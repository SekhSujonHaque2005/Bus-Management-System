const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true
  },

  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true
  },

  seatNumber: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["confirmed", "cancelled"],
    default: "confirmed"
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("Booking", bookingSchema);