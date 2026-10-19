// fix-indexes.mjs
// Run with: mongosh "<ATLAS_URI>" --file fix-indexes.mjs

const DB_NAME = "bohra-crm";
const COLLECTION = "users";

print("======================================");
print("MongoDB Index Fix Script Started");
print("DB:", DB_NAME);
print("Collection:", COLLECTION);
print("======================================");

const dbRef = db.getSiblingDB(DB_NAME);
const col = dbRef.getCollection(COLLECTION);

// 1) Show indexes
print("\n✅ Current indexes:");
const indexes = col.getIndexes();
printjson(indexes);

// 2) Drop old wrong index: empid_1
const hasEmpidIndex = indexes.some((i) => i.name === "empid_1");

if (hasEmpidIndex) {
  print("\n⚠️ Found old index: empid_1 -> dropping...");
  const res = col.dropIndex("empid_1");
  print("✅ Dropped empid_1:", res);
} else {
  print("\n✅ empid_1 index not found. Skipping drop.");
}

// 3) Create correct index for employeeId
print("\n✅ Ensuring correct employeeId unique sparse index exists...");
const empIdIndexName = col.createIndex(
  { employeeId: 1 },
  { unique: true, sparse: true, name: "employeeId_1_unique_sparse" }
);
print("✅ employeeId index ensured:", empIdIndexName);

// 4) Show final indexes
print("\n✅ Final indexes:");
printjson(col.getIndexes());

print("\n🎉 DONE: Index fix completed successfully.");
