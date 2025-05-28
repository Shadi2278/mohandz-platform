const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['client', 'engineer', 'admin'],
    default: 'client'
  },
  avatar: {
    type: String
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  country: {
    type: String,
    default: 'المملكة العربية السعودية'
  },
  bio: {
    type: String
  },
  specialization: {
    type: String
  },
  resetToken: {
    type: String
  },
  resetTokenExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
