const mongoose = require('mongoose');

const ParcelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderPhone: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverPhone: {
    type: String,
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  dropoffLocation: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  fragile: {
    type: Boolean,
    default: false
  },
  selectedService: {
    type: String,
    default: 'express'
  },
  price: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Parcel', ParcelSchema);
