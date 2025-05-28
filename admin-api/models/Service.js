const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان الخدمة مطلوب'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'وصف الخدمة مطلوب']
  },
  shortDescription: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'سعر الخدمة مطلوب'],
    min: [0, 'السعر يجب أن يكون أكبر من أو يساوي صفر']
  },
  category: {
    type: String,
    required: [true, 'فئة الخدمة مطلوبة'],
    enum: ['architectural', 'structural', 'mep', 'comprehensive', 'roads', 'survey', 'networks', 'culverts', 'bridges', 'other'],
    default: 'other'
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  requirements: [{
    type: String
  }],
  deliverables: [{
    type: String
  }],
  estimatedDuration: {
    type: Number, // in days
    default: 7
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create index for search
ServiceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);
