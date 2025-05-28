const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  requirements: {
    type: String,
    required: true
  },
  attachments: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryDate: {
    type: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    date: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
