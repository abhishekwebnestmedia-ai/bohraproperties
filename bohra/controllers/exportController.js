const PropertyLead = require('../models/propertyLead');
const FinanceLead = require('../models/financeLead');
const Inventory = require('../models/inventory');

exports.exportAll = async (req, res) => {
  try {
    const [propertyLeads, financeLeads, inventory] = await Promise.all([
      PropertyLead.find().lean().sort({ createdAt: -1 }),
      FinanceLead.find().lean().sort({ createdAt: -1 }),
      Inventory.find().lean().sort({ createdAt: -1 }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      counts: {
        propertyLeads: propertyLeads.length,
        financeLeads: financeLeads.length,
        inventory: inventory.length,
      },
      data: {
        propertyLeads,
        financeLeads,
        inventory,
      },
    };

    const filename = `export-all-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ success: false, message: 'Export failed' });
  }
};
