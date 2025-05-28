const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Service = require('../models/Service');

// @route   GET api/services
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ category: 1, createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/services/category/:category
// @desc    Get services by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const services = await Service.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/services
// @desc    Create a service
// @access  Private (Admin only)
router.post('/', [
  auth,
  [
    check('title', 'العنوان مطلوب').not().isEmpty(),
    check('description', 'الوصف مطلوب').not().isEmpty(),
    check('category', 'الفئة مطلوبة').not().isEmpty(),
    check('price', 'السعر مطلوب').isNumeric()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بإنشاء خدمات' });
  }
  
  const { title, description, category, subcategory, price, features, image, requirements } = req.body;
  
  try {
    // Create new service
    const newService = new Service({
      title,
      description,
      category,
      subcategory,
      price,
      features,
      image,
      requirements
    });
    
    const service = await newService.save();
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   PUT api/services/:id
// @desc    Update a service
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  [
    check('title', 'العنوان مطلوب').not().isEmpty(),
    check('description', 'الوصف مطلوب').not().isEmpty(),
    check('category', 'الفئة مطلوبة').not().isEmpty(),
    check('price', 'السعر مطلوب').isNumeric()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بتحديث الخدمات' });
  }
  
  const { title, description, category, subcategory, price, features, image, requirements } = req.body;
  
  // Build service object
  const serviceFields = {};
  if (title) serviceFields.title = title;
  if (description) serviceFields.description = description;
  if (category) serviceFields.category = category;
  if (subcategory) serviceFields.subcategory = subcategory;
  if (price) serviceFields.price = price;
  if (features) serviceFields.features = features;
  if (image) serviceFields.image = image;
  if (requirements) serviceFields.requirements = requirements;
  
  try {
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    
    // Update service
    service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: serviceFields },
      { new: true }
    );
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   DELETE api/services/:id
// @desc    Delete a service
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بحذف الخدمات' });
  }
  
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    
    await service.remove();
    res.json({ msg: 'تم حذف الخدمة' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'الخدمة غير موجودة' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
