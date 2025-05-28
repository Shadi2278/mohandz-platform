const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
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
    type: String
  },
  client: {
    type: String
  },
  location: {
    type: String
  },
  year: {
    type: Number
  },
  images: {
    type: [String],
    required: true
  },
  features: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
