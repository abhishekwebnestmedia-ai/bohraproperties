const Inventory = require("../models/inventory");
const InventoryHistory = require("../models/inventoryHistory");
const fs = require("fs");
const XLSX = require("xlsx");
const csvtojson = require("csvtojson");

/* =====================================================
   SANITIZE HISTORY OUTPUT HELPERS
===================================================== */
function bufferObjectToHex(bufObj) {
  if (!bufObj) return null;
  if (Array.isArray(bufObj)) return Buffer.from(bufObj).toString("hex");
  if (bufObj && typeof bufObj === "object") {
    const keys = Object.keys(bufObj).sort((a, b) => Number(a) - Number(b));
    const arr = keys.map((k) => bufObj[k]);
    return Buffer.from(arr).toString("hex");
  }
  return null;
}

function normalizeIdValue(v) {
  if (!v) return v;
  if (typeof v === "string") return v;
  if (v && typeof v.toHexString === "function") {
    try {
      return v.toHexString();
    } catch (e) {}
  }
  if (v && v._bsontype === "ObjectID") {
    if (v.id && v.id.buffer) return bufferObjectToHex(v.id.buffer);
  }
  if (v && v.buffer) {
    return bufferObjectToHex(v.buffer);
  }
  if (v && v.id && v.id.buffer) {
    return bufferObjectToHex(v.id.buffer);
  }
  return v;
}

function sanitizeValue(value) {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);

  const normalized = normalizeIdValue(value);
  if (typeof normalized === "string" && /^[0-9a-fA-F]{24}$/.test(normalized)) return normalized;

  const out = {};
  for (const k of Object.keys(value)) {
    out[k] = sanitizeValue(value[k]);
  }
  return out;
}

/* =====================================================
   RECORD HISTORY HELPER
===================================================== */
async function recordHistory(
  req,
  { inventoryId, action, previous = {}, current = {}, message = "" }
) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() ||
      req.ip;
    const userAgent = req.headers["user-agent"] || "";

    const performedBy = req.user?.userId || req.user?._id;

    if (!performedBy) {
      console.error("History not saved: performedBy missing", req.user);
      return;
    }

    await InventoryHistory.create({
      inventoryId,
      action,
      performedBy,
      previous,
      current,
      message,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("recordHistory error:", err);
  }
}

/* =====================================================
   EXTRACT FIELD-LEVEL CHANGES (previous vs current)
===================================================== */
function extractChanges(previous, current) {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(current || {}),
  ]);

  for (const key of allKeys) {
    const prevVal = previous?.[key];
    const currVal = current?.[key];

    // Skip unchanged fields and internal fields
    if (JSON.stringify(prevVal) === JSON.stringify(currVal)) continue;
    if (["_id", "__v", "createdAt", "updatedAt"].includes(key)) continue;

    // Skip nested objects for simplicity (show only primitives)
    if (
      typeof prevVal === "object" &&
      prevVal !== null &&
      typeof currVal === "object" &&
      currVal !== null
    ) {
      continue;
    }

    changes.push({
      field: key,
      previous: prevVal === undefined ? null : prevVal,
      current: currVal === undefined ? null : currVal,
    });
  }

  return changes;
}

/* =====================================================
   FORMAT HISTORY AS GROUPED TIMELINE
===================================================== */
function groupHistoryByUser(historyRecords) {
  const groupsMap = new Map();

  const actionTypeMap = {
    CREATED: { type: "Created", icon: "circle", color: "green" },
    UPDATED: { type: "Updated", icon: "circle", color: "blue" },
    DELETED: { type: "Deleted", icon: "circle", color: "red" },
    BULK_UPLOADED: { type: "Bulk Upload", icon: "circle", color: "blue" },
  };

  for (const record of historyRecords) {
    const userId = record.performedBy?._id || record.performedBy;
    const userKey = String(userId);

    if (!groupsMap.has(userKey)) {
      groupsMap.set(userKey, {
        user: record.performedBy || { _id: userId, name: "Unknown", email: "" },
        activities: [],
      });
    }

    const group = groupsMap.get(userKey);

    let timestamp = "";
    if (record.createdAt) {
      const date = new Date(record.createdAt);
      const monthStr = date.toLocaleString("en-US", { month: "short" });
      const dayStr = String(date.getDate()).padStart(2, "0");
      const yearStr = date.getFullYear();
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      timestamp = `${monthStr} ${dayStr}, ${yearStr} | ${timeStr}`;
    }

    const actionInfo = actionTypeMap[record.action] || {
      type: record.action,
      icon: "circle",
      color: "gray",
    };

    // Extract field-level changes
    const changes = extractChanges(record.previous, record.current);

    const activity = {
      _id: record._id,
      action: record.action,
      type: actionInfo.type,
      icon: actionInfo.icon,
      color: actionInfo.color,
      description: record.message || actionInfo.type,
      timestamp,
      createdAt: record.createdAt,
      changes, // Array of { field, previous, current }
      ip: record.ip,
      userAgent: record.userAgent,
    };

    group.activities.push(activity);
  }

  return Array.from(groupsMap.values()).map((group) => ({
    ...group,
    activities: group.activities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
  }));
}

/* =====================================================
   HELPER – HANDLE "OTHER" LOGIC (CENTRALIZED)
===================================================== */
function handleOther(body, payload) {
  payload.otherDetails = payload.otherDetails || {};

  /* ---------- RESIDENTIAL OTHER ---------- */
  if (payload.propertyType === "residential_other") {
    const value =
      body?.otherDetails?.residentialPropertyTypeOther ||
      body?.residentialPropertyTypeOther;

    if (!value) {
      throw new Error(
        "residentialPropertyTypeOther is required for residential_other"
      );
    }

    payload.otherDetails.residentialPropertyTypeOther = value.trim();
  } else {
    delete payload.otherDetails.residentialPropertyTypeOther;
  }

  /* ---------- COMMERCIAL OTHER ---------- */
  if (payload.propertyType === "commercial_other") {
    const value =
      body?.otherDetails?.commercialPropertyTypeOther ||
      body?.commercialPropertyTypeOther;

    if (!value) {
      throw new Error(
        "commercialPropertyTypeOther is required for commercial_other"
      );
    }

    payload.otherDetails.commercialPropertyTypeOther = value.trim();
  } else {
    delete payload.otherDetails.commercialPropertyTypeOther;
  }

  /* ---------- RETAIL PROJECT TYPE OTHER ---------- */
  if (
    payload.propertyType === "retail" &&
    payload.commercialMeta?.retailProjectType === "other"
  ) {
    const value =
      body?.otherDetails?.retailProjectTypeOther ||
      body?.retailProjectTypeOther;

    if (!value) {
      throw new Error(
        "retailProjectTypeOther is required when retailProjectType is other"
      );
    }

    payload.otherDetails.retailProjectTypeOther = value.trim();
  } else {
    delete payload.otherDetails.retailProjectTypeOther;
  }

  if (Object.keys(payload.otherDetails).length === 0) {
    delete payload.otherDetails;
  }
}

/* =====================================================
   CREATE INVENTORY
===================================================== */
exports.createInventory = async (req, res) => {
  try {
    const payload = { ...req.body };

    handleOther(req.body, payload);

    const inventory = await Inventory.create(payload);

    // Record history
    await recordHistory(req, {
      inventoryId: inventory._id,
      action: "CREATED",
      previous: {},
      current: inventory.toObject(),
      message: "Inventory created",
    });

    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET INVENTORIES (PAGINATED)
===================================================== */
exports.getInventories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      propertyType,
      status,
      city,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (propertyType) filter.propertyType = propertyType;
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) filter.status = { $in: statuses };
    }
    if (city) filter["locationDetails.city"] = city;

    // Free-text search across owner name, phone, email, city, location
    if (search && search.trim().length >= 1) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'basicDetails.ownerName': re },
        { 'basicDetails.ownerPhone': re },
        { 'basicDetails.ownerEmail': re },
        { 'locationDetails.city': re },
        { 'locationDetails.location': re },
        { 'locationDetails.subLocation': re },
      ];
    }

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.max(Number(limit), 1);
    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'priceDetails.expectedPrice'].includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      Inventory.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Inventory.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET INVENTORY BY ID
===================================================== */
exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid inventory ID",
    });
  }
};

/* =====================================================
   UPDATE INVENTORY
===================================================== */
exports.updateInventory = async (req, res) => {
  try {
    if (req.body.locationDetails && !req.body.locationDetails.city) {
      return res.status(400).json({
        success: false,
        message: "locationDetails.city is required when updating location",
      });
    }

    const payload = { ...req.body };
    handleOther(req.body, payload);

    // Get old inventory before update
    const oldInventory = await Inventory.findById(req.params.id);

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // Record history
    await recordHistory(req, {
      inventoryId: inventory._id,
      action: "UPDATED",
      previous: oldInventory ? oldInventory.toObject() : {},
      current: payload,
      message: "Inventory updated",
    });

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   DELETE INVENTORY
===================================================== */
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // Record history
    await recordHistory(req, {
      inventoryId: inventory._id,
      action: "DELETED",
      previous: inventory.toObject(),
      current: {},
      message: "Inventory deleted",
    });

    res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid inventory ID",
    });
  }
};

/* =====================================================
   GET INVENTORY HISTORY
===================================================== */
exports.getInventoryHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    // Verify inventory exists
    const inventory = await Inventory.findById(id).select("_id");
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // Fetch history
    const [total, history] = await Promise.all([
      InventoryHistory.countDocuments({ inventoryId: id }),
      InventoryHistory.find({ inventoryId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "performedBy",
          select: "name email role employeeId",
        }),
    ]);

    // Sanitize history entries
    const sanitizedHistory = history.map((h) => {
      const obj = typeof h.toObject === "function" ? h.toObject() : h;
      return sanitizeValue(obj);
    });

    const groupedHistory = groupHistoryByUser(sanitizedHistory);

    return res.status(200).json({
      success: true,
      message: "History fetched",
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: groupedHistory,
    });
  } catch (err) {
    console.error("getInventoryHistory error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   BULK UPLOAD INVENTORY (CSV / XLS / XLSX)
===================================================== */
exports.bulkUploadInventory = async (req, res) => {
  let filePath;

  try {
    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    filePath = req.file.path;
    const ext = req.file.originalname.split(".").pop().toLowerCase();
    let rows = [];

    if (ext === "csv") {
      rows = await csvtojson().fromFile(filePath);
    } else if (["xls", "xlsx"].includes(ext)) {
      const wb = XLSX.readFile(filePath);
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: "",
      });
    } else {
      throw new Error("Only CSV / XLS / XLSX supported");
    }

    const normalize = (v) =>
      typeof v === "string" && v.trim() ? v.trim().toLowerCase() : undefined;

    const parseNumber = (v) =>
      v === "" || v == null || isNaN(Number(v)) ? undefined : Number(v);

    const docs = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2;
      const r = rows[i];

      try {
        const payload = {
          category: normalize(r.category),
          propertyType: normalize(r.propertyType),
          status: normalize(r.status) || "active",
          
          /* Basic Details */
          basicDetails: {
            ownerName: r.ownerName?.trim() || undefined,
            ownerPhone: r.ownerPhone?.trim() || undefined,
            ownerAlternatePhone: r.ownerAlternatePhone?.trim() || undefined,
            ownerEmail: r.ownerEmail?.trim() || undefined,
            ownerAddress: r.ownerAddress?.trim() || undefined,
            coOwnerName: r.coOwnerName?.trim() || undefined,
            coOwnerEmail: r.coOwnerEmail?.trim() || undefined,
            coOwnerPhone: r.coOwnerPhone?.trim() || undefined,
            authorizedRepName: r.authorizedRepName?.trim() || undefined,
            authorizedRepPhone: r.authorizedRepPhone?.trim() || undefined,
            authorizedRepEmail: r.authorizedRepEmail?.trim() || undefined,
          },

          /* Location Details */
          locationDetails: { 
            city: r.city?.trim(),
            location: r.location?.trim() || undefined,
            subLocation: r.subLocation?.trim() || undefined,
            societyOrApartment: r.societyOrApartment?.trim() || undefined,
            houseNumber: r.houseNumber?.trim() || undefined,
            pinCode: r.pinCode?.trim() || undefined,
          },

          /* Residential Type */
          residentialType: normalize(r.residentialType),

          /* Room Details */
          roomDetails: {
            bedrooms: parseNumber(r.bedrooms),
            bathrooms: parseNumber(r.bathrooms),
            balconies: parseNumber(r.balconies),
          },

          /* Area Details */
          areaDetails: {
            carpetArea: parseNumber(r.carpetArea),
            builtUpArea: parseNumber(r.builtUpArea),
            superBuiltUpArea: parseNumber(r.superBuiltUpArea),
            plotArea: parseNumber(r.plotArea),
            plotLength: parseNumber(r.plotLength),
            plotBreadth: parseNumber(r.plotBreadth),
          },

          /* Floor Details */
          floorDetails: {
            totalFloors: parseNumber(r.totalFloors),
            propertyOnFloor: parseNumber(r.propertyOnFloor),
          },

          /* Plot Details */
          plotDetails: {
            floorsAllowed: parseNumber(r.floorsAllowed),
            boundaryWall: r.boundaryWall === "true" || r.boundaryWall === true,
            openSides: parseNumber(r.openSides),
            constructionDone: r.constructionDone === "true" || r.constructionDone === true,
            roadWidth: parseNumber(r.roadWidth),
            possessionYear: parseNumber(r.possessionYear),
            possessionMonth: r.possessionMonth?.trim() || undefined,
          },

          /* Furnishing & Features */
          furnishing: normalize(r.furnishing),
          availabilityStatus: normalize(r.availabilityStatus),
          propertyAge: normalize(r.propertyAge),
          
          /* Ownership */
          ownership: normalize(r.ownership),

          /* Price Details */
          priceDetails: {
            expectedPrice: parseNumber(r.expectedPrice),
            pricePerSqFt: parseNumber(r.pricePerSqFt),
            allInclusivePrice: r.allInclusivePrice === "true" || r.allInclusivePrice === true,
            taxExcluded: r.taxExcluded === "true" || r.taxExcluded === true,
            priceNegotiable: r.priceNegotiable === "true" || r.priceNegotiable === true,
          },

          /* Media */
          media: {
            images: r.images ? r.images.split("|").map(i => i.trim()).filter(i => i) : undefined,
            videos: r.videos ? r.videos.split("|").map(v => v.trim()).filter(v => v) : undefined,
          },

          /* Amenities */
          amenities: r.amenities ? r.amenities.split("|").map(a => a.trim()).filter(a => a) : undefined,

          /* Commercial Meta */
          commercialMeta: {
            officeType: normalize(r.officeType),
            officeSetup: {
              minSeats: parseNumber(r.minSeats),
              maxSeats: parseNumber(r.maxSeats),
              numberOfCabins: parseNumber(r.numberOfCabins),
              meetingRooms: parseNumber(r.meetingRooms),
            },
            retailUnitType: normalize(r.retailUnitType),
            retailProjectType: normalize(r.retailProjectType),
            storageType: normalize(r.storageType),
            industryType: normalize(r.industryType),
            hospitalityType: normalize(r.hospitalityType),
            roomDetails: {
              totalRooms: parseNumber(r.totalRooms),
            },
            furnishing: normalize(r.commercialFurnishing),
            qualityRating: parseNumber(r.qualityRating),
            washrooms: parseNumber(r.washrooms),
            parking: parseNumber(r.parking),
            pantry: r.pantry === "true" || r.pantry === true,
            receptionArea: r.receptionArea === "true" || r.receptionArea === true,
            conferenceRoom: r.conferenceRoom === "true" || r.conferenceRoom === true,
            powerBackup: r.powerBackup === "true" || r.powerBackup === true,
            centralAirConditioning: r.centralAirConditioning === "true" || r.centralAirConditioning === true,
            pantryType: normalize(r.pantryType),
            dgUpsIncluded: r.dgUpsIncluded === "true" || r.dgUpsIncluded === true,
            preLeased: r.preLeased === "true" || r.preLeased === true,
          },

          /* Other Details */
          otherDetails: {
            residentialPropertyTypeOther: r.residentialPropertyTypeOther?.trim() || undefined,
            commercialPropertyTypeOther: r.commercialPropertyTypeOther?.trim() || undefined,
            retailProjectTypeOther: r.retailProjectTypeOther?.trim() || undefined,
          },

          /* Ownership Documents */
          ownershipDocuments: {
            ownershipDocumentType: normalize(r.ownershipDocumentType),
            ownershipDocumentNumber: r.ownershipDocumentNumber?.trim() || undefined,
            ownershipDocumentDate: r.ownershipDocumentDate ? new Date(r.ownershipDocumentDate) : undefined,
            documentVerified: r.documentVerified === "true" || r.documentVerified === true,
          },

          /* Description */
          description: {
            propertyDescription: r.propertyDescription?.trim() || undefined,
            keyFeatures: r.keyFeatures ? r.keyFeatures.split("|").map(f => f.trim()).filter(f => f) : undefined,
          },

          /* Finance Details */
          financeDetails: {
            loanAvailable: r.loanAvailable === "true" || r.loanAvailable === true,
            loanAmountApproved: parseNumber(r.loanAmountApproved),
            loanTenure: parseNumber(r.loanTenure),
            loanRate: parseNumber(r.loanRate),
            bankName: r.bankName?.trim() || undefined,
            mortgageEligible: r.mortgageEligible === "true" || r.mortgageEligible === true,
          },

          /* Management Info */
          managementInfo: {
            assignedTeam: r.assignedTeam?.trim() || undefined,
            listingAgent: r.listingAgent?.trim() || undefined,
            channelPartner: r.channelPartner?.trim() || undefined,
          },

          /* Activity Tracking */
          activityTracking: {
            leadSource: normalize(r.leadSource),
            enquiryDate: r.enquiryDate ? new Date(r.enquiryDate) : undefined,
            lastFollowUp: r.lastFollowUp ? new Date(r.lastFollowUp) : undefined,
            followUpRequired: r.followUpRequired === "true" || r.followUpRequired === true,
            viewingScheduled: r.viewingScheduled ? new Date(r.viewingScheduled) : undefined,
            viewingCompleted: r.viewingCompleted === "true" || r.viewingCompleted === true,
            viewingFeedback: r.viewingFeedback?.trim() || undefined,
          },

          /* Legal & Compliance */
          legal: {
            mutualAgreementSigned: r.mutualAgreementSigned === "true" || r.mutualAgreementSigned === true,
            agreementDate: r.agreementDate ? new Date(r.agreementDate) : undefined,
            agreementDocumentUrl: r.agreementDocumentUrl?.trim() || undefined,
            propertyTaxPaid: r.propertyTaxPaid === "true" || r.propertyTaxPaid === true,
            waterBillPaid: r.waterBillPaid === "true" || r.waterBillPaid === true,
            electricityBillPaid: r.electricityBillPaid === "true" || r.electricityBillPaid === true,
            noc: r.noc === "true" || r.noc === true,
            nocDocumentUrl: r.nocDocumentUrl?.trim() || undefined,
          },

          /* General Status */
          remarks: r.remarks?.trim() || undefined,
          notes: r.notes?.trim() || undefined,
          internalNotes: r.internalNotes?.trim() || undefined,
          visibility: normalize(r.visibility) || "public",
        };

        if (!payload.category || !payload.propertyType || !payload.locationDetails.city) {
          throw new Error("category, propertyType and city are required");
        }

        handleOther(r, payload);

        docs.push(payload);
      } catch (e) {
        errors.push({ row: rowNo, error: e.message });
      }
    }

    const inserted = docs.length
      ? await Inventory.insertMany(docs, { ordered: false })
      : [];

    // Record history for each inserted item
    if (req.user) {
      await Promise.all(
        inserted.map((item) =>
          recordHistory(req, {
            inventoryId: item._id,
            action: "BULK_UPLOADED",
            previous: {},
            current: item.toObject(),
            message: "Inventory created via bulk upload",
          })
        )
      );
    }

    res.status(201).json({
      success: true,
      message: "Bulk upload completed",
      summary: {
        totalRows: rows.length,
        inserted: inserted.length,
        failed: errors.length,
      },
      errors: errors.length ? errors : undefined,
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
};

/* =====================================================
   BULK DELETE
===================================================== */
exports.bulkDeleteInventory = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "ids array is required" });
    }

    const result = await Inventory.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} item(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("bulkDeleteInventory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};