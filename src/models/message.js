const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ timestamp: 1 });
module.exports = mongoose.model('Message', messageSchema);