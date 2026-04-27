const express = require("express");
const router = express.Router();

const {
  getBuses,
  createBus,
  updateBus,
  deleteBus
} = require("../controllers/busController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/* ===============================
   PUBLIC / STUDENT
================================= */
router.get("/", getBuses);

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