const express = require('express');
const router = express.Router();

const { requireSignIn } = require('../middleware/authmiddleware');
const ExportController = require('../controllers/exportController');

// GET /api/export/all -> downloads a JSON file containing all data
router.get('/all', requireSignIn, ExportController.exportAll);

module.exports = router;
