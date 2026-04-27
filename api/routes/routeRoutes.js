const express = require("express");
const router = express.Router();

const {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} = require("../controllers/routeController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/* ===============================
   PUBLIC
================================= */
router.get("/", getRoutes);

/* ===============================
   ADMIN ONLY
================================= */
router.post(
  "/",
  protect,
  authorize("admin"),
  createRoute
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateRoute
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteRoute
);

module.exports = router;