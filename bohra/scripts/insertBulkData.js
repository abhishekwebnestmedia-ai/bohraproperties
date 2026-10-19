const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/user');
const PropertyLead = require('../models/propertyLead');
const FinanceLead = require('../models/financeLead');
const Inventory = require('../models/inventory');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  // generate 10 digit phone starting with 7-9
  const first = pick(['7','8','9']);
  let s = first;
  for (let i=0;i<9;i++) s += String(randInt(0,9));
  return s;
}

const firstNames = ['Arjun','Neha','Raj','Priya','Amit','Sonal','Vikram','Karan','Ritika','Anil','Sneha','Rohit','Divya','Nisha','Manoj','Pooja'];
const lastNames = ['Shah','Patel','Kumar','Gupta','Singh','Mehta','Reddy','Verma','Agarwal','Bohra','Jain'];

function randomName() {
  return pick(firstNames) + ' ' + pick(lastNames);
}

function randomEmail(name, idx) {
  const base = name.toLowerCase().replace(/[^a-z]/g,'') || 'user';
  return `${base}${idx}@example.test`;
}

async function run() {
  await connectDB();

  const adminUser = await User.findOne().lean().exec();
  if (!adminUser) {
    console.error('No User found. Please create at least one user to use as createdBy.');
    process.exit(1);
  }

  const propertyDocs = [];
  const financeDocs = [];
  const inventoryDocs = [];

  const propertyStatuses = [null, 'Follow up','Interested','Busy','Dead'];
  const financeStatuses = [null, 'Dead','Follow up','Interested','Busy','Closed'];
  const residentialTypes = ['flat_apartment','builder_floor','independent_house_villa','plot_land_residential','studio_apartment','serviced_apartment','farmhouse','residential_other'];
  const commercialTypes = ['office','retail','storage','industry','hospitality','plot_land_commercial','commercial_other'];

  for (let i=1;i<=50;i++) {
    const pname = randomName();
    const pphone = randomPhone();
    propertyDocs.push({
      clientName: pname,
      contactNumber: pphone,
      email: randomEmail(pname,i),
      budget: `${randInt(20,500)} Lakh`,
      location: pick(['Mumbai','Delhi','Bengaluru','Pune','Noida','Gurugram','Ahmedabad']),
      project: `Project ${randInt(1,50)}`,
      source: pick(['portal','agent','referral','direct']),
      propertyType: pick(['Commercial','Residential']),
      status: pick(propertyStatuses),
      createdBy: adminUser._id,
      notes: 'Seed data entry',
    });

    const fname = randomName();
    const fphone = randomPhone();
    financeDocs.push({
      clientName: fname,
      contactNumber: fphone,
      email: randomEmail(fname, i+100),
      loanRequirement: `${randInt(5,100)} Lakh`,
      location: pick(['Mumbai','Delhi','Bengaluru','Pune','Noida','Gurugram','Hyderabad']),
      Eligibility: pick(['High','Medium','Low']),
      source: pick(['portal','agent','referral','direct']),
      status: pick(financeStatuses),
      createdBy: adminUser._id,
      notes: 'Seed finance lead',
    });

    // inventory: alternate between residential/commercial
    const isResidential = i % 2 === 0;
    const category = isResidential ? 'residential' : 'commercial';
    const propertyType = isResidential ? pick(residentialTypes) : pick(commercialTypes);

    const inv = {
      category,
      propertyType,
      basicDetails: {
        ownerName: randomName(),
        ownerPhone: randomPhone(),
        ownerEmail: `owner${i}@example.test`,
        ownerAddress: `${randInt(1,999)} Main St, ${pick(['Mumbai','Delhi','Pune','Bengaluru'])}`,
      },
      locationDetails: {
        city: pick(['Mumbai','Delhi','Pune','Bengaluru','Chennai','Kolkata']),
        location: `Area ${randInt(1,100)}`,
        pinCode: String(100000 + randInt(0,899999)).slice(0,6),
      },
      priceDetails: {
        expectedPrice: randInt(2000000, 50000000),
        pricePerSqFt: randInt(2000,15000),
        allInclusivePrice: pick([true,false]),
      },
      status: pick(['active','inactive','sold','withdrawn','pending']),
      remarks: 'Seed inventory',
    };

    // commercial-specific required meta
    if (!isResidential) {
      inv.commercialMeta = {};
      if (propertyType === 'retail') {
        inv.commercialMeta.retailUnitType = pick(['shop','showroom']);
        if (inv.commercialMeta.retailUnitType === 'showroom') inv.commercialMeta.retailProjectType = pick(['mall','commercial_project','residential_project']);
      }
      if (propertyType === 'storage') inv.commercialMeta.storageType = pick(['cold_storage','warm_storage']);
      if (propertyType === 'office') inv.commercialMeta.officeType = pick(['ready_to_move','bare_shell','co_working']);
      if (propertyType === 'industry') inv.commercialMeta.industryType = pick(['factory','manufacturing']);
      if (propertyType === 'hospitality') inv.commercialMeta.hospitalityType = pick(['hotel_resort','guest_house','banquet_hall']);
    }

    inventoryDocs.push(inv);
  }

  try {
    const pRes = await PropertyLead.insertMany(propertyDocs, { ordered: false });
    console.log('Property leads inserted:', pRes.length);
  } catch (e) {
    console.error('Property insert error:', e.message || e);
  }

  try {
    const fRes = await FinanceLead.insertMany(financeDocs, { ordered: false });
    console.log('Finance leads inserted:', fRes.length);
  } catch (e) {
    console.error('Finance insert error:', e.message || e);
  }

  try {
    const iRes = await Inventory.insertMany(inventoryDocs, { ordered: false });
    console.log('Inventory items inserted:', iRes.length);
  } catch (e) {
    console.error('Inventory insert error:', e.message || e);
  }

  await mongoose.disconnect();
}

run().catch((err)=>{ console.error('Fatal:', err && err.message ? err.message : err); process.exit(1); });
