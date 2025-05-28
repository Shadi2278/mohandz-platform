const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان المشروع مطلوب'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'وصف المشروع مطلوب']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'العميل مطلوب']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'الخدمة مطلوبة']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  images: [{
    url: String,
    caption: String
  }],
  documents: [{
    name: String,
    path: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },
    completedDate: Date
  }],
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create index for search
ProjectSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Project', ProjectSchema);
