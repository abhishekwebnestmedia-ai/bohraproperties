# LINE-BY-LINE SOCKET.IO INTEGRATION POINTS

**Purpose:** Exact locations where socket.io emissions need to be added

---

## propertyLeadController.js

### Import Statement
**Location:** After all `const` declarations (around line 20-30)

**Add these lines:**
```javascript
const {
  notifyLeadFollowup,
  notifyLeadStatusChange,
  notifyLeadTransfer,
} = require("../utils/socketService");
```

---

### Issue #1: updateFollowUp()
**Exact Location:** Search for `exports.updateFollowUp`  
**Approximate Line:** ~945

**Code to Add:**
```javascript
// RIGHT AFTER this line:
const updated = await PropertyLead.findOneAndUpdate(
  { _id: id, ...accessFilter },
  { $set: { followUpDate: parsedFollowUp, reminderSent: false } },
  { new: true }
).populate(LEAD_POPULATE);

// ADD THIS:
if (parsedFollowUp) {
  await notifyLeadFollowup(updated, {
    createdBy: updated.createdBy?._id,
    teamLead: updated.teamLead?._id,
    relationshipManager: updated.relationshipManager?._id,
  });
}

// THEN continue with history recording...
await recordHistory(req, {
  // ... existing code ...
});
```

---

### Issue #2: updateStatus()
**Exact Location:** Search for `exports.updateStatus`  
**Approximate Line:** ~801

**Code to Add:**
```javascript
// RIGHT AFTER this line:
const populated = await PropertyLead.findById(id).populate(LEAD_POPULATE);

// ADD THIS (BEFORE the response):
await notifyLeadStatusChange(populated, prevStatus, status, {
  createdBy: populated.createdBy?._id,
  teamLead: populated.teamLead?._id,
});

// THEN respond
return res.status(200).json({ 
  success: true, 
  message: "Status updated", 
  data: populated 
});
```

---

### Issue #3: transferLead()
**Exact Location:** Search for `exports.transferLead`  
**Approximate Line:** ~844

**Code to Add:**
```javascript
// RIGHT AFTER this line:
const updated = await PropertyLead.findOneAndUpdate(
  { _id: id, ...accessFilter },
  { $set: { transferTo, transferDate: now } },
  { new: true }
).populate(LEAD_POPULATE);

// ADD THIS:
await notifyLeadTransfer(updated, oldLead.transferTo?._id, transferTo, {
  transferredBy: req.user.userId,
  teamLead: updated.teamLead?._id,
});

// THEN continue with history recording...
await recordHistory(req, {
  // ... existing code ...
});
```

---

### Issue #4: updateLead()
**Exact Location:** Search for `exports.updateLead`  
**Approximate Line:** ~676

**Code to Add (in two places):**

**First: In the followUpDate section:**
```javascript
if (updates.followUpDate) {
  const parsed = parseISTDateTime(updates.followUpDate);
  if (!parsed) {
    return res.status(400).json({
      success: false,
      message: "Invalid followUpDate format"
    });
  }
  updates.followUpDate = parsed;
  updates.reminderSent = false;
  followupChanged = true;  // ADD THIS FLAG
}
```

**Second: After the findOneAndUpdate call:**
```javascript
const updated = await PropertyLead.findOneAndUpdate(
  { _id: id, ...accessFilter },
  { $set: updates },
  { new: true }
).populate(LEAD_POPULATE);

// ADD THIS:
if (followupChanged) {
  await notifyLeadFollowup(updated, {
    createdBy: updated.createdBy?._id,
    teamLead: updated.teamLead?._id,
    relationshipManager: updated.relationshipManager?._id,
  });
}
```

---

## financeLeadController.js

### Import Statement
**Location:** After all `const` declarations (around line 20-30)

**Add these lines:**
```javascript
const {
  notifyLeadFollowup,
  notifyLeadStatusChange,
  notifyLeadTransfer,
} = require("../utils/socketService");
```

---

### Issue #5: updateFollowUp()
**Exact Location:** Search for `exports.updateFollowUp`  
**Approximate Line:** ~1121

**Code to Add:** (IDENTICAL to propertyLeadController.js Issue #1)
```javascript
if (parsedFollowUp) {
  await notifyLeadFollowup(updated, {
    createdBy: updated.createdBy?._id,
    teamLead: updated.teamLead?._id,
    relationshipManager: updated.relationshipManager?._id,
  });
}
```

---

### Issue #6: updateStatus()
**Exact Location:** Search for `exports.updateStatus`  
**Approximate Line:** ~734

**Code to Add:** (IDENTICAL to propertyLeadController.js Issue #2)
```javascript
await notifyLeadStatusChange(populated, prevStatus, status, {
  createdBy: populated.createdBy?._id,
  teamLead: populated.teamLead?._id,
});
```

---

### Issue #7: transferLead()
**Exact Location:** Search for `exports.transferLead`  
**Approximate Line:** ~782

**Code to Add:** (IDENTICAL to propertyLeadController.js Issue #3)
```javascript
await notifyLeadTransfer(updated, oldLead.transferTo?._id, transferTo, {
  transferredBy: req.user.userId,
  teamLead: updated.teamLead?._id,
});
```

---

### Issue #8: bulkTransferLeads()
**Exact Location:** Search for `exports.bulkTransferLeads`  
**Approximate Line:** ~839

**Code to Add:**
```javascript
// INSIDE the loop that updates leads, AFTER transferTo is set:
const leadToUpdate = {
  _id: new mongoose.Types.ObjectId(),
  clientName: lead.clientName,
  // ... other fields ...
  transferTo: transferUser?._id || null,
};

// ADD THIS CODE:
if (leadToUpdate.transferTo) {
  await notifyLeadTransfer(
    { 
      _id: leadToUpdate._id, 
      clientName: leadToUpdate.clientName,
      transferTo: transferUser,
      teamLead: team,
    }, 
    null, 
    leadToUpdate.transferTo, 
    {
      transferredBy: req.user.userId,
      teamLead: team?._id,
    }
  );
}
```

---

### Issue #9: updateLead()
**Exact Location:** Search for `exports.updateLead`  
**Approximate Line:** ~600

**Code to Add:** (IDENTICAL to propertyLeadController.js Issue #4)
```javascript
if (followupChanged) {
  await notifyLeadFollowup(updated, {
    createdBy: updated.createdBy?._id,
    teamLead: updated.teamLead?._id,
    relationshipManager: updated.relationshipManager?._id,
  });
}
```

---

## Summary Table

| Issue | File | Method | Line | Type | Status |
|-------|------|--------|------|------|--------|
| #1 | propertyLeadController.js | updateFollowUp() | ~945 | Add socket emit | 🔴 CRITICAL |
| #2 | propertyLeadController.js | updateStatus() | ~801 | Add socket emit | 🔴 CRITICAL |
| #3 | propertyLeadController.js | transferLead() | ~844 | Add socket emit | 🔴 CRITICAL |
| #4 | propertyLeadController.js | updateLead() | ~676 | Add socket emit (conditional) | 🔴 CRITICAL |
| #5 | financeLeadController.js | updateFollowUp() | ~1121 | Add socket emit | 🔴 CRITICAL |
| #6 | financeLeadController.js | updateStatus() | ~734 | Add socket emit | 🔴 CRITICAL |
| #7 | financeLeadController.js | transferLead() | ~782 | Add socket emit | 🔴 CRITICAL |
| #8 | financeLeadController.js | bulkTransferLeads() | ~839 | Add socket emit (loop) | 🔴 CRITICAL |
| #9 | financeLeadController.js | updateLead() | ~600 | Add socket emit (conditional) | 🔴 CRITICAL |

---

## Quick Search Commands

Use these in VS Code to find the exact locations:

```
Ctrl+F in propertyLeadController.js:
- "exports.updateFollowUp" → Line ~945
- "exports.updateStatus" → Line ~801
- "exports.transferLead" → Line ~844
- "exports.updateLead" → Line ~676

Ctrl+F in financeLeadController.js:
- "exports.updateFollowUp" → Line ~1121
- "exports.updateStatus" → Line ~734
- "exports.transferLead" → Line ~782
- "exports.bulkTransferLeads" → Line ~839
- "exports.updateLead" → Line ~600
```

---

## Verification Steps

After implementing each fix:

1. **Restart server:**
   ```bash
   npm start
   ```

2. **Test with curl:**
   ```bash
   curl -X PATCH http://localhost:4000/api/pleads/:leadId/followup \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"followUpDate":"2026-02-20"}'
   ```

3. **Check browser console:** Should show socket notifications

4. **Verify database:** Notification should be saved

5. **Check socket.io:** Should see emission in network tab

---

## Notes

- All additions are **non-breaking** (adding functionality, not changing existing)
- All additions follow **existing code patterns**
- All additions use **existing utility functions** (socketService.js)
- No **database schema changes** needed
- No **migration scripts** required
- **Backward compatible** - old clients still work

---

**Next: See EXACT_CODE_FIXES.md for full code snippets ready to copy-paste**
