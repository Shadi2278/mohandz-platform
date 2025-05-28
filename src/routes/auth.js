const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', [
  check('name', 'الاسم مطلوب').not().isEmpty(),
  check('email', 'يرجى إدخال بريد إلكتروني صحيح').isEmail(),
  check('password', 'يرجى إدخال كلمة مرور لا تقل عن 6 أحرف').isLength({ min: 6 }),
  check('phone', 'رقم الهاتف مطلوب').not().isEmpty()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'المستخدم موجود بالفعل' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'client'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mohandzSecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('email', 'يرجى إدخال بريد إلكتروني صحيح').isEmail(),
  check('password', 'كلمة المرور مطلوبة').exists()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'بيانات الاعتماد غير صالحة' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'بيانات الاعتماد غير صالحة' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mohandzSecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  check('email', 'يرجى إدخال بريد إلكتروني صحيح').isEmail()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'المستخدم غير موجود' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'mohandzSecret',
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset link
    // This would be implemented with an email service

    res.json({ msg: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  check('token', 'الرمز مطلوب').not().isEmpty(),
  check('password', 'يرجى إدخال كلمة مرور لا تقل عن 6 أحرف').isLength({ min: 6 })
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token, password } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mohandzSecret');

    // Find user
    const user = await User.findOne({
      _id: decoded.id,
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'رمز غير صالح أو منتهي الصلاحية' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ msg: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
