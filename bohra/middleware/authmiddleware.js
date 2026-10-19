
const jwt = require("jsonwebtoken");
const env = require('../config/environment');

const JWT_SECRET = env.JWT_SECRET;

exports.requireSignIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // { userId, role, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized: invalid token" });
  }
};

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: allowed roles = ${roles.join(", ")}`,
      });
    }

    next();
  };
};
