const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const InviteLinkSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4, // Replaces UUIDV4 from sequelize
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdByAdmin: {
    type: String, // Storing the Admin ID as a string/UUID
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('InviteLink', InviteLinkSchema);
