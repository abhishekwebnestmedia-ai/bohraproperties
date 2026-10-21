const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const User = require('../models/user');
const env = require('../config/environment');

const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD;
const name = process.env.SUPERADMIN_NAME?.trim() || 'Super Admin';
const phoneNumber = process.env.SUPERADMIN_PHONE?.trim();
const resetExisting = process.argv.includes('--reset-password');

async function run() {
  if (!env.MONGO_URI) {
    throw new Error('MONGO_URI must point to the production database before provisioning an account.');
  }

  const databaseName = env.MONGO_URI.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)?.[1];
  if (databaseName?.toLowerCase() === 'yourdb') {
    throw new Error('MONGO_URI still uses the placeholder database name "yourDB". Set the actual database name first.');
  }

  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before provisioning an account.');
  }

  if (!email || !password || !phoneNumber) {
    throw new Error('Set SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, and SUPERADMIN_PHONE in the environment.');
  }

  if (password.length < 12) {
    throw new Error('SUPERADMIN_PASSWORD must be at least 12 characters long.');
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    throw new Error('SUPERADMIN_PHONE must contain exactly 10 digits.');
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing && !resetExisting) {
    throw new Error('That account already exists. Use --reset-password to reset an existing superadmin account.');
  }

  if (existing && existing.role !== 'superadmin') {
    throw new Error('The existing account is not a superadmin; refusing to change its role or password.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  if (existing) {
    existing.password = hashedPassword;
    existing.isApproved = true;
    existing.isLoggedIn = false;
    await existing.save();
    console.log(`Superadmin password reset for ${email}.`);
    return;
  }

  await User.create({
    name,
    email,
    phoneNumber,
    password: hashedPassword,
    role: 'superadmin',
    domain: 'property',
    designation: 'employee',
    isApproved: true,
    isLoggedIn: false,
    permissions: { dashboard: true, dailyPlans: true, allLeads: true, inventory: true },
  });

  console.log(`Approved superadmin created for ${email}.`);
}

run()
  .catch((error) => {
    console.error(`Superadmin provisioning failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
