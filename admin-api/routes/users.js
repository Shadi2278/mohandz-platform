const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, role, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add role filter
    if (role) {
      query.role = role;
    }
    
    // Build sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count
    const count = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: page * 1,
        pages: Math.ceil(count / limit),
        limit: limit * 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private/Admin
 */
router.post('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const { name, email, password, role, phone, status } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      status
    });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    
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
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.put('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const { name, email, role, phone, status } = req.body;
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, phone, status },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    
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
 * @route   PUT /api/admin/users/:id/password
 * @desc    Update user password
 * @access  Private/Admin
 */
router.put('/:id/password', auth, authorize(['admin']), async (req, res) => {
  try {
    const { password } = req.body;
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // Update password
    user.password = password;
    await user.save();
    
    res.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Update password error:', error);
    
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
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف حسابك الخاص'
      });
    }
    
    await user.remove();
    
    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

module.exports = router;
