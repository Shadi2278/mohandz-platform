const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const projectRoutes = require('./routes/projects');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../client/public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/projects', projectRoutes);

// Serve the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mohandz', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

module.exports = app;
