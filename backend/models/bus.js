const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
{
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  busType: {
    type: String,
    default: "Standard"
  },

  capacity: {
    type: Number,
    required: true,
    default: 40
  },

  seatsAvailable: {
    type: Number,
    default: 40
  },

  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active"
  },

  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    default: null
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  currentLocation: {
    lat: { type: Number, default: 31.2536 },
    lng: { type: Number, default: 75.7033 }
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("Bus", busSchema);