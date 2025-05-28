// Script to create or reset admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mohandz', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    let admin = await User.findOne({ email: 'admin@mohandz.com' });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    if (admin) {
      // Update existing admin
      admin.password = hashedPassword;
      admin.name = 'مدير النظام';
      admin.role = 'admin';
      admin.status = 'active';
      
      await admin.save();
      console.log('Admin user updated successfully');
    } else {
      // Create new admin
      admin = new User({
        name: 'مدير النظام',
        email: 'admin@mohandz.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@mohandz.com');
    console.log('Password: Admin@123');
    
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  }
  
  // Close connection
  mongoose.connection.close();
};

// Run script
connectDB().then(() => {
  createAdminUser();
});
