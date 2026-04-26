// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const { Server } = require('socket.io');
// const connectDB = require('./config/db');

// // Connect to MongoDB
// connectDB();

// const app = express();
// const server = http.createServer(app);

// const parseAllowedOrigins = () => {
//   const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
//   const list = raw
//     .split(',')
//     .map((s) => s.trim())
//     .filter(Boolean);

//   // Always allow local dev
//   list.push('http://localhost:3000'); // if user uses a dev server
//   list.push('http://localhost:5000');
//   list.push('http://127.0.0.1:5000');
//   return Array.from(new Set(list));
// };

// const allowedOrigins = parseAllowedOrigins();

// const corsOptions = {
//   origin(origin, cb) {
//     // allow non-browser tools (curl/postman) and same-origin
//     if (!origin) return cb(null, true);
//     if (allowedOrigins.includes(origin)) return cb(null, true);
//     // allow Vercel preview domains without hardcoding
//     if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true);
//     return cb(new Error(`CORS blocked for origin: ${origin}`));
//   },
//   credentials: true,
// };

// // Socket.io setup for real-time tracking
// const io = new Server(server, {
//   cors: {
//     origin: (origin, cb) => corsOptions.origin(origin, cb),
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     credentials: true,
//   },
// });

// app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));
// app.use(express.json());

// // Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/buses', require('./routes/busRoutes'));
// app.use('/api/bookings', require('./routes/bookingRoutes'));
// app.use('/api/routes', require('./routes/routeRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));

// app.get('/api/health', (req, res) => {
//   res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
// });

// // Socket.IO Logic
// io.on('connection', (socket) => {
//   console.log('New client connected:', socket.id);

//   // Driver emits location update
//   socket.on('update-location', (data) => {
//     // data should contain { busId, lat, lng }
//     // Broadcast to all students tracking buses
//     io.emit('live-location', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// // Render sets PORT. Local default should match frontend dev config.
// const PORT = process.env.PORT || 5000;

// // Not found + error handler (keep last)
// app.use((req, res) => {
//   res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
// });

// // eslint-disable-next-line no-unused-vars
// app.use((err, req, res, next) => {
//   const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
//   res.status(status).json({
//     message: err.message || 'Server error',
//     ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


require('dotenv').config();
const express = require('express');
const http = require('http');
// const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Connect MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());
app.use(express.json());

/* ==================================================
   CORS CONFIG
================================================== */
const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';

  const list = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  // Local frontend URLs
  list.push('http://localhost:8080');
  list.push('http://127.0.0.1:8080');
  list.push('http://localhost:3000');
  list.push('http://127.0.0.1:3000');

  return [...new Set(list)];
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(null, true); // allow temporarily for development
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

/* ==================================================
   SOCKET.IO
================================================== */
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Client Connected:', socket.id);

  socket.on('update-location', (data) => {
    io.emit('live-location', data);
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected:', socket.id);
  });
});

/* ==================================================
   ROUTES
================================================== */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server running successfully',
    time: new Date(),
  });
});

/* ==================================================
   404 ROUTE
================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ==================================================
   ERROR HANDLER
================================================== */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

/* ==================================================
   START SERVER
================================================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});