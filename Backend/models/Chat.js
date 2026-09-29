const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: String,
    required: true
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  messages: [{
    text: {
      type: String,
      required: true
    },
    senderId: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chat', ChatSchema);
