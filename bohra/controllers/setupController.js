const User = require('../models/user');
const bcrypt = require('bcrypt');

// One-time protected endpoint to create a superadmin user.
// Protect by setting ONE_TIME_ADMIN_SECRET env var on the server.
exports.createSuperadmin = async (req, res) => {
  try {
    const secret = process.env.ONE_TIME_ADMIN_SECRET;
    const provided = req.headers['x-admin-secret'];

    if (!secret || provided !== secret) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const email = String(req.body?.email || process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
    const password = req.body?.password || process.env.SUPERADMIN_PASSWORD;
    const name = req.body?.name || process.env.SUPERADMIN_NAME || 'Super Admin';
    const phone = String(req.body?.phone || process.env.SUPERADMIN_PHONE || '').trim();

    if (!email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and phone are required to create the superadmin.',
      });
    }

    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 12 characters long.',
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone must contain exactly 10 digits.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);

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
