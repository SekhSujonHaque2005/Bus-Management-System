const Bus = require("../models/bus");

/* ===============================
   GET ALL BUSES
================================= */
const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate("driverId", "name email")
      .populate("routeId");

    res.json({ success: true, buses });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   GET ACTIVE BUSES
================================= */
const getActiveBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ status: "active" });

    res.json({ success: true, buses });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   CREATE BUS (ADMIN)
================================= */
const createBus = async (req, res) => {
  try {
    const { busNumber, busType, routeId, capacity, status } = req.body;

    if (!busNumber || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Bus number and capacity required"
      });
    }

    const existingBus = await Bus.findOne({ busNumber });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: "Bus already exists"
      });
    }

    const bus = await Bus.create({
      busNumber,
      busType: busType || "Standard",
      routeId: routeId || null,
      capacity: Number(capacity),
      seatsAvailable: Number(capacity),
      status: status || "active",
      currentLocation: {
        lat: 31.2536,
        lng: 75.7033
      }
    });

    res.status(201).json({
      success: true,
      message: "Bus added successfully",
      bus
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   UPDATE BUS
================================= */
const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.json({
      success: true,
      message: "Bus updated",
      bus
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   DELETE BUS
================================= */
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.json({
      success: true,
      message: "Bus deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   GET BUS LOCATION
================================= */
const getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.json(bus.currentLocation);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   UPDATE BUS LOCATION
================================= */
const updateBusLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { lat, lng }
      },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.json({
      success: true,
      bus
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   BUS STATS
================================= */
const getBusStats = async (req, res) => {
  try {
    const total = await Bus.countDocuments();
    const active = await Bus.countDocuments({ status: "active" });

    res.json({
      success: true,
      total,
      active
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBuses,
  getActiveBuses,
  createBus,
  updateBus,
  deleteBus,
  getBusLocation,
  updateBusLocation,
  getBusStats
};
