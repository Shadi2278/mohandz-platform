const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'مفتاح الإعداد مطلوب'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'قيمة الإعداد مطلوبة']
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object', 'image', 'color'],
    default: 'string'
  },
  group: {
    type: String,
    enum: ['general', 'contact', 'social', 'appearance', 'notification', 'payment', 'seo'],
    default: 'general'
  },
  label: {
    type: String,
    required: [true, 'عنوان الإعداد مطلوب'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);
