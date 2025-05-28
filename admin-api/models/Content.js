const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان المحتوى مطلوب'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'المسار المختصر مطلوب'],
    unique: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['page', 'slider', 'testimonial', 'faq', 'project_showcase', 'service_detail', 'team_member'],
    required: [true, 'نوع المحتوى مطلوب']
  },
  content: {
    type: String
  },
  excerpt: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  gallery: [{
    url: String,
    caption: String,
    order: Number
  }],
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  meta: {
    title: String,
    description: String,
    keywords: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create slug from title
ContentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  }
  
  next();
});

// Create index for search
ContentSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

module.exports = mongoose.model('Content', ContentSchema);
