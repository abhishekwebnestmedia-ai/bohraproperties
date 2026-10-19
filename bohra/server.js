// Load env
const env = require("./config/environment");

// Import the app and server from app.js
const { app, server } = require("./app");

/* ==============================
   START SERVER
============================== */

const PORT = env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket Running on ${PORT}`);
});
