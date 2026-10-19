const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const FinanceLead = require('../models/financeLead');
const { generateExcel, generateCSV } = require('../utils/exportHelpers');

exports.exportFinanceLeads = async (req, res) => {
  try {
    let { format = 'csv' } = req.query;
    format = String(format).toLowerCase();

    const financeLeads = await FinanceLead.find()
      .populate('teamLead', 'name')
      .populate('relationshipManager', 'name')
      .populate('transferTo', 'name')
      .lean()
      .sort({ createdAt: -1 });

    console.log(`📁 finance export requested, format=${format}, count=${financeLeads.length}`);
    if (financeLeads.length > 0) {
      console.log('  first record example:', JSON.stringify(financeLeads[0]).slice(0, 200));
    }

    if (financeLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'No data to export' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];

    if (format === 'excel' || format === 'xlsx') {
      const workbook = generateExcel(financeLeads, 'Finance Leads', 'finance');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `finance-leads-${timestamp}.xlsx`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      return res.send(buffer);
    } else {
      const csvData = generateCSV(financeLeads, 'finance');
      const filename = `finance-leads-${timestamp}.csv`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csvData);
    }
  } catch (err) {
    console.error('Finance export error:', err);
    return res.status(500).json({ success: false, message: 'Finance export failed: ' + err.message });
  }
};
