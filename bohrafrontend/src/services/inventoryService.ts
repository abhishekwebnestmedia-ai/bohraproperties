import api from './api';

// ─── Category & Property Type ──────────────────────────────────────────────

export type InventoryCategory = 'residential' | 'commercial';

export type ResidentialPropertyType =
  | 'flat_apartment'
  | 'builder_floor'
  | 'independent_house_villa'
  | 'plot_land_residential'
  | 'studio_apartment'
  | 'serviced_apartment'
  | 'farmhouse'
  | 'residential_other';

export type CommercialPropertyType =
  | 'office'
  | 'retail'
  | 'storage'
  | 'industry'
  | 'hospitality'
  | 'plot_land_commercial'
  | 'commercial_other';

export type InventoryPropertyType = ResidentialPropertyType | CommercialPropertyType;

/** Residential sub-type labels (stored verbatim in DB residentialType field) */
export type ResidentialType =
  | 'Flat/Apartment'
  | 'Independent House / Villa'
  | 'Independent / Builder Floor'
  | 'Plot / Land'
  | '1 RK / Studio Apartment'
  | 'Serviced Apartment'
  | 'Farmhouse'
  | 'Other';

export type OfficeType = 'ready_to_move' | 'bare_shell' | 'co_working';
export type RetailUnitType = 'shop' | 'showroom';
export type RetailProjectType = 'mall' | 'commercial_project' | 'residential_project' | 'retail_complex_building' | 'market_high_street' | 'other';
export type StorageType = 'cold_storage' | 'warm_storage';
export type IndustryType = 'factory' | 'manufacturing';
export type HospitalityType = 'hotel_resort' | 'guest_house' | 'banquet_hall';

/** Top-level enum values — must match backend schema enum strings exactly */
export type FurnishingType = 'Furnished' | 'Semi-Furnished' | 'Un-Furnished';
export type AvailabilityStatus = 'Ready to move' | 'Under construction';
export type AgeOfProperty = '0-1 years' | '1-5 years' | '5-10 years' | '10+ years';
export type OwnershipType = 'Freehold' | 'Leasehold' | 'Co-operative society' | 'Power of Attorney';
export type OwnershipDocumentType = 'sale_deed' | 'lease_deed' | 'power_of_attorney' | 'registry' | 'other';
export type LeadSource = 'direct' | 'portal' | 'agent' | 'referral' | 'walk_in' | 'other';
export type CommercialFurnishingType = 'Furnished' | 'Semi-furnished' | 'Un-furnished';
export type PantryType = 'Private' | 'Shared' | 'Not Available';
export type VisibilityType = 'public' | 'private' | 'agents_only';
export type InventoryStatus = 'active' | 'inactive' | 'sold' | 'withdrawn' | 'pending';

// ─── Nested Interfaces ────────────────────────────────────────────────────────

export interface BasicDetails {
  ownerName?: string;
  ownerPhone?: string;
  ownerAlternatePhone?: string;
  ownerEmail?: string;
  ownerAddress?: string;
  coOwnerName?: string;
  coOwnerEmail?: string;
  coOwnerPhone?: string;
  authorizedRepName?: string;
  authorizedRepPhone?: string;
  authorizedRepEmail?: string;
}

export interface LocationDetails {
  city?: string;
  location?: string;
  subLocation?: string;
  societyOrApartment?: string;
  houseNumber?: string;
  pinCode?: string;
}

export interface RoomDetails {
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
}

export interface AreaDetails {
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  plotArea?: number;
  plotLength?: number;
  plotBreadth?: number;
}

export interface FloorDetails {
  totalFloors?: number;
  propertyOnFloor?: number;
}

export interface PlotDetails {
  floorsAllowed?: number;
  boundaryWall?: boolean;
  openSides?: number;
  constructionDone?: boolean;
  roadWidth?: number;
  possessionYear?: number;
  possessionMonth?: string;
}

export interface PriceDetails {
  expectedPrice?: number;
  pricePerSqFt?: number;
  allInclusivePrice?: boolean;
  taxExcluded?: boolean;
  priceNegotiable?: boolean;
}

export interface OfficeSetup {
  minSeats?: number;
  maxSeats?: number;
  numberOfCabins?: number;
  meetingRooms?: number;
}

export interface CommercialMeta {
  officeType?: OfficeType;
  officeSetup?: OfficeSetup;
  retailUnitType?: RetailUnitType;
  retailProjectType?: RetailProjectType;
  storageType?: StorageType;
  industryType?: IndustryType;
  hospitalityType?: HospitalityType;
  roomDetails?: { totalRooms?: number };
  furnishing?: CommercialFurnishingType;
  qualityRating?: number;
  washrooms?: number;
  parking?: number;
  pantry?: boolean;
  receptionArea?: boolean;
  conferenceRoom?: boolean;
  powerBackup?: boolean;
  centralAirConditioning?: boolean;
  pantryType?: PantryType;
  dgUpsIncluded?: boolean;
  preLeased?: boolean;
}

export interface OtherDetails {
  residentialPropertyTypeOther?: string;
  commercialPropertyTypeOther?: string;
  retailProjectTypeOther?: string;
}

export interface OwnershipDocuments {
  ownershipDocumentType?: OwnershipDocumentType;
  ownershipDocumentNumber?: string;
  ownershipDocumentDate?: string;
  documentVerified?: boolean;
}

export interface PropertyDescription {
  propertyDescription?: string;
  keyFeatures?: string[];
}

export interface FinanceDetails {
  loanAvailable?: boolean;
  loanAmountApproved?: number;
  loanTenure?: number;
  loanRate?: number;
  bankName?: string;
  mortgageEligible?: boolean;
}

export interface ManagementInfo {
  assignedTeam?: string;
  listingAgent?: string;
  channelPartner?: string;
}

export interface ActivityTracking {
  leadSource?: LeadSource;
  enquiryDate?: string;
  lastFollowUp?: string;
  followUpRequired?: boolean;
  viewingScheduled?: string;
  viewingCompleted?: boolean;
  viewingFeedback?: string;
}

export interface Legal {
  mutualAgreementSigned?: boolean;
  agreementDate?: string;
  agreementDocumentUrl?: string;
  propertyTaxPaid?: boolean;
  waterBillPaid?: boolean;
  electricityBillPaid?: boolean;
  noc?: boolean;
  nocDocumentUrl?: string;
}

// ─── Create / Update Payloads ─────────────────────────────────────────────────

export interface CreateInventoryData {
  // Core
  category?: InventoryCategory;
  propertyType?: InventoryPropertyType;
  residentialType?: ResidentialType;
  // Owner  
  basicDetails?: BasicDetails;
  // Location
  locationDetails?: LocationDetails;
  // Property details
  roomDetails?: RoomDetails;
  areaDetails?: AreaDetails;
  floorDetails?: FloorDetails;
  plotDetails?: PlotDetails;
  // Top-level status
  furnishing?: FurnishingType;
  availabilityStatus?: AvailabilityStatus;
  propertyAge?: AgeOfProperty;
  ownership?: OwnershipType;
  // Price
  priceDetails?: PriceDetails;
  amenities?: string[];
  // Commercial
  commercialMeta?: CommercialMeta;
  otherDetails?: OtherDetails;
  // Documents
  ownershipDocuments?: OwnershipDocuments;
  // Content
  description?: PropertyDescription;
  financeDetails?: FinanceDetails;
  // Management
  managementInfo?: ManagementInfo;
  activityTracking?: ActivityTracking;
  legal?: Legal;
  // General
  notes?: string;
  internalNotes?: string;
  remarks?: string;
  status?: InventoryStatus;
  visibility?: VisibilityType;
}

export type UpdateInventoryData = Partial<CreateInventoryData>;

// ─── Response Types ───────────────────────────────────────────────────────────

export interface InventoryItem {
  _id: string;
  category?: InventoryCategory;
  propertyType?: InventoryPropertyType;
  residentialType?: string;
  sellerName?: string;
  contactNumbers?: string[];
  email?: string;
  status?: string;
  location?: { city?: string; area?: string };
  locationDetails?: LocationDetails;
  basicDetails?: BasicDetails;
  propertyProfile?: Record<string, any>;
  priceDetails?: PriceDetails;
  commercialMeta?: CommercialMeta;
  otherDetails?: OtherDetails;
  notes?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface InventoryResponse {
  success: boolean;
  meta: { total: number; page: number; limit: number; totalPages: number };
  data: InventoryItem[];
}

export interface GetInventoryParams {
  page?: number;
  limit?: number;
  category?: InventoryCategory;
  propertyType?: string;
  city?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ─── Service ──────────────────────────────────────────────────────────────────

class InventoryService {
  async getAll(params?: GetInventoryParams): Promise<InventoryResponse> {
    const response = await api.get('/inventory', { params });
    return response.data;
  }

  async getById(id: string): Promise<{ success: boolean; data: InventoryItem }> {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  }

  async create(data: CreateInventoryData): Promise<{ success: boolean; message: string; data: InventoryItem }> {
    const response = await api.post('/inventory', data);
    return response.data;
  }

  async update(id: string, data: UpdateInventoryData): Promise<{ success: boolean; message: string; data: InventoryItem }> {
    const response = await api.patch(`/inventory/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  }

  async getHistory(id: string): Promise<{ success: boolean; message: string; data: any[] }> {
    const response = await api.get(`/inventory/${id}/history`);
    return response.data;
  }

  async bulkUpload(file: File): Promise<{ summary: { totalRows: number; inserted: number; failed: number }; errors: { row: number; error: string }[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/inventory/bulk-upload', formData);
    return response.data;
  }

  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await api.delete('/inventory/bulk-delete', { data: { ids } });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
