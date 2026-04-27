const express = require("express");
const router = express.Router();

const {
  getBuses,
  createBus,
  updateBus,
  deleteBus,
  getBusLocation,
  updateBusLocation,
  getBusesByRoute
} = require("../controllers/busController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/* ===============================
   PUBLIC / SHARED
================================= */
router.get("/", getBuses);
router.get("/location/:id", getBusLocation);
router.get("/route/:id", getBusesByRoute);

/* ===============================
   DRIVER & ADMIN
================================= */
router.patch(
  "/location/:id",
  protect,
  authorize("driver", "admin"),
  updateBusLocation
);

/* ===============================
   ADMIN ONLY
================================= */
router.post(
  "/",
  protect,
  authorize("admin"),
  createBus
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateBus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteBus
);

module.exports = router;