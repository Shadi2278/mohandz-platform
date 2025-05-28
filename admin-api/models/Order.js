const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
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
  price: {
    type: Number,
    required: [true, 'السعر مطلوب'],
    min: [0, 'السعر يجب أن يكون أكبر من أو يساوي صفر']
  },
  status: {
    type: String,
    enum: ['new', 'in_review', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requirements: {
    type: String
  },
  attachments: [{
    name: String,
    path: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
}, {
  timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Find the latest order
    const latestOrder = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    
    // Generate order number
    let orderNumber;
    if (latestOrder && latestOrder.orderNumber) {
      const lastNumber = parseInt(latestOrder.orderNumber.split('-')[1]);
      orderNumber = `${currentYear}-${(lastNumber + 1).toString().padStart(5, '0')}`;
    } else {
      orderNumber = `${currentYear}-00001`;
    }
    
    this.orderNumber = orderNumber;
  }
  
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
