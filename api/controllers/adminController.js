const User = require("../models/user");
const Bus = require("../models/bus");
const Route = require("../models/route");
const Booking = require("../models/booking");

/* ===============================
   ADMIN DASHBOARD STATS
================================= */
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalStudents = await User.countDocuments({
      role: "student"
    });

    const totalDrivers = await User.countDocuments({
      role: "driver"
    });

    const totalAdmins = await User.countDocuments({
      role: "admin"
    });

    const totalBuses = await Bus.countDocuments();

    const activeBuses = await Bus.countDocuments({
      status: "active"
    });

    const inactiveBuses = await Bus.countDocuments({
      status: "inactive"
    });

    const maintenanceBuses = await Bus.countDocuments({
      status: "maintenance"
    });

    const totalRoutes = await Route.countDocuments();

    const totalBookings = await Booking.countDocuments();

    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed"
    });

    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled"
    });

    res.json({
      success: true,
      message: "Admin stats loaded",

      totalUsers,
      totalStudents,
      totalDrivers,
      totalAdmins,

      totalBuses,
      activeBuses,
      inactiveBuses,
      maintenanceBuses,

      totalRoutes,

      totalBookings,
      confirmedBookings,
      cancelledBookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAdminStats
};