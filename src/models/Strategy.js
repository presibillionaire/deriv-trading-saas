const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const StrategySchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4, // Replaces UUIDV4
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
  },
  icon: {
    type: String,
  },
  filePath: {
    type: String,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Strategy', StrategySchema);
