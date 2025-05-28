// Backend API for Mohandz Admin Dashboard

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'mohandz-secret-key';

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mohandz', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Invalid file type!'));
    }
  }
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const projectRoutes = require('./routes/projects');
const contentRoutes = require('./routes/content');
const settingRoutes = require('./routes/settings');
const reportRoutes = require('./routes/reports');

// Auth Middleware
const authMiddleware = require('./middleware/auth');

// Routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/users', authMiddleware, userRoutes);
app.use('/api/admin/services', authMiddleware, serviceRoutes);
app.use('/api/admin/orders', authMiddleware, orderRoutes);
app.use('/api/admin/projects', authMiddleware, projectRoutes);
app.use('/api/admin/content', authMiddleware, contentRoutes);
app.use('/api/admin/settings', authMiddleware, settingRoutes);
app.use('/api/admin/reports', authMiddleware, reportRoutes);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
