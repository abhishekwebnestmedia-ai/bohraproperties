const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Mongoose 6+ enables strictPopulate by default; disable it so that
// populate() calls on paths not in the schema don't throw errors.
mongoose.set('strictPopulate', false);
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Load env
const env = require("./config/environment");

const app = express();

/* ==============================
   ROUTES
============================== */
const leadRoutes = require("./routes/propertyLeadRoutes");
const financeLeadRoutes = require("./routes/financeLeadRoutes");
const taskNoteRoutes = require("./routes/taskNoteRoutes");
const operational = require("./routes/operationRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const inventoryRoutes = require("./routes/inventoryRoutes");
const exportRoutes = require("./routes/exportRoutes");
/* ==============================
   MIDDLEWARE
============================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ==============================
   API ROUTES
============================== */
app.use("/api/pleads", leadRoutes);
app.use("/api/fleads", financeLeadRoutes);
app.use("/api/notes", taskNoteRoutes);
app.use("/api/opera", operational);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/export", exportRoutes);

/* ==============================
   DB CONNECT
============================== */
const connectDB = require('./config/db');

connectDB().catch((err) => {
  console.error('❌ Mongo Error:', err);
  process.exit(1);
});

/* ==============================
   HTTP + SOCKET
============================== */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Make io global
global.io = io;

/* ==============================
   SOCKET AUTHENTICATION MIDDLEWARE
============================== */

const JWT_SECRET = env.JWT_SECRET;

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token;
  
  if (!token) {
    return next(new Error("Unauthorized - No token provided"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId || decoded._id;
    socket.role = decoded.role;
    socket.userName = decoded.name;
    next();
  } catch (err) {
    next(new Error("Unauthorized - Invalid token"));
  }
});

/* ==============================
   SOCKET CONNECTION HANDLER
============================== */

io.on("connection", (socket) => {
  console.log(`🔌 Socket Connected: ${socket.id} | User: ${socket.userId}`);

  // Join user's personal room
  socket.join(socket.userId);

  // Join admin room if applicable
  if (socket.role === "admin" || socket.role === "superadmin") {
    socket.join("admins");
    console.log(`✅ ${socket.userName} (${socket.role}) joined admin room`);
  }

  // Optional: Team lead room
  if (socket.role === "teamlead") {
    socket.join(`teamlead:${socket.userId}`);
  }

  // Acknowledge connection to client
  socket.emit("connected", {
    message: "Connected to CRM",
    userId: socket.userId,
    role: socket.role,
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket Disconnected: ${socket.id} | User: ${socket.userId}`);
  });

  // Optional: heartbeat to keep connection alive
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date() });
  });
});

/* ==============================
   CRON JOB
============================== */

require("./cron/reminderJob");

/* ==============================
   DEFAULT ROUTES
============================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM Backend Running",
    time: new Date(),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

module.exports = { app, server };
