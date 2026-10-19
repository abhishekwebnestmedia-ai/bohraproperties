const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const PropertyLead = require("../models/propertyLead");
const FinanceLead = require("../models/financeLead");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const env = require('../config/environment');

const APP_ENV = {
  EMAIL_USER: env.EMAIL_USER || "",
  EMAIL_PASS: env.EMAIL_PASS || "",
  JWT_SECRET: env.JWT_SECRET,
  BACKEND_URL: env.BACKEND_URL,
  FRONTEND_URL: env.FRONTEND_URL,
  ADMIN_EMAIL: env.ADMIN_EMAIL || env.EMAIL_USER || "",
};



// mail transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: APP_ENV.EMAIL_USER,
    pass: APP_ENV.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const signToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      domain: user.domain,
      designation: user.designation,
    },
    APP_ENV.JWT_SECRET,
    { expiresIn: "9h" }
  );
};

// who can create whom
const CREATE_RULES = {
  superadmin: ["admin", "teamlead", "employee"],
  admin: ["admin", "teamlead", "employee"],
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUserLeadFilter = async (user) => {
  const uid = new mongoose.Types.ObjectId(user._id);
  const normalizedRole = String(user.role || "").toLowerCase();

  if (normalizedRole === "employee") {
    return { relationshipManager: uid };
  }

  if (normalizedRole === "teamlead") {
    const teamMembers = await User.find({ createdBy: uid, role: "employee" }).select("_id");
    const teamMemberIds = teamMembers.map((member) => member._id);

    return {
      $or: [
        { teamLead: uid },
        { createdBy: uid },
        ...(teamMemberIds.length ? [{ relationshipManager: { $in: teamMemberIds } }] : []),
      ],
    };
  }

  return {
    $or: [
      { createdBy: uid },
      { teamLead: uid },
      { relationshipManager: uid },
    ],
  };
};

// ----------------------------------------------------
// ✅ REGISTER (Role Based)
// ----------------------------------------------------
exports.register = async (req, res) => {
  try {
    const creatorRole = String(req.user?.role || "").toLowerCase();

    if (!creatorRole || !["superadmin", "admin"].includes(creatorRole)) {
      return res.status(403).json({
        success: false,
        message: "Only superadmin/admin can register users",
      });
    }

    const {
      name,
      email,
      phoneNumber,
      address,
      password,
      confirmPassword,

      role,
      domain,
      designation,

      employeeId,
      teamleadName,
      aadharNumber,
    } = req.body;

    let requestedRole = role;
    let requestedDomain = domain;
    let requestedDesignation = designation;
    let requestedTeamleadName = teamleadName;

    // base required fields
    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "name, email, phoneNumber, password, confirmPassword are required",
      });
    }

    // password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    const sanitizedPhone = String(phoneNumber || "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(sanitizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "phoneNumber must be exactly 10 digits",
      });
    }

    const sanitizedAadhar = aadharNumber ? String(aadharNumber).replace(/\D/g, "") : undefined;
    if (sanitizedAadhar && !/^\d{12}$/.test(sanitizedAadhar)) {
      return res.status(400).json({
        success: false,
        message: "aadharNumber must be exactly 12 digits",
      });
    }

    // role based creation
    const allowedRoles = CREATE_RULES[creatorRole] || [];
    if (!requestedRole || !allowedRoles.includes(requestedRole)) {
      return res.status(403).json({
        success: false,
        message: "Only superadmin/admin can register admin, teamlead, and employee",
      });
    }

    // extra validations for admin created by superadmin
    if (requestedRole === "admin") {
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is required while creating admin",
        });
      }
    }

    // extra validations for teamlead/employee created by admin
    if (["teamlead", "employee"].includes(requestedRole)) {
      if (!requestedDomain || !["finance", "property"].includes(requestedDomain)) {
        return res.status(400).json({
          success: false,
          message: "domain is required and must be finance/property",
        });
      }

      if (!requestedDesignation || !["teamlead", "employee"].includes(requestedDesignation)) {
        return res.status(400).json({
          success: false,
          message: "designation is required and must be teamlead/employee",
        });
      }

      // strict mapping: role must match designation
      if (requestedRole === "teamlead" && requestedDesignation !== "teamlead") {
        return res.status(400).json({
          success: false,
          message: "designation must be teamlead when role is teamlead",
        });
      }

      if (requestedRole === "employee" && requestedDesignation !== "employee") {
        return res.status(400).json({
          success: false,
          message: "designation must be employee when role is employee",
        });
      }

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is compulsory for teamlead/employee",
        });
      }

      if (requestedRole === "employee" && !requestedTeamleadName) {
        return res.status(400).json({
          success: false,
          message: "teamleadName is required for employee",
        });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    // check existing email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // approval flow
    // superadmin creates admin => auto approved
    // admin creates employee/teamlead => pending approval
    const isApproved = creatorRole === "superadmin";

    /* ─────────────────────────────────────────────────────
       Handle optional file uploads (via memberUpload middleware)
       req.files may be:  { profileImage: [File], documents: [File, ...] }
    ───────────────────────────────────────────────────── */
    let profileImage;
    let documents = [];

    if (req.files) {
      // Profile image → base64-encode from memory buffer/disk file
      const profileFiles = req.files.profileImage;
      if (profileFiles && profileFiles.length > 0) {
        const pf = profileFiles[0];
        const base64 = pf.buffer
          ? pf.buffer.toString("base64")
          : (pf.path ? fs.readFileSync(pf.path, "base64") : undefined);

        if (pf.path) {
          fs.unlink(pf.path, () => {});
        }

        if (!base64) {
          return res.status(400).json({ success: false, message: "Invalid profileImage upload" });
        }

        profileImage = {
          base64,
          contentType: pf.mimetype,
        };
      }

      // Documents → disk-stored; save relative URL
      const docFiles = req.files.documents;
      if (docFiles && docFiles.length > 0) {
        documents = docFiles.map((f) => ({
          title:      f.originalname,
          fileUrl:    `/uploads/documents/${f.filename || path.basename(f.path || "")}`,
          uploadedAt: new Date(),
        }));
      }
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phoneNumber: sanitizedPhone,
      address,

      // ✅ IMPORTANT FIX:
      // store ONLY hashed password
      password: hashedPassword,

      role: requestedRole,
      domain: requestedDomain || "property",
      designation: requestedDesignation || "employee",

      employeeId,
      teamleadName: requestedTeamleadName,
      aadharNumber: sanitizedAadhar,

      ...(profileImage  && { profileImage }),
      ...(documents.length && { documents }),

      isApproved,
      isLoggedIn: false,

      createdBy: req.user.userId,
      approvedBy: isApproved ? req.user.userId : undefined,
      approvedAt: isApproved ? new Date() : undefined,
    });

    // if pending approval -> send mail
    if (!isApproved) {
      const approvalToken = jwt.sign({ userId: user._id }, APP_ENV.JWT_SECRET, {
        expiresIn: "48h",
      });

      const approvalUrl = `${APP_ENV.BACKEND_URL}/api/auth/approve-user/${approvalToken}`;

      try {
        await transporter.sendMail({
          from: `"Bohra CRM" <${APP_ENV.EMAIL_USER}>`,
          to: APP_ENV.ADMIN_EMAIL,
          subject: "New User Requires Approval",
          html: `
            <h2>New User Registration Request</h2>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Domain:</strong> ${user.domain}</p>
            <br>
            <a href="${approvalUrl}" style="background:green;color:white;padding:12px 18px;text-decoration:none;border-radius:5px;">
              APPROVE USER
            </a>
          `,
        });
      } catch (mailErr) {
        // Registration should not fail just because email delivery fails.
        console.error("REGISTER MAIL ERROR:", mailErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: isApproved
        ? "Admin registered successfully (auto approved)"
        : "User registered successfully (pending approval)",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        domain: user.domain,
        designation: user.designation,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error?.name === "ValidationError") {
      const first = Object.values(error.errors || {})[0];
      return res.status(400).json({
        success: false,
        message: first?.message || "Validation failed",
      });
    }

    if (error?.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: `${key} already exists`,
      });
    }

    // ✅ during development you can show exact error:
    // return res.status(500).json({ success: false, message: error.message });

    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// ✅ LOGIN
// ----------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    // IMPORTANT: password is select:false
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval. Please wait.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    user.isLoggedIn = true;
    await user.save();

    const token = signToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        domain: user.domain,
        designation: user.designation,
        phoneNumber: user.phoneNumber,
        employeeId: user.employeeId,
        profileImage: user.profileImage?.base64
          ? `data:${user.profileImage.contentType};base64,${user.profileImage.base64}`
          : null,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------
// ✅ LOGOUT
// ----------------------------------------------------
exports.logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isLoggedIn = false;
    await user.save();

    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------
// ✅ APPROVE USER
// ----------------------------------------------------
exports.approveUser = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, APP_ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).send("❌ User not found");

    if (user.isApproved) {
      return res.status(200).send(`
        <h2>✔ Already Approved</h2>
        <p>${user.name} (${user.email}) already approved.</p>
      `);
    }

    user.isApproved = true;
    user.approvedBy = req.user.userId;
    user.approvedAt = new Date();
    await user.save();

    return res.status(200).send(`
      <h2>✔ User Approved Successfully</h2>
      <p>${user.name} (${user.email}) can now log in.</p>
    `);
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    return res.status(400).send("❌ Invalid or expired approval link");
  }
};

// ----------------------------------------------------
// ✅ GET ALL USERS
// ----------------------------------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const requester = await User.findById(req.user.userId).select("_id role name domain employeeId createdBy");
    if (!requester) {
      return res.status(404).json({ success: false, message: "Request user not found" });
    }

    const requesterRole = String(requester.role || "").toLowerCase();

    const query = {};
    let users;

    if (["superadmin", "admin"].includes(requesterRole)) {
      // Admin and superadmin can view all users.
    } else if (requesterRole === "teamlead") {
      // Team leads can view a scoped set: self + own admin/superadmin + same-domain employees.
      const usersMap = new Map();
      const pushUser = (u) => {
        if (!u) return;
        usersMap.set(String(u._id), u);
      };

      const selfUser = await User.findById(requester._id).select(
        "_id name email phoneNumber role domain designation employeeId teamleadName isApproved isLoggedIn createdBy createdAt updatedAt profileImage"
      );
      pushUser(selfUser);

      if (requester.createdBy) {
        const admin = await User.findById(requester.createdBy).select(
          "_id name email phoneNumber role domain designation employeeId teamleadName isApproved isLoggedIn createdBy createdAt updatedAt profileImage"
        );
        pushUser(admin);

        if (admin?.createdBy) {
          const superadmin = await User.findById(admin.createdBy).select(
            "_id name email phoneNumber role domain designation employeeId teamleadName isApproved isLoggedIn createdBy createdAt updatedAt profileImage"
          );
          pushUser(superadmin);
        }
      }

      const requesterNameRegex = new RegExp(`^${escapeRegex(requester.name)}$`, "i");
      const assignedEmployees = await User.find({
        role: { $regex: /^employee$/i },
        ...(requester.domain ? { domain: requester.domain } : {}),
        $or: [
          { createdBy: requester._id },
          { teamleadName: requesterNameRegex },
        ],
      }).select(
        "_id name email phoneNumber role domain designation employeeId teamleadName isApproved isLoggedIn createdBy createdAt updatedAt profileImage"
      );
      assignedEmployees.forEach(pushUser);

      users = Array.from(usersMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (requesterRole === "employee") {
      // Employees can only view employee colleagues from their own domain.
      query.role = { $regex: /^employee$/i };
      if (requester.domain) query.domain = requester.domain;
    } else {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!users) {
      users = await User.find(query)
        .select(
          "_id name email phoneNumber role domain designation employeeId teamleadName isApproved isLoggedIn createdBy createdAt updatedAt profileImage"
        )
        .sort({ createdAt: -1 });
    }

    // Format profileImage to data URI for frontend
    const formattedUsers = users.map(u => {
      const obj = typeof u?.toObject === "function" ? u.toObject() : { ...u };
      if (obj.profileImage?.base64) {
        obj.profileImage = `data:${obj.profileImage.contentType};base64,${obj.profileImage.base64}`;
      } else {
        obj.profileImage = null;
      }
      return obj;
    });

    return res.json({ success: true, count: formattedUsers.length, users: formattedUsers });
  } catch (err) {
    console.error("getAllUsers ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching users" });
  }
};

// ----------------------------------------------------
// ✅ CHANGE USER ROLE (only superadmin)
// ----------------------------------------------------
exports.changeUserRole = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Only superadmin can change roles" });
    }

    const { userId } = req.params;
    const role = req.body?.role || req.body?.newRole;

    const validRoles = ["superadmin", "admin", "teamlead", "employee"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) return res.status(404).json({ success: false, message: "User not found" });

    userToUpdate.role = role;
    await userToUpdate.save();

    return res.json({ success: true, message: "Role updated", user: userToUpdate });
  } catch (err) {
    console.error("changeUserRole ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------
// ✅ DELETE USER (admin/superadmin)
// ----------------------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin/superadmin can delete users",
      });
    }

    const { userId } = req.params;

    if (String(req.user.userId) === String(userId)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "User deleted", deletedUser });
  } catch (err) {
    console.error("deleteUser ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------
// ✅ FORGOT PASSWORD
// ----------------------------------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email missing" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${APP_ENV.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Bohra" <${APP_ENV.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested password reset.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return res.json({ success: true, message: "Reset link sent to email" });
  } catch (err) {
    console.error("forgotPassword ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------------------------------------
// ✅ RESET PASSWORD
// ----------------------------------------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, password, confirmPassword } = req.body;
    const nextPassword = newPassword || password;

    if (!token || !nextPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "token, password, confirmPassword required",
      });
    }

    if (nextPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(nextPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.approveOrDisapproveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved } = req.body; // true | false

    if (typeof isApproved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isApproved must be boolean",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved,
        approvedBy: req.user._id,
        approvedAt: isApproved ? new Date() : null,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User ${isApproved ? "approved" : "disapproved"} successfully`,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;

    // Employee / teamlead → only self
    if (
      ["employee", "teamlead"].includes(loggedInUser.role) &&
      loggedInUser.userId !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can update only your own profile",
      });
    }

    delete req.body.confirmPassword;

    let allowedFields = [];
    if (["admin", "superadmin"].includes(loggedInUser.role)) {
      allowedFields = Object.keys(req.body);
    }
    if (["employee", "teamlead"].includes(loggedInUser.role)) {
      allowedFields = ["name", "email", "phoneNumber", "password"];
    }

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    /* ✅ BASE64 IMAGE SAVE */
    if (req.file) {
      updateData.profileImage = {
        base64: req.file.buffer.toString("base64"),
        contentType: req.file.mimetype,
      };
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ✅ FORMAT IMAGE FOR FRONTEND */
    const userObj = user.toObject();
    if (userObj.profileImage?.base64) {
      userObj.profileImage =
        `data:${userObj.profileImage.contentType};base64,${userObj.profileImage.base64}`;
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: userObj,
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getDateGroup = (range) => {
  switch (range) {
    case "daily":
      return {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
      };

    case "weekly":
      return {
        $concat: [
          { $toString: { $isoWeekYear: "$createdAt" } },
          "-W",
          {
            $cond: [
              { $lt: [{ $isoWeek: "$createdAt" }, 10] },
              { $concat: ["0", { $toString: { $isoWeek: "$createdAt" } }] },
              { $toString: { $isoWeek: "$createdAt" } },
            ],
          },
        ],
      };

    case "yearly":
      return { $toString: { $year: "$createdAt" } };

    case "monthly":
    default:
      return {
        $dateToString: { format: "%Y-%m", date: "$createdAt" },
      };
  }
};

// -------------------------------
// DATE FILTER (DATA WINDOW) ✅ FIXED
// -------------------------------
const getDateFilter = (range) => {
  const now = new Date();

  switch (range) {
    case "daily": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { createdAt: { $gte: start, $lte: now } };
    }

    case "weekly": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { createdAt: { $gte: start, $lte: now } };
    }

    case "monthly": {
      return {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: now,
        },
      };
    }

    case "yearly": {
      return {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: now,
        },
      };
    }

    default:
      return {};
  }
};


exports.getUserDashboardInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const { range = "monthly" } = req.query;

    // 🔐 Access control
    if (
      ["employee", "teamlead"].includes(req.user.role) &&
      req.user._id.toString() !== userId
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userFilter = await buildUserLeadFilter(user);
    const normalizedDomain = String(user.domain || "").toLowerCase();
    const LeadModel = normalizedDomain === "finance" ? FinanceLead : PropertyLead;
    const closedCountFilter =
      normalizedDomain === "finance"
        ? { stage: "Login" }
        : { status: { $in: ["Completed", "Token"] } };
    const closedAggregateExpr =
      normalizedDomain === "finance"
        ? { $eq: ["$stage", "Login"] }
        : { $in: ["$status", ["Completed", "Token"]] };

    const dateFilter = getDateFilter(range);
    const dateGroup = getDateGroup(range);

     const scopedFilter = { ...userFilter, ...dateFilter };

     /* ===========================
       KPI COUNTS (RANGE SCOPED)
     =========================== */

    const totalLeads = await LeadModel.countDocuments(scopedFilter);

    const activeStatuses = ["Interested", "Follow up", "Busy"];

    const activeDeals = await LeadModel.countDocuments({
      ...scopedFilter,
      status: { $in: activeStatuses },
    });

    const pendingTasks = await LeadModel.countDocuments({
      ...scopedFilter,
      followUpDate: { $gte: new Date() },
    });

    const closedLeads = await LeadModel.countDocuments({
      ...scopedFilter,
      ...closedCountFilter,
    });

    const conversionRate =
      totalLeads === 0
        ? "0%"
        : ((closedLeads / totalLeads) * 100).toFixed(1) + "%";

    /* ===========================
       PERFORMANCE (FINANCE + PROPERTY) ✅ FIXED
    =========================== */

    const performance = (await LeadModel.aggregate([
      { $match: scopedFilter },
      {
        $group: {
          _id: dateGroup,
          leads: { $sum: 1 },
          closed: {
            $sum: {
              $cond: [closedAggregateExpr, 1, 0],
            },
          },
        },
      },
    ])).sort((a, b) =>
      a._id.localeCompare(b._id)
    );

    /* ===========================
       LEAD STATUS DONUT
    =========================== */

    const leadStatus = await LeadModel.aggregate([
      { $match: scopedFilter },
      {
        $group: {
          _id: { $ifNull: ["$status", "Unspecified"] },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalLeads,
          activeDeals,
          pendingTasks,
          conversionRate,
        },
        performance,
        leadStatus,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserLeads = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ choose correct Lead model based on domain
    let LeadModel;
    if (targetUser.domain === "property") {
      LeadModel = PropertyLead;
    } else if (targetUser.domain === "finance") {
      LeadModel = FinanceLead;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user domain",
      });
    }

    let filter = {};

    // 3️⃣ EMPLOYEE → only own leads
    if (req.user.role === "employee") {
      if (req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      filter.relationshipManager = userId;
    }

    // 4️⃣ TEAMLEAD → employees under him
    if (req.user.role === "teamlead") {
      filter.teamleadName = req.user.name;
    }

    // admin & superadmin → no filter

    const leads = await LeadModel.find(filter)
      .populate("relationshipManager", "name email employeeId")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (err) {
    console.error("getUserLeads ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ----------------------------------------------------
// ✅ GET ME — fetch own profile
// ----------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const obj = user.toObject();
    if (obj.profileImage?.base64) {
      obj.profileImage = `data:${obj.profileImage.contentType};base64,${obj.profileImage.base64}`;
    } else {
      obj.profileImage = null;
    }

    return res.json({ success: true, data: obj });
  } catch (err) {
    console.error("getMe ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};