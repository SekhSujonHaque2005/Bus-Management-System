const Route = require("../models/route");

/* ===============================
   GET ALL ROUTES
================================= */
const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true });

    res.json(routes);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   CREATE ROUTE
================================= */
const createRoute = async (req, res) => {
  try {
    const {
      source,
      destination,
      stops,
      distanceKm,
      estimatedTime
    } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: "Source and destination required"
      });
    }

    const route = await Route.create({
      source,
      destination,
      stops: stops || [],
      distanceKm: distanceKm || 0,
      estimatedTime: estimatedTime || "15 mins",
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Route added successfully",
      route
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   UPDATE ROUTE
================================= */
const updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found"
      });
    }

    res.json({
      success: true,
      message: "Route updated",
      route
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===============================
   DELETE ROUTE
================================= */
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found"
      });
    }

    res.json({
      success: true,
      message: "Route deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute
};