const User = require('../models/user');
const bcrypt = require('bcrypt');
const env = require('../env');

// One-time protected endpoint to create a superadmin user.
// Protect by setting ONE_TIME_ADMIN_SECRET env var on the server.
exports.createSuperadmin = async (req, res) => {
  try {
    const secret = process.env.ONE_TIME_ADMIN_SECRET || env.ONE_TIME_ADMIN_SECRET;
    const provided = req.headers['x-admin-secret'] || req.body?.secret;

    if (!secret || provided !== secret) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const email = (req.body.email || process.env.SUPERADMIN_EMAIL || 'abhishekwebnestmedia@gmail.com').toLowerCase().trim();
    const password = req.body.password || process.env.SUPERADMIN_PASSWORD || 'Abhishek@123';
    const name = req.body.name || process.env.SUPERADMIN_NAME || 'Super Admin';
    const phone = req.body.phone || process.env.SUPERADMIN_PHONE || '9999999999';

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(200).json({ success: true, message: 'User already exists', user: { email: existing.email, role: existing.role } });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phoneNumber: phone,
      password: hashed,
      role: 'superadmin',
      domain: 'property',
      designation: 'employee',
      isApproved: true,
      isLoggedIn: false,
      permissions: { dashboard: true, dailyPlans: true, allLeads: true, inventory: true },
    });

    return res.status(201).json({ success: true, message: 'Superadmin created', user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error('createSuperadmin ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
