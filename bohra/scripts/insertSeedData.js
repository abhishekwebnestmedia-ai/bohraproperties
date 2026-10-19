const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');

async function run() {
  await connectDB();

  const seedUsers = [

    {
     
      email: 'admin@webnestmedia.online',
    
      password: 'AdminPass1!',
    
    },
    {
     
      email: 'demo@webnestmedia.online',
   
      password: 'Employee1!',
      
    },
  ];

  try {
    // Hash passwords
    for (const u of seedUsers) {
      u.password = await bcrypt.hash(u.password, 10);
    }

    const result = await User.insertMany(seedUsers, { ordered: false });
    console.log(`Inserted ${result.length} users`);
  } catch (err) {
    // Mongo bulk insert may throw on duplicates; log details
    console.error('Insert error:', err && err.message ? err.message : err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((e) => {
  console.error('Fatal:', e && e.message ? e.message : e);
  process.exit(1);
});
