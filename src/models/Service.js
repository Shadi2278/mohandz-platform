const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['architectural', 'infrastructure', 'surveying']
  },
  subcategory: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  features: {
    type: [String],
    default: []
  },
  image: {
    type: String
  },
  requirements: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', ServiceSchema);
