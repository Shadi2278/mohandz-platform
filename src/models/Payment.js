const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'paypal', 'mada', 'stcpay', 'apple_pay'],
    required: true
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rejected'],
    default: 'pending'
  },
  receipt: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
