Bohra api 

1login 
  postman request POST 'https://bohra.onrender.com/api/auth/login' \
  --header 'Content-Type: application/json' \
  --body '{
    "email": "admin1@gmail.com",
    "password": "123456"
  }'

{
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNjk3NDM4LCJleHAiOjE3NzA3Mjk4Mzh9.Wmttpa1bgkcTkTz7IkGaDcKh_f2BjYiuJkH2JtvwoA8",
    "user": {
        "id": "6971bbd9df381f2923748844",
        "name": "Admin One",
        "email": "admin1@gmail.com",
        "role": "admin",
        "domain": "property",
        "designation": "employee"
    }
}


=========================================
=========================super adminlogin credentials====================
postman request POST 'http://localhost:4000/api/auth/login' \
  --header 'Content-Type: application/json' \
  --body '{
  "email": "superadmin@gmail.com",
  "password": "123456"
}'

{
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcwY2FlZDcyNzI1MjczMDdiZGFmZTIiLCJyb2xlIjoic3VwZXJhZG1pbiIsImVtYWlsIjoic3VwZXJhZG1pbkBnbWFpbC5jb20iLCJuYW1lIjoiU3VwZXIgQWRtaW4iLCJkb21haW4iOiJwcm9wZXJ0eSIsImRlc2lnbmF0aW9uIjoiZW1wbG95ZWUiLCJpYXQiOjE3NzA3MDQwODIsImV4cCI6MTc3MDczNjQ4Mn0.5g6qQtYeZhsRXuofPQGbCR8pEjOUa4MOn2BN6UdIOL4",
    "user": {
        "id": "6970caed7272527307bdafe2",
        "name": "Super Admin",
        "email": "superadmin@gmail.com",
        "role": "superadmin",
        "domain": "property",
        "designation": "employee"
    }
}
===================================
=================== creating admin by super admin ================

postman request POST 'http://localhost:4000/api/auth/register' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcwY2FlZDcyNzI1MjczMDdiZGFmZTIiLCJyb2xlIjoic3VwZXJhZG1pbiIsImVtYWlsIjoic3VwZXJhZG1pbkBnbWFpbC5jb20iLCJuYW1lIjoiU3VwZXIgQWRtaW4iLCJkb21haW4iOiJwcm9wZXJ0eSIsImRlc2lnbmF0aW9uIjoiZW1wbG95ZWUiLCJpYXQiOjE3NzA3MDQwODIsImV4cCI6MTc3MDczNjQ4Mn0.5g6qQtYeZhsRXuofPQGbCR8pEjOUa4MOn2BN6UdIOL4' \
  --body '{
  "name": "Admin 10",
  "email": "admin10@gmail.com",
  "phoneNumber": "9876543210",
  "password": "123456",
  "confirmPassword": "123456",
  "role": "admin",
  "employeeId": "ADM010"
}'



{
    "success": true,
    "message": "Admin registered successfully (auto approved)",
    "user": {
        "id": "698acd22eab2106c75a4b92d",
        "name": "Admin 10",
        "email": "admin10@gmail.com",
        "role": "admin",
        "domain": "property",
        "designation": "employee",
        "isApproved": true
    }
}
================================================
========================api to get all user =================
postman request 'http://localhost:4000/api/auth/users' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA0Mzg5LCJleHAiOjE3NzA3MzY3ODl9.Wp7EZJ_qYbifBKSG9AP1A1QbdtaGj_y5BWL3YomvdPg'

{
    "success": true,
    "count": 8,
    "users": [
        {
            "_id": "6970caed7272527307bdafe2",
            "name": "Super Admin",
            "email": "superadmin@gmail.com",
            "phoneNumber": "9999999999",
            "role": "superadmin",
            "domain": "property",
            "designation": "employee",
            "isLoggedIn": true,
            "isApproved": true,
            "createdAt": "2026-01-21T12:47:41.769Z",
            "id": "6970caed7272527307bdafe2"
        },
        {
            "_id": "6971bbd9df381f2923748844",
            "name": "Admin One",
            "email": "admin1@gmail.com",
            "phoneNumber": "9876543210",
            "role": "admin",
            "domain": "property",
            "designation": "employee",
            "employeeId": "ADM001",
            "isLoggedIn": true,
            "isApproved": true,
            "createdAt": "2026-01-22T05:55:37.169Z",
            "id": "6971bbd9df381f2923748844"
        },
        {
            "_id": "6971bf78df381f292374884b",
            "name": "Teamlead Property",
            "email": "teamlead_property@gmail.com",
            "phoneNumber": "9000000001",
            "role": "teamlead",
            "domain": "property",
            "designation": "teamlead",
            "employeeId": "TL_PROP_001",
            "isLoggedIn": false,
            "isApproved": false,
            "createdAt": "2026-01-22T06:11:04.906Z",
            "id": "6971bf78df381f292374884b"
        },
        {
            "_id": "6971bf90df381f292374884e",
            "name": "Teamlead Finance",
            "email": "teamlead_finance@gmail.com",
            "phoneNumber": "9000000002",
            "role": "teamlead",
            "domain": "finance",
            "designation": "teamlead",
            "employeeId": "TL_FIN_001",
            "isLoggedIn": false,
            "isApproved": false,
            "createdAt": "2026-01-22T06:11:28.560Z",
            "id": "6971bf90df381f292374884e"
        },
        {
            "_id": "6971bfa0df381f2923748851",
            "name": "Employee Property",
            "email": "employee_property@gmail.com",
            "phoneNumber": "9000000003",
            "role": "employee",
            "domain": "property",
            "designation": "employee",
            "employeeId": "EMP_PROP_001",
            "teamleadName": "Teamlead Property",
            "isLoggedIn": false,
            "isApproved": false,
            "createdAt": "2026-01-22T06:11:44.820Z",
            "id": "6971bfa0df381f2923748851"
        },
        {
            "_id": "6971bfb2df381f2923748854",
            "name": "Employee Finance",
            "email": "employee_finance@gmail.com",
            "phoneNumber": "9000000004",
            "role": "employee",
            "domain": "finance",
            "designation": "employee",
            "employeeId": "EMP_FIN_001",
            "teamleadName": "Teamlead Finance",
            "isLoggedIn": false,
            "isApproved": false,
            "createdAt": "2026-01-22T06:12:02.342Z",
            "id": "6971bfb2df381f2923748854"
        },
        {
            "_id": "6971c23f186f286ed8946c9c",
            "name": "Teamlead Property Two",
            "email": "teamlead_property2@gmail.com",
            "phoneNumber": "9000000011",
            "role": "teamlead",
            "domain": "property",
            "designation": "teamlead",
            "employeeId": "TL_PROP_002",
            "isLoggedIn": false,
            "isApproved": false,
            "createdAt": "2026-01-22T06:22:55.424Z",
            "id": "6971c23f186f286ed8946c9c"
        },
        {
            "_id": "698acd22eab2106c75a4b92d",
            "name": "Admin 10",
            "email": "admin10@gmail.com",
            "phoneNumber": "9876543210",
            "role": "admin",
            "domain": "property",
            "designation": "employee",
            "employeeId": "ADM010",
            "isLoggedIn": false,
            "isApproved": true,
            "createdAt": "2026-02-10T06:16:02.843Z",
            "id": "698acd22eab2106c75a4b92d"
        }
    ]
}

==========================
======================property lead api ======================
postman request 'http://localhost:4000/api/pleads' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNjk3NDM4LCJleHAiOjE3NzA3Mjk4Mzh9.Wmttpa1bgkcTkTz7IkGaDcKh_f2BjYiuJkH2JtvwoA8'

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
            "teamLead": {
                "_id": "6971bf78df381f292374884b",
                "name": "Teamlead Property",
                "email": "teamlead_property@gmail.com",
                "phoneNumber": "9000000001",
                "role": "teamlead",
                "employeeId": "TL_PROP_001",
                "id": "6971bf78df381f292374884b"
            },
            "relationshipManager": {
                "_id": "6971bfa0df381f2923748851",
                "name": "Employee Property",
                "email": "employee_property@gmail.com",
                "phoneNumber": "9000000003",
                "role": "employee",
                "employeeId": "EMP_PROP_001",
                "id": "6971bfa0df381f2923748851"
            },
            "transferTo": {
                "_id": "6971bfa0df381f2923748851",
                "name": "Employee Property",
                "email": "employee_property@gmail.com",
                "phoneNumber": "9000000003",
                "role": "employee",
                "employeeId": "EMP_PROP_001",
                "id": "6971bfa0df381f2923748851"
            },
            "transferDate": "2026-02-09T19:04:30.750+05:30",
            "createdAt": "2026-02-09T18:04:30.750+05:30",
            "updatedAt": "2026-02-09T18:04:30.750+05:30",
            "reminderSent": true,
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
                "_id": "6971bf78df381f292374884b",
                "name": "Teamlead Property",
                "email": "teamlead_property@gmail.com",
                "phoneNumber": "9000000001",
                "role": "teamlead",
                "employeeId": "TL_PROP_001",
                "id": "6971bf78df381f292374884b"
            },
            "relationshipManager": {
                "_id": "6971bfa0df381f2923748851",
                "name": "Employee Property",
                "email": "employee_property@gmail.com",
                "phoneNumber": "9000000003",
                "role": "employee",
                "employeeId": "EMP_PROP_001",
                "id": "6971bfa0df381f2923748851"
            },
            "transferTo": {
                "_id": "6971bfa0df381f2923748851",
                "name": "Employee Property",
                "email": "employee_property@gmail.com",
                "phoneNumber": "9000000003",
                "role": "employee",
                "employeeId": "EMP_PROP_001",
                "id": "6971bfa0df381f2923748851"
            },
            "transferDate": "2026-02-09T19:04:30.750+05:30",
            "createdAt": "2026-02-09T18:04:30.750+05:30",
            "updatedAt": "2026-02-09T18:04:30.750+05:30",
            "reminderSent": true,
            "id": "6989d486100e4499c4a68d59"
        },
        {
            "_id": "6989c3b3100e4499c4a68a05",
            "clientName": "Client 42",
            "contactNumber": "9497447929",
            "email": "client42@gmail.com",
            "budget": "53 Lakh",
            "location": "Noida Extension",
            "project": "Palm Residency",
            "source": "Referral",
            "followUpDate": "2026-02-16T16:52:10.940+05:30",
            "status": "Busy",
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
            "teamLead": {
                "_id": "6971bf78df381f292374884b",
                "name": "Teamlead Property",
                "email": "teamlead_property@gmail.com",
                "phoneNumber": "9000000001",
                "role": "teamlead",
                "employeeId": "TL_PROP_001",
                "id": "6971bf78df381f292374884b"
            },
            "relationshipManager": {
                "_id": "6971bfa0df381f2923748851",
                "name": "Employee Property",
                "email": "employee_property@gmail.com",
                "phoneNumber": "9000000003",
                "role": "employee",
                "employeeId": "EMP_PROP_001",
                "id": "6971bfa0df381f2923748851"
            },
            "transferTo": {
                "_id": "6971bfa0df381f2923748851",
                "name": "Employee Property",
                "email": "employee_property@gmail.com",
                "phoneNumber": "9000000003",
                "role": "employee",
                "employeeId": "EMP_PROP_001",
                "id": "6971bfa0df381f2923748851"
            },
            "transferDate": "2026-02-09T17:52:10.940+05:30",
            "createdAt": "2026-02-09T16:52:10.940+05:30",
            "updatedAt": "2026-02-09T16:52:10.940+05:30",
            "reminderSent": false,
            "id": "6989c3b3100e4499c4a68a05"
        },
=====================================
===============================finace get api ======
postman request 'http://localhost:4000/api/fleads' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNjk3NDM4LCJleHAiOjE3NzA3Mjk4Mzh9.Wmttpa1bgkcTkTz7IkGaDcKh_f2BjYiuJkH2JtvwoA8'

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
            "__v": 0,
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
            "__v": 0,
            "id": "6978a61b3e764d4ac1e97783"
        },
  ]
}
===========================================
=================================================================================

dashboard api postman request 'https://bohra.onrender.com/api/pleads/pdashboard?range=yearly' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNjE4OTYyLCJleHAiOjE3NzA2NTEzNjJ9.pSdsrrlU9dkHhg0O30hS2rrerzGvxIf2YKbvHqm-bAw' \
  --header 'Content-Type: application/json'





queries  params  for this api
?range=yearly
?range=monthly
?range=weekly
?range=daily

{
    "success": true,
    "range": "yearly",
    "cards": {
        "totalLeads": {
            "value": 7,
            "change": 100
        },
        "activeDeals": {
            "value": 0,
            "change": 0
        },
        "completed": {
            "value": 0,
            "change": 0
        },
        "pending": {
            "value": 7,
            "change": 100
        },
        "token": {
            "value": 0,
            "change": 0
        },
        "conversionRate": {
            "value": 0,
            "change": 0
        }
    },
    "performance": {
        "daily": [],
        "weekly": [],
        "monthly": [],
        "yearly": [
            {
                "_id": "2026",
                "leads": 7,
                "completed": 0
            }
        ]
    },
    "sources": {
        "daily": [],
        "weekly": [],
        "monthly": [],
        "yearly": [
            {
                "_id": "Website",
                "count": 4
            },
            {
                "_id": "Facebook",
                "count": 1
            },
            {
                "_id": "Instagram",
                "count": 1
            },
            {
                "_id": "Google Ads",
                "count": 1
            }
        ]
    },
    "recentLeads": [
        {
            "_id": "6978a9b23e764d4ac1e9781a",
            "clientName": "Suresh Verma",
            "contactNumber": "9000000666",
            "email": "suresh@gmail.com",
            "reminderSent": true,
            "budget": "90 Lakh",
            "location": "Noida Extension",
            "project": "Sky Heights",
            "source": "Google Ads",
            "followUpDate": "2026-01-27T17:48:00.000+05:30",
            "status": "Follow up",
            "notes": "Interested in corner flat",
            "remarks": "Call at 5:48 PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-27T17:34:02.559+05:30",
            "createdAt": "2026-01-27T17:34:02.560+05:30",
            "updatedAt": "2026-01-27T17:47:00.255+05:30",
            "__v": 0,
            "id": "6978a9b23e764d4ac1e9781a"
        },
        {
            "_id": "6978a9a13e764d4ac1e97808",
            "clientName": "Neha Sharma",
            "contactNumber": "9000000777",
            "email": "neha@gmail.com",
            "reminderSent": true,
            "budget": "85 Lakh",
            "location": "Greater Noida",
            "project": "Palm Residency",
            "source": "Instagram",
            "followUpDate": "2026-01-27T17:46:00.000+05:30",
            "status": "Follow up",
            "notes": "Wants park facing flat",
            "remarks": "Call at 5:46 PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-27T17:33:45.854+05:30",
            "createdAt": "2026-01-27T17:33:45.855+05:30",
            "updatedAt": "2026-01-27T17:45:00.260+05:30",
            "__v": 0,
            "id": "6978a9a13e764d4ac1e97808"
        },
        {
            "_id": "6978a9903e764d4ac1e977fa",
            "clientName": "Amit Khanna",
            "contactNumber": "9000000888",
            "email": "amit@gmail.com",
            "reminderSent": true,
            "budget": "60 Lakh",
            "location": "Ghaziabad",
            "project": "Wave Homes",
            "source": "Facebook",
            "followUpDate": "2026-01-27T17:42:00.000+05:30",
            "status": "Follow up",
            "notes": "Needs 2BHK",
            "remarks": "Call at 5:42 PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-27T17:33:28.728+05:30",
            "createdAt": "2026-01-27T17:33:28.729+05:30",
            "updatedAt": "2026-01-27T17:41:00.277+05:30",
            "__v": 0,
            "id": "6978a9903e764d4ac1e977fa"
        },
        {
            "_id": "6978a97f3e764d4ac1e977ec",
            "clientName": "Rohit Mehra",
            "contactNumber": "9000000999",
            "email": "rohit@gmail.com",
            "reminderSent": true,
            "budget": "75 Lakh",
            "location": "Noida Sector 50",
            "project": "Green Valley",
            "source": "Website",
            "followUpDate": "2026-01-27T17:40:00.000+05:30",
            "status": "Follow up",
            "notes": "Client wants near metro",
            "remarks": "Call at 5:40 PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-27T17:33:11.062+05:30",
            "createdAt": "2026-01-27T17:33:11.063+05:30",
            "updatedAt": "2026-01-27T17:39:00.269+05:30",
            "__v": 0,
            "id": "6978a97f3e764d4ac1e977ec"
        },
        {
            "_id": "6973525f872a863d53f458da",
            "clientName": "Rohit Mehra",
            "contactNumber": "9000000999",
            "email": "rohit@gmail.com",
            "budget": "75 Lakh",
            "location": "Noida Sector 50",
            "project": "Green Valley",
            "source": "Website",
            "followUpDate": "2026-01-28T00:00:00.000+05:30",
            "status": "Follow up",
            "propertyType": "Commercial",
            "notes": "Client wants near metro",
            "remarks": "Call at 6PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-23T16:20:07.654+05:30",
            "createdAt": "2026-01-23T16:20:07.665+05:30",
            "updatedAt": "2026-02-06T13:22:00.207+05:30",
            "__v": 0,
            "reminderSent": true,
            "id": "6973525f872a863d53f458da"
        },
        {
            "_id": "69732f6e5b32370adb0faf17",
            "clientName": "Rohit Mehra",
            "contactNumber": "9000000999",
            "email": "rohit@gmail.com",
            "budget": "75 Lakh",
            "location": "Noida Sector 50",
            "project": "Green Valley",
            "source": "Website",
            "followUpDate": "2026-02-06T13:39:00.000+05:30",
            "status": "Follow up",
            "notes": "Client wants near metro",
            "remarks": "Call at 6PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-23T13:51:02.107+05:30",
            "createdAt": "2026-01-23T13:51:02.110+05:30",
            "updatedAt": "2026-02-06T13:22:00.207+05:30",
            "__v": 0,
            "reminderSent": true,
            "id": "69732f6e5b32370adb0faf17"
        },
        {
            "_id": "697323b298d3663a4b06f0f4",
            "clientName": "Rohit Mehra",
            "contactNumber": "9000000999",
            "email": "rohit@gmail.com",
            "budget": "75 Lakh",
            "location": "Noida Sector 50",
            "project": "Green Valley",
            "source": "Website",
            "followUpDate": "2026-02-06T13:32:00.000+05:30",
            "status": "Follow up",
            "notes": "Client wants near metro",
            "remarks": "Call at 6PM",
            "createdBy": "6971bbd9df381f2923748844",
            "teamLead": "6971bf78df381f292374884b",
            "relationshipManager": "6971bfa0df381f2923748851",
            "transferTo": "6971bfa0df381f2923748851",
            "transferDate": "2026-01-23T13:00:58.444+05:30",
            "createdAt": "2026-01-23T13:00:58.446+05:30",
            "updatedAt": "2026-02-06T13:22:00.207+05:30",
            "__v": 0,
            "reminderSent": true,
            "id": "697323b298d3663a4b06f0f4"
        }
    ]
}
=============================

===========================api to  get notes ===============

postman request 'http://localhost:4000/api/notes?page=1&limit=10' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo'

{
    "success": true,
    "message": "Notes fetched successfully",
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
    },
    "data": [
        {
            "_id": "69735fe2573f50dc9d7b0ccf",
            "title": "Updated Title - Call Client",
            "note": "Updated: client asked for discount, call tomorrow.",
            "dueDate": "2026-01-30T11:30:00.000+05:30",
            "status": "Pending",
            "priority": "Medium",
            "createdBy": {
                "_id": "6971bbd9df381f2923748844",
                "name": "Admin One",
                "email": "admin1@gmail.com",
                "role": "admin",
                "employeeId": "ADM001",
                "id": "6971bbd9df381f2923748844"
            },
            "comments": [
                {
                    "text": "First comment on create",
                    "commentedBy": {
                        "_id": "6971bbd9df381f2923748844",
                        "name": "Admin One",
                        "email": "admin1@gmail.com",
                        "role": "admin",
                        "employeeId": "ADM001",
                        "id": "6971bbd9df381f2923748844"
                    },
                    "_id": "69735fe2573f50dc9d7b0cd0",
                    "createdAt": "2026-01-23T17:17:46.075+05:30"
                },
                {
                    "text": "Second comment on create",
                    "commentedBy": {
                        "_id": "6971bbd9df381f2923748844",
                        "name": "Admin One",
                        "email": "admin1@gmail.com",
                        "role": "admin",
                        "employeeId": "ADM001",
                        "id": "6971bbd9df381f2923748844"
                    },
                    "_id": "69735fe2573f50dc9d7b0cd1",
                    "createdAt": "2026-01-23T17:17:46.077+05:30"
                },
                {
                    "text": "New comment 1 added in update",
                    "commentedBy": {
                        "_id": "6971bbd9df381f2923748844",
                        "name": "Admin One",
                        "email": "admin1@gmail.com",
                        "role": "admin",
                        "employeeId": "ADM001",
                        "id": "6971bbd9df381f2923748844"
                    },
                    "createdAt": "2026-01-23T17:26:34.327+05:30",
                    "_id": "697361f2573f50dc9d7b0cec"
                },
                {
                    "text": "New comment 2 added in update",
                    "commentedBy": {
                        "_id": "6971bbd9df381f2923748844",
                        "name": "Admin One",
                        "email": "admin1@gmail.com",
                        "role": "admin",
                        "employeeId": "ADM001",
                        "id": "6971bbd9df381f2923748844"
                    },
                    "createdAt": "2026-01-23T17:26:34.327+05:30",
                    "_id": "697361f2573f50dc9d7b0ced"
                },
                {
                    "text": "New comment 3 object format",
                    "commentedBy": {
                        "_id": "6971bbd9df381f2923748844",
                        "name": "Admin One",
                        "email": "admin1@gmail.com",
                        "role": "admin",
                        "employeeId": "ADM001",
                        "id": "6971bbd9df381f2923748844"
                    },
                    "createdAt": "2026-01-23T17:26:34.327+05:30",
                    "_id": "697361f2573f50dc9d7b0cee"
                }
            ],
            "deleteAt": "2026-04-30T11:30:00.000+05:30",
            "createdAt": "2026-01-23T17:17:46.089+05:30",
            "updatedAt": "2026-01-30T11:30:00.847+05:30",
            "__v": 0,
            "reminderSent": true,
            "id": "69735fe2573f50dc9d7b0ccf"
        }
    ]
}
=====================================
==============api to get notes by id ==========================

postman request 'http://localhost:4000/api/notes/69735fe2573f50dc9d7b0ccf' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo'

{
    "success": true,
    "data": {
        "_id": "69735fe2573f50dc9d7b0ccf",
        "title": "Updated Title - Call Client",
        "note": "Updated: client asked for discount, call tomorrow.",
        "dueDate": "2026-01-30T11:30:00.000+05:30",
        "status": "Pending",
        "priority": "Medium",
        "createdBy": {
            "_id": "6971bbd9df381f2923748844",
            "name": "Admin One",
            "email": "admin1@gmail.com",
            "role": "admin",
            "employeeId": "ADM001",
            "id": "6971bbd9df381f2923748844"
        },
        "comments": [
            {
                "text": "First comment on create",
                "commentedBy": {
                    "_id": "6971bbd9df381f2923748844",
                    "name": "Admin One",
                    "email": "admin1@gmail.com",
                    "role": "admin",
                    "employeeId": "ADM001",
                    "id": "6971bbd9df381f2923748844"
                },
                "_id": "69735fe2573f50dc9d7b0cd0",
                "createdAt": "2026-01-23T17:17:46.075+05:30"
            },
            {
                "text": "Second comment on create",
                "commentedBy": {
                    "_id": "6971bbd9df381f2923748844",
                    "name": "Admin One",
                    "email": "admin1@gmail.com",
                    "role": "admin",
                    "employeeId": "ADM001",
                    "id": "6971bbd9df381f2923748844"
                },
                "_id": "69735fe2573f50dc9d7b0cd1",
                "createdAt": "2026-01-23T17:17:46.077+05:30"
            },
            {
                "text": "New comment 1 added in update",
                "commentedBy": {
                    "_id": "6971bbd9df381f2923748844",
                    "name": "Admin One",
                    "email": "admin1@gmail.com",
                    "role": "admin",
                    "employeeId": "ADM001",
                    "id": "6971bbd9df381f2923748844"
                },
                "createdAt": "2026-01-23T17:26:34.327+05:30",
                "_id": "697361f2573f50dc9d7b0cec"
            },
            {
                "text": "New comment 2 added in update",
                "commentedBy": {
                    "_id": "6971bbd9df381f2923748844",
                    "name": "Admin One",
                    "email": "admin1@gmail.com",
                    "role": "admin",
                    "employeeId": "ADM001",
                    "id": "6971bbd9df381f2923748844"
                },
                "createdAt": "2026-01-23T17:26:34.327+05:30",
                "_id": "697361f2573f50dc9d7b0ced"
            },
            {
                "text": "New comment 3 object format",
                "commentedBy": {
                    "_id": "6971bbd9df381f2923748844",
                    "name": "Admin One",
                    "email": "admin1@gmail.com",
                    "role": "admin",
                    "employeeId": "ADM001",
                    "id": "6971bbd9df381f2923748844"
                },
                "createdAt": "2026-01-23T17:26:34.327+05:30",
                "_id": "697361f2573f50dc9d7b0cee"
            }
        ],
        "deleteAt": "2026-04-30T11:30:00.000+05:30",
        "createdAt": "2026-01-23T17:17:46.089+05:30",
        "updatedAt": "2026-01-30T11:30:00.847+05:30",
        "__v": 0,
        "reminderSent": true,
        "id": "69735fe2573f50dc9d7b0ccf"
    }
}
===========================
=====================  get spending api  =======================
postman request POST 'http://localhost:4000/api/opera/spending' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo' \
  --header 'Content-Type: application/json' \
  --body '{
  "type": "Meta",
  "amount": 20000,
  "note": "October Campaign"
}'

{
    "success": true,
    "message": "Spending added",
    "data": {
        "type": "Meta",
        "amount": 20000,
        "note": "October Campaign",
        "createdBy": {
            "_id": "6971bbd9df381f2923748844",
            "name": "Admin One",
            "email": "admin1@gmail.com",
            "id": "6971bbd9df381f2923748844"
        },
        "_id": "698ad6e2eab2106c75a4b941",
        "createdAt": "2026-02-10T12:27:38.005+05:30",
        "updatedAt": "2026-02-10T12:27:38.005+05:30",
        "__v": 0,
        "id": "698ad6e2eab2106c75a4b941"
    }
}

=========================
=================api to get notification ================
postman request 'http://localhost:4000/api/notifications' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo' \
  --header 'Content-Type: application/json'

{
    "success": true,
    "data": [
        {
            "_id": "69859da012b1226c2f54fafb",
            "user": {
                "_id": "6970caed7272527307bdafe2",
                "name": "Super Admin",
                "email": "superadmin@gmail.com",
                "id": "6970caed7272527307bdafe2"
            },
            "title": "Finance Follow-up Reminder",
            "message": "Finance Follow-up reminder: Rohit Sharma",
            "type": "finance",
            "refId": "6973210998d3663a4b06f0db",
            "isRead": false,
            "createdBy": "6971bbd9df381f2923748844",
            "__v": 0,
            "createdAt": "2026-02-06T07:52:00.367Z",
            "updatedAt": "2026-02-06T07:52:00.367Z"
        },
        {
            "_id": "69859da012b1226c2f54faf7",
            "user": {
                "_id": "6971bbd9df381f2923748844",
                "name": "Admin One",
                "email": "admin1@gmail.com",
                "id": "6971bbd9df381f2923748844"
            },
            "title": "Finance Follow-up Reminder",
            "message": "Finance Follow-up reminder: Rohit Sharma",
            "type": "finance",
            "refId": "6973210998d3663a4b06f0db",
            "isRead": false,
            "createdBy": "6971bbd9df381f2923748844",
            "__v": 0,
            "createdAt": "2026-02-06T07:52:00.367Z",
            "updatedAt": "2026-02-06T07:52:00.367Z"
        },
        {
            "_id": "69859da012b1226c2f54faf8",
            "user": {
                "_id": "6971bf90df381f292374884e",
                "name": "Teamlead Finance",
                "email": "teamlead_finance@gmail.com",
                "id": "6971bf90df381f292374884e"
            },
            "title": "Finance Follow-up Reminder",
            "message": "Finance Follow-up reminder: Rohit Sharma",
            "type": "finance",
            "refId": "6973210998d3663a4b06f0db",
            "isRead": false,
            "createdBy": "6971bbd9df381f2923748844",
            "__v": 0,
            "createdAt": "2026-02-06T07:52:00.367Z",
            "updatedAt": "2026-02-06T07:52:00.367Z"
        },
}
    ]
}
==================post api finance lead ========================
postman request POST 'http://localhost:4000/api/fleads' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzY5MTUyNzAwLCJleHAiOjE3NjkxODUxMDB9.YrhSjtGM6YrAWIZmiRNuzihebwoTlVHvuKIewacCHlI' \
  --header 'Content-Type: application/json' \
  --body '{
    "clientName": "Rohit Sharma",
    "contactNumber": "9000000099",
    "email": "rohit@gmail.com",
    "loanRequirement": "Home Loan - 50 Lakh",
    "location": "Noida",
    "project": "Jaypee Greens",
    "source": "Facebook",
    "followUpDate": "2026-01-25",
    "notes": "Client wants low ROI",
    "remarks": "Call in evening",

    "relationshipManagerName": "Employee Finance",
    "teamLeadName": "Teamlead Finance"
  }'

================================================
==================post api finance lead ========================
postman request POST 'http://localhost:4000/api/fleads' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzY5MTUyNzAwLCJleHAiOjE3NjkxODUxMDB9.YrhSjtGM6YrAWIZmiRNuzihebwoTlVHvuKIewacCHlI' \
  --header 'Content-Type: application/json' \
  --body '{
    "clientName": "Rohit Sharma",
    "contactNumber": "9000000099",
    "email": "rohit@gmail.com",
    "loanRequirement": "Home Loan - 50 Lakh",
    "location": "Noida",
    "project": "Jaypee Greens",
    "source": "Facebook",
    "followUpDate": "2026-01-25",
    "notes": "Client wants low ROI",
    "remarks": "Call in evening",

    "relationshipManagerName": "Employee Finance",
    "teamLeadName": "Teamlead Finance"
  }'

======================================================

[1:15 PM]
===============post api for property lead ===============
postman request POST 'http://localhost:4000/api/pleads' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzY5MTUzMzcxLCJleHAiOjE3NjkxODU3NzF9.WOlMhR8OLvxuvl44cj226BNRReqDoN_f2Z0QO8iRg18' \
  --header 'Content-Type: application/json' \
  --body '{
    "clientName": "Rohit Mehra",
    "contactNumber": "9000000999",
    "email": "rohit@gmail.com",
    "budget": "75 Lakh",
    "location": "Noida Sector 50",
    "project": "Green Valley",
    "source": "Website",
    "followUpDate": "2026-01-28",
    "status": "Follow up",
    "notes": "Client wants near metro",
    "remarks": "Call at 6PM",
    "teamLeadName": "Teamlead Property",
    "relationshipManagerName": "Employee Property",
    "transferToName": "Employee Property"
  }'
================================================
====================api to post spending ==================
postman request POST 'http://localhost:4000/api/opera/spending' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo' \
  --header 'Content-Type: application/json' \
  --body '{
  "type": "Meta",
  "amount": 20000,
  "note": "October Campaign"
}'
======================================
============================api to update spending =========

postman request PUT 'http://localhost:4000/api/opera/spending/69786b8583577f8cb47f51d6' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzY5NDkwNzkyLCJleHAiOjE3Njk1MjMxOTJ9.aJ0cfFPlLJ730PTIms_X_51Z9OYlJJ5Wo9CkniiasbY' \
  --header 'Content-Type: application/json' \
  --body '{
  "amount": 25000,
  "note": "Updated Budget"
}'



=============================================
==================api for bulk uploadation===================
curl --location --request POST 'http://localhost:4000/api/pleads/bulk-upload' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \
--form 'file=@leads.xlsx'

====================================
==========api for bulk uploadation===================
curl --location --request POST 'http://localhost:4000/api/pleads/bulk-upload' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \
--form 'file=@leads.xlsx'

=========================

[1:46 PM]
=================api to get property lead by id
curl --location 'http://localhost:4000/api/pleads/6989d486100e4499c4a68e1b' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'



============ bulk transfer of Property lead ===========
curl --location --request PATCH 'http://localhost:4000/api/pleads/bulk-transfer' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
  "leadIds": [
    "6989d486100e4499c4a68e1b",
    "6989d486100e4499c4a68e1c"
  ],
  "transferToName": "Employee Property"
}'

===========history of particular property id =========
curl --location 'http://localhost:4000/api/pleads/6989d486100e4499c4a68e1b/history' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'
======================================

=========== update history of property lead ==== 
curl --location --request PUT 'http://localhost:4000/api/pleads/6989d486100e4499c4a68e1b' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \
--header 'Content-Type: application/json' \
--data '{
  "status": "Hot",
  "remarks": "Updated from API"
}'

=================bulk upload finance lead============
curl --location --request POST 'http://localhost:4000/api/fleads/bulk-upload' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...kfxmXQgsMxBaFQ3x4Pk4OzOYX1AEkuG7JqbZFPAUYow' \
--form 'file=@"/path/to/file.xlsx"'
======================================

===============post api for property lead ===============
postman request POST 'http://localhost:4000/api/pleads' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzY5MTUzMzcxLCJleHAiOjE3NjkxODU3NzF9.WOlMhR8OLvxuvl44cj226BNRReqDoN_f2Z0QO8iRg18' \
  --header 'Content-Type: application/json' \
  --body '{
    "clientName": "Rohit Mehra",
    "contactNumber": "9000000999",
    "email": "rohit@gmail.com",
    "budget": "75 Lakh",
    "location": "Noida Sector 50",
    "project": "Green Valley",
    "source": "Website",
    "followUpDate": "2026-01-28",
    "status": "Follow up",
    "notes": "Client wants near metro",
    "remarks": "Call at 6PM",
    "teamLeadName": "Teamlead Property",
    "relationshipManagerName": "Employee Property",
    "transferToName": "Employee Property"
  }'
[1:18 PM]
====================api to post spending ==================
postman request POST 'http://localhost:4000/api/opera/spending' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo' \
  --header 'Content-Type: application/json' \
  --body '{
  "type": "Meta",
  "amount": 20000,
  "note": "October Campaign"
}'
======================================
[1:19 PM]
=====================================
====================api to post spending ==================
postman request POST 'http://localhost:4000/api/opera/spending' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzA1NjEyLCJleHAiOjE3NzA3MzgwMTJ9.yWnRErhhNJCLNKG5BGN2F0NocaFlnjFP1VzHp2Qkwgo' \
  --header 'Content-Type: application/json' \
  --body '{
  "type": "Meta",
  "amount": 20000,
  "note": "October Campaign"
}'
======================================
[1:20 PM]
============================api to update spending =========

postman request PUT 'http://localhost:4000/api/opera/spending/69786b8583577f8cb47f51d6' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzY5NDkwNzkyLCJleHAiOjE3Njk1MjMxOTJ9.aJ0cfFPlLJ730PTIms_X_51Z9OYlJJ5Wo9CkniiasbY' \
  --header 'Content-Type: application/json' \
  --body '{
  "amount": 25000,
  "note": "Updated Budget"
}'



=============================================

Abhishek  [1:45 PM]
==================api for bulk uploadation===================
curl --location --request POST 'http://localhost:4000/api/pleads/bulk-upload' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \
--form 'file=@leads.xlsx'

=========================

[1:46 PM]
=================api to get property lead by id
curl --location 'http://localhost:4000/api/pleads/6989d486100e4499c4a68e1b' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'



============================

Abhishek  [2:02 PM]
=======bulk transfer of Property lead===================
curl --location --request PATCH 'http://localhost:4000/api/pleads/bulk-transfer' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
  "leadIds": [
    "6989d486100e4499c4a68e1b",
    "6989d486100e4499c4a68e1c"
  ],
  "transferToName": "Employee Property"
}'

=========================================

[2:03 PM]
=======bulk transfer of Property lead===================
curl --location --request PATCH 'http://localhost:4000/api/pleads/bulk-transfer' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--header 'Content-Type: application/json' \
--data '{
  "leadIds": [
    "6989d486100e4499c4a68e1b",
    "6989d486100e4499c4a68e1c"
  ],
  "transferToName": "Employee Property"
}'

=========================================

Abhishek  [3:20 PM]
=========== delete propertylead============
curl --location --request DELETE 'http://localhost:4000/api/pleads/6989d486100e4499c4a68e1b' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'
====================================
[3:21 PM]
================get lead history ==============
curl --location 'http://localhost:4000/api/pleads/6989d486100e4499c4a68e1b/history' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'
======================================
Abhishek  [3:38 PM]
==============bulk upload finance lead ======
curl --location --request POST 'http://localhost:4000/api/fleads/bulk-upload' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...kfxmXQgsMxBaFQ3x4Pk4OzOYX1AEkuG7JqbZFPAUYow' \
--form 'file=@"/path/to/file.xlsx"'
===========================================
[3:40 PM]
================finance dashboard api ==========
postman request 'http://localhost:4000/api/fleads/fdashboard' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzE4MTM3LCJleHAiOjE3NzA3NTA1Mzd9.cZ7RTCHTNVz8C7Klx7xq0BB2RuwIYKB5cFEr3oCfKbw'
{
    "success": true,
    "cards": {
        "loanApplications": {
            "value": 0,
            "change": -100
        },
        "activeDeals": {
            "value": 0,
            "change": 0
        },
        "loggedIn": {
            "value": 0,
            "change": 0
        },
        "pendingTasks": {
            "value": 0,
            "change": -100
        },
        "conversionRate": {
            "value": 0,
            "change": 0
        }
    },
    "performance": {
        "daily": [],
        "weekly": [],
        "monthly": [],
        "yearly": [
            {
                "_id": "2026",
                "leads": 7,
                "loggedIn": 0
            }
        ]
    },
    "sources": {
        "daily": [],
        "weekly": [],
        "monthly": [],
        "yearly": [
            {
                "_id": "Facebook",
                "count": 3
            },
            {
                "_id": "Google Ads",
                "count": 2
            },
            {
                "_id": "Website",
                "count": 1
            },
            {
                "_id": "Instagram",
                "count": 1
            }
        ]
    },
    "recentLeads": [
        {
            "_id": "6978a6303e764d4ac1e977a6",
            "clientName": "Suresh Kumar",
            "contactNumber": "9000000066",
            "email": "suresh@gmail.com",
            "loanRequirement": "Business Loan - 20 Lakh",
            "location": "Faridabad",
            "source": "Website",
            "status": "Follow up",
            "createdAt": "2026-01-27T17:19:04.007+05:30",
            "id": "6978a6303e764d4ac1e977a6"
        },
        {
            "_id": "6978a61b3e764d4ac1e97783",
            "clientName": "Neha Gupta",
            "contactNumber": "9000000077",
            "email": "neha@gmail.com",
            "loanRequirement": "Personal Loan - 5 Lakh",
            "location": "Ghaziabad",
            "source": "Instagram",
            "status": "Follow up",
            "createdAt": "2026-01-27T17:18:43.757+05:30",
            "id": "6978a61b3e764d4ac1e97783"
        },
        {
            "_id": "6978a60e3e764d4ac1e97777",
            "clientName": "Amit Verma",
            "contactNumber": "9000000088",
            "email": "amit@gmail.com",
            "loanRequirement": "Car Loan - 12 Lakh",
            "location": "Delhi",
            "source": "Google Ads",
            "status": "Follow up",
            "createdAt": "2026-01-27T17:18:30.506+05:30",
            "id": "6978a60e3e764d4ac1e97777"
        },
        {
            "_id": "6978a5fc3e764d4ac1e9776b",
            "clientName": "Amit Verma",
            "contactNumber": "9000000088",
            "email": "amit@gmail.com",
            "loanRequirement": "Car Loan - 12 Lakh",
            "location": "Delhi",
            "source": "Google Ads",
            "status": "Follow up",
            "createdAt": "2026-01-27T17:18:12.367+05:30",
            "id": "6978a5fc3e764d4ac1e9776b"
        },
        {
            "_id": "6978a5ed3e764d4ac1e97751",
            "clientName": "Rohit Sharma",
            "contactNumber": "9000000099",
            "email": "rohit@gmail.com",
            "loanRequirement": "Home Loan - 50 Lakh",
            "location": "Noida",
            "source": "Facebook",
            "status": "Follow up",
            "createdAt": "2026-01-27T17:17:57.830+05:30",
            "id": "6978a5ed3e764d4ac1e97751"
        },
        {
            "_id": "697321cd98d3663a4b06f0e6",
            "clientName": "Rohit Sharma",
            "contactNumber": "9000000099",
            "email": "rohit@gmail.com",
            "loanRequirement": "Home Loan - 50 Lakh",
            "location": "Noida",
            "source": "Facebook",
            "status": "Follow up",
            "createdAt": "2026-01-23T12:52:53.585+05:30",
            "id": "697321cd98d3663a4b06f0e6"
        },
        {
            "_id": "6973210998d3663a4b06f0db",
            "clientName": "Rohit Sharma",
            "contactNumber": "9000000099",
            "email": "rohit@gmail.com",
            "loanRequirement": "Home Loan - 50 Lakh",
            "location": "Noida",
            "source": "Facebook",
            "status": "Follow up",
            "createdAt": "2026-01-23T12:49:37.734+05:30",
            "id": "6973210998d3663a4b06f0db"
        }
    ]
}
=======================================
=======================================

[3:42 PM]
==============finance lead get api =========
postman request 'http://localhost:4000/api/fleads?page=1&limit=10' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzE4MTM3LCJleHAiOjE3NzA3NTA1Mzd9.cZ7RTCHTNVz8C7Klx7xq0BB2RuwIYKB5cFEr3oCfKbw'
{
    "success": true,
    "message": "Finance leads fetched",
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 8,
        "totalPages": 1
    },
    "data": [
        {
            "_id": "698b04386d93f3663f77a052",
            "clientName": "Test Finance Client",
            "contactNumber": "9000000022",
            "email": "testfinance@gmail.com",
            "reminderSent": false,
            "loanRequirement": "Personal Loan - 5 Lakh",
            "location": "Noida",
            "source": "Google",
            "followUpDate": "2026-02-25T00:00:00.000+05:30",
            "status": "Follow up",
            "notes": "Interested",
            "remarks": "Call tomorrow",
            "createdBy": {
                "_id": "6971bbd9df381f2923748844",
                "name": "Admin One",
                "email": "admin1@gmail.com",
                "phoneNumber": "9876543210",
                "role": "admin",
                "employeeId": "ADM001",
                "id": "6971bbd9df381f2923748844"
            },
            "teamLead": null,
            "relationshipManager": null,
            "transferTo": null,
            "transferDate": null,
            "createdAt": "2026-02-10T15:41:04.345+05:30",
            "updatedAt": "2026-02-10T15:41:04.345+05:30",
            "__v": 0,
            "id": "698b04386d93f3663f77a052"
        },
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
            "__v": 0,
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
            "__v": 0,
            "id": "6978a61b3e764d4ac1e97783"
        },
        {
            "_id": "6978a60e3e764d4ac1e97777",
            "clientName": "Amit Verma",
            "contactNumber": "9000000088",
            "email": "amit@gmail.com",
            "reminderSent": true,
            "loanRequirement": "Car Loan - 12 Lakh",
            "location": "Delhi",
            "project": "DLF Phase 3",
            "source": "Google Ads",
            "followUpDate": "2026-01-27T17:20:00.000+05:30",
            "status": "Follow up",
            "notes": "Needs quick approval",
            "remarks": "Call at 5:20",
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
            "transferDate": "2026-01-27T17:18:30.506+05:30",
            "createdAt": "2026-01-27T17:18:30.506+05:30",
            "updatedAt": "2026-01-27T17:19:00.519+05:30",
            "__v": 0,
            "id": "6978a60e3e764d4ac1e97777"
        },
        {
            "_id": "6978a5fc3e764d4ac1e9776b",
            "clientName": "Amit Verma",
            "contactNumber": "9000000088",
            "email": "amit@gmail.com",
            "reminderSent": true,
            "loanRequirement": "Car Loan - 12 Lakh",
            "location": "Delhi",
            "project": "DLF Phase 3",
            "source": "Google Ads",
            "followUpDate": "2026-01-27T17:20:00.000+05:30",
            "status": "Follow up",
            "notes": "Needs quick approval",
            "remarks": "Call at 5:20",
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
            "transferDate": "2026-01-27T17:18:12.366+05:30",
            "createdAt": "2026-01-27T17:18:12.367+05:30",
            "updatedAt": "2026-01-27T17:19:00.326+05:30",
            "__v": 0,
            "id": "6978a5fc3e764d4ac1e9776b"
        },

    ]
}
[3:45 PM]
========================update status of finance lead ===========

postman request PATCH 'http://localhost:4000/api/fleads/6978a6303e764d4ac1e977a6/status' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNzE4MTM3LCJleHAiOjE3NzA3NTA1Mzd9.cZ7RTCHTNVz8C7Klx7xq0BB2RuwIYKB5cFEr3oCfKbw' \
  --header 'Content-Type: application/json' \
  --body '{
  "status": "Interested"
}'
{
    "success": true,
    "message": "Status updated",
    "data": {
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
        "status": "Interested",
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
        "updatedAt": "2026-02-10T15:44:18.976+05:30",
        "__v": 0,
        "id": "6978a6303e764d4ac1e977a6"
    }
}
=================================


