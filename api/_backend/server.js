require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const app = express();

/* ===============================
   DATABASE
================================= */
connectDB();

/* ===============================
   MIDDLEWARE
================================= */
app.use(cors());
app.use(express.json());

/* ===============================
   ROUTES
================================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/buses", require("./routes/busRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend Running"
  });
});

/* ===============================
   HTTP SERVER + SOCKET.IO
================================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ===============================
   SOCKET EVENTS
================================= */
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  /* Driver sends live location */
  socket.on("driver-location", (data) => {
    // data = { busId, lat, lng }

    io.emit("live-location", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

/* ===============================
   START SERVER
================================= */
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;