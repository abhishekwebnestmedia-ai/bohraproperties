const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const Inventory = require('../models/inventory');
const { generateExcel, generateCSV } = require('../utils/exportHelpers');

exports.exportInventories = async (req, res) => {
  try {
    let { format = 'csv' } = req.query;
    format = String(format).toLowerCase();

    // Use aggregate to bypass Mongoose's populate code path entirely.
    // This avoids the StrictPopulateError that occurs when MongoDB documents
    // contain an `ownerObjectId` field not defined in the current schema.
    const inventory = await Inventory.aggregate([
      { $sort: { createdAt: -1 } },
    ]);

    console.log(`📁 inventory export requested, format=${format}, count=${inventory.length}`);
    if (inventory.length > 0) {
      console.log('  first record example:', JSON.stringify(inventory[0]).slice(0, 200));
    }

    if (inventory.length === 0) {
      return res.status(400).json({ success: false, message: 'No data to export' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];

    if (format === 'excel' || format === 'xlsx') {
      const workbook = generateExcel(inventory, 'Inventory', 'inventory');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `inventory-${timestamp}.xlsx`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      return res.send(buffer);
    } else {
      const csvData = generateCSV(inventory, 'inventory');
      const filename = `inventory-${timestamp}.csv`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csvData);
    }
  } catch (err) {
    console.error('Inventory export error:', err);
    return res.status(500).json({ success: false, message: 'Inventory export failed: ' + err.message });
  }
};
