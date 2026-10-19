const mongoose = require("mongoose");

function toTitleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeUserFields(userObj) {
  if (!userObj) return;

  if (userObj.name) userObj.name = toTitleCase(userObj.name);
  if (userObj.teamleadName) userObj.teamleadName = toTitleCase(userObj.teamleadName);

  if (userObj.email) userObj.email = userObj.email.toLowerCase().trim();

  if (userObj.address) userObj.address = toTitleCase(userObj.address);

  if (userObj.employeeId) userObj.employeeId = userObj.employeeId.trim().toUpperCase();

  if (userObj.aadharNumber) userObj.aadharNumber = String(userObj.aadharNumber).replace(/\D/g, "");
  if (userObj.phoneNumber) userObj.phoneNumber = String(userObj.phoneNumber).replace(/\D/g, "");
}

const userSchema = new mongoose.Schema(
  {
    // -----------------------------
    // Basic
    // -----------------------------
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: "phoneNumber must be exactly 10 digits",
      },
    },

    address: { type: String, trim: true },

    // -----------------------------
    // Role
    // -----------------------------
    role: {
      type: String,
      enum: ["superadmin", "admin", "teamlead", "employee"],
      default: "employee",
      required: true,
      index: true,
    },

    // -----------------------------
    // Domain & Designation
    // -----------------------------
    domain: {
      type: String,
      enum: ["property", "finance"],
      default: "property",
      required: true,
      index: true,
    },

    designation: {
      type: String,
      enum: ["teamlead", "employee"],
      default: "employee",
      required: true,
      index: true,
    },

    // -----------------------------
    // IDs
    // -----------------------------
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
      required: function () {
        return ["admin", "teamlead", "employee"].includes(this.role);
      },
    },

    teamleadName: {
      type: String,
      trim: true,
      index: true,
      required: function () {
        return this.role === "employee";
      },
    },

    aadharNumber: {
      type: String,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^\d{12}$/.test(v);
        },
        message: "aadharNumber must be exactly 12 digits",
      },
    },

    // -----------------------------
    // Auth
    // -----------------------------
    password: { type: String, required: true, minlength: 6, select: false },

    // -----------------------------
    // Media
    // -----------------------------
 profileImage: {
  base64: {
    type: String, // ✅ Base64 string
  },
  contentType: {
    type: String, // image/png, image/jpeg, image/svg+xml
  },
},
    documents: [
      {
        title: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // -----------------------------
    // Status
    // -----------------------------
    registeredAt: { type: Date, default: Date.now, index: true },
    isLoggedIn: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },

    // ✅ scalability audit fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    approvedAt: { type: Date },

    // Reset password
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // Permissions
    permissions: {
      dashboard: { type: Boolean, default: false },
      dailyPlans: { type: Boolean, default: false },
      allLeads: { type: Boolean, default: false },
      inventory: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ["registeredAt", "createdAt", "updatedAt", "approvedAt"].forEach((k) => {
          if (ret[k]) ret[k] = new Date(ret[k]).toISOString();
        });

        delete ret.password; // ✅ hide password always
        return ret;
      },
    },
  }
);

// indexes
userSchema.index({ role: 1, domain: 1, isApproved: 1 });
userSchema.index({ createdAt: -1 });

// hooks
userSchema.pre("save", function (next) {
  normalizeUserFields(this);
  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!update) return next();
  const target = update.$set || update;
  normalizeUserFields(target);
  next();
});

userSchema.pre("insertMany", function (next, docs) {
  if (Array.isArray(docs)) docs.forEach((doc) => normalizeUserFields(doc));
  next();
});

module.exports = mongoose.model("User", userSchema);
