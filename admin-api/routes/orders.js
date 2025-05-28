const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Service = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/orders');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'order-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Invalid file type!'));
    }
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      paymentStatus,
      clientId,
      serviceId,
      assignedTo,
      startDate,
      endDate,
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Add client filter
    if (clientId) {
      query.client = clientId;
    }
    
    // Add service filter
    if (serviceId) {
      query.service = serviceId;
    }
    
    // Add assigned to filter
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Build sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('client', 'name email phone')
      .populate('service', 'title price category')
      .populate('assignedTo', 'name email')
      .exec();
    
    // Get total count
    const count = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        page: page * 1,
        pages: Math.ceil(count / limit),
        limit: limit * 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get order by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('service', 'title price category description')
      .populate('assignedTo', 'name email')
      .populate('notes.createdBy', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/orders
 * @desc    Create new order
 * @access  Private/Admin
 */
router.post('/', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { 
      client, 
      service, 
      price, 
      status, 
      paymentStatus,
      assignedTo,
      requirements,
      startDate,
      dueDate
    } = req.body;
    
    // Validate client
    const clientExists = await User.findById(client);
    if (!clientExists) {
      return res.status(400).json({
        success: false,
        message: 'العميل غير موجود'
      });
    }
    
    // Validate service
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(400).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }
    
    // Validate assignedTo if provided
    if (assignedTo) {
      const assignedToExists = await User.findById(assignedTo);
      if (!assignedToExists) {
        return res.status(400).json({
          success: false,
          message: 'المهندس المعين غير موجود'
        });
      }
    }
    
    // Create order
    const order = new Order({
      client,
      service,
      price: price || serviceExists.price,
      status: status || 'new',
      paymentStatus: paymentStatus || 'pending',
      assignedTo: assignedTo || null,
      requirements,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null
    });
    
    await order.save();
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   PUT /api/admin/orders/:id
 * @desc    Update order
 * @access  Private/Admin
 */
router.put('/:id', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus,
      assignedTo,
      requirements,
      startDate,
      dueDate,
      completedDate
    } = req.body;
    
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Validate assignedTo if provided
    if (assignedTo) {
      const assignedToExists = await User.findById(assignedTo);
      if (!assignedToExists) {
        return res.status(400).json({
          success: false,
          message: 'المهندس المعين غير موجود'
        });
      }
    }
    
    // Build update object
    const updateData = {
      status: status || order.status,
      paymentStatus: paymentStatus || order.paymentStatus,
      assignedTo: assignedTo || order.assignedTo,
      requirements: requirements || order.requirements,
      startDate: startDate ? new Date(startDate) : order.startDate,
      dueDate: dueDate ? new Date(dueDate) : order.dueDate,
      completedDate: completedDate ? new Date(completedDate) : order.completedDate
    };
    
    // Update order
    order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/orders/:id/attachments
 * @desc    Add attachments to order
 * @access  Private/Admin
 */
router.post('/:id/attachments', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Add attachments
    if (req.files && req.files.length > 0) {
      const attachments = req.files.map(file => ({
        name: file.originalname,
        path: `/uploads/orders/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        uploadedAt: Date.now()
      }));
      
      order = await Order.findByIdAndUpdate(
        req.params.id,
        { $push: { attachments: { $each: attachments } } },
        { new: true }
      );
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Add attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/orders/:id/attachments/:attachmentId
 * @desc    Delete attachment from order
 * @access  Private/Admin
 */
router.delete('/:id/attachments/:attachmentId', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Find attachment
    const attachment = order.attachments.id(req.params.attachmentId);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'المرفق غير موجود'
      });
    }
    
    // Delete file
    const filePath = path.join(__dirname, '../../..', attachment.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove attachment from order
    order = await Order.findByIdAndUpdate(
      req.params.id,
      { $pull: { attachments: { _id: req.params.attachmentId } } },
      { new: true }
    );
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/orders/:id/notes
 * @desc    Add note to order
 * @access  Private/Admin
 */
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'نص الملاحظة مطلوب'
      });
    }
    
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Add note
    order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          notes: { 
            text, 
            createdBy: req.user._id,
            createdAt: Date.now()
          } 
        } 
      },
      { new: true }
    ).populate('notes.createdBy', 'name email');
    
    res.json({
      success: true,
      data: order.notes[order.notes.length - 1]
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/orders/:id/notes/:noteId
 * @desc    Delete note from order
 * @access  Private/Admin
 */
router.delete('/:id/notes/:noteId', auth, async (req, res) => {
  try {
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Find note
    const note = order.notes.id(req.params.noteId);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'الملاحظة غير موجودة'
      });
    }
    
    // Check if user is admin or note creator
    if (req.user.role !== 'admin' && note.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بحذف هذه الملاحظة'
      });
    }
    
    // Remove note from order
    order = await Order.findByIdAndUpdate(
      req.params.id,
      { $pull: { notes: { _id: req.params.noteId } } },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'تم حذف الملاحظة بنجاح'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/orders/:id
 * @desc    Delete order
 * @access  Private/Admin
 */
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }
    
    // Delete attachments
    if (order.attachments && order.attachments.length > 0) {
      order.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '../../..', attachment.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await order.remove();
    
    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

module.exports = router;
