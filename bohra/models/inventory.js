const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    /* =====================================================
       STEP 1 – CATEGORY & PROPERTY TYPE
    ===================================================== */
    category: {
      type: String, 
      enum: ["residential", "commercial"],
      index: true,
    },

    propertyType: {
      type: String,
      index: true,
      enum: [
        // Residential
        "flat_apartment",
        "builder_floor",
        "independent_house_villa",
        "plot_land_residential",
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
        "plot_land_commercial",
        "commercial_other",
      ],
    },

    /* =====================================================
       STEP 2 – BASIC DETAILS (OWNER INFORMATION)
    ===================================================== */
    basicDetails: {
      ownerName: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      ownerPhone: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      ownerAlternatePhone: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      ownerEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      ownerAddress: {
        type: String,
        trim: true,
        maxlength: 250,
      },
      /* CO-OWNER (OPTIONAL) */
      coOwnerName: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      coOwnerEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
      coOwnerPhone: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      /* AUTHORIZED REPRESENTATIVE */
      authorizedRepName: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      authorizedRepPhone: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      authorizedRepEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },

    /* =====================================================
       STEP 3 – LOCATION DETAILS
    ===================================================== */
    locationDetails: {
      city: {
        type: String,
        index: true,
        trim: true,
      },
      location: {
        type: String,
        trim: true,
      },
      subLocation: {
        type: String,
        trim: true,
      },
      societyOrApartment: {
        type: String,
        trim: true,
      },
      houseNumber: {
        type: String,
        trim: true,
      },
      pinCode: {
        type: String,
        trim: true,
      },
    },

    /* =====================================================
       STEP 4 – RESIDENTIAL SPECIFIC DETAILS
    ===================================================== */
    residentialType: {
      type: String,
      enum: [
        "Flat/Apartment",
        "Independent House / Villa",
        "Independent / Builder Floor",
        "Plot / Land",
        "1 RK / Studio Apartment",
        "Serviced Apartment",
        "Farmhouse",
        "Other"
      ],
    },

    /* =====================================================
       STEP 5 – ROOM DETAILS (RESIDENTIAL)
    ===================================================== */
    roomDetails: {
      bedrooms: {
        type: Number,
      },
      bathrooms: {
        type: Number,
      },
      balconies: {
        type: Number,
      },
    },

    /* =====================================================
       STEP 6 – AREA DETAILS (RESIDENTIAL & COMMERCIAL)
    ===================================================== */
    areaDetails: {
      carpetArea: {
        type: Number,
      },
      builtUpArea: {
        type: Number,
      },
      superBuiltUpArea: {
        type: Number,
      },
      plotArea: {
        type: Number,
      },
      plotLength: {
        type: Number,
      },
      plotBreadth: {
        type: Number,
      },
    },

    /* =====================================================
       STEP 7 – FLOOR DETAILS
    ===================================================== */
    floorDetails: {
      totalFloors: {
        type: Number,
      },
      propertyOnFloor: {
        type: Number,
      },
    },

    /* =====================================================
       STEP 8 – PLOT SPECIFIC DETAILS (RESIDENTIAL)
    ===================================================== */
    plotDetails: {
      floorsAllowed: {
        type: Number,
      },
      boundaryWall: {
        type: Boolean,
      },
      openSides: {
        type: Number,
      },
      constructionDone: {
        type: Boolean,
      },
      roadWidth: {
        type: Number,
      },
      possessionYear: {
        type: Number,
      },
      possessionMonth: {
        type: String,
      },
    },

    /* =====================================================
       STEP 9 – FURNISHING & FEATURES
    ===================================================== */
    furnishing: {
      type: String,
      enum: ["Furnished", "Semi-Furnished", "Un-Furnished"],
    },

    /* =====================================================
       STEP 10 – AVAILABILITY & STATUS
    ===================================================== */
    availabilityStatus: {
      type: String,
      enum: ["Ready to move", "Under construction"],
    },

    /* =====================================================
       STEP 11 – PROPERTY AGE (RESIDENTIAL)
    ===================================================== */
    propertyAge: {
      type: String,
      enum: ["0-1 years", "1-5 years", "5-10 years", "10+ years"],
    },

    /* =====================================================
       STEP 12 – OWNERSHIP
    ===================================================== */
    ownership: {
      type: String,
      enum: [
        "Freehold",
        "Leasehold",
        "Co-operative society",
        "Power of Attorney"
      ],
    },

    /* =====================================================
       STEP 13 – PRICE DETAILS
    ===================================================== */
    priceDetails: {
      expectedPrice: {
        type: Number,
        min: 0,
      },
      pricePerSqFt: {
        type: Number,
        min: 0,
      },
      allInclusivePrice: {
        type: Boolean,
        default: false,
      },
      taxExcluded: {
        type: Boolean,
        default: false,
      },
      priceNegotiable: {
        type: Boolean,
        default: false,
      },
    },

    /* =====================================================
       STEP 14 – MEDIA (IMAGES & VIDEOS)
    ===================================================== */
    media: {
      images: [
        {
          type: String,
          trim: true,
        }
      ],
      videos: [
        {
          type: String,
          trim: true,
        }
      ],
    },

    /* =====================================================
       STEP 15 – AMENITIES
    ===================================================== */
    amenities: [
      {
        type: String,
        trim: true,
      }
    ],

    /* =====================================================
       STEP 16 – COMMERCIAL-SPECIFIC META
    ===================================================== */
    commercialMeta: {
      /* OFFICE */
      officeType: {
        type: String,
        enum: ["ready_to_move", "bare_shell", "co_working"],
      },

      officeSetup: {
        minSeats: Number,
        maxSeats: Number,
        numberOfCabins: Number,
        meetingRooms: Number,
      },

      /* RETAIL */
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

      /* STORAGE */
      storageType: {
        type: String,
        enum: ["cold_storage", "warm_storage"],
      },

      /* INDUSTRY */
      industryType: {
        type: String,
        enum: ["factory", "manufacturing"],
      },

      /* HOSPITALITY */
      hospitalityType: {
        type: String,
        enum: ["hotel_resort", "guest_house", "banquet_hall"],
      },

      roomDetails: {
        totalRooms: Number,
      },

      furnishing: {
        type: String,
        enum: ["Furnished", "Semi-furnished", "Un-furnished"],
      },

      qualityRating: {
        type: Number,
        min: 0,
        max: 7,
      },

      /* COMMERCIAL AMENITIES */
      washrooms: Number,
      parking: Number,
      pantry: Boolean,
      receptionArea: Boolean,
      conferenceRoom: Boolean,
      powerBackup: Boolean,
      centralAirConditioning: Boolean,
      pantryType: {
        type: String,
        enum: ["Private", "Shared", "Not Available"],
      },

      dgUpsIncluded: Boolean,
      preLeased: Boolean,
    },

    /* =====================================================
       STEP 17 – OTHER TYPE DETAILS
    ===================================================== */
    otherDetails: {
      residentialPropertyTypeOther: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      commercialPropertyTypeOther: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      retailProjectTypeOther: {
        type: String,
        trim: true,
        maxlength: 100,
      },
    },

    /* =====================================================
       STEP 18 – OWNERSHIP DOCUMENTS
    ===================================================== */
    ownershipDocuments: {
      ownershipDocumentType: {
        type: String,
        enum: ["sale_deed", "lease_deed", "power_of_attorney", "registry", "other"],
      },
      ownershipDocumentNumber: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      ownershipDocumentDate: Date,
      documentVerified: {
        type: Boolean,
        default: false,
      },
    },

    /* =====================================================
       STEP 19 – PROPERTY DESCRIPTION & FEATURES
    ===================================================== */
    description: {
      propertyDescription: {
        type: String,
        trim: true,
        maxlength: 2000,
      },
      keyFeatures: [
        {
          type: String,
          trim: true,
          maxlength: 200,
        }
      ],
    },

    /* =====================================================
       STEP 20 – FINANCE & LOAN DETAILS
    ===================================================== */
    financeDetails: {
      loanAvailable: {
        type: Boolean,
        default: false,
      },
      loanAmountApproved: Number,
      loanTenure: Number, // in years
      loanRate: Number, // annual interest rate
      bankName: String,
      mortgageEligible: {
        type: Boolean,
        default: false,
      },
    },

    /* =====================================================
       STEP 21 – MANAGEMENT & TEAM TRACKING
    ===================================================== */
    managementInfo: {
      assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      assignedTeam: String,
      listingAgent: String,
      channelPartner: String,
    },

    /* =====================================================
       STEP 22 – ACTIVITY & STATUS TRACKING
    ===================================================== */
    activityTracking: {
      leadSource: {
        type: String,
        enum: ["direct", "portal", "agent", "referral", "walk_in", "other"],
      },
      enquiryDate: Date,
      lastFollowUp: Date,
      followUpRequired: Boolean,
      viewingScheduled: Date,
      viewingCompleted: Boolean,
      viewingFeedback: String,
    },

    /* =====================================================
       STEP 23 – LEGAL & COMPLIANCE
    ===================================================== */
    legal: {
      mutualAgreementSigned: Boolean,
      agreementDate: Date,
      agreementDocumentUrl: String,
      propertyTaxPaid: Boolean,
      waterBillPaid: Boolean,
      electricityBillPaid: Boolean,
      noc: Boolean, // No Objection Certificate
      nocDocumentUrl: String,
    },

    /* =====================================================
       STEP 24 – GENERAL REMARKS & STATUS
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
    
    internalNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "sold", "withdrawn", "pending"],
      default: "active",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private", "agents_only"],
      default: "public",
    },
  },
  { timestamps: true, strictPopulate: false }
);

/* =====================================================
   CROSS-FIELD VALIDATION (CRITICAL)
===================================================== */
inventorySchema.pre("validate", function (next) {
  /* CATEGORY SAFETY */
  if (this.category === "residential") {
    const commercialTypes = [
      "office",
      "retail",
      "storage",
      "industry",
      "hospitality",
      "commercial_other",
      "plot_land_commercial",
    ];
    if (commercialTypes.includes(this.propertyType)) {
      return next(new Error("Commercial propertyType not allowed in residential"));
    }
  }

  if (this.category === "commercial") {
    const residentialTypes = [
      "flat_apartment",
      "builder_floor",
      "independent_house_villa",
      "plot_land_residential",
      "studio_apartment",
      "serviced_apartment",
      "farmhouse",
      "residential_other",
    ];
    if (residentialTypes.includes(this.propertyType)) {
      return next(new Error("Residential propertyType not allowed in commercial"));
    }
  }

  /* REQUIRED BASIC DETAILS — removed; all fields are now optional */

  /* EMAIL VALIDATION */
  if (this.basicDetails?.ownerEmail && !this.isValidEmail(this.basicDetails.ownerEmail)) {
    return next(new Error("Invalid owner email format"));
  }
  if (this.basicDetails?.coOwnerEmail && !this.isValidEmail(this.basicDetails.coOwnerEmail)) {
    return next(new Error("Invalid co-owner email format"));
  }
  if (this.basicDetails?.authorizedRepEmail && !this.isValidEmail(this.basicDetails.authorizedRepEmail)) {
    return next(new Error("Invalid authorized representative email format"));
  }

  /* RESIDENTIAL SPECIFIC RULES — residentialType now optional */

  /* COMMERCIAL SPECIFIC RULES */
  if (this.category === "commercial") {
    /* RETAIL RULE */
    if (this.propertyType === "retail") {
      if (!this.commercialMeta?.retailUnitType) {
        return next(new Error("retailUnitType is required for retail"));
      }

      if (
        this.commercialMeta.retailUnitType === "showroom" &&
        !this.commercialMeta.retailProjectType
      ) {
        return next(new Error("retailProjectType is required for showroom"));
      }
    }

    /* STORAGE RULE */
    if (this.propertyType === "storage" && !this.commercialMeta?.storageType) {
      return next(new Error("storageType is required"));
    }

    /* INDUSTRY RULE */
    if (this.propertyType === "industry" && !this.commercialMeta?.industryType) {
      return next(new Error("industryType is required"));
    }

    /* HOSPITALITY RULE */
    if (this.propertyType === "hospitality" && !this.commercialMeta?.hospitalityType) {
      return next(new Error("hospitalityType is required"));
    }

    /* OFFICE RULE */
    if (this.propertyType === "office" && !this.commercialMeta?.officeType) {
      return next(new Error("officeType is required"));
    }
  }

  next();
});

/* EMAIL VALIDATION HELPER */
inventorySchema.methods.isValidEmail = function (email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = mongoose.model("Inventory", inventorySchema);


/* =====================================================
   COMPLETE FIELD REFERENCE & VALIDATION GUIDE
===================================================== */
/*
════════════════════════════════════════════════════════
1. CATEGORY & PROPERTY TYPE
════════════════════════════════════════════════════════
- category: "residential" | "commercial" (required)
- propertyType: (required)
  RESIDENTIAL: flat_apartment, builder_floor, independent_house_villa, 
               plot_land_residential, studio_apartment, serviced_apartment, 
               farmhouse, residential_other
  COMMERCIAL: office, retail, storage, industry, hospitality, 
              plot_land_commercial, commercial_other

════════════════════════════════════════════════════════
2. BASIC DETAILS (OWNER INFORMATION)
════════════════════════════════════════════════════════
PRIMARY OWNER (Required):
  - ownerName (string, max 100 chars)
  - ownerPhone (string, max 20 chars, required)
  - ownerAlternatePhone (string, max 20 chars)
  - ownerEmail (string, valid email required)
  - ownerAddress (string, max 250 chars)

CO-OWNER (Optional):
  - coOwnerName (string, max 100 chars)
  - coOwnerEmail (string, valid email)
  - coOwnerPhone (string, max 20 chars)

AUTHORIZED REPRESENTATIVE (Optional):
  - authorizedRepName (string, max 100 chars)
  - authorizedRepPhone (string, max 20 chars)
  - authorizedRepEmail (string, valid email)

════════════════════════════════════════════════════════
3. LOCATION DETAILS
════════════════════════════════════════════════════════
- city (string, required, indexed)
- location (string, required)
- subLocation (string)
- societyOrApartment (string)
- houseNumber (string)
- pinCode (string)

════════════════════════════════════════════════════════
4. RESIDENTIAL SPECIFIC DETAILS
════════════════════════════════════════════════════════
- residentialType (enum):
  "Flat/Apartment", "Independent House / Villa", 
  "Independent / Builder Floor", "Plot / Land", 
  "1 RK / Studio Apartment", "Serviced Apartment", 
  "Farmhouse", "Other"

════════════════════════════════════════════════════════
5. ROOM DETAILS (RESIDENTIAL)
════════════════════════════════════════════════════════
- bedrooms (number)
- bathrooms (number)
- balconies (number)

════════════════════════════════════════════════════════
6. AREA DETAILS
════════════════════════════════════════════════════════
- carpetArea (number, in sq ft)
- builtUpArea (number, in sq ft)
- superBuiltUpArea (number, in sq ft)
- plotArea (number, in sq ft)
- plotLength (number)
- plotBreadth (number)

════════════════════════════════════════════════════════
7. FLOOR DETAILS
════════════════════════════════════════════════════════
- totalFloors (number)
- propertyOnFloor (number)

════════════════════════════════════════════════════════
8. PLOT SPECIFIC DETAILS (RESIDENTIAL)
════════════════════════════════════════════════════════
- floorsAllowed (number)
- boundaryWall (boolean)
- openSides (number)
- constructionDone (boolean)
- roadWidth (number)
- possessionYear (number)
- possessionMonth (string)

════════════════════════════════════════════════════════
9. FURNISHING & FEATURES
════════════════════════════════════════════════════════
- furnishing (enum):
  "Furnished", "Semi-Furnished", "Un-Furnished"

════════════════════════════════════════════════════════
10. AVAILABILITY & STATUS
════════════════════════════════════════════════════════
- availabilityStatus (enum):
  "Ready to move", "Under construction"

════════════════════════════════════════════════════════
11. PROPERTY AGE (RESIDENTIAL)
════════════════════════════════════════════════════════
- propertyAge (enum):
  "0-1 years", "1-5 years", "5-10 years", "10+ years"

════════════════════════════════════════════════════════
12. OWNERSHIP
════════════════════════════════════════════════════════
- ownership (enum):
  "Freehold", "Leasehold", "Co-operative society", "Power of Attorney"

════════════════════════════════════════════════════════
13. PRICE DETAILS
════════════════════════════════════════════════════════
- expectedPrice (number, required, min 0)
- pricePerSqFt (number, min 0)
- allInclusivePrice (boolean, default false)
- taxExcluded (boolean, default false)
- priceNegotiable (boolean, default false)

════════════════════════════════════════════════════════
14. MEDIA (IMAGES & VIDEOS)
════════════════════════════════════════════════════════
- images (array of strings - URLs)
- videos (array of strings - URLs)

════════════════════════════════════════════════════════
15. AMENITIES
════════════════════════════════════════════════════════
- amenities (array of strings)
  Examples: "Swimming Pool", "Gym", "Garden", "Parking", etc.

════════════════════════════════════════════════════════
16. COMMERCIAL-SPECIFIC META
════════════════════════════════════════════════════════
OFFICE:
  - officeType: "ready_to_move" | "bare_shell" | "co_working"
  - officeSetup:
    * minSeats (number)
    * maxSeats (number)
    * numberOfCabins (number)
    * meetingRooms (number)

RETAIL:
  - retailUnitType: "shop" | "showroom"
  - retailProjectType: 
    "mall" | "commercial_project" | "residential_project" | 
    "retail_complex_building" | "market_high_street" | "other"

STORAGE:
  - storageType: "cold_storage" | "warm_storage"

INDUSTRY:
  - industryType: "factory" | "manufacturing"

HOSPITALITY:
  - hospitalityType: "hotel_resort" | "guest_house" | "banquet_hall"
  - roomDetails:
    * totalRooms (number)
  - furnishing: "Furnished" | "Semi-furnished" | "Un-furnished"
  - qualityRating (number, 0-7)

COMMERCIAL AMENITIES (All Types):
  - washrooms (number)
  - parking (number)
  - pantry (boolean)
  - receptionArea (boolean)
  - conferenceRoom (boolean)
  - powerBackup (boolean)
  - centralAirConditioning (boolean)
  - pantryType: "Private" | "Shared" | "Not Available"
  - dgUpsIncluded (boolean)
  - preLeased (boolean)

════════════════════════════════════════════════════════
17. OTHER TYPE DETAILS
════════════════════════════════════════════════════════
- residentialPropertyTypeOther (string for "residential_other")
- commercialPropertyTypeOther (string for "commercial_other")
- retailProjectTypeOther (string for "other" retailProjectType)

════════════════════════════════════════════════════════
18. OWNERSHIP DOCUMENTS
════════════════════════════════════════════════════════
- ownershipDocumentType: "sale_deed" | "lease_deed" | "power_of_attorney" | "registry" | "other"
- ownershipDocumentNumber (string)
- ownershipDocumentDate (date)
- documentVerified (boolean, default false)

════════════════════════════════════════════════════════
19. PROPERTY DESCRIPTION & FEATURES
════════════════════════════════════════════════════════
- propertyDescription (string, max 2000 chars)
- keyFeatures (array of strings, max 200 chars each)

════════════════════════════════════════════════════════
20. FINANCE & LOAN DETAILS
════════════════════════════════════════════════════════
- loanAvailable (boolean, default false)
- loanAmountApproved (number)
- loanTenure (number, in years)
- loanRate (number, annual interest rate %)
- bankName (string)
- mortgageEligible (boolean, default false)

════════════════════════════════════════════════════════
21. MANAGEMENT & TEAM TRACKING
════════════════════════════════════════════════════════
- assignedAgent (ObjectId, ref to User)
- assignedTeam (string)
- listingAgent (string)
- channelPartner (string)

════════════════════════════════════════════════════════
22. ACTIVITY & STATUS TRACKING
════════════════════════════════════════════════════════
- leadSource: "direct" | "portal" | "agent" | "referral" | "walk_in" | "other"
- enquiryDate (date)
- lastFollowUp (date)
- followUpRequired (boolean)
- viewingScheduled (date)
- viewingCompleted (boolean)
- viewingFeedback (string)

════════════════════════════════════════════════════════
23. LEGAL & COMPLIANCE
════════════════════════════════════════════════════════
- mutualAgreementSigned (boolean)
- agreementDate (date)
- agreementDocumentUrl (string)
- propertyTaxPaid (boolean)
- waterBillPaid (boolean)
- electricityBillPaid (boolean)
- noc (boolean - No Objection Certificate)
- nocDocumentUrl (string)

════════════════════════════════════════════════════════
24. GENERAL REMARKS & STATUS
════════════════════════════════════════════════════════
- remarks (string, max 500 chars)
- notes (string, max 2000 chars)
- internalNotes (string, max 1000 chars)
- status: "active" | "inactive" | "sold" | "withdrawn" | "pending" (default: "active")
- visibility: "public" | "private" | "agents_only" (default: "public")

════════════════════════════════════════════════════════
AUTO FIELDS (System Generated)
════════════════════════════════════════════════════════
- createdAt (timestamp)
- updatedAt (timestamp)
- _id (ObjectId)
*/




