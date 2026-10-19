const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const PropertyLead = require('../models/propertyLead');
const { generateExcel, generateCSV } = require('../utils/exportHelpers');

exports.exportPropertyLeads = async (req, res) => {
  try {
    let { format = 'csv' } = req.query;
    format = String(format).toLowerCase();

    const propertyLeads = await PropertyLead.find()
      .populate('teamLead', 'name')
      .populate('relationshipManager', 'name')
      .populate('transferTo', 'name')
      .lean()
      .sort({ createdAt: -1 });

    console.log(`📁 property export requested, format=${format}, count=${propertyLeads.length}`);
    if (propertyLeads.length > 0) {
      console.log('  first record example:', JSON.stringify(propertyLeads[0]).slice(0, 200));
    }

    if (propertyLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'No data to export' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];

    if (format === 'excel' || format === 'xlsx') {
      // Generate excel buffer in-memory
      const workbook = generateExcel(propertyLeads, 'Property Leads', 'property');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `property-leads-${timestamp}.xlsx`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      return res.send(buffer);
    } else {
      // CSV output
      const csvData = generateCSV(propertyLeads, 'property');
      const filename = `property-leads-${timestamp}.csv`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csvData);
    }
  } catch (err) {
    console.error('Property export error:', err);
    return res.status(500).json({ success: false, message: 'Property export failed: ' + err.message });
  }
};
