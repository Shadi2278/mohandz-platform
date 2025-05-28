const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/services');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only image files are allowed!'));
    }
  }
});

/**
 * @route   GET /api/admin/services
 * @desc    Get all services
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, featured, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add featured filter
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // Build sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const services = await Service.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email')
      .exec();
    
    // Get total count
    const count = await Service.countDocuments(query);
    
    res.json({
      success: true,
      data: services,
      pagination: {
        total: count,
        page: page * 1,
        pages: Math.ceil(count / limit),
        limit: limit * 1
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/services/:id
 * @desc    Get service by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/services
 * @desc    Create new service
 * @access  Private/Admin
 */
router.post('/', auth, authorize(['admin', 'editor']), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      shortDescription, 
      price, 
      category, 
      status, 
      featured, 
      order,
      requirements,
      deliverables,
      estimatedDuration
    } = req.body;
    
    // Create service
    const service = new Service({
      title,
      description,
      shortDescription,
      price,
      category,
      status,
      featured: featured === 'true',
      order: order || 0,
      requirements: requirements ? JSON.parse(requirements) : [],
      deliverables: deliverables ? JSON.parse(deliverables) : [],
      estimatedDuration: estimatedDuration || 7,
      createdBy: req.user._id
    });
    
    // Add image and icon if uploaded
    if (req.files) {
      if (req.files.image) {
        service.image = `/uploads/services/${req.files.image[0].filename}`;
      }
      
      if (req.files.icon) {
        service.icon = `/uploads/services/${req.files.icon[0].filename}`;
      }
    }
    
    await service.save();
    
    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    
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
 * @route   PUT /api/admin/services/:id
 * @desc    Update service
 * @access  Private/Admin
 */
router.put('/:id', auth, authorize(['admin', 'editor']), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      shortDescription, 
      price, 
      category, 
      status, 
      featured, 
      order,
      requirements,
      deliverables,
      estimatedDuration
    } = req.body;
    
    // Find service
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }
    
    // Build update object
    const updateData = {
      title,
      description,
      shortDescription,
      price,
      category,
      status,
      featured: featured === 'true',
      order: order || 0,
      requirements: requirements ? JSON.parse(requirements) : service.requirements,
      deliverables: deliverables ? JSON.parse(deliverables) : service.deliverables,
      estimatedDuration: estimatedDuration || service.estimatedDuration
    };
    
    // Add image and icon if uploaded
    if (req.files) {
      if (req.files.image) {
        // Delete old image if exists
        if (service.image) {
          const oldImagePath = path.join(__dirname, '../../..', service.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        updateData.image = `/uploads/services/${req.files.image[0].filename}`;
      }
      
      if (req.files.icon) {
        // Delete old icon if exists
        if (service.icon) {
          const oldIconPath = path.join(__dirname, '../../..', service.icon);
          if (fs.existsSync(oldIconPath)) {
            fs.unlinkSync(oldIconPath);
          }
        }
        
        updateData.icon = `/uploads/services/${req.files.icon[0].filename}`;
      }
    }
    
    // Update service
    service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    
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
 * @route   DELETE /api/admin/services/:id
 * @desc    Delete service
 * @access  Private/Admin
 */
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }
    
    // Delete image and icon if exists
    if (service.image) {
      const imagePath = path.join(__dirname, '../../..', service.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (service.icon) {
      const iconPath = path.join(__dirname, '../../..', service.icon);
      if (fs.existsSync(iconPath)) {
        fs.unlinkSync(iconPath);
      }
    }
    
    await service.remove();
    
    res.json({
      success: true,
      message: 'تم حذف الخدمة بنجاح'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   PUT /api/admin/services/:id/status
 * @desc    Update service status
 * @access  Private/Admin
 */
router.put('/:id/status', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الخدمة غير صالحة'
      });
    }
    
    // Find and update service
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   PUT /api/admin/services/reorder
 * @desc    Reorder services
 * @access  Private/Admin
 */
router.put('/reorder', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { services } = req.body;
    
    if (!services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الترتيب غير صالحة'
      });
    }
    
    // Update order for each service
    const updatePromises = services.map(item => {
      return Service.findByIdAndUpdate(
        item.id,
        { order: item.order },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'تم تحديث ترتيب الخدمات بنجاح'
    });
  } catch (error) {
    console.error('Reorder services error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

module.exports = router;
