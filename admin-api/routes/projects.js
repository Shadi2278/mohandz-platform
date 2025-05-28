const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const Service = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/projects');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
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
 * @route   GET /api/admin/projects
 * @desc    Get all projects
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      clientId,
      serviceId,
      featured,
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
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add client filter
    if (clientId) {
      query.client = clientId;
    }
    
    // Add service filter
    if (serviceId) {
      query.service = serviceId;
    }
    
    // Add featured filter
    if (featured) {
      query.featured = featured === 'true';
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
    const projects = await Project.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('client', 'name email phone')
      .populate('service', 'title category')
      .populate('team.user', 'name email')
      .populate('createdBy', 'name email')
      .exec();
    
    // Get total count
    const count = await Project.countDocuments(query);
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        total: count,
        page: page * 1,
        pages: Math.ceil(count / limit),
        limit: limit * 1
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/projects/:id
 * @desc    Get project by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('service', 'title category description')
      .populate('team.user', 'name email')
      .populate('createdBy', 'name email')
      .populate('notes.createdBy', 'name email')
      .populate('orders');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/projects
 * @desc    Create new project
 * @access  Private/Admin
 */
router.post('/', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      client, 
      service, 
      status, 
      progress,
      startDate,
      endDate,
      budget,
      location,
      featured,
      team
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
    
    // Create project
    const project = new Project({
      title,
      description,
      client,
      service,
      status: status || 'pending',
      progress: progress || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget,
      location,
      featured: featured === 'true',
      team: team ? JSON.parse(team) : [],
      createdBy: req.user._id
    });
    
    await project.save();
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    
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
 * @route   PUT /api/admin/projects/:id
 * @desc    Update project
 * @access  Private/Admin
 */
router.put('/:id', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      progress,
      startDate,
      endDate,
      budget,
      location,
      featured,
      team
    } = req.body;
    
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Build update object
    const updateData = {
      title: title || project.title,
      description: description || project.description,
      status: status || project.status,
      progress: progress !== undefined ? progress : project.progress,
      startDate: startDate ? new Date(startDate) : project.startDate,
      endDate: endDate ? new Date(endDate) : project.endDate,
      budget: budget || project.budget,
      location: location || project.location,
      featured: featured !== undefined ? featured === 'true' : project.featured,
      team: team ? JSON.parse(team) : project.team
    };
    
    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    
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
 * @route   POST /api/admin/projects/:id/images
 * @desc    Add images to project
 * @access  Private/Admin
 */
router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Add images
    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => ({
        url: `/uploads/projects/${file.filename}`,
        caption: file.originalname
      }));
      
      project = await Project.findByIdAndUpdate(
        req.params.id,
        { $push: { images: { $each: images } } },
        { new: true }
      );
    }
    
    res.json({
      success: true,
      data: project.images
    });
  } catch (error) {
    console.error('Add images error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/projects/:id/images/:imageId
 * @desc    Delete image from project
 * @access  Private/Admin
 */
router.delete('/:id/images/:imageId', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Find image
    const image = project.images.id(req.params.imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة'
      });
    }
    
    // Delete file
    const filePath = path.join(__dirname, '../../..', image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove image from project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: { _id: req.params.imageId } } },
      { new: true }
    );
    
    res.json({
      success: true,
      data: project.images
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/projects/:id/documents
 * @desc    Add documents to project
 * @access  Private/Admin
 */
router.post('/:id/documents', auth, upload.array('documents', 5), async (req, res) => {
  try {
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Add documents
    if (req.files && req.files.length > 0) {
      const documents = req.files.map(file => ({
        name: file.originalname,
        path: `/uploads/projects/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        uploadedAt: Date.now()
      }));
      
      project = await Project.findByIdAndUpdate(
        req.params.id,
        { $push: { documents: { $each: documents } } },
        { new: true }
      );
    }
    
    res.json({
      success: true,
      data: project.documents
    });
  } catch (error) {
    console.error('Add documents error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/projects/:id/documents/:documentId
 * @desc    Delete document from project
 * @access  Private/Admin
 */
router.delete('/:id/documents/:documentId', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Find document
    const document = project.documents.id(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'المستند غير موجود'
      });
    }
    
    // Delete file
    const filePath = path.join(__dirname, '../../..', document.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove document from project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { documents: { _id: req.params.documentId } } },
      { new: true }
    );
    
    res.json({
      success: true,
      data: project.documents
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/projects/:id/milestones
 * @desc    Add milestone to project
 * @access  Private/Admin
 */
router.post('/:id/milestones', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;
    
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'عنوان المرحلة وتاريخ الاستحقاق مطلوبان'
      });
    }
    
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Add milestone
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          milestones: { 
            title,
            description,
            dueDate: new Date(dueDate),
            status: status || 'pending'
          } 
        } 
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: project.milestones[project.milestones.length - 1]
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   PUT /api/admin/projects/:id/milestones/:milestoneId
 * @desc    Update milestone
 * @access  Private/Admin
 */
router.put('/:id/milestones/:milestoneId', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { title, description, dueDate, status, completedDate } = req.body;
    
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Find milestone
    const milestone = project.milestones.id(req.params.milestoneId);
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'المرحلة غير موجودة'
      });
    }
    
    // Update milestone
    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (dueDate) milestone.dueDate = new Date(dueDate);
    if (status) milestone.status = status;
    if (completedDate) milestone.completedDate = new Date(completedDate);
    
    await project.save();
    
    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   DELETE /api/admin/projects/:id/milestones/:milestoneId
 * @desc    Delete milestone
 * @access  Private/Admin
 */
router.delete('/:id/milestones/:milestoneId', auth, authorize(['admin', 'editor']), async (req, res) => {
  try {
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Find milestone
    const milestone = project.milestones.id(req.params.milestoneId);
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'المرحلة غير موجودة'
      });
    }
    
    // Remove milestone from project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { milestones: { _id: req.params.milestoneId } } },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'تم حذف المرحلة بنجاح'
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/projects/:id/notes
 * @desc    Add note to project
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
    
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Add note
    project = await Project.findByIdAndUpdate(
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
      data: project.notes[project.notes.length - 1]
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
 * @route   DELETE /api/admin/projects/:id/notes/:noteId
 * @desc    Delete note from project
 * @access  Private/Admin
 */
router.delete('/:id/notes/:noteId', auth, async (req, res) => {
  try {
    // Find project
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Find note
    const note = project.notes.id(req.params.noteId);
    
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
    
    // Remove note from project
    project = await Project.findByIdAndUpdate(
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
 * @route   DELETE /api/admin/projects/:id
 * @desc    Delete project
 * @access  Private/Admin
 */
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    // Delete images
    if (project.images && project.images.length > 0) {
      project.images.forEach(image => {
        const filePath = path.join(__dirname, '../../..', image.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Delete documents
    if (project.documents && project.documents.length > 0) {
      project.documents.forEach(document => {
        const filePath = path.join(__dirname, '../../..', document.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await project.remove();
    
    res.json({
      success: true,
      message: 'تم حذف المشروع بنجاح'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

module.exports = router;
