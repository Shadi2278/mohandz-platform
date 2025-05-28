const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @route   GET api/payments
// @desc    Get all payments for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let payments;
    
    // If admin, get all payments
    if (req.user.role === 'admin') {
      payments = await Payment.find()
        .populate('user', ['name', 'email'])
        .populate('order', ['service', 'status'])
        .sort({ createdAt: -1 });
    } 
    // If client, get own payments
    else {
      payments = await Payment.find({ user: req.user.id })
        .populate('order', ['service', 'status'])
        .sort({ createdAt: -1 });
    }
    
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', ['name', 'email'])
      .populate({
        path: 'order',
        populate: {
          path: 'service',
          select: 'title price'
        }
      });
    
    if (!payment) {
      return res.status(404).json({ msg: 'الدفعة غير موجودة' });
    }
    
    // Check if user is authorized to view this payment
    if (req.user.role !== 'admin' && req.user.id !== payment.user._id.toString()) {
      return res.status(401).json({ msg: 'غير مصرح لك بعرض هذه الدفعة' });
    }
    
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الدفعة غير موجودة' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/payments
// @desc    Create a new payment
// @access  Private
router.post('/', [
  auth,
  [
    check('order', 'الطلب مطلوب').not().isEmpty(),
    check('amount', 'المبلغ مطلوب').isNumeric(),
    check('method', 'طريقة الدفع مطلوبة').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { order, amount, method, transactionId } = req.body;
  
  try {
    // Get order details
    const orderDetails = await Order.findById(order);
    if (!orderDetails) {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    
    // Check if user is the order owner
    if (orderDetails.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'غير مصرح لك بإنشاء دفعة لهذا الطلب' });
    }
    
    // Create new payment
    const newPayment = new Payment({
      user: req.user.id,
      order,
      amount,
      method,
      transactionId,
      status: 'completed'
    });
    
    const payment = await newPayment.save();
    
    // Update order payment status
    const totalPaid = await Payment.aggregate([
      { $match: { order: orderDetails._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
    
    if (paidAmount >= orderDetails.price) {
      orderDetails.paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      orderDetails.paymentStatus = 'partial';
    }
    
    await orderDetails.save();
    
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   PUT api/payments/:id
// @desc    Update payment status
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('status', 'الحالة مطلوبة').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بتحديث حالة الدفعة' });
  }
  
  const { status } = req.body;
  
  try {
    let payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'الدفعة غير موجودة' });
    }
    
    // Update payment
    payment.status = status;
    
    await payment.save();
    
    // If payment is completed or rejected, update order payment status
    if (status === 'completed' || status === 'rejected') {
      const order = await Order.findById(payment.order);
      
      if (order) {
        const totalPaid = await Payment.aggregate([
          { $match: { order: order._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
        
        if (paidAmount >= order.price) {
          order.paymentStatus = 'paid';
        } else if (paidAmount > 0) {
          order.paymentStatus = 'partial';
        } else {
          order.paymentStatus = 'unpaid';
        }
        
        await order.save();
      }
    }
    
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الدفعة غير موجودة' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   DELETE api/payments/:id
// @desc    Delete a payment
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بحذف الدفعات' });
  }
  
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'الدفعة غير موجودة' });
    }
    
    await payment.remove();
    
    // Update order payment status
    const order = await Order.findById(payment.order);
    
    if (order) {
      const totalPaid = await Payment.aggregate([
        { $match: { order: order._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
      
      if (paidAmount >= order.price) {
        order.paymentStatus = 'paid';
      } else if (paidAmount > 0) {
        order.paymentStatus = 'partial';
      } else {
        order.paymentStatus = 'unpaid';
      }
      
      await order.save();
    }
    
    res.json({ msg: 'تم حذف الدفعة' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الدفعة غير موجودة' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
