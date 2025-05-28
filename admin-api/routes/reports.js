const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Service = require('../models/Service');
const Project = require('../models/Project');
const { auth, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

/**
 * @route   GET /api/admin/reports/dashboard
 * @desc    Get dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments({ role: 'client' });
    const serviceCount = await Service.countDocuments();
    const orderCount = await Order.countDocuments();
    const projectCount = await Project.countDocuments();
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('client', 'name email')
      .populate('service', 'title');
    
    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue statistics
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Monthly revenue for current year
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31, 23, 59, 59)
          },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format monthly revenue
    const formattedMonthlyRevenue = Array(12).fill(0);
    monthlyRevenue.forEach(item => {
      formattedMonthlyRevenue[item._id - 1] = item.revenue;
    });
    
    // Get top services
    const topServices = await Order.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: '$service'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          revenue: 1,
          'service.title': 1,
          'service.category': 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        counts: {
          users: userCount,
          services: serviceCount,
          orders: orderCount,
          projects: projectCount
        },
        recentOrders,
        ordersByStatus,
        revenue: {
          monthly: formattedMonthlyRevenue
        },
        topServices
      }
    });
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/reports/sales
 * @desc    Get sales reports
 * @access  Private/Admin
 */
router.get('/sales', auth, authorize(['admin']), async (req, res) => {
  try {
    const { 
      period = 'monthly', 
      startDate, 
      endDate,
      serviceId,
      paymentStatus
    } = req.query;
    
    // Build match stage
    const match = {};
    
    // Add date range
    if (startDate || endDate) {
      match.createdAt = {};
      
      if (startDate) {
        match.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        match.createdAt.$lte = new Date(endDate);
      }
    } else {
      // Default to current year if no date range specified
      const currentYear = new Date().getFullYear();
      match.createdAt = {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31, 23, 59, 59)
      };
    }
    
    // Add service filter
    if (serviceId) {
      match.service = mongoose.Types.ObjectId(serviceId);
    }
    
    // Add payment status filter
    if (paymentStatus) {
      match.paymentStatus = paymentStatus;
    }
    
    // Build group stage based on period
    let groupStage = {};
    
    if (period === 'daily') {
      groupStage = {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      };
    } else if (period === 'monthly') {
      groupStage = {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      };
    } else if (period === 'yearly') {
      groupStage = {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      };
    } else if (period === 'service') {
      groupStage = {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      };
    }
    
    // Execute aggregation
    const salesData = await Order.aggregate([
      {
        $match: match
      },
      groupStage,
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // If grouped by service, populate service details
    if (period === 'service') {
      const populatedSalesData = await Service.populate(salesData, {
        path: '_id',
        select: 'title category'
      });
      
      // Format response
      const formattedSalesData = populatedSalesData.map(item => ({
        service: item._id,
        count: item.count,
        revenue: item.revenue
      }));
      
      return res.json({
        success: true,
        data: formattedSalesData
      });
    }
    
    // Format response for date-based periods
    const formattedSalesData = salesData.map(item => {
      let date;
      
      if (period === 'daily') {
        date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`;
      } else if (period === 'monthly') {
        date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
      } else if (period === 'yearly') {
        date = `${item._id.year}`;
      }
      
      return {
        date,
        count: item.count,
        revenue: item.revenue
      };
    });
    
    res.json({
      success: true,
      data: formattedSalesData
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/reports/users
 * @desc    Get user reports
 * @access  Private/Admin
 */
router.get('/users', auth, authorize(['admin']), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Build group stage based on period
    let groupStage = {};
    
    if (period === 'daily') {
      groupStage = {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      };
    } else if (period === 'monthly') {
      groupStage = {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      };
    } else if (period === 'yearly') {
      groupStage = {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      };
    }
    
    // Execute aggregation
    const userData = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear - 1, 0, 1),
            $lte: new Date(currentYear, 11, 31, 23, 59, 59)
          }
        }
      },
      groupStage,
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format response
    const formattedUserData = userData.map(item => {
      let date;
      
      if (period === 'daily') {
        date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`;
      } else if (period === 'monthly') {
        date = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
      } else if (period === 'yearly') {
        date = `${item._id.year}`;
      }
      
      return {
        date,
        count: item.count
      };
    });
    
    // Get user roles distribution
    const userRoles = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        registrations: formattedUserData,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('User report error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/reports/projects
 * @desc    Get project reports
 * @access  Private/Admin
 */
router.get('/projects', auth, authorize(['admin']), async (req, res) => {
  try {
    // Get projects by status
    const projectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get projects by service
    const projectsByService = await Project.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: '$service'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          'service.title': 1,
          'service.category': 1
        }
      }
    ]);
    
    // Get average project duration
    const averageDuration = await Project.aggregate([
      {
        $match: {
          status: 'completed',
          startDate: { $exists: true, $ne: null },
          endDate: { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          duration: { 
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: '$duration' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        byStatus: projectsByStatus,
        byService: projectsByService,
        averageDuration: averageDuration.length > 0 ? Math.round(averageDuration[0].averageDuration) : 0
      }
    });
  } catch (error) {
    console.error('Project report error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * @route   GET /api/admin/reports/export
 * @desc    Export data as CSV
 * @access  Private/Admin
 */
router.get('/export', auth, authorize(['admin']), async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // Build date range
    const dateRange = {};
    
    if (startDate || endDate) {
      if (startDate) {
        dateRange.$gte = new Date(startDate);
      }
      
      if (endDate) {
        dateRange.$lte = new Date(endDate);
      }
    }
    
    let data = [];
    let fields = [];
    let filename = '';
    
    // Export based on type
    if (type === 'orders') {
      // Get orders
      const orders = await Order.find({ 
        createdAt: Object.keys(dateRange).length > 0 ? dateRange : { $exists: true } 
      })
        .populate('client', 'name email phone')
        .populate('service', 'title')
        .populate('assignedTo', 'name');
      
      // Format data
      data = orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        client: order.client ? order.client.name : '',
        clientEmail: order.client ? order.client.email : '',
        clientPhone: order.client ? order.client.phone : '',
        service: order.service ? order.service.title : '',
        price: order.price,
        status: order.status,
        paymentStatus: order.paymentStatus,
        assignedTo: order.assignedTo ? order.assignedTo.name : '',
        createdAt: order.createdAt.toISOString().split('T')[0]
      }));
      
      fields = [
        'id', 'orderNumber', 'client', 'clientEmail', 'clientPhone', 
        'service', 'price', 'status', 'paymentStatus', 'assignedTo', 'createdAt'
      ];
      
      filename = 'orders-export.csv';
    } else if (type === 'users') {
      // Get users
      const users = await User.find({ 
        createdAt: Object.keys(dateRange).length > 0 ? dateRange : { $exists: true } 
      });
      
      // Format data
      data = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString().split('T')[0]
      }));
      
      fields = [
        'id', 'name', 'email', 'phone', 'role', 'status', 'createdAt'
      ];
      
      filename = 'users-export.csv';
    } else if (type === 'projects') {
      // Get projects
      const projects = await Project.find({ 
        createdAt: Object.keys(dateRange).length > 0 ? dateRange : { $exists: true } 
      })
        .populate('client', 'name email')
        .populate('service', 'title');
      
      // Format data
      data = projects.map(project => ({
        id: project._id,
        title: project.title,
        client: project.client ? project.client.name : '',
        clientEmail: project.client ? project.client.email : '',
        service: project.service ? project.service.title : '',
        status: project.status,
        progress: project.progress,
        budget: project.budget,
        location: project.location,
        startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
        endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
        createdAt: project.createdAt.toISOString().split('T')[0]
      }));
      
      fields = [
        'id', 'title', 'client', 'clientEmail', 'service', 'status', 
        'progress', 'budget', 'location', 'startDate', 'endDate', 'createdAt'
      ];
      
      filename = 'projects-export.csv';
    } else {
      return res.status(400).json({
        success: false,
        message: 'نوع التصدير غير صالح'
      });
    }
    
    // Generate CSV
    const csv = generateCSV(data, fields);
    
    // Set headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send CSV
    res.send(csv);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * Generate CSV from data
 * @param {Array} data - Array of objects
 * @param {Array} fields - Array of field names
 * @returns {String} - CSV string
 */
function generateCSV(data, fields) {
  // Generate header
  const header = fields.join(',');
  
  // Generate rows
  const rows = data.map(item => {
    return fields.map(field => {
      const value = item[field] !== undefined ? item[field] : '';
      
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  return [header, ...rows].join('\n');
}

module.exports = router;
