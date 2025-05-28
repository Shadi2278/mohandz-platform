const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/content');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'content-' + uniqueSuffix + path.extname(file.originalname));
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
 * @route   GET /api/admin/content
 * @desc    Get all content
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      type, 
      status, 
      featured,
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add type filter
    if (type) {
      query.type = type;
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
    const contents = await Content.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('parent', 'title')
      .exec();
    
    // Get total count
    const count = await Content.countDocuments(query);
    
    res.json({
      success: true,
      data: contents,
      pagination: {
        total: count,
        page: page * 1,
        pages: Math.ceil(count / limit),
        limit: limit * 1
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/content/:id
 * @desc    Get content by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('parent', 'title');
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/content
 * @desc    Create new content
 * @access  Private/Admin
 */
router.post('/', auth, authorize(['admin', 'editor']), upload.single('image'), async (req, res) => {
  try {
    const { 
      title, 
      type, 
      content, 
      excerpt, 
      status, 
      featured,
      order,
      parent,
      meta
    } = req.body;
    
    // Create content
    const contentItem = new Content({
      title,
      type,
      content,
      excerpt,
      status: status || 'draft',
      featured: featured === 'true',
      order: order || 0,
      parent: parent || null,
      meta: meta ? JSON.parse(meta) : {},
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    // Add image if uploaded
    if (req.file) {
      contentItem.image = `/uploads/content/${req.file.filename}`;
    }
    
    // Generate slug from title
    contentItem.slug = title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');
    
    await contentItem.save();
    
    res.status(201).json({
      success: true,
      data: contentItem
    });
  } catch (error) {
    console.error('Create content error:', error);
    
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
 * @route   PUT /api/admin/content/:id
 * @desc    Update content
 * @access  Private/Admin
 */
router.put('/:id', auth, authorize(['admin', 'editor']), upload.single('image'), async (req, res) => {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      status, 
      featured,
      order,
      parent,
      meta
    } = req.body;
    
    // Find content
    let contentItem = await Content.findById(req.params.id);
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }
    
    // Build update object
    const updateData = {
      title: title || contentItem.title,
      content: content || contentItem.content,
      excerpt: excerpt || contentItem.excerpt,
      status: status || contentItem.status,
      featured: featured !== undefined ? featured === 'true' : contentItem.featured,
      order: order || contentItem.order,
      parent: parent || contentItem.parent,
      meta: meta ? JSON.parse(meta) : contentItem.meta,
      updatedBy: req.user._id
    };
    
    // Update slug if title changed
    if (title && title !== contentItem.title) {
      updateData.slug = title
        .toLowerCase()
        .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
    }
    
    // Add image if uploaded
    if (req.file) {
      // Delete old image if exists
      if (contentItem.image) {
        const oldImagePath = path.join(__dirname, '../../..', contentItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updateData.image = `/uploads/content/${req.file.filename}`;
    }
    
    // Update content
    contentItem = await Content.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: contentItem
    });
  } catch (error) {
    console.error('Update content error:', error);
    
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
 * @route   POST /api/admin/content/:id/gallery
 * @desc    Add gallery images to content
 * @access  Private/Admin
 */
router.post('/:id/gallery', auth, authorize(['admin', 'editor']), upload.array('gallery', 10), async (req, res) => {
  try {
    // Find content
    let contentItem = await Content.findById(req.params.id);
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }
    
    // Add gallery images
    if (req.files && req.files.length > 0) {
      const gallery = req.files.map((file, index) => ({
        url: `/uploads/content/${file.filename}`,
        caption: file.originalname,
        order: contentItem.gallery.length + index
      }));
      
      contentItem = await Content.findByIdAndUpdate(
        req.params.id,
        { $push: { gallery: { $each: gallery } } },
        { new: true }
      );
    }
    
    res.json({
      success: true,
      data: contentItem.gallery
    });
  } catch (error) {
    console.error('Add gallery error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/content/:id/gallery/:galleryId
 * @desc    Delete gallery image from content
 * @access  Private/Admin
 */
router.delete('/:id/gallery/:galleryId', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    // Find content
    let contentItem = await Content.findById(req.params.id);
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }
    
    // Find gallery image
    const galleryImage = contentItem.gallery.id(req.params.galleryId);
    
    if (!galleryImage) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة'
      });
    }
    
    // Delete file
    const filePath = path.join(__dirname, '../../..', galleryImage.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove gallery image from content
    contentItem = await Content.findByIdAndUpdate(
      req.params.id,
      { $pull: { gallery: { _id: req.params.galleryId } } },
      { new: true }
    );
    
    res.json({
      success: true,
      data: contentItem.gallery
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   PUT /api/admin/content/:id/status
 * @desc    Update content status
 * @access  Private/Admin
 */
router.put('/:id/status', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['published', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة المحتوى غير صالحة'
      });
    }
    
    // Find and update content
    const contentItem = await Content.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedBy: req.user._id
      },
      { new: true }
    );
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: contentItem
    });
  } catch (error) {
    console.error('Update content status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/content/:id
 * @desc    Delete content
 * @access  Private/Admin
 */
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const contentItem = await Content.findById(req.params.id);
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: 'المحتوى غير موجود'
      });
    }
    
    // Delete image if exists
    if (contentItem.image) {
      const imagePath = path.join(__dirname, '../../..', contentItem.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete gallery images if exist
    if (contentItem.gallery && contentItem.gallery.length > 0) {
      contentItem.gallery.forEach(image => {
        const filePath = path.join(__dirname, '../../..', image.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await contentItem.remove();
    
    res.json({
      success: true,
      message: 'تم حذف المحتوى بنجاح'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

module.exports = router;
