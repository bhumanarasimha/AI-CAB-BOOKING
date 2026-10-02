const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  pickup: {
    type: String,
    required: true
  },
  dropoff: {
    type: String,
    required: true
  },
  pickupCoords: {
    type: { lat: Number, lng: Number },
    default: null
  },
  dropoffCoords: {
    type: { lat: Number, lng: Number },
    default: null
  },
  vehicleType: {
    type: String,
    required: true,
    default: 'Standard'
  },
  price: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: ''
  },
  distance: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['searching', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'searching'
  },
  aiInsights: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ride', RideSchema);
