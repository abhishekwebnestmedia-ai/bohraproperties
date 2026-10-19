// const mongoose = require('mongoose');
// const dns = require('dns').promises;

// const env = require('../env');
// s

// const connectDB = async () => {
//   const uri = env.MONGO_URI;

//   // Common connect options and a reasonably short server selection timeout
//   const connectOpts = { serverSelectionTimeoutMS: 10000 };

//   // If not an SRV URI, just connect normally
//   if (!uri || !uri.startsWith('mongodb+srv://')) {
//     await mongoose.connect(uri, connectOpts);
//     console.log('MongoDB connected');
//     return;
//   }

//   try {
//     // Primary attempt (driver does SRV lookup internally)
//     await mongoose.connect(uri, connectOpts);
//     console.log('MongoDB connected (mongodb+srv)');
//     return;
//   } catch (err) {
//     // If SRV lookup itself was refused, attempt a deterministic fallback
//     const isQuerySrvRefused = err && err.syscall === 'querySrv' && err.code === 'ECONNREFUSED';
//     if (!isQuerySrvRefused) {
//       console.error('MongoDB connection failed:', err && err.message ? err.message : err);
//       throw err; // rethrow for caller to handle
//     }

//     console.warn('SRV lookup refused by DNS server — attempting fallback to direct hosts');

//     try {
//       // Resolve SRV records ourselves and build a mongodb:// host list
//       const records = await dns.resolveSrv('_mongodb._tcp.' + (uri.match(/@([^/]+)\//) || [])[1]);
//       const hosts = records.map((r) => `${r.name}:${r.port}`).join(',');

//       // parse DB name + params from original URI (keep auth intact)
//       const after = uri.replace('mongodb+srv://', ''); // user:pass@host/DB?params
//       const slashIndex = after.indexOf('/');
//       const authAndHost = slashIndex === -1 ? after : after.slice(0, slashIndex); // user:pass@host
//       const dbAndParams = slashIndex === -1 ? '' : after.slice(slashIndex + 1); // db?params

//       const authPart = authAndHost.includes('@') ? authAndHost.split('@')[0] + '@' : '';
//       const fallbackUri = `mongodb://${authPart}${hosts}/${dbAndParams}`;

//       console.info('Attempting fallback URI (mongodb://) — this preserves DB and query params');
//       // final attempt using constructed URI
//       await mongoose.connect(fallbackUri, connectOpts);
//       console.log('MongoDB connected (fallback mongodb://)');
//       return;
//     } catch (fallbackErr) {
//       console.error('Fallback connection also failed:', fallbackErr && fallbackErr.message ? fallbackErr.message : fallbackErr);
//       // throw original error (more informative about SRV failure) so caller sees the root cause
//       throw err;
//     }
//   }
// };

// module.exports = connectDB;


const mongoose = require('mongoose');
const dns = require('dns').promises;

const connectDB = async () => {
  const env = require('./environment');
  let uri = env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI must be set in the environment or local env.js');

  // If user wants to force a specific DB name, set FORCE_DB_NAME env var (e.g. yourDB)
  const forceDb = process.env.FORCE_DB_NAME || undefined;
  if (forceDb) {
    try {
      // Replace the path (DB name and optional params) after the host with the forced DB name, preserving query params
      // Example: mongodb+srv://user:pass@host/oldDB?params  -> mongodb+srv://user:pass@host/forceDb?params
      uri = uri.replace(/^(mongodb(?:\+srv)?:\/\/[^/]+)\/([^?]*)(\?.*)?$/, (m, p1, p2, p3) => {
        const suffix = p3 || '';
        return `${p1}/${encodeURIComponent(forceDb)}${suffix}`;
      });
      console.info('FORCE_DB_NAME applied to Mongo URI:', forceDb);
    } catch (e) {
      console.warn('Failed to apply FORCE_DB_NAME to MONGO_URI:', e && e.message ? e.message : e);
    }
  }

  const connectOpts = {
    serverSelectionTimeoutMS: 10000,
  };

  // 👉 If NOT mongodb+srv → direct connect
  if (!uri.startsWith('mongodb+srv://')) {
    try {
      await mongoose.connect(uri, connectOpts);
      console.log('✅ MongoDB connected (standard)');
      return;
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    }
  }

  // 👉 Try normal SRV connection first
  try {
    await mongoose.connect(uri, connectOpts);
    console.log('✅ MongoDB connected (mongodb+srv)');
    return;
  } catch (err) {
    const isSrvError =
      err?.syscall === 'querySrv' && err?.code === 'ECONNREFUSED';

    if (!isSrvError) {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    }

    console.warn('⚠️ SRV lookup failed, attempting fallback...');

    try {
      // Extract hostname
      const match = uri.match(/@([^/]+)\//);
      if (!match) throw new Error('Invalid MongoDB URI');

      const hostname = match[1];

      // Resolve SRV records
      const records = await dns.resolveSrv(`_mongodb._tcp.${hostname}`);

      const hosts = records
        .map((r) => `${r.name}:${r.port}`)
        .join(',');

      // Remove mongodb+srv://
      const withoutSrv = uri.replace('mongodb+srv://', '');

      const slashIndex = withoutSrv.indexOf('/');
      const authHost =
        slashIndex === -1
          ? withoutSrv
          : withoutSrv.slice(0, slashIndex);

      const dbParams =
        slashIndex === -1
          ? ''
          : withoutSrv.slice(slashIndex + 1);

      const authPart = authHost.includes('@')
        ? authHost.split('@')[0] + '@'
        : '';

      const fallbackUri = `mongodb://${authPart}${hosts}/${dbParams}`;

      console.log('🔁 Trying fallback URI...');

      await mongoose.connect(fallbackUri, connectOpts);

      console.log('✅ MongoDB connected (fallback)');
      return;
    } catch (fallbackErr) {
      console.error(
        '❌ Fallback connection failed:',
        fallbackErr.message
      );
      process.exit(1);
    }
  }
};

module.exports = connectDB;