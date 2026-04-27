const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
{
  source: {
    type: String,
    required: true,
    trim: true
  },

  destination: {
    type: String,
    required: true,
    trim: true
  },

  stops: {
    type: [String],
    default: []
  },

  distanceKm: {
    type: Number,
    default: 0
  },

  estimatedTime: {
    type: String,
    default: ""
  },

  isActive: {
    type: Boolean,
    default: true
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("Route", routeSchema);