const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/settings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'setting-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
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
 * @route   GET /api/admin/settings
 * @desc    Get all settings
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    const { group } = req.query;
    
    // Build query
    const query = {};
    
    // Add group filter
    if (group) {
      query.group = group;
    }
    
    // Execute query
    const settings = await Setting.find(query)
      .sort({ group: 1, order: 1 })
      .populate('updatedBy', 'name email');
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/settings/public
 * @desc    Get public settings
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    // Get public settings
    const settings = await Setting.find({ isPublic: true })
      .sort({ group: 1, order: 1 });
    
    // Transform to key-value object
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });
    
    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/settings/:id
 * @desc    Get setting by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const setting = await Setting.findById(req.params.id)
      .populate('updatedBy', 'name email');
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'الإعداد غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/settings
 * @desc    Create new setting
 * @access  Private/Admin
 */
router.post('/', auth, authorize(['admin']), upload.single('image'), async (req, res) => {
  try {
    const { 
      key, 
      value, 
      type, 
      group, 
      label, 
      description,
      isPublic,
      order
    } = req.body;
    
    // Check if key already exists
    const existingSetting = await Setting.findOne({ key });
    
    if (existingSetting) {
      return res.status(400).json({
        success: false,
        message: 'مفتاح الإعداد موجود بالفعل'
      });
    }
    
    // Create setting
    const setting = new Setting({
      key,
      value: type === 'image' ? '' : value,
      type,
      group,
      label,
      description,
      isPublic: isPublic === 'true',
      order: order || 0,
      updatedBy: req.user._id
    });
    
    // Add image if uploaded and type is image
    if (type === 'image' && req.file) {
      setting.value = `/uploads/settings/${req.file.filename}`;
    }
    
    await setting.save();
    
    res.status(201).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Create setting error:', error);
    
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
 * @route   PUT /api/admin/settings/:id
 * @desc    Update setting
 * @access  Private/Admin
 */
router.put('/:id', auth, authorize(['admin']), upload.single('image'), async (req, res) => {
  try {
    const { 
      value, 
      label, 
      description,
      isPublic,
      order
    } = req.body;
    
    // Find setting
    let setting = await Setting.findById(req.params.id);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'الإعداد غير موجود'
      });
    }
    
    // Build update object
    const updateData = {
      label: label || setting.label,
      description: description || setting.description,
      isPublic: isPublic !== undefined ? isPublic === 'true' : setting.isPublic,
      order: order || setting.order,
      updatedBy: req.user._id
    };
    
    // Update value based on type
    if (setting.type === 'image') {
      if (req.file) {
        // Delete old image if exists
        if (setting.value) {
          const oldImagePath = path.join(__dirname, '../../..', setting.value);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        updateData.value = `/uploads/settings/${req.file.filename}`;
      }
    } else {
      updateData.value = value;
    }
    
    // Update setting
    setting = await Setting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    
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
 * @route   PUT /api/admin/settings/batch
 * @desc    Update multiple settings
 * @access  Private/Admin
 */
router.put('/batch', auth, authorize(['admin']), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الإعدادات غير صالحة'
      });
    }
    
    // Update each setting
    const updatePromises = settings.map(item => {
      return Setting.findByIdAndUpdate(
        item.id,
        { 
          value: item.value,
          updatedBy: req.user._id
        },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('Batch update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/settings/:id
 * @desc    Delete setting
 * @access  Private/Admin
 */
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const setting = await Setting.findById(req.params.id);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'الإعداد غير موجود'
      });
    }
    
    // Delete image if type is image
    if (setting.type === 'image' && setting.value) {
      const imagePath = path.join(__dirname, '../../..', setting.value);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await setting.remove();
    
    res.json({
      success: true,
      message: 'تم حذف الإعداد بنجاح'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

module.exports = router;
