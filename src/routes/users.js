const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بعرض جميع المستخدمين' });
  }
  
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/users/engineers
// @desc    Get all engineers
// @access  Private (Admin only)
router.get('/engineers', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بعرض المهندسين' });
  }
  
  try {
    const engineers = await User.find({ role: 'engineer' }).select('-password').sort({ createdAt: -1 });
    res.json(engineers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own user)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    
    // Check if user is authorized to view this user
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(401).json({ msg: 'غير مصرح لك بعرض هذا المستخدم' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin or own user)
router.put('/:id', [
  auth,
  [
    check('name', 'الاسم مطلوب').not().isEmpty(),
    check('email', 'يرجى إدخال بريد إلكتروني صحيح').isEmail(),
    check('phone', 'رقم الهاتف مطلوب').not().isEmpty()
  ]
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Check if user is authorized to update this user
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(401).json({ msg: 'غير مصرح لك بتحديث هذا المستخدم' });
  }
  
  const { name, email, phone, address, city, country, bio, specialization, avatar, role } = req.body;
  
  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (phone) userFields.phone = phone;
  if (address) userFields.address = address;
  if (city) userFields.city = city;
  if (country) userFields.country = country;
  if (bio) userFields.bio = bio;
  if (specialization) userFields.specialization = specialization;
  if (avatar) userFields.avatar = avatar;
  
  // Only admin can update role
  if (role && req.user.role === 'admin') {
    userFields.role = role;
  }
  
  try {
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({ msg: 'البريد الإلكتروني مستخدم بالفعل' });
      }
    }
    
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(401).json({ msg: 'غير مصرح لك بحذف المستخدمين' });
  }
  
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    
    await user.remove();
    res.json({ msg: 'تم حذف المستخدم' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
