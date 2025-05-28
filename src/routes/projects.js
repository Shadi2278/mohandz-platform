const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// @route   GET api/projects
// @desc    Get all projects
// @access  Public
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(12);
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/projects/category/:category
// @desc    Get projects by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const projects = await Project.find({ category: req.params.category })
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'المشروع غير موجود' });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'المشروع غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/projects
// @desc    Create a project
// @access  Private (Admin only)
router.post('/', [
  auth,
  [
    check('title', 'العنوان مطلوب').not().isEmpty(),
    check('description', 'الوصف مطلوب').not().isEmpty(),
    check('category', 'الفئة مطلوبة').not().isEmpty(),
    check('images', 'الصور مطلوبة').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بإنشاء مشاريع' });
  }
  
  const { title, description, category, subcategory, client, location, year, images, features } = req.body;
  
  try {
    // Create new project
    const newProject = new Project({
      title,
      description,
      category,
      subcategory,
      client,
      location,
      year,
      images,
      features
    });
    
    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('title', 'العنوان مطلوب').not().isEmpty(),
    check('description', 'الوصف مطلوب').not().isEmpty(),
    check('category', 'الفئة مطلوبة').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بتحديث المشاريع' });
  }
  
  const { title, description, category, subcategory, client, location, year, images, features } = req.body;
  
  // Build project object
  const projectFields = {};
  if (title) projectFields.title = title;
  if (description) projectFields.description = description;
  if (category) projectFields.category = category;
  if (subcategory) projectFields.subcategory = subcategory;
  if (client) projectFields.client = client;
  if (location) projectFields.location = location;
  if (year) projectFields.year = year;
  if (images) projectFields.images = images;
  if (features) projectFields.features = features;
  
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'المشروع غير موجود' });
    }
    
    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    );
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'المشروع غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بحذف المشاريع' });
  }
  
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'المشروع غير موجود' });
    }
    
    await project.remove();
    res.json({ msg: 'تم حذف المشروع' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'المشروع غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
