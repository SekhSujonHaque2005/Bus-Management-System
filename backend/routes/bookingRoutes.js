const express = require("express");
const router = express.Router();

const {
  getMyBookings,
  createBooking,
  cancelBooking
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

/* ===============================
   STUDENT BOOKINGS
================================= */

router.get("/my", protect, getMyBookings);
router.get("/my-bookings", protect, getMyBookings);

router.post("/", protect, createBooking);

router.delete("/:id", protect, cancelBooking);

module.exports = router;