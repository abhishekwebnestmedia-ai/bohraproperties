const multer = require("multer");
const path = require("path");
const fs = require("fs");

const DOCS_DIR = path.join(__dirname, "../uploads/documents");
const PROFILE_DIR = path.join(__dirname, "../uploads/profile");

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const DOC_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "profileImage") {
      return cb(null, PROFILE_DIR);
    }
    return cb(null, DOCS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const memberUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "profileImage") {
      if (!IMAGE_TYPES.has(file.mimetype)) {
        return cb(new Error("profileImage: only JPEG, PNG, or WebP allowed"));
      }
      return cb(null, true);
    }

    if (file.fieldname === "documents") {
      if (!DOC_TYPES.has(file.mimetype)) {
        return cb(new Error("documents: only JPEG, PNG, WebP, or PDF allowed"));
      }
      return cb(null, true);
    }

    return cb(new Error(`Unsupported upload field: ${file.fieldname}`));
  },
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);

module.exports = (req, res, next) => {
  memberUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const profile = req.files?.profileImage?.[0];
    if (profile && profile.size > 3 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "profileImage: max size is 3 MB",
      });
    }

    next();
  });
};
