const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
{
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
    default: "inactive"
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("Bus", busSchema);