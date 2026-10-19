const OperationSpending = require("../models/operationSpending");
const PropertyLead = require("../models/propertyLead");
const FinanceLead = require("../models/financeLead");

/* ===============================
   ADMIN CHECK
================================ */
function isAdmin(req, res) {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "Admin only access",
    });
    return false;
  }
  return true;
}

/* =====================================================
   ✅ CREATE SPENDING
===================================================== */
exports.createSpending = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { type, amount, note } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: "Type and amount required",
      });
    }

    const spending = await OperationSpending.create({
      type,
      amount,
      note,
      createdBy: req.user.userId,
    });

    const data = await spending.populate(
      "createdBy",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "Spending added",
      data,
    });
  } catch (err) {
    console.error("createSpending:", err);
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   ✅ GET SPENDINGS (TABLE)
===================================================== */
exports.getSpendings = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const {
      page = 1,
      limit = 10,
      type,
      from,
      to,
    } = req.query;

    const filter = {};

    if (type) filter.type = type;

    if (from || to) {
      filter.createdAt = {};

      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      OperationSpending.countDocuments(filter),

      OperationSpending.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy", "name"),
    ]);

    res.json({
      success: true,

      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },

      data: rows,
    });
  } catch (err) {
    console.error("getSpendings:", err);
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   ✅ UPDATE SPENDING
===================================================== */
exports.updateSpending = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { id } = req.params;

    const updated =
      await OperationSpending.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      ).populate("createdBy", "name");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({
      success: true,
      message: "Updated",
      data: updated,
    });
  } catch (err) {
    console.error("updateSpending:", err);
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   ✅ DELETE SPENDING
===================================================== */
exports.deleteSpending = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { id } = req.params;

    const deleted =
      await OperationSpending.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    console.error("deleteSpending:", err);
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   ✅ OPERATIONS DASHBOARD
===================================================== */
exports.getOperationsDashboard = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { range = 'monthly' } = req.query;
    const now = new Date();

    /* ===============================
       DATE RANGE CALCULATION
    =============================== */
    let dateStart;
    switch (range) {
      case 'daily':
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly': {
        const w = new Date(now);
        w.setDate(w.getDate() - 7);
        dateStart = w;
        break;
      }
      case 'yearly':
        dateStart = new Date(now.getFullYear(), 0, 1);
        break;
      case 'monthly':
      default:
        dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const dateFilter = { createdAt: { $gte: dateStart } };

    /* ===============================
       TOTAL LEADS
    =============================== */
    const [propertyLeads, financeLeads] =
      await Promise.all([
        PropertyLead.countDocuments(dateFilter),
        FinanceLead.countDocuments(dateFilter),
      ]);

    const totalLeads = propertyLeads + financeLeads;

    /* ===============================
       TOTAL SPENDING
    =============================== */
    const spendingAgg =
      await OperationSpending.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

    const totalSpending =
      spendingAgg[0]?.total || 0;

    /* ===============================
       CONVERSION
    =============================== */
    const financeLogin =
      await FinanceLead.countDocuments({
        ...dateFilter,
        status: "login",
      });

    const conversionRate =
      totalLeads === 0
        ? 0
        : Number(
            ((financeLogin / totalLeads) * 100).toFixed(
              1
            )
          );

    /* ===============================
       PERFORMANCE CHART
    =============================== */
    const performance =
      await OperationSpending.aggregate([
        {
          $match: dateFilter,
        },

        {
          $group: {
            _id: {
              $dayOfMonth: "$createdAt",
            },

            spending: { $sum: "$amount" },
          },
        },

        { $sort: { _id: 1 } },
      ]);

    /* ===============================
       SOURCE WISE SPENDING
    =============================== */
    const sources =
      await OperationSpending.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },

        { $sort: { total: -1 } },
      ]);

    res.json({
      success: true,

      cards: {
        totalLeads,
        totalSpending,
        conversionRate,
      },

      charts: {
        performance,
        sources,
      },
    });
  } catch (err) {
    console.error("operationsDashboard:", err);
    res.status(500).json({ success: false });
  }
};


/* =====================================================
   ✅ SPENDING BY TYPE WITH MONTHLY CHANGE
===================================================== */

// exports.getSpendingTypeStats = async (req, res) => {
//   try {
//     if (!isAdmin(req, res)) return;

//     const { range = "monthly" } = req.query;

//     /* ===============================
//        GET CURRENT TIME IN IST
//     =============================== */
//     const now = new Date(
//       new Date().toLocaleString("en-US", {
//         timeZone: "Asia/Kolkata",
//       })
//     );

//     let currentStart, previousStart, previousEnd;

//     /* ===============================
//        DATE RANGE LOGIC (IST BASED)
//     =============================== */

//     switch (range) {
//       /* ---------- DAILY ---------- */
//       case "daily":
//         // Today 00:00 IST
//         currentStart = new Date(
//           now.getFullYear(),
//           now.getMonth(),
//           now.getDate()
//         );

//         // Yesterday 00:00 IST
//         previousStart = new Date(currentStart);
//         previousStart.setDate(previousStart.getDate() - 1);

//         // Yesterday 23:59:59
//         previousEnd = new Date(currentStart);
//         previousEnd.setMilliseconds(-1);
//         break;

//       /* ---------- WEEKLY ---------- */
//       case "weekly": {
//         // Monday = Start
//         const day = now.getDay() || 7;

//         currentStart = new Date(now);
//         currentStart.setDate(now.getDate() - day + 1);
//         currentStart.setHours(0, 0, 0, 0);

//         previousStart = new Date(currentStart);
//         previousStart.setDate(previousStart.getDate() - 7);

//         previousEnd = new Date(currentStart);
//         previousEnd.setMilliseconds(-1);
//         break;
//       }

//       /* ---------- YEARLY ---------- */
//       case "yearly":
//         currentStart = new Date(now.getFullYear(), 0, 1);

//         previousStart = new Date(now.getFullYear() - 1, 0, 1);

//         previousEnd = new Date(
//           now.getFullYear(),
//           0,
//           0,
//           23,
//           59,
//           59,
//           999
//         );
//         break;

//       /* ---------- MONTHLY (DEFAULT) ---------- */
//       default:
//         currentStart = new Date(
//           now.getFullYear(),
//           now.getMonth(),
//           1
//         );

//         previousStart = new Date(
//           now.getFullYear(),
//           now.getMonth() - 1,
//           1
//         );

//         previousEnd = new Date(
//           now.getFullYear(),
//           now.getMonth(),
//           0,
//           23,
//           59,
//           59,
//           999
//         );
//     }

//     /* ===============================
//        FORCE MIDNIGHT
//     =============================== */
//     [currentStart, previousStart].forEach((d) => {
//       if (d) d.setHours(0, 0, 0, 0);
//     });

//     /* ===============================
//        AGGREGATION
//     =============================== */

//     const stats = await OperationSpending.aggregate([
//       {
//         $facet: {
//           /* ---------- ALL TIME ---------- */
//           total: [
//             {
//               $group: {
//                 _id: "$type",
//                 totalAmount: { $sum: "$amount" },
//               },
//             },
//           ],

//           /* ---------- CURRENT PERIOD ---------- */
//           current: [
//             {
//               $match: {
//                 createdAt: { $gte: currentStart },
//               },
//             },
//             {
//               $group: {
//                 _id: "$type",
//                 currentAmount: { $sum: "$amount" },
//               },
//             },
//           ],

//           /* ---------- PREVIOUS PERIOD ---------- */
//           previous: [
//             {
//               $match: {
//                 createdAt: {
//                   $gte: previousStart,
//                   $lte: previousEnd,
//                 },
//               },
//             },
//             {
//               $group: {
//                 _id: "$type",
//                 previousAmount: { $sum: "$amount" },
//               },
//             },
//           ],
//         },
//       },
//     ]);

//     /* ===============================
//        FORMAT RESPONSE
//     =============================== */

//     const totalMap = {};
//     const currentMap = {};
//     const previousMap = {};

//     stats[0].total.forEach(
//       (i) => (totalMap[i._id] = i.totalAmount)
//     );

//     stats[0].current.forEach(
//       (i) => (currentMap[i._id] = i.currentAmount)
//     );

//     stats[0].previous.forEach(
//       (i) => (previousMap[i._id] = i.previousAmount)
//     );

//     const TYPES = [
//       "Meta",
//       "WhatsApp",
//       "Google",
//       "Referral",
//       "99Acres",
//       "Walk in",
//       "Other",
//     ];

//     const result = TYPES.map((type) => {
//       const total = totalMap[type] || 0;
//       const current = currentMap[type] || 0;
//       const previous = previousMap[type] || 0;

//       let change = 0;

//       if (previous === 0 && current > 0) {
//         change = 100;
//       } else if (previous > 0) {
//         change = Number(
//           (((current - previous) / previous) * 100).toFixed(2)
//         );
//       }

//       return {
//         type,
//         totalAmount: total,
//         currentAmount: current,
//         previousAmount: previous,
//         changePercent: change,
//       };
//     });

//     /* ===============================
//        RESPONSE
//     =============================== */

//     res.json({
//       success: true,
//       range,
//       data: result,
//     });
//   } catch (err) {
//     console.error("getSpendingTypeStats:", err);
//     res.status(500).json({ success: false });
//   }
// };

/* =====================================================
   ✅ LEAD SOURCE CHART (time-series per source)
   GET /opera/lead-source-chart?range=daily|weekly|monthly|yearly
===================================================== */
exports.getLeadSourceChart = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { range = "monthly" } = req.query;
    const now = new Date();

    let dateStart;
    let dateFormat;

    switch (range) {
      case "daily":
        dateStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        dateFormat = "%H:00";
        break;

      case "weekly":
        dateStart = new Date(now);
        dateStart.setDate(now.getDate() - 6);
        dateStart.setHours(0, 0, 0, 0);
        dateFormat = "%Y-%m-%d";
        break;

      case "yearly":
        dateStart = new Date(now.getFullYear(), 0, 1);
        dateFormat = "%Y-%m";
        break;

      default: // monthly
        dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFormat = "%Y-%m-%d";
    }

    const pipeline = [
      { $match: { createdAt: { $gte: dateStart } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: dateFormat, date: "$createdAt" },
            },
            source: "$source",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ];

    const [propertyRaw, financeRaw] = await Promise.all([
      PropertyLead.aggregate(pipeline),
      FinanceLead.aggregate(pipeline),
    ]);

    const map = {};

    const addToMap = (raw) => {
      raw.forEach(({ _id: { date, source }, count }) => {
        if (!source) return;
        if (!map[date]) map[date] = { date };
        map[date][source] = (map[date][source] || 0) + count;
      });
    };

    addToMap(propertyRaw);
    addToMap(financeRaw);

    const sorted = Object.values(map).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const formatLabel = (d) => {
      if (range === "daily") return d;
      if (range === "weekly" || range === "monthly") {
        const dt = new Date(d + "T00:00:00");
        return `${dt.getDate()} ${dt.toLocaleString("en", { month: "short" })}`;
      }
      if (range === "yearly") {
        const dt = new Date(d + "-01T00:00:00");
        return dt.toLocaleString("en", { month: "short" });
      }
      return d;
    };

    const data = sorted.map((row) => ({
      ...row,
      date: formatLabel(row.date),
    }));

    res.json({ success: true, range, data });
  } catch (err) {
    console.error("getLeadSourceChart:", err);
    res.status(500).json({ success: false });
  }
};

exports.getSpendingTypeStats = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { range = "monthly" } = req.query;

    /* ===============================
       CURRENT TIME (IST)
    =============================== */
    const now = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      })
    );

    let currentStart, previousStart, previousEnd;

    /* ===============================
       RANGE LOGIC (IST)
    =============================== */
    switch (range) {
      case "daily":
        currentStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);

        previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(-1);
        break;

      case "weekly": {
        const day = now.getDay() || 7;

        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - day + 1);
        currentStart.setHours(0, 0, 0, 0);

        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);

        previousEnd = new Date(currentStart);
        previousEnd.setMilliseconds(-1);
        break;
      }

      case "yearly":
        currentStart = new Date(now.getFullYear(), 0, 1);

        previousStart = new Date(now.getFullYear() - 1, 0, 1);

        previousEnd = new Date(
          now.getFullYear(),
          0,
          0,
          23,
          59,
          59,
          999
        );
        break;

      default: // monthly
        currentStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        previousStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

        previousEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        );
    }

    [currentStart, previousStart].forEach((d) => {
      if (d) d.setHours(0, 0, 0, 0);
    });

    /* ===============================
       LAST MONTH (FIXED BASELINE)
    =============================== */
    const lastMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    lastMonthStart.setHours(0, 0, 0, 0);

    /* ===============================
       AGGREGATION
    =============================== */
    const stats = await OperationSpending.aggregate([
      {
        $facet: {
          total: [
            {
              $group: {
                _id: "$type",
                totalAmount: { $sum: "$amount" },
              },
            },
          ],

          current: [
            {
              $match: {
                createdAt: { $gte: currentStart },
              },
            },
            {
              $group: {
                _id: "$type",
                currentAmount: { $sum: "$amount" },
              },
            },
          ],

          previous: [
            {
              $match: {
                createdAt: {
                  $gte: previousStart,
                  $lte: previousEnd,
                },
              },
            },
            {
              $group: {
                _id: "$type",
                previousAmount: { $sum: "$amount" },
              },
            },
          ],

          /* ✅ LAST MONTH FOR changePercent */
          lastMonth: [
            {
              $match: {
                createdAt: {
                  $gte: lastMonthStart,
                  $lte: lastMonthEnd,
                },
              },
            },
            {
              $group: {
                _id: "$type",
                lastMonthAmount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ]);

    /* ===============================
       MAP RESULTS
    =============================== */
    const totalMap = {};
    const currentMap = {};
    const previousMap = {};
    const lastMonthMap = {};

    stats[0].total.forEach(i => (totalMap[i._id] = i.totalAmount));
    stats[0].current.forEach(i => (currentMap[i._id] = i.currentAmount));
    stats[0].previous.forEach(i => (previousMap[i._id] = i.previousAmount));
    stats[0].lastMonth.forEach(i => (lastMonthMap[i._id] = i.lastMonthAmount));

    const TYPES = [
      "Meta",
      "WhatsApp",
      "Google",
      "Referral",
      "99Acres",
      "Walk in",
      "Other",
    ];

    const result = TYPES.map((type) => {
      const total = totalMap[type] || 0;
      const current = currentMap[type] || 0;
      const previous = previousMap[type] || 0;
      const lastMonth = lastMonthMap[type] || 0;

      let changePercent = 0;

      if (lastMonth === 0 && current > 0) {
        changePercent = 100;
      } else if (lastMonth > 0) {
        changePercent = Number(
          (((current - lastMonth) / lastMonth) * 100).toFixed(2)
        );
      }

      return {
        type,
        totalAmount: total,
        currentAmount: current,
        previousAmount: previous,     // optional
        lastMonthAmount: lastMonth,   // optional but useful
        changePercent,
      };
    });

    res.json({
      success: true,
      range,
      data: result,
    });
  } catch (err) {
    console.error("getSpendingTypeStats:", err);
    res.status(500).json({ success: false });
  }
};
