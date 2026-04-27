const Booking = require("../models/booking");
const Bus = require("../models/bus");

/* ===============================
   GET CURRENT USER ID SAFELY
================================= */
const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

/* ===============================
   GET MY BOOKINGS
================================= */
const getMyBookings = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const bookings = await Booking.find({
      userId
    })
      .populate("busId", "busNumber")
      .populate("routeId", "source destination");

    res.json(bookings);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   CREATE BOOKING
================================= */
const createBooking = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { busId, routeId, seatNumber } = req.body;

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (bus.seatsAvailable <= 0) {
      return res.status(400).json({
        success: false,
        message: "No seats available"
      });
    }

    const existingSeat = await Booking.findOne({
      busId,
      seatNumber,
      status: "confirmed"
    });

    if (existingSeat) {
      return res.status(400).json({
        success: false,
        message: "Seat already booked"
      });
    }

    const booking = await Booking.create({
      userId,
      busId,
      routeId,
      seatNumber,
      status: "confirmed"
    });

    bus.seatsAvailable -= 1;
    await bus.save();

    res.status(201).json({
      success: true,
      message: "Booked Successfully",
      booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   CANCEL BOOKING
================================= */
const cancelBooking = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (String(booking.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Already cancelled"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    const bus = await Bus.findById(booking.busId);

    if (bus) {
      bus.seatsAvailable += 1;
      await bus.save();
    }

    res.json({
      success: true,
      message: "Booking Cancelled"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMyBookings,
  createBooking,
  cancelBooking
};