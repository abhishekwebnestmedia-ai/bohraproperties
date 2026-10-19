const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Upload folder
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// ✅ Storage: disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

// ✅ Allowed mimetypes
const allowedMimeTypes = [
  // images
  "image/jpeg",
  "image/jpg",
  "image/png",

  // pdf
  "application/pdf",

  // csv
  "text/csv",
  "application/csv",
  "text/plain", // some browsers send csv as text/plain

  // excel
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // ✅ 20 MB (bulk excel might be larger)
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: JPG, PNG, PDF, CSV, XLS, XLSX`
        )
      );
    }
    cb(null, true);
  },
});

module.exports = { upload, uploadPath };
