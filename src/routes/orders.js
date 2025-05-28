const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Service = require('../models/Service');
const User = require('../models/User');

// @route   GET api/orders
// @desc    Get all orders for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    
    // If admin, get all orders
    if (req.user.role === 'admin') {
      orders = await Order.find()
        .populate('user', ['name', 'email', 'phone'])
        .populate('service', ['title', 'category', 'subcategory'])
        .populate('assignedTo', ['name', 'email', 'specialization'])
        .sort({ createdAt: -1 });
    } 
    // If engineer, get assigned orders
    else if (req.user.role === 'engineer') {
      orders = await Order.find({ assignedTo: req.user.id })
        .populate('user', ['name', 'email', 'phone'])
        .populate('service', ['title', 'category', 'subcategory'])
        .sort({ createdAt: -1 });
    } 
    // If client, get own orders
    else {
      orders = await Order.find({ user: req.user.id })
        .populate('service', ['title', 'category', 'subcategory'])
        .populate('assignedTo', ['name', 'specialization'])
        .sort({ createdAt: -1 });
    }
    
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', ['name', 'email', 'phone'])
      .populate('service', ['title', 'category', 'subcategory', 'description', 'price'])
      .populate('assignedTo', ['name', 'email', 'specialization']);
    
    if (!order) {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    
    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && 
        req.user.id !== order.user._id.toString() && 
        req.user.id !== order.assignedTo?._id.toString()) {
      return res.status(401).json({ msg: 'غير مصرح لك بعرض هذا الطلب' });
    }
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post('/', [
  auth,
  [
    check('service', 'الخدمة مطلوبة').not().isEmpty(),
    check('requirements', 'متطلبات المشروع مطلوبة').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { service, requirements, attachments } = req.body;
  
  try {
    // Get service details
    const serviceDetails = await Service.findById(service);
    if (!serviceDetails) {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    
    // Create new order
    const newOrder = new Order({
      user: req.user.id,
      service,
      requirements,
      attachments,
      price: serviceDetails.price
    });
    
    const order = await newOrder.save();
    
    // Populate service details
    const populatedOrder = await Order.findById(order._id)
      .populate('service', ['title', 'category', 'subcategory']);
    
    res.json(populatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   PUT api/orders/:id
// @desc    Update order status
// @access  Private (Admin or Engineer)
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
  
  // Check if user is admin or engineer
  if (req.user.role !== 'admin' && req.user.role !== 'engineer') {
    return res.status(401).json({ msg: 'غير مصرح لك بتحديث حالة الطلب' });
  }
  
  const { status, assignedTo, deliveryDate } = req.body;
  
  try {
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    
    // If engineer, check if order is assigned to them
    if (req.user.role === 'engineer' && order.assignedTo.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'غير مصرح لك بتحديث هذا الطلب' });
    }
    
    // Update order
    order.status = status;
    if (assignedTo) order.assignedTo = assignedTo;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    
    await order.save();
    
    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', ['name', 'email', 'phone'])
      .populate('service', ['title', 'category', 'subcategory'])
      .populate('assignedTo', ['name', 'email', 'specialization']);
    
    res.json(populatedOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   PUT api/orders/:id/feedback
// @desc    Add feedback to an order
// @access  Private (Client only)
router.put('/:id/feedback', [
  auth,
  [
    check('rating', 'التقييم مطلوب').isNumeric().isInt({ min: 1, max: 5 }),
    check('comment', 'التعليق مطلوب').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { rating, comment } = req.body;
  
  try {
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    
    // Check if user is the order owner
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'غير مصرح لك بإضافة تقييم لهذا الطلب' });
    }
    
    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ msg: 'يمكن إضافة التقييم فقط للطلبات المكتملة' });
    }
    
    // Add feedback
    order.feedback = {
      rating,
      comment,
      date: Date.now()
    };
    
    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   DELETE api/orders/:id
// @desc    Delete an order
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بحذف الطلبات' });
  }
  
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    
    await order.remove();
    res.json({ msg: 'تم حذف الطلب' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الطلب غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
