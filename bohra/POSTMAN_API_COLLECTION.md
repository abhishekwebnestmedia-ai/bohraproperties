# Bohra CRM - Complete API Collection for Postman

## Base URL
```
https://darkorchid-kudu-454380.hostingersite.com/api
```

## Authentication
All endpoints (except login, register, forgot-password, reset-password, approve-user) require:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

Get token from login response and use it in all subsequent requests.

---

# 🔐 AUTHENTICATION ENDPOINTS

## 1. LOGIN
Create your JWT token here first!

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/login' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "YOUR_SUPERADMIN_EMAIL",
    "password": "YOUR_SUPERADMIN_PASSWORD"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "userId",
    "name": "Admin User",
    "email": "YOUR_SUPERADMIN_EMAIL",
    "role": "admin",
    "phoneNumber": "9876543210"
  }
}
```

**Save this token and use it for all other requests as:**
```
Authorization: Bearer <token>
```

---

## 2. LOGOUT

```bash
curl --location --request POST 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/logout' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. REGISTER USER (Superadmin/Admin only)

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/register' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "name": "John Teamlead",
    "email": "john@bohra.com",
    "phoneNumber": "9876543210",
    "address": "Delhi",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "teamlead",
    "domain": "property",
    "designation": "teamlead",
    "employeeId": "EMP001"
  }'
```

**For Employee (created by Admin):**
```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/register' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "name": "Jane Employee",
    "email": "jane@bohra.com",
    "phoneNumber": "9876543211",
    "address": "Bangalore",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "employee",
    "domain": "finance",
    "designation": "employee",
    "employeeId": "EMP002",
    "teamleadName": "John Teamlead"
  }'
```

---

## 4. GET ALL USERS (Admin/Superadmin only)

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/users' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 5. CHANGE USER ROLE (Superadmin only)

```bash
curl --location --request PUT 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/change-role/USER_ID_HERE' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "newRole": "admin"
  }'
```

---

## 6. DELETE USER (Admin/Superadmin only)

```bash
curl --location --request DELETE 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/delete-user/USER_ID_HERE' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 7. FORGOT PASSWORD

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/forgot-password' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "user@bohra.com"
  }'
```

---

## 8. RESET PASSWORD

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/reset-password' \
  --header 'Content-Type: application/json' \
  --data '{
    "token": "RESET_TOKEN_FROM_EMAIL",
    "password": "newpassword123",
    "confirmPassword": "newpassword123"
  }'
```

---

## 9. APPROVE USER (Via Email Link - No Auth Required)

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/auth/approve-user/APPROVAL_TOKEN_FROM_EMAIL'
```

---

# 🏘️ PROPERTY LEADS ENDPOINTS

## 1. CREATE PROPERTY LEAD

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "clientName": "Rajesh Kumar",
    "contactNumber": "9876543210",
    "email": "rajesh@example.com",
    "budget": "50 Lakhs",
    "location": "Delhi NCR",
    "project": "Sector 128, Noida",
    "source": "WhatsApp",
    "followUpDate": "2026-02-05",
    "status": "Follow up",
    "notes": "Interested in 3BHK",
    "remarks": "Call after 6 PM"
  }'
```

---

## 2. GET ALL PROPERTY LEADS

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**With Pagination & Filtering:**
```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads?page=1&limit=20&status=Follow%20up&search=Rajesh' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. GET PROPERTY LEAD BY ID

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 4. UPDATE PROPERTY LEAD

```bash
curl --location --request PUT 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "clientName": "Rajesh Kumar Updated",
    "budget": "60 Lakhs",
    "notes": "Updated notes here",
    "remarks": "Follow up on Friday"
  }'
```

---

## 5. UPDATE PROPERTY LEAD STATUS

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID/status' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "status": "Interested"
  }'
```

**Valid Statuses:** Token, Completed, Dead, Follow up, Interested, Busy, Not Interested

---

## 6. UPDATE PROPERTY LEAD FOLLOW-UP DATE

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID/followup' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "followUpDate": "2026-02-10"
  }'
```

---

## 7. TRANSFER PROPERTY LEAD

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID/transfer' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "transferTo": "EMPLOYEE_ID_HERE"
  }'
```

**Or use employee name:**
```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID/transfer' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "transferToName": "Jane Employee"
  }'
```

---

## 8. DELETE PROPERTY LEAD

```bash
curl --location --request DELETE 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 9. GET PROPERTY LEAD HISTORY

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/LEAD_ID/history' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 10. GET PROPERTY DASHBOARD



dashboard api postman request 'https://bohra.onrender.com/api/pleads/pdashboard?range=yearly' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNjE4OTYyLCJleHAiOjE3NzA2NTEzNjJ9.pSdsrrlU9dkHhg0O30hS2rrerzGvxIf2YKbvHqm-bAw' \
  --header 'Content-Type: application/json'

````````````````````````````````````



queries  params  for this api
?range=yearly
?range=monthly
?range=weekly
?range=daily


----------------------------------

## 11. BULK UPLOAD PROPERTY LEADS (CSV/Excel)

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/bulk-upload' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --form 'file=@"/path/to/your/file.xlsx"'
```

**Expected CSV Columns:**
- clientName (required)
- contactNumber (required)
- email
- budget
- location
- project
- source
- followUpDate (YYYY-MM-DD format)
- status
- notes
- remarks

---

## 12. BULK TRANSFER PROPERTY LEADS

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/pleads/bulk-transfer' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "ids": ["LEAD_ID_1", "LEAD_ID_2", "LEAD_ID_3"],
    "transferTo": "EMPLOYEE_ID_HERE"
  }'
```

---

# 💰 FINANCE LEADS ENDPOINTS

## 1. CREATE FINANCE LEAD

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "clientName": "Abhishek",
    "contactNumber": "9876543220",
    "email": "Abhisheka@example.com",
    "loanRequirement": "Home Loan 25 Lakhs",
    "location": "Mumbai",
    "Eligibility": "High",
    "source": "Google",
    "followUpDate": "2026-02-07",
    "status": "Follow up",
    "notes": "Ready to proceed",
    "remarks": "Approx 6 month timeline"
  }'
```

---

## 2. GET ALL FINANCE LEADS

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**With Pagination & Filtering:**
```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads?page=1&limit=20&status=Interested&search=Abhisheka' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. GET FINANCE LEAD BY ID

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 4. UPDATE FINANCE LEAD

```bash
curl --location --request PUT 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "clientName": "Abhishek Updated",
    "loanRequirement": "Home Loan 30 Lakhs",
    "Eligibility": "Very High",
    "notes": "Updated loan requirement",
    "remarks": "Fast processing possible"
  }'
```

---

## 5. UPDATE FINANCE LEAD STATUS

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID/status' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "status": "Interested"
  }'
```

**Valid Statuses:** login, Dead, Follow up, Interested, Busy, Not Interested

---

## 6. UPDATE FINANCE LEAD FOLLOW-UP DATE

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID/followup' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "followUpDate": "2026-02-14"
  }'
```

---

## 7. TRANSFER FINANCE LEAD

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID/transfer' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "transferTo": "EMPLOYEE_ID_HERE"
  }'
```

---

## 8. DELETE FINANCE LEAD

```bash
curl --location --request DELETE 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 9. GET FINANCE LEAD HISTORY

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/LEAD_ID/history' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 10. GET FINANCE DASHBOARD

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/fdashboard' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 11. BULK UPLOAD FINANCE LEADS (CSV/Excel)

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/bulk-upload' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --form 'file=@"/path/to/your/file.xlsx"'
```

**Expected CSV Columns:**
- clientName (required)
- contactNumber (required)
- email
- loanRequirement
- location
- Eligibility
- source
- followUpDate (YYYY-MM-DD format)
- status
- notes
- remarks

---

## 12. BULK TRANSFER FINANCE LEADS

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/fleads/bulk-transfer' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "ids": ["LEAD_ID_1", "LEAD_ID_2"],
    "transferTo": "EMPLOYEE_ID_HERE"
  }'
```

---

# 📝 TASK NOTES ENDPOINTS

## 1. CREATE TASK NOTE

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/tasknotes' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "title": "Follow up with Rajesh",
    "description": "Call to check interest level",
    "dueDate": "2026-02-05",
    "priority": "High",
    "status": "Pending"
  }'
```

**Valid Priority:** Low, Medium, High
**Valid Status:** Pending, Completed

---

## 2. GET ALL TASK NOTES

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/tasknotes' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. GET TASK NOTE BY ID

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/tasknotes/NOTE_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 4. UPDATE TASK NOTE (Update + Add Comment)

```bash
curl --location --request PUT 'https://darkorchid-kudu-454380.hostingersite.com/api/tasknotes/NOTE_ID' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "title": "Follow up with Rajesh - Updated",
    "description": "Call after 6 PM",
    "dueDate": "2026-02-06",
    "priority": "Medium",
    "status": "Completed",
    "comment": "Successfully reached and discussed budget"
  }'
```

---

## 5. DELETE TASK NOTE

```bash
curl --location --request DELETE 'https://darkorchid-kudu-454380.hostingersite.com/api/tasknotes/NOTE_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

# 🔔 NOTIFICATIONS ENDPOINTS

## 1. GET MY NOTIFICATIONS

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/notifications' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 2. MARK NOTIFICATION AS READ

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/notifications/NOTIFICATION_ID/read' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. MARK ALL NOTIFICATIONS AS READ

```bash
curl --location --request PATCH 'https://darkorchid-kudu-454380.hostingersite.com/api/notifications/read-all' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 4. DELETE NOTIFICATION

```bash
curl --location --request DELETE 'https://darkorchid-kudu-454380.hostingersite.com/api/notifications/NOTIFICATION_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

# 💸 opera/SPENDING ENDPOINTS

## 1. CREATE SPENDING ENTRY

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/spending' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "type": "Meta",
    "amount": 5000,
    "note": "Facebook ads for property promotion"
  }'
```

**Valid Types:** Meta, WhatsApp, Google, Referral, 99Acres, Walk in, Other

---

## 2. GET ALL SPENDING ENTRIES

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/spending' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**With Filtering:**
```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/spending?type=Meta&startDate=2026-01-01&endDate=2026-02-01' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 3. UPDATE SPENDING ENTRY

```bash
curl --location --request PUT 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/spending/SPENDING_ID' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --data '{
    "type": "Google",
    "amount": 7500,
    "note": "Google Ads campaign updated"
  }'
```

---

## 4. DELETE SPENDING ENTRY

```bash
curl --location --request DELETE 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/spending/SPENDING_ID' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## 5. GET OPERATIONS DASHBOARD

```bash
curl --location 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/dashboard' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Returns spending summary, total by type, graphs data, etc.

---



## 6. GET OPERATION BASED ONTYPE




postman request 'https://darkorchid-kudu-454380.hostingersite.com/api/opera/spending-stats' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwMDEzODQyLCJleHAiOjE3NzAwNDYyNDJ9.Q9Spdr_l3wqddWHLO3V92x9-rSSwp_dvXSGJl3evDPE' \
  --header 'Content-Type: application/json'




# 🚀 HOW TO USE IN POSTMAN

## Option 1: Import JSON Collection
1. Go to Postman
2. Click "Import"
3. Copy-paste the curl commands as individual requests
4. Set up environment variable: `{{baseUrl}}` = `https://darkorchid-kudu-454380.hostingersite.com/api`
5. Set up environment variable: `{{token}}` = Your JWT token from login

## Option 2: Use as Curl Commands
1. Copy each curl command
2. Paste in terminal or Postman "Code" tab
3. Replace placeholders:
   - `YOUR_JWT_TOKEN` → Your actual token from login
   - `LEAD_ID` → Actual lead ID
   - `USER_ID_HERE` → Actual user ID
   - `EMPLOYEE_ID_HERE` → Actual employee ID

## Option 3: Use in Postman Pre-request Script
```javascript
// Set token globally after login
pm.environment.set("token", pm.response.json().token);

// Use in requests:
// Authorization header: Bearer {{token}}
```

---

# ⚠️ COMMON ERRORS & SOLUTIONS

### 401 Unauthorized
- **Cause:** Missing or invalid JWT token
- **Solution:** Make sure token is set in Authorization header as `Bearer YOUR_TOKEN`

### 400 Bad Request
- **Cause:** Missing required fields or validation error
- **Solution:** Check field names and required fields in endpoint documentation above

### 403 Forbidden
- **Cause:** Insufficient permissions for action
- **Solution:** Check if your role allows this action (admin/superadmin/employee rules)

### 404 Not Found
- **Cause:** Resource (lead, user, note) doesn't exist
- **Solution:** Verify the ID is correct

### 500 Server Error
- **Cause:** Server-side issue
- **Solution:** Check server logs and database connection

---

# 📋 QUICK REFERENCE TABLE

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| **Auth** |
| Login | POST | /auth/login | ❌ |
| Logout | POST | /auth/logout | ✅ |
| Register | POST | /auth/register | ✅ Admin |
| **Property Leads** |
| Create | POST | /pleads | ✅ |
| List | GET | /pleads | ✅ |
| Get One | GET | /pleads/:id | ✅ |
| Update | PUT | /pleads/:id | ✅ |
| Delete | DELETE | /pleads/:id | ✅ |
| Status | PATCH | /pleads/:id/status | ✅ |
| Follow-up | PATCH | /pleads/:id/followup | ✅ |
| Transfer | PATCH | /pleads/:id/transfer | ✅ |
| History | GET | /pleads/:id/history | ✅ |
| Dashboard | GET | /pleads/pdashboard | ✅ |
| Bulk Upload | POST | /pleads/bulk-upload | ✅ |
| Bulk Transfer | PATCH | /pleads/bulk-transfer | ✅ |
| **Finance Leads** |
| Create | POST | /fleads | ✅ |
| List | GET | /fleads | ✅ |
| Get One | GET | /fleads/:id | ✅ |
| Update | PUT | /fleads/:id | ✅ |
| Delete | DELETE | /fleads/:id | ✅ |
| Status | PATCH | /fleads/:id/status | ✅ |
| Follow-up | PATCH | /fleads/:id/followup | ✅ |
| Transfer | PATCH | /fleads/:id/transfer | ✅ |
| History | GET | /fleads/:id/history | ✅ |
| Dashboard | GET | /fleads/fdashboard | ✅ |
| Bulk Upload | POST | /fleads/bulk-upload | ✅ |
| Bulk Transfer | PATCH | /fleads/bulk-transfer | ✅ |
| **Task Notes** |
| Create | POST | /tasknotes | ✅ |
| List | GET | /tasknotes | ✅ |
| Get One | GET | /tasknotes/:id | ✅ |
| Update | PUT | /tasknotes/:id | ✅ |
| Delete | DELETE | /tasknotes/:id | ✅ |
| **Notifications** |
| Get Mine | GET | /notifications | ✅ |
| Mark Read | PATCH | /notifications/:id/read | ✅ |
| Mark All Read | PATCH | /notifications/read-all | ✅ |
| Delete | DELETE | /notifications/:id | ✅ |
| **Operations** |
| Create Spending | POST | /operations/spending | ✅ |
| Get Spending | GET | /operations/spending | ✅ |
| Update Spending | PUT | /operations/spending/:id | ✅ |
| Delete Spending | DELETE | /operations/spending/:id | ✅ |
| Dashboard | GET | /operations/dashboard | ✅ |

---

**Last Updated:** January 30, 2026
**API Version:** 1.0
**Base URL:** https://darkorchid-kudu-454380.hostingersite.com/api

**Example Responses**

Below are concise example responses for common endpoints. Use these to shape client handling and Postman tests.

**Auth**

- Login (success)

  Fields: `token` — JWT string; `user` — object with `_id`, `name`, `email`, `role`, `phoneNumber`.

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ...xyz",
  "user": {
    "_id": "6123abc456def7890",
    "name": "Admin User",
    "email": "admin@bohra.com",
    "role": "admin",
    "phoneNumber": "9876543210"
  }
}
```

- Logout (success)

  Fields: `success` — boolean; `message` — human-readable status.

```json
{
  "success": true,
  "message": "Logout successful"
}
```

- Register (success)

  Fields: `user` — created user object.

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {"_id":"6123def456abc7891","name":"John Teamlead","email":"john@bohra.com","role":"teamlead"}
}
```

- Get all users (success)

```json
{
  "success": true,
  "users": [{"_id":"6123abc","name":"Admin User","email":"admin@bohra.com","role":"admin"}]
}
```

- Change role / Delete user / Forgot/reset/approve (success)

```json
{
  "success": true,
  "message": "Action completed successfully"
}
```

**Property Leads (`/pleads`)**

- Create lead (success)

  Fields: `lead` — created lead object with `_id`, `clientName`, `contactNumber`, `status`, `followUpDate`.

```json
{
  "success": true,
  "message": "Property lead created",
  "lead": {"_id":"7001","clientName":"Rajesh Kumar","contactNumber":"9876543210","status":"Follow up","followUpDate":"2026-02-05"}
}
```

- Get lead (by id)

```json
{
  "success": true,
  "lead": {"_id":"7001","clientName":"Rajesh Kumar","email":"rajesh@example.com","budget":"50 Lakhs","status":"Follow up"}
}
```

- Update lead (success)

```json
{
  "success": true,
  "message": "Lead updated",
  "lead": {"_id":"7001","clientName":"Rajesh Kumar Updated","budget":"60 Lakhs"}
}
```

- Update status / follow-up / transfer (success)

```json
{ "success": true, "message": "Status/assignment updated", "lead": {"_id":"7001","status":"Interested"} }
```

- Delete lead (success)

```json
{ "success": true, "message": "Lead deleted" }
```

- List leads (paginated)

```json
{
  "success": true,
  "message": "Property leads fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2307,
    "totalPages": 231
  },
  "data": [
    {
      "_id": "6989d486100e4499c4a68e1b",
      "clientName": "Client 388",
      "contactNumber": "9814046764",
      "email": "client388@gmail.com",
      "budget": "35 Lakh",
      "location": "Greater Noida",
      "project": "Sky Residency",
      "source": "Instagram",
      "followUpDate": "2026-02-17T18:04:30.750+05:30",
      "status": "Dead",
      "propertyType": "Residential",
      "notes": "Dashboard JSON seed data",
      "remarks": "Auto generated",
      "createdBy": {
        "_id": "6971bbd9df381f2923748844",
        "name": "Admin One",
        "email": "admin1@gmail.com",
        "phoneNumber": "9876543210",
        "role": "admin",
        "employeeId": "ADM001",
        "id": "6971bbd9df381f2923748844"
      },
      "reminderSent": true,
      "createdAt": "2026-02-09T18:04:30.750+05:30",
      "updatedAt": "2026-02-09T18:04:30.750+05:30",
      "id": "6989d486100e4499c4a68e1b"
    },
    {
      "_id": "6989d486100e4499c4a68d59",
      "clientName": "Client 194",
      "contactNumber": "9966410819",
      "email": "client194@gmail.com",
      "budget": "112 Lakh",
      "location": "Greater Noida",
      "project": "Elite Homes",
      "source": "Google Ads",
      "followUpDate": "2026-02-23T18:04:30.750+05:30",
      "status": "Completed",
      "propertyType": "Commercial",
      "notes": "Dashboard JSON seed data",
      "remarks": "Auto generated",
      "createdBy": {"_id":"6971bbd9df381f2923748844","name":"Admin One"},
      "reminderSent": true,
      "createdAt": "2026-02-09T18:04:30.750+05:30",
      "updatedAt": "2026-02-09T18:04:30.750+05:30",
      "id": "6989d486100e4499c4a68d59"
    }
  ]
}
```

- History (success)

```json
{ "success": true, "history": [{"action":"created","by":"Agent A","at":"2026-01-01T10:00:00Z"}] }
```

- Dashboard (success)

```json
{ "success": true, "range":"yearly", "totalLeads":1200, "byStatus":{"Token":100,"Completed":800} }
```

**Finance Leads (`/fleads`)**

- Create (success)

  Fields: `message` — status; `lead` — created lead object with `_id`, `clientName`, `loanRequirement`.

```json
{ "success": true, "message": "Finance lead created", "lead": {"_id":"8001","clientName":"Abhishek Singh","loanRequirement":"Home Loan 25 Lakhs"} }
```

- List leads (paginated)

  Fields: `success` — boolean; `message` — status; `meta` — pagination info; `data` — array of finance lead objects with nested user/teamlead/manager objects.

```json
{
  "success": true,
  "message": "Finance leads fetched",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 7,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "6978a6303e764d4ac1e977a6",
      "clientName": "Suresh Kumar",
      "contactNumber": "9000000066",
      "email": "suresh@gmail.com",
      "reminderSent": true,
      "loanRequirement": "Business Loan - 20 Lakh",
      "location": "Faridabad",
      "project": "Omaxe World",
      "source": "Website",
      "followUpDate": "2026-01-27T17:25:00.000+05:30",
      "status": "Follow up",
      "notes": "Wants meeting",
      "remarks": "Call at 5:25",
      "createdBy": {
        "_id": "6971bbd9df381f2923748844",
        "name": "Admin One",
        "email": "admin1@gmail.com",
        "phoneNumber": "9876543210",
        "role": "admin",
        "employeeId": "ADM001",
        "id": "6971bbd9df381f2923748844"
      },
      "teamLead": {
        "_id": "6971bf90df381f292374884e",
        "name": "Teamlead Finance",
        "email": "teamlead_finance@gmail.com",
        "phoneNumber": "9000000002",
        "role": "teamlead",
        "employeeId": "TL_FIN_001",
        "id": "6971bf90df381f292374884e"
      },
      "relationshipManager": {
        "_id": "6971bfb2df381f2923748854",
        "name": "Employee Finance",
        "email": "employee_finance@gmail.com",
        "phoneNumber": "9000000004",
        "role": "employee",
        "employeeId": "EMP_FIN_001",
        "id": "6971bfb2df381f2923748854"
      },
      "transferTo": {
        "_id": "6971bf90df381f292374884e",
        "name": "Teamlead Finance",
        "email": "teamlead_finance@gmail.com",
        "phoneNumber": "9000000002",
        "role": "teamlead",
        "employeeId": "TL_FIN_001",
        "id": "6971bf90df381f292374884e"
      },
      "transferDate": "2026-01-27T17:19:04.006+05:30",
      "createdAt": "2026-01-27T17:19:04.007+05:30",
      "updatedAt": "2026-01-27T17:24:00.376+05:30",
      "id": "6978a6303e764d4ac1e977a6"
    },
    {
      "_id": "6978a61b3e764d4ac1e97783",
      "clientName": "Neha Gupta",
      "contactNumber": "9000000077",
      "email": "neha@gmail.com",
      "reminderSent": true,
      "loanRequirement": "Personal Loan - 5 Lakh",
      "location": "Ghaziabad",
      "project": "Wave City",
      "source": "Instagram",
      "followUpDate": "2026-01-27T17:22:00.000+05:30",
      "status": "Follow up",
      "notes": "Prefers WhatsApp",
      "remarks": "Call at 5:22",
      "createdBy": {
        "_id": "6971bbd9df381f2923748844",
        "name": "Admin One",
        "email": "admin1@gmail.com",
        "phoneNumber": "9876543210",
        "role": "admin",
        "employeeId": "ADM001",
        "id": "6971bbd9df381f2923748844"
      },
      "teamLead": {
        "_id": "6971bf90df381f292374884e",
        "name": "Teamlead Finance",
        "email": "teamlead_finance@gmail.com",
        "phoneNumber": "9000000002",
        "role": "teamlead",
        "employeeId": "TL_FIN_001",
        "id": "6971bf90df381f292374884e"
      },
      "relationshipManager": {
        "_id": "6971bfb2df381f2923748854",
        "name": "Employee Finance",
        "email": "employee_finance@gmail.com",
        "phoneNumber": "9000000004",
        "role": "employee",
        "employeeId": "EMP_FIN_001",
        "id": "6971bfb2df381f2923748854"
      },
      "transferTo": {
        "_id": "6971bf90df381f292374884e",
        "name": "Teamlead Finance",
        "email": "teamlead_finance@gmail.com",
        "phoneNumber": "9000000002",
        "role": "teamlead",
        "employeeId": "TL_FIN_001",
        "id": "6971bf90df381f292374884e"
      },
      "transferDate": "2026-01-27T17:18:43.757+05:30",
      "createdAt": "2026-01-27T17:18:43.757+05:30",
      "updatedAt": "2026-01-27T17:21:00.315+05:30",
      "id": "6978a61b3e764d4ac1e97783"
    }
  ]
}
```

- Update / Delete / Transfer / History / Dashboard — concise success patterns

```json
{ "success": true, "message": "Lead updated", "lead": {"_id":"8001","clientName":"Abhishek Singh","loanRequirement":"Home Loan 30 Lakhs"} }
```

**Task Notes (`/tasknotes`)**

- Create (success)

```json
{ "success": true, "message": "Task note created", "note": {"_id":"9001","title":"Follow up with Rajesh","priority":"High","status":"Pending","dueDate":"2026-02-05"} }
```

- Update (add comment)

```json
{ "success": true, "message": "Task updated", "note": {"_id":"9001","status":"Completed","comments":[{"by":"Agent A","text":"Reached client","at":"2026-02-05T15:00:00Z"}] } }
```

- Delete (success)

```json
{ "success": true, "message": "Task note deleted" }
```

**Notifications (`/notifications`)**

- Get notifications (success)

```json
{ "success": true, "notifications": [{"_id":"n1","title":"Lead assigned","body":"You were assigned lead 7001","read":false,"createdAt":"2026-02-01T10:00:00Z"}] }
```

- Mark read / mark all read / delete (success)

```json
{ "success": true, "message": "Notification(s) updated" }
```

**Operations / Spending (`/opera`)**

- Create spending (success)

```json
{ "success": true, "message": "Spending entry created", "spending": {"_id":"op100","type":"Meta","amount":5000,"note":"Facebook ads"} }
```

- List / Update / Delete / Dashboard (success)

```json
{ "success": true, "spendings": [{"_id":"op100","type":"Meta","amount":5000,"date":"2026-01-10"}], "total":5000 }
```

**Errors (examples)**

- Validation / 400

```json
{ "success": false, "message": "Validation failed", "errors": [{"field":"contactNumber","message":"required"}] }
```

- Unauthorized / 401

```json
{ "success": false, "message": "Unauthorized" }
```

Note: code blocks use `json` fences — many Markdown viewers show colored syntax highlighting. For the most "colorful" experience, import these examples into Postman as a collection (I can create a Postman collection JSON for direct import which will show responses with full formatting and colors).
