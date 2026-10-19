Inventory Module – Frontend Integration Guide

This document explains how to integrate the Inventory module with the frontend application.
It is aligned with backend MongoDB schema, validations, controllers, and bulk upload logic.

1. Base API Information

Base URL

/api/inventory

Authentication

All APIs require JWT authentication

Headers

Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
2. Inventory Creation – Form Flow
Step 1: Category (Required)

Allowed values:

residential
commercial

Frontend rule:

Category decides valid propertyType

Must be selected before proceeding

Step 2: Property Type (Required)
Residential Property Types
flat_apartment
builder_floor
independent_house_villa
plot_land
studio_apartment
serviced_apartment
farmhouse
residential_other
Commercial Property Types
office
retail
storage
industry
hospitality
commercial_other
Step 2A: “Other” Fields (Conditional)

Show text input only when selected.

Condition	Required Field
propertyType = residential_other	otherDetails.residentialPropertyTypeOther
propertyType = commercial_other	otherDetails.commercialPropertyTypeOther
retailProjectType = other	otherDetails.retailProjectTypeOther

Example:

{
  "otherDetails": {
    "residentialPropertyTypeOther": "Row House"
  }
}
3. Commercial Meta (Only for Commercial Category)

Render only if category = commercial.

{
  "commercialMeta": {
    "officeType": "ready_to_move | bare_shell | co_working",
    "retailUnitType": "shop | showroom",
    "retailProjectType": "mall | commercial_project | residential_project | retail_complex_building | market_high_street | other"
  }
}

If retailProjectType = other, then:

{
  "otherDetails": {
    "retailProjectTypeOther": "Airport Retail"
  }
}
4. Location (Mandatory)
{
  "location": {
    "city": "Gurgaon",
    "area": "Sector 56",
    "subArea": "Golf Course Road",
    "apartmentSociety": "DLF Park Place",
    "houseNumber": "A-1203",
    "pinCode": "122002"
  }
}

Rules:

city is mandatory

On update: if location is sent, city must be present

5. Property Profile (Dynamic)

Send only applicable fields based on property type.

Common Residential Fields
{
  "propertyProfile": {
    "bedrooms": 3,
    "bathrooms": 2,
    "balconies": 2,
    "furnishing": "furnished",
    "availabilityStatus": "ready_to_move",
    "ageOfProperty": "1-5"
  }
}
Area Details
{
  "propertyProfile": {
    "carpetArea": 1200,
    "builtUpArea": 1450,
    "superBuiltUpArea": 1600
  }
}
Commercial Extras
{
  "propertyProfile": {
    "washrooms": 2,
    "parking": 3,
    "pantry": true,
    "receptionArea": true,
    "conferenceRoom": false,
    "powerBackup": true
  }
}
6. Pricing
{
  "propertyProfile": {
    "expectedPrice": 15000000,
    "pricePerSqFt": 12500,
    "pricingFlags": {
      "allInclusivePrice": true,
      "taxAndGovtChargesExcluded": false,
      "priceNegotiable": true
    }
  }
}
7. Remarks & Notes
{
  "remarks": "Near metro station",
  "notes": "Owner prefers corporate tenant"
}
8. Status
active
inactive

Default value: active

9. Create Inventory

POST

/api/inventory

Example payload:

{
  "category": "residential",
  "propertyType": "flat_apartment",
  "location": {
    "city": "Gurgaon",
    "area": "Sector 56"
  },
  "propertyProfile": {
    "bedrooms": 3,
    "bathrooms": 2,
    "expectedPrice": 15000000
  }
}
10. Update Inventory

PUT / PATCH

/api/inventory/:id

Rules:

Partial updates supported

Validators run

If updating location, location.city is required

11. Get Inventory List

GET

/api/inventory

Query parameters:

page
limit
category
propertyType
city
status

Example:

/api/inventory?category=residential&city=Gurgaon&page=1&limit=10
12. Get Single Inventory

GET

/api/inventory/:id
13. Delete Inventory

DELETE

/api/inventory/:id
14. Bulk Upload Inventory

POST

/api/inventory/bulk-upload

Form-data:

file: inventory.csv | inventory.xlsx
Required Columns
category
propertyType
city
Optional Columns
area
officeType
retailUnitType
retailProjectType
residentialPropertyTypeOther
commercialPropertyTypeOther
retailProjectTypeOther
bedrooms
bathrooms
expectedPrice
pricePerSqFt
allInclusivePrice
taxAndGovtChargesExcluded
priceNegotiable
status
Response Example
{
  "summary": {
    "totalRows": 20,
    "inserted": 18,
    "failed": 2
  },
  "errors": [
    { "row": 4, "error": "city is required" }
  ]
}
15. Frontend Validation Checklist

Category ↔ PropertyType mapping enforced

“Other” field required when selected

Commercial fields only for commercial category

City always mandatory

Do not send empty objects

Remove empty otherDetails, commercialMeta, propertyProfile

16. Recommended Frontend Structure
InventoryForm/
 ├── StepCategory
 ├── StepPropertyType
 ├── StepCommercialMeta
 ├── StepLocation
 ├── StepPropertyProfile
 ├── StepPricing
 └── StepReviewSubmit



 <!-- inventry modle  -->

 const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    /* =====================================================
       STEP 1 – CATEGORY
    ===================================================== */
    category: {
      type: String,
      enum: ["residential", "commercial"],
      required: true,
      index: true,
    },

    /* =====================================================
       STEP 2 – PROPERTY TYPE
    ===================================================== */
    propertyType: {
      type: String,
      required: true,
      index: true,
      enum: [
        // Residential
        "flat_apartment",
        "builder_floor",
        "independent_house_villa",
        "plot_land",
        "studio_apartment",
        "serviced_apartment",
        "farmhouse",
        "residential_other",

        // Commercial
        "office",
        "retail",
        "storage",
        "industry",
        "hospitality",
        "commercial_other",
      ],
    },

    /* =====================================================
       STEP 2A – OTHER VALUES
    ===================================================== */
    otherDetails: {
      residentialPropertyTypeOther: {
        type: String,
        trim: true,
        maxlength: 100,
        required: function () {
          return this.propertyType === "residential_other";
        },
      },

      commercialPropertyTypeOther: {
        type: String,
        trim: true,
        maxlength: 100,
        required: function () {
          return this.propertyType === "commercial_other";
        },
      },

      retailProjectTypeOther: {
        type: String,
        trim: true,
        maxlength: 100,
        required: function () {
          return (
            this.propertyType === "retail" &&
            this.commercialMeta?.retailProjectType === "other"
          );
        },
      },
    },

    /* =====================================================
       STEP 3 – COMMERCIAL META
    ===================================================== */
    commercialMeta: {
      officeType: {
        type: String,
        enum: ["ready_to_move", "bare_shell", "co_working"],
      },

      retailUnitType: {
        type: String,
        enum: ["shop", "showroom"],
      },

      retailProjectType: {
        type: String,
        enum: [
          "mall",
          "commercial_project",
          "residential_project",
          "retail_complex_building",
          "market_high_street",
          "other",
        ],
      },
    },

    /* =====================================================
       STEP 4 – LOCATION DETAILS
    ===================================================== */
    location: {
      city: { type: String, required: true, index: true },
      area: { type: String },
      subArea: { type: String },
      apartmentSociety: { type: String },
      houseNumber: { type: String },
      pinCode: { type: String },
    },

    /* =====================================================
       STEP 5 – PROPERTY PROFILE
    ===================================================== */
    propertyProfile: {
      bedrooms: Number,
      bathrooms: Number,
      balconies: Number,

      builderFloorType: {
        type: String,
        enum: ["single_floor", "duplex", "triplex"],
      },

      carpetArea: Number,
      builtUpArea: Number,
      superBuiltUpArea: Number,

      plotArea: Number,
      plotLength: Number,
      plotBreadth: Number,

      totalFloors: Number,
      propertyOnFloor: Number,

      furnishing: {
        type: String,
        enum: ["furnished", "semi_furnished", "unfurnished"],
      },

      availabilityStatus: {
        type: String,
        enum: ["ready_to_move", "under_construction"],
      },

      possessionYear: Number,
      possessionMonth: String,

      ageOfProperty: {
        type: String,
        enum: ["0-1", "1-5", "5-10", "10+"],
      },

      boundaryWall: Boolean,
      openSides: Number,
      constructionDone: Boolean,
      roadWidth: Number,

      ownership: {
        type: String,
        enum: [
          "freehold",
          "leasehold",
          "cooperative_society",
          "power_of_attorney",
        ],
      },

      washrooms: Number,
      parking: Number,
      pantry: Boolean,
      receptionArea: Boolean,
      conferenceRoom: Boolean,
      powerBackup: Boolean,

      expectedPrice: { type: Number, min: 0 },
      pricePerSqFt: { type: Number, min: 0 },

      pricingFlags: {
        allInclusivePrice: { type: Boolean, default: false },
        taxAndGovtChargesExcluded: { type: Boolean, default: false },
        priceNegotiable: { type: Boolean, default: false },
      },
    },

    /* =====================================================
       REMARKS & NOTES (COMMON)
    ===================================================== */
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    /* =====================================================
       STATUS
    ===================================================== */
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

/* =====================================================
   CATEGORY-BASED VALIDATION (SAFETY)
===================================================== */
inventorySchema.pre("validate", function (next) {
  if (this.category === "residential") {
    const commercialTypes = [
      "office",
      "retail",
      "storage",
      "industry",
      "hospitality",
      "commercial_other",
    ];
    if (commercialTypes.includes(this.propertyType)) {
      return next(
        new Error(
          "Commercial propertyType not allowed in residential category"
        )
      );
    }
  }

  if (this.category === "commercial") {
    const residentialTypes = [
      "flat_apartment",
      "builder_floor",
      "independent_house_villa",
      "plot_land",
      "studio_apartment",
      "serviced_apartment",
      "farmhouse",
      "residential_other",
    ];
    if (residentialTypes.includes(this.propertyType)) {
      return next(
        new Error(
          "Residential propertyType not allowed in commercial category"
        )
      );
    }
  }

  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);
