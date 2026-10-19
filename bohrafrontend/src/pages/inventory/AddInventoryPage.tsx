import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DropdownSelect from '../../components/common/DropdownSelect';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  Home,
  User,
  LayoutDashboard,
  Briefcase,
  Store,
  Warehouse,
  Factory,
  MoreHorizontal,
  UtensilsCrossed,
  Map,
  Layers,
  House,
  BedSingle,
  TreePine,
  Hotel,
  Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCreateInventory } from '../../hooks/useInventory';
import BulkUploadButton from '../../components/common/BulkUploadButton';
import type {
  InventoryCategory,
  ResidentialPropertyType,
  CommercialPropertyType,
  InventoryPropertyType,
  BasicDetails,
  LocationDetails,
  AreaDetails,
  FloorDetails,
  PlotDetails,
  PriceDetails,
  CommercialMeta,
  OtherDetails,
  CommercialFurnishingType,
  PantryType,
  AvailabilityStatus,
  OwnershipType,
  CreateInventoryData,
  InventoryStatus,
  StorageType,
  IndustryType,
  HospitalityType,
  RetailUnitType,
  RetailProjectType,
  FurnishingType,
  AgeOfProperty,
  OfficeType,
  ResidentialType,
} from '../../services/inventoryService';

type BuilderFloorType = 'single_floor' | 'duplex' | 'triplex';

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { key: 'basicDetails',    label: 'Basic Details',    Icon: Home },
  { key: 'ownerLocation',   label: 'Details',          Icon: User },
  { key: 'propertyProfile', label: 'Property Profile', Icon: LayoutDashboard },
];

// ─── Option lists ────────────────────────────────────────────────────────────

const RESIDENTIAL_TYPES: { value: ResidentialPropertyType; label: string; Icon: LucideIcon; desc: string }[] = [
  { value: 'flat_apartment',           label: 'Flat / Apartment',          Icon: Building2,      desc: 'Multi-storey residential unit' },
  { value: 'builder_floor',            label: 'Builder Floor',             Icon: Layers,         desc: 'Entire floor of a builder house' },
  { value: 'independent_house_villa',  label: 'Independent House / Villa', Icon: House,          desc: 'Stand-alone house or luxury villa' },
  { value: 'plot_land_residential',    label: 'Plot / Land',               Icon: Map,            desc: 'Residential plot or open land' },
  { value: 'studio_apartment',         label: 'Studio Apartment',          Icon: BedSingle,      desc: 'Compact open-plan apartment' },
  { value: 'serviced_apartment',       label: 'Serviced Apartment',        Icon: Hotel,          desc: 'Fully serviced residential apartment' },
  { value: 'farmhouse',                label: 'Farmhouse',                 Icon: TreePine,       desc: 'Rural or semi-urban farm property' },
  { value: 'residential_other',        label: 'Other',                     Icon: MoreHorizontal, desc: 'Any other residential type' },
];

const COMMERCIAL_TYPES: { value: CommercialPropertyType; label: string; Icon: LucideIcon; desc: string }[] = [
  { value: 'office',              label: 'Office',       Icon: Briefcase,      desc: 'Corporate or co-working office space' },
  { value: 'retail',             label: 'Retail',       Icon: Store,          desc: 'Shop or showroom unit' },
  { value: 'plot_land_commercial', label: 'Plot / Land', Icon: Map,            desc: 'Commercial plot or open land' },
  { value: 'storage',            label: 'Storage',      Icon: Warehouse,      desc: 'Warehouse or cold storage' },
  { value: 'industry',           label: 'Industry',     Icon: Factory,        desc: 'Factory or manufacturing unit' },
  { value: 'hospitality',        label: 'Hospitality',  Icon: UtensilsCrossed, desc: 'Hotel, resort or guest house' },
  { value: 'commercial_other',   label: 'Other',        Icon: MoreHorizontal, desc: 'Any other commercial type' },
];

const RETAIL_UNIT_OPTIONS: { value: RetailUnitType; label: string }[] = [
  { value: 'shop',     label: 'Commercial Shops' },
  { value: 'showroom', label: 'Commercial Showrooms' },
];

const RETAIL_LOCATION_OPTIONS: { value: RetailProjectType; label: string }[] = [
  { value: 'mall',                    label: 'Mall' },
  { value: 'commercial_project',      label: 'Commercial Project' },
  { value: 'residential_project',     label: 'Residential Project' },
  { value: 'retail_complex_building', label: 'Retail Complex / Building' },
  { value: 'market_high_street',      label: 'Market / High Street' },
  { value: 'other',                   label: 'Others' },
];

const STORAGE_TYPE_OPTIONS: { value: StorageType; label: string }[] = [
  { value: 'warm_storage', label: 'Ware House' },
  { value: 'cold_storage', label: 'Cold Storage' },
];

const INDUSTRY_TYPE_OPTIONS: { value: IndustryType; label: string }[] = [
  { value: 'factory',       label: 'Factory' },
  { value: 'manufacturing', label: 'Manufacturing' },
];

const HOSPITALITY_TYPE_OPTIONS: { value: HospitalityType; label: string }[] = [
  { value: 'hotel_resort', label: 'Hotel / Resorts' },
  { value: 'guest_house',  label: 'Guest-House / Banquet-Halls' },
];

const PLOT_LAND_TYPE_OPTIONS = [
  { value: 'commercial_land',   label: 'Commercial Land / Inst. Land' },
  { value: 'agricultural_land', label: 'Agricultural / Farm Land' },
  { value: 'industrial_plots',  label: 'Industrial Lands / Plots' },
];

const OWNERSHIP_OPTIONS: { value: OwnershipType; label: string }[] = [
  { value: 'Freehold',             label: 'Freehold' },
  { value: 'Leasehold',            label: 'Leasehold' },
  { value: 'Co-operative society', label: 'Co-operative society' },
  { value: 'Power of Attorney',    label: 'Power of Attorney' },
];

const FURNISHING_OPTIONS: { value: CommercialFurnishingType; label: string }[] = [
  { value: 'Furnished',      label: 'Furnished' },
  { value: 'Semi-furnished', label: 'Semi-furnished' },
  { value: 'Un-furnished',   label: 'Un-furnished' },
];

const PANTRY_TYPE_OPTIONS: { value: PantryType; label: string }[] = [
  { value: 'Private',       label: 'Private' },
  { value: 'Shared',        label: 'Shared' },
  { value: 'Not Available', label: 'Not Available' },
];

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: 'Ready to move',      label: 'Ready to move' },
  { value: 'Under construction', label: 'Under construction' },
];

const RES_FURNISHING_OPTIONS: { value: FurnishingType; label: string }[] = [
  { value: 'Furnished',      label: 'Fully Furnished' },
  { value: 'Semi-Furnished', label: 'Semi Furnished' },
  { value: 'Un-Furnished',   label: 'Unfurnished' },
];

const BUILDER_FLOOR_OPTIONS: { value: BuilderFloorType; label: string }[] = [
  { value: 'single_floor', label: 'Single Floor' },
  { value: 'duplex',        label: 'Duplex' },
  { value: 'triplex',       label: 'Triplex' },
];

const AGE_OPTIONS: { value: AgeOfProperty; label: string }[] = [
  { value: '0-1 years',  label: '0–1 Year' },
  { value: '1-5 years',  label: '1–5 Years' },
  { value: '5-10 years', label: '5–10 Years' },
  { value: '10+ years',  label: '10+ Years' },
];

const OFFICE_TYPE_OPTIONS: { value: OfficeType; label: string }[] = [
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'bare_shell',    label: 'Bare Shell' },
  { value: 'co_working',   label: 'Co-Working' },
];

const RESIDENTIAL_TYPE_MAP: Record<string, ResidentialType> = {
  flat_apartment:           'Flat/Apartment',
  builder_floor:            'Independent / Builder Floor',
  independent_house_villa:  'Independent House / Villa',
  plot_land_residential:    'Plot / Land',
  studio_apartment:         '1 RK / Studio Apartment',
  serviced_apartment:       'Serviced Apartment',
  farmhouse:                'Farmhouse',
  residential_other:        'Other',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (price?: number) => {
  if (!price) return '-';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000)   return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-400 bg-white';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className={labelCls}>
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="pb-2 mb-4 text-sm font-semibold text-gray-800 border-b border-gray-100">{children}</h3>
);

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}

const SelectField = ({ label, required, value, options, onChange, placeholder = 'Select' }: SelectFieldProps) => (
  <div className=''>
    <FieldLabel required={required}>{label}</FieldLabel>
    <DropdownSelect value={value} onChange={onChange} placeholder={placeholder} options={options} />
  </div>
);

interface NumberFieldProps {
  label: string;
  value?: number;
  onChange: (v?: number) => void;
  placeholder?: string;
  required?: boolean;
}

const NumberField = ({ label, value, onChange, placeholder, required }: NumberFieldProps) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    <input
      type="number"
      min={0}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      placeholder={placeholder}
      className={inputCls}
    />
  </div>
);

const TextField = ({
  label, value, onChange, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) => (
  <div>
    <FieldLabel required={required}>{label}</FieldLabel>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  </div>
);

interface ToggleBoolFieldProps { label: string; value?: boolean; onChange: (v: boolean) => void; }
const ToggleBoolField = ({ label, value, onChange }: ToggleBoolFieldProps) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-gray-900' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

/** Pill toggle between string options */
const PillToggle = ({
  label, value, options, onChange, required,
}: {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  required?: boolean;
}) => (
  <div>
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 text-sm rounded-full border font-medium transition-colors ${
            value === opt.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

/** Star Rating 0-7 */
const StarRating = ({ value, onChange }: { value?: number; onChange: (v: number) => void }) => (
  <div>
    <FieldLabel>Quality Rating</FieldLabel>
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex items-center gap-0.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
            value === n ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'
          }`}
        >
          {n === 0 ? 'No Rating' : <><Star className="w-3 h-3" />{n} Star</>}
        </button>
      ))}
    </div>
  </div>
);

// ─── Shared profile sub-sections ─────────────────────────────────────────────

const AreaSection = ({
  areaDetails, setAreaDetails,
}: {
  areaDetails: AreaDetails;
  setAreaDetails: React.Dispatch<React.SetStateAction<AreaDetails>>;
}) => (
  <div>
    <SectionTitle>Add Area Details</SectionTitle>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <NumberField label="Carpet Area" required value={areaDetails.carpetArea}
        onChange={(v) => setAreaDetails((a) => ({ ...a, carpetArea: v }))} placeholder="Sq ft" />
      <NumberField label="Built-Up Area" value={areaDetails.builtUpArea}
        onChange={(v) => setAreaDetails((a) => ({ ...a, builtUpArea: v }))} placeholder="Sq ft" />
      <NumberField label="Super Built-Up Area" value={areaDetails.superBuiltUpArea}
        onChange={(v) => setAreaDetails((a) => ({ ...a, superBuiltUpArea: v }))} placeholder="Sq ft" />
    </div>
  </div>
);

const FloorSection = ({
  floorDetails, setFloorDetails, required = false,
}: {
  floorDetails: FloorDetails;
  setFloorDetails: React.Dispatch<React.SetStateAction<FloorDetails>>;
  required?: boolean;
}) => (
  <div>
    <SectionTitle>Floor Details</SectionTitle>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NumberField label="No. of Floors" required={required} value={floorDetails.totalFloors}
        onChange={(v) => setFloorDetails((f) => ({ ...f, totalFloors: v }))} placeholder="Total floors" />
      <NumberField label="Property on Floor" required={required} value={floorDetails.propertyOnFloor}
        onChange={(v) => setFloorDetails((f) => ({ ...f, propertyOnFloor: v }))} placeholder="Which floor" />
    </div>
  </div>
);

const WashroomField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <PillToggle
    label="Washrooms"
    value={value}
    onChange={onChange}
    options={[{ value: 'Available', label: 'Available' }, { value: 'Not Available', label: 'Not - Available' }]}
  />
);

const AvailabilityField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <PillToggle
    label="Availability Status"
    value={value}
    onChange={onChange}
    options={AVAILABILITY_OPTIONS}
    required
  />
);

const PricingSection = ({
  priceDetails, setPriceDetails, showDgUps = false,
}: {
  priceDetails: PriceDetails & { dgUpsIncluded?: boolean };
  setPriceDetails: React.Dispatch<React.SetStateAction<PriceDetails & { dgUpsIncluded?: boolean }>>;
  showDgUps?: boolean;
}) => (
  <div>
    <SectionTitle>Price Details</SectionTitle>
    <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
      <NumberField label="Expected Price" required value={priceDetails.expectedPrice}
        onChange={(v) => setPriceDetails((p) => ({ ...p, expectedPrice: v }))} placeholder="₹" />
      <NumberField label="Price per sq.ft." required value={priceDetails.pricePerSqFt}
        onChange={(v) => setPriceDetails((p) => ({ ...p, pricePerSqFt: v }))} placeholder="₹ per sqft" />
    </div>
    {priceDetails.expectedPrice && (
      <p className="mb-3 text-xs font-medium text-green-600">≈ {fmtPrice(priceDetails.expectedPrice)}</p>
    )}
    <div className="space-y-2.5">
      {showDgUps && (
        <ToggleBoolField
          label="DG / UPS Included"
          value={(priceDetails as any).dgUpsIncluded}
          onChange={(v) => setPriceDetails((p) => ({ ...p, dgUpsIncluded: v } as any))}
        />
      )}
      <ToggleBoolField
        label="Tax & Govt. charges excluded"
        value={priceDetails.taxExcluded}
        onChange={(v) => setPriceDetails((p) => ({ ...p, taxExcluded: v }))}
      />
      <ToggleBoolField
        label="Price Negotiable"
        value={priceDetails.priceNegotiable}
        onChange={(v) => setPriceDetails((p) => ({ ...p, priceNegotiable: v }))}
      />
    </div>
  </div>
);

const LeasedOwnershipSection = ({
  preLeased, setPreLeased, ownership, setOwnership,
}: {
  preLeased: boolean;
  setPreLeased: (v: boolean) => void;
  ownership: string;
  setOwnership: (v: string) => void;
}) => (
  <div className="relative space-y-5">
    <div>
      <FieldLabel>Is it Pre-Leased / Pre-Rented?</FieldLabel>
      <div className="flex gap-3 mt-1">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setPreLeased(v)}
            className={`px-5 py-1.5 text-sm rounded-full border font-medium transition-colors ${
              preLeased === v
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
    <SelectField
      label="Ownership"
      required
      value={ownership}
      options={OWNERSHIP_OPTIONS}
      onChange={setOwnership}
      placeholder="Select ownership type"
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type PriceState = PriceDetails & { dgUpsIncluded?: boolean };

const AddInventoryPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateInventory();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState('');

  // ── Step 1 ──
  const [category, setCategory] = useState<InventoryCategory | ''>('');
  const [propertyType, setPropertyType] = useState<InventoryPropertyType | ''>('');
  const [retailUnitType, setRetailUnitType] = useState<RetailUnitType | ''>('');
  const [retailLocationType, setRetailLocationType] = useState<RetailProjectType | ''>('');
  const [storageType, setStorageType] = useState<StorageType | ''>('');
  const [industryType, setIndustryType] = useState<IndustryType | ''>('');
  const [hospitalityType, setHospitalityType] = useState<HospitalityType | ''>('');
  const [plotLandType, setPlotLandType] = useState('');
  const [otherDetails, setOtherDetails] = useState<OtherDetails>({});

  // ── Step 2 ──
  const [basicDetails, setBasicDetails] = useState<BasicDetails>({});
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({});

  // ── Step 3 ──
  const [areaDetails, setAreaDetails] = useState<AreaDetails>({});
  const [floorDetails, setFloorDetails] = useState<FloorDetails>({});
  const [plotDetails, setPlotDetails] = useState<PlotDetails>({});
  const [priceDetails, setPriceDetails] = useState<PriceState>({ taxExcluded: false, priceNegotiable: false });
  const [ownership, setOwnership] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [washroomStatus, setWashroomStatus] = useState('');
  const [preLeased, setPreLeased] = useState(false);
  // Office-specific
  const [officeType, setOfficeType] = useState<OfficeType | ''>('');
  const [officeSetup, setOfficeSetup] = useState({ minSeats: undefined as number | undefined, maxSeats: undefined as number | undefined, numberOfCabins: undefined as number | undefined, meetingRooms: undefined as number | undefined });
  const [officeAmenities, setOfficeAmenities] = useState({ washrooms: false, conferenceRoom: false, receptionArea: false, furnishing: false, centralAirConditioning: false });
  const [pantryType, setPantryType] = useState<PantryType | ''>('');
  // Hospitality-specific
  const [totalRooms, setTotalRooms] = useState<number | undefined>();
  const [hospFurnishing, setHospFurnishing] = useState<CommercialFurnishingType | ''>('');
  const [qualityRating, setQualityRating] = useState<number | undefined>();
  // Residential-specific
  const [resBedrooms, setResBedrooms] = useState<number | undefined>();
  const [resBathrooms, setResBathrooms] = useState<number | undefined>();
  const [resBalconies, setResBalconies] = useState<number | undefined>();
  const [resFurnishing, setResFurnishing] = useState<FurnishingType | ''>('');
  const [resAvailability, setResAvailability] = useState<AvailabilityStatus | ''>('');
  const [resOwnership, setResOwnership] = useState('');
  const [resBuilderFloor, setResBuilderFloor] = useState<BuilderFloorType | ''>('');
  const [resPropertyAge, setResPropertyAge] = useState<AgeOfProperty | ''>('');
  const [resBoundaryWall, setResBoundaryWall] = useState(false);
  const [resConstructionDone, setResConstructionDone] = useState(false);
  const [resOpenSides, setResOpenSides] = useState<number | undefined>();
  const [resRoadWidth, setResRoadWidth] = useState<number | undefined>();
  const [resTotalFloors, setResTotalFloors] = useState<number | undefined>();
  const [resPropertyOnFloor, setResPropertyOnFloor] = useState<number | undefined>();
  const [resPossessionYear, setResPossessionYear] = useState<number | undefined>();
  const [resPossessionMonth, setResPossessionMonth] = useState('');
  const [status, setStatus] = useState<InventoryStatus>('active');

  const isCommercial       = category === 'commercial';
  const isResidential      = category === 'residential';
  const isOffice           = propertyType === 'office';
  const isRetail           = propertyType === 'retail';
  const isPlotLandCommercial = propertyType === 'plot_land_commercial';
  const isPlotLandResidential = propertyType === 'plot_land_residential';
  const isStorage          = propertyType === 'storage';
  const isIndustry         = propertyType === 'industry';
  const isHospitality      = propertyType === 'hospitality';
  const isCommercialOther  = propertyType === 'commercial_other';

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const canProceed = (): boolean => {
    if (currentStep === 0) {
      if (!category || !propertyType) return false;
      if (isRetail && (!retailUnitType || !retailLocationType)) return false;
      if (isStorage && !storageType) return false;
      if (isIndustry && !industryType) return false;
      if (isHospitality && !hospitalityType) return false;
      if (isOffice && !officeType) return false;
      return true;
    }
    if (currentStep === 1) {
      return !!basicDetails.ownerName?.trim() && !!basicDetails.ownerPhone?.trim() && !!locationDetails.city?.trim();
    }
    return true;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitError('');
    if (!category || !propertyType) {
      setSubmitError('Category and property type are required.');
      return;
    }

    const commercialMeta: CommercialMeta = {};
    if (isOffice) {
      if (officeType) commercialMeta.officeType = officeType as OfficeType;
      commercialMeta.officeSetup = officeSetup;
      commercialMeta.conferenceRoom = officeAmenities.conferenceRoom;
      commercialMeta.receptionArea = officeAmenities.receptionArea;
      commercialMeta.centralAirConditioning = officeAmenities.centralAirConditioning;
      if (pantryType) commercialMeta.pantryType = pantryType as PantryType;
      (commercialMeta as any).dgUpsIncluded = (priceDetails as any).dgUpsIncluded;
      commercialMeta.preLeased = preLeased;
    }
    if (isRetail) {
      commercialMeta.retailUnitType = retailUnitType as RetailUnitType;
      commercialMeta.retailProjectType = retailLocationType as RetailProjectType;
      commercialMeta.preLeased = preLeased;
    }
    if (isStorage && storageType)    { commercialMeta.storageType = storageType as StorageType; commercialMeta.preLeased = preLeased; }
    if (isIndustry && industryType)  { commercialMeta.industryType = industryType as IndustryType; commercialMeta.preLeased = preLeased; }
    if (isHospitality) {
      if (hospitalityType) commercialMeta.hospitalityType = hospitalityType as HospitalityType;
      commercialMeta.roomDetails = { totalRooms };
      if (hospFurnishing) commercialMeta.furnishing = hospFurnishing as CommercialFurnishingType;
      if (qualityRating !== undefined) commercialMeta.qualityRating = qualityRating;
      commercialMeta.preLeased = preLeased;
    }
    if (isCommercialOther) { commercialMeta.preLeased = preLeased; }

    const payload: CreateInventoryData = {
      category: category as 'residential' | 'commercial',
      propertyType: propertyType as any,
      status,
      basicDetails,
      locationDetails: {
        city: locationDetails.city,
        location: locationDetails.location,
        subLocation: locationDetails.subLocation,
        societyOrApartment: locationDetails.societyOrApartment,
      },
    };

    // Map frontend propertyType code to backend residentialType label
    if (isResidential && propertyType) {
      const rt = RESIDENTIAL_TYPE_MAP[propertyType];
      if (rt) payload.residentialType = rt;
    }

    const cleanArea: AreaDetails = {};
    if (areaDetails.carpetArea)       cleanArea.carpetArea = areaDetails.carpetArea;
    if (areaDetails.builtUpArea)      cleanArea.builtUpArea = areaDetails.builtUpArea;
    if (areaDetails.superBuiltUpArea) cleanArea.superBuiltUpArea = areaDetails.superBuiltUpArea;
    if (areaDetails.plotArea)         cleanArea.plotArea = areaDetails.plotArea;
    if (areaDetails.plotLength)       cleanArea.plotLength = areaDetails.plotLength;
    if (areaDetails.plotBreadth)      cleanArea.plotBreadth = areaDetails.plotBreadth;
    if (Object.keys(cleanArea).length > 0) payload.areaDetails = cleanArea;

    if (floorDetails.totalFloors || floorDetails.propertyOnFloor) payload.floorDetails = floorDetails;

    if (isPlotLandCommercial || isPlotLandResidential) {
      const pd: PlotDetails = {};
      if (plotDetails.floorsAllowed)  pd.floorsAllowed = plotDetails.floorsAllowed;
      if (plotDetails.openSides)      pd.openSides = plotDetails.openSides;
      if (plotDetails.possessionYear) pd.possessionYear = plotDetails.possessionYear;
      if (plotDetails.possessionMonth) pd.possessionMonth = plotDetails.possessionMonth;
      if (isPlotLandResidential) {
        pd.boundaryWall = resBoundaryWall;
        pd.constructionDone = resConstructionDone;
        pd.openSides = resOpenSides;
        if (resRoadWidth) pd.roadWidth = resRoadWidth;
      }
      if (Object.keys(pd).length > 0) payload.plotDetails = pd;
    }

    const cleanPrice: PriceDetails = {};
    if (priceDetails.expectedPrice) cleanPrice.expectedPrice = priceDetails.expectedPrice;
    if (priceDetails.pricePerSqFt)  cleanPrice.pricePerSqFt = priceDetails.pricePerSqFt;
    cleanPrice.taxExcluded    = !!priceDetails.taxExcluded;
    cleanPrice.priceNegotiable = !!priceDetails.priceNegotiable;
    payload.priceDetails = cleanPrice;

    if (isCommercial && ownership)    payload.ownership = ownership as OwnershipType;
    if (isResidential && resOwnership) payload.ownership = resOwnership as OwnershipType;
    if (availabilityStatus)           payload.availabilityStatus = availabilityStatus as AvailabilityStatus;
    if (isResidential && resAvailability) payload.availabilityStatus = resAvailability as AvailabilityStatus;

    if (isCommercial && Object.keys(commercialMeta).length > 0) payload.commercialMeta = commercialMeta;

    if (isResidential) {
      const rr: any = {};
      if (resBedrooms)  rr.bedrooms  = resBedrooms;
      if (resBathrooms) rr.bathrooms = resBathrooms;
      if (resBalconies) rr.balconies = resBalconies;
      if (Object.keys(rr).length > 0) payload.roomDetails = rr;
      if (resFurnishing)   payload.furnishing   = resFurnishing as FurnishingType;
      if (resPropertyAge)  payload.propertyAge  = resPropertyAge as AgeOfProperty;
      if (resTotalFloors || resPropertyOnFloor)
        payload.floorDetails = { totalFloors: resTotalFloors, propertyOnFloor: resPropertyOnFloor };
      if (resAvailability === 'Under construction' && (resPossessionYear || resPossessionMonth))
        payload.plotDetails = { ...payload.plotDetails, possessionYear: resPossessionYear, possessionMonth: resPossessionMonth };
    }

    if (otherDetails.commercialPropertyTypeOther || otherDetails.residentialPropertyTypeOther)
      payload.otherDetails = otherDetails;

    const washroomAmenities: string[] = [];
    if (washroomStatus) washroomAmenities.push(washroomStatus === 'Available' ? 'Washroom Available' : 'No Washroom');
    if (officeAmenities.washrooms) washroomAmenities.push('Washroom Available');
    if (washroomAmenities.length > 0) payload.amenities = [...(payload.amenities ?? []), ...washroomAmenities];

    try {
      await createMutation.mutateAsync(payload);
      navigate('/inventory');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Failed to create inventory. Please try again.');
    }
  };

  // ─── Step 1: Basic Details ─────────────────────────────────────────────────

  const renderStep1 = () => {
    const typeOptions = category === 'residential' ? RESIDENTIAL_TYPES : category === 'commercial' ? COMMERCIAL_TYPES : [];
    return (
      <div className="space-y-8">
        {/* Category */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-500">Property Type</p>
          <div className="grid max-w-sm grid-cols-2 gap-4">
            {([
              { value: 'residential' as InventoryCategory, label: 'Residential', Icon: Home },
              { value: 'commercial'  as InventoryCategory, label: 'Commercial',  Icon: Building2 },
            ] as { value: InventoryCategory; label: string; Icon: LucideIcon }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value);
                  setPropertyType('');
                  setRetailUnitType('');
                  setRetailLocationType('');
                  setStorageType('');
                  setIndustryType('');
                  setHospitalityType('');
                  setPlotLandType('');
                  setOfficeType('');
                  setOtherDetails({});
                }}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  category === opt.value
                    ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <opt.Icon className={`w-8 h-8 mb-2 ${category === opt.value ? 'text-white' : 'text-gray-600'}`} />
                <div className={`font-semibold text-sm ${category === opt.value ? 'text-white' : 'text-gray-900'}`}>
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        {category && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">
              {isCommercial ? 'What Kind of Commercial Property?' : 'What type of Residential property?'}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setPropertyType(opt.value);
                    setRetailUnitType('');
                    setRetailLocationType('');
                    setStorageType('');
                    setIndustryType('');
                    setHospitalityType('');
                    setPlotLandType('');
                    setOfficeType('');
                    setOtherDetails({});
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    propertyType === opt.value
                      ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <opt.Icon className={`w-6 h-6 mb-2 ${propertyType === opt.value ? 'text-white' : 'text-gray-600'}`} />
                  <div className={`font-medium text-xs ${propertyType === opt.value ? 'text-white' : 'text-gray-800'}`}>
                    {opt.label}
                  </div>
                  <div className={`text-xs mt-0.5 leading-snug ${propertyType === opt.value ? 'text-gray-300' : 'text-gray-400'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Retail sub-type */}
        {isRetail && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">What type of retail space do you have?</p>
            <div className="flex flex-wrap gap-3">
              {RETAIL_UNIT_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setRetailUnitType(opt.value)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    retailUnitType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Retail location type */}
        {isRetail && retailUnitType && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">Your shop is located inside</p>
            <div className="flex flex-wrap gap-3">
              {RETAIL_LOCATION_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setRetailLocationType(opt.value)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    retailLocationType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Storage type */}
        {isStorage && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">What kind of storage is it? <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-3">
              {STORAGE_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setStorageType(opt.value)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    storageType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Industry type */}
        {isIndustry && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">What kind of industry is it? <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-3">
              {INDUSTRY_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setIndustryType(opt.value)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    industryType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hospitality type */}
        {isHospitality && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">What kind of hospitality is it? <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-3">
              {HOSPITALITY_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setHospitalityType(opt.value)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    hospitalityType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plot / Land type */}
        {isPlotLandCommercial && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">What type of plot / land?</p>
            <div className="flex flex-wrap gap-3">
              {PLOT_LAND_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setPlotLandType(opt.value)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    plotLandType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Office type */}
        {isOffice && (
          <div>
            <p className="mb-3 text-sm font-medium text-gray-500">What type of office space? <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-3">
              {OFFICE_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setOfficeType(opt.value as OfficeType)}
                  className={`px-5 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                    officeType === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Other text */}
        {propertyType === 'commercial_other' && (
          <div className="max-w-sm">
            <FieldLabel required>Specify Property Type</FieldLabel>
            <input type="text" value={otherDetails.commercialPropertyTypeOther ?? ''}
              onChange={(e) => setOtherDetails((d) => ({ ...d, commercialPropertyTypeOther: e.target.value }))}
              placeholder="e.g. Medical Centre, Sports Complex…" className={inputCls} />
          </div>
        )}
        {propertyType === 'residential_other' && (
          <div className="max-w-sm">
            <FieldLabel required>Specify Property Type</FieldLabel>
            <input type="text" value={otherDetails.residentialPropertyTypeOther ?? ''}
              onChange={(e) => setOtherDetails((d) => ({ ...d, residentialPropertyTypeOther: e.target.value }))}
              placeholder="e.g. Row House, Chawl…" className={inputCls} />
          </div>
        )}
      </div>
    );
  };

  // ─── Step 2: Owner + Location ──────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="max-w-xl space-y-8">
      <div>
        <SectionTitle>Owner Details</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Name" required value={basicDetails.ownerName ?? ''}
            onChange={(v) => setBasicDetails((b) => ({ ...b, ownerName: v }))} placeholder="Owner name" />
          <TextField label="Phone No." required value={basicDetails.ownerPhone ?? ''}
            onChange={(v) => setBasicDetails((b) => ({ ...b, ownerPhone: v }))} placeholder="Mobile number" />
          <TextField label="Alternative No." value={basicDetails.ownerAlternatePhone ?? ''}
            onChange={(v) => setBasicDetails((b) => ({ ...b, ownerAlternatePhone: v }))} placeholder="Alternate number" />
          <TextField label="E-mail" value={basicDetails.ownerEmail ?? ''}
            onChange={(v) => setBasicDetails((b) => ({ ...b, ownerEmail: v }))} placeholder="Email address" />
        </div>
      </div>
      <div>
        <SectionTitle>Where is your property located?</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="City" required value={locationDetails.city ?? ''}
            onChange={(v) => setLocationDetails((l) => ({ ...l, city: v }))} placeholder="e.g. Mumbai, Pune…" />
          <TextField label="Location" required value={locationDetails.location ?? ''}
            onChange={(v) => setLocationDetails((l) => ({ ...l, location: v }))} placeholder="Area / Sector" />
          <TextField label="Sub-location" value={locationDetails.subLocation ?? ''}
            onChange={(v) => setLocationDetails((l) => ({ ...l, subLocation: v }))} placeholder="Sub-area / Locality" />
          <TextField label="Project" value={locationDetails.societyOrApartment ?? ''}
            onChange={(v) => setLocationDetails((l) => ({ ...l, societyOrApartment: v }))} placeholder="Society / Project name" />
        </div>
      </div>
    </div>
  );

  // ─── Step 3 variants ───────────────────────────────────────────────────────

  const renderOfficeProfile = () => (
    <div className="max-w-2xl space-y-6">
      <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
      <FloorSection floorDetails={floorDetails} setFloorDetails={setFloorDetails} required />
      <div>
        <SectionTitle>Office Setup</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumberField label="Min Seats" value={officeSetup.minSeats}
            onChange={(v) => setOfficeSetup((o) => ({ ...o, minSeats: v }))} placeholder="e.g. 10" />
          <NumberField label="Max Seats" value={officeSetup.maxSeats}
            onChange={(v) => setOfficeSetup((o) => ({ ...o, maxSeats: v }))} placeholder="e.g. 50" />
          <NumberField label="No. of Cabins" value={officeSetup.numberOfCabins}
            onChange={(v) => setOfficeSetup((o) => ({ ...o, numberOfCabins: v }))} placeholder="e.g. 5" />
          <NumberField label="Meeting Rooms" value={officeSetup.meetingRooms}
            onChange={(v) => setOfficeSetup((o) => ({ ...o, meetingRooms: v }))} placeholder="e.g. 2" />
        </div>
      </div>
      <div>
        <SectionTitle>Amenities</SectionTitle>
        <div className="flex flex-wrap gap-5 mb-4">
          {([
            ['washrooms',              'Washrooms'],
            ['conferenceRoom',         'Conference Room'],
            ['receptionArea',          'Reception Area'],
            ['furnishing',             'Furnished'],
            ['centralAirConditioning', 'Central Air Conditioning'],
          ] as [keyof typeof officeAmenities, string][]).map(([key, label]) => (
            <ToggleBoolField key={key} label={label} value={officeAmenities[key]}
              onChange={(v) => setOfficeAmenities((a) => ({ ...a, [key]: v }))} />
          ))}
        </div>
        <div className="max-w-xs">
          <SelectField label="Pantry Type" value={pantryType} options={PANTRY_TYPE_OPTIONS}
            onChange={(v) => setPantryType(v as PantryType)} />
        </div>
      </div>
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} showDgUps />
      <LeasedOwnershipSection preLeased={preLeased} setPreLeased={setPreLeased} ownership={ownership} setOwnership={setOwnership} />
    </div>
  );

  const renderRetailProfile = () => (
    <div className="max-w-2xl space-y-6">
      <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
      <FloorSection floorDetails={floorDetails} setFloorDetails={setFloorDetails} required />
      <WashroomField value={washroomStatus} onChange={setWashroomStatus} />
      <AvailabilityField value={availabilityStatus} onChange={setAvailabilityStatus} />
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <LeasedOwnershipSection preLeased={preLeased} setPreLeased={setPreLeased} ownership={ownership} setOwnership={setOwnership} />
    </div>
  );

  const renderStorageProfile = () => (
    <div className="max-w-2xl space-y-6">
      <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
      <WashroomField value={washroomStatus} onChange={setWashroomStatus} />
      <AvailabilityField value={availabilityStatus} onChange={setAvailabilityStatus} />
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <LeasedOwnershipSection preLeased={preLeased} setPreLeased={setPreLeased} ownership={ownership} setOwnership={setOwnership} />
    </div>
  );

  const renderIndustryProfile = () => (
    <div className="max-w-2xl space-y-6">
      <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
      <FloorSection floorDetails={floorDetails} setFloorDetails={setFloorDetails} required />
      <WashroomField value={washroomStatus} onChange={setWashroomStatus} />
      <AvailabilityField value={availabilityStatus} onChange={setAvailabilityStatus} />
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <LeasedOwnershipSection preLeased={preLeased} setPreLeased={setPreLeased} ownership={ownership} setOwnership={setOwnership} />
    </div>
  );

  const renderHospitalityProfile = () => (
    <div className="max-w-2xl space-y-6">
      <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
      <FloorSection floorDetails={floorDetails} setFloorDetails={setFloorDetails} required />
      <div>
        <SectionTitle>Add Room Details</SectionTitle>
        <div className="max-w-xs">
          <NumberField label="Total no. of Rooms" required value={totalRooms}
            onChange={setTotalRooms} placeholder="e.g. 40" />
        </div>
      </div>
      <WashroomField value={washroomStatus} onChange={setWashroomStatus} />
      <div>
        <SectionTitle>Furnishing</SectionTitle>
        <PillToggle value={hospFurnishing} onChange={(v) => setHospFurnishing(v as CommercialFurnishingType)} options={FURNISHING_OPTIONS} />
      </div>
      <StarRating value={qualityRating} onChange={setQualityRating} />
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <LeasedOwnershipSection preLeased={preLeased} setPreLeased={setPreLeased} ownership={ownership} setOwnership={setOwnership} />
    </div>
  );

  const renderPlotLandProfile = () => (
    <div className="max-w-xl space-y-6">
      <div>
        <SectionTitle>Add Area Details</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel required>Plot Area</FieldLabel>
            <div className="flex gap-2">
              <input type="number" min={0} value={areaDetails.plotArea ?? ''}
                onChange={(e) => setAreaDetails((a) => ({ ...a, plotArea: e.target.value === '' ? undefined : Number(e.target.value) }))}
                placeholder="Area" className={inputCls} />
              <span className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg bg-gray-50 shrink-0">Sq</span>
            </div>
          </div>
          <NumberField label="Floors Allowed" required value={plotDetails.floorsAllowed}
            onChange={(v) => setPlotDetails((p) => ({ ...p, floorsAllowed: v }))} placeholder="e.g. 4" />
          <NumberField label="Open Sides" required value={plotDetails.openSides}
            onChange={(v) => setPlotDetails((p) => ({ ...p, openSides: v }))} placeholder="e.g. 2" />
        </div>
      </div>
      <div>
        <SectionTitle>Possession By</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Expected Year" value={plotDetails.possessionYear}
            onChange={(v) => setPlotDetails((p) => ({ ...p, possessionYear: v }))} placeholder="e.g. 2026" />
          <TextField label="Expected Month" value={plotDetails.possessionMonth ?? ''}
            onChange={(v) => setPlotDetails((p) => ({ ...p, possessionMonth: v }))} placeholder="e.g. March" />
        </div>
      </div>
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <LeasedOwnershipSection preLeased={preLeased} setPreLeased={setPreLeased} ownership={ownership} setOwnership={setOwnership} />
    </div>
  );

  const renderCommercialOtherProfile = () => (
    <div className="max-w-xl space-y-6">
      <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
      <div>
        <SectionTitle>Possession By</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Expected Year" value={plotDetails.possessionYear}
            onChange={(v) => setPlotDetails((p) => ({ ...p, possessionYear: v }))} placeholder="e.g. 2026" />
          <TextField label="Expected Month" value={plotDetails.possessionMonth ?? ''}
            onChange={(v) => setPlotDetails((p) => ({ ...p, possessionMonth: v }))} placeholder="e.g. March" />
        </div>
      </div>
      <SelectField label="Ownership" required value={ownership} options={OWNERSHIP_OPTIONS}
        onChange={setOwnership} placeholder="Select ownership type" />
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <div>
        <FieldLabel>Is it Pre-Leased / Pre-Rented?</FieldLabel>
        <div className="flex gap-3 mt-1">
          {([true, false] as const).map((v) => (
            <button key={String(v)} type="button" onClick={() => setPreLeased(v)}
              className={`px-5 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                preLeased === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}>
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResidentialProfile = () => (
    <div className="max-w-2xl space-y-6">
      {isPlotLandResidential ? (
        <>
          <div>
            <SectionTitle>Plot Dimensions</SectionTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <NumberField label="Plot Area (sq ft)" value={areaDetails.plotArea}
                onChange={(v) => setAreaDetails((a) => ({ ...a, plotArea: v }))} placeholder="e.g. 1500" />
              <NumberField label="Plot Length (ft)" value={areaDetails.plotLength}
                onChange={(v) => setAreaDetails((a) => ({ ...a, plotLength: v }))} placeholder="e.g. 50" />
              <NumberField label="Plot Breadth (ft)" value={areaDetails.plotBreadth}
                onChange={(v) => setAreaDetails((a) => ({ ...a, plotBreadth: v }))} placeholder="e.g. 30" />
              <NumberField label="Road Width (ft)" value={resRoadWidth}
                onChange={setResRoadWidth} />
              <NumberField label="Open Sides" value={resOpenSides} onChange={setResOpenSides} />
            </div>
          </div>
          <div>
            <SectionTitle>Plot Details</SectionTitle>
            <div className="max-w-xs mb-4">
              <SelectField label="Ownership" value={resOwnership} options={OWNERSHIP_OPTIONS} onChange={setResOwnership} />
            </div>
            <div className="flex flex-wrap gap-6">
              <ToggleBoolField label="Boundary Wall"      value={resBoundaryWall}     onChange={setResBoundaryWall} />
              <ToggleBoolField label="Construction Done"  value={resConstructionDone} onChange={setResConstructionDone} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <SectionTitle>Room Configuration</SectionTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <NumberField label="Bedrooms"          value={resBedrooms}         onChange={setResBedrooms}         placeholder="e.g. 3" />
              <NumberField label="Bathrooms"         value={resBathrooms}        onChange={setResBathrooms}        placeholder="e.g. 2" />
              <NumberField label="Balconies"         value={resBalconies}        onChange={setResBalconies}        placeholder="e.g. 1" />
              <NumberField label="Total Floors"      value={resTotalFloors}      onChange={setResTotalFloors} />
              <NumberField label="Property on Floor" value={resPropertyOnFloor}  onChange={setResPropertyOnFloor} />
            </div>
          </div>
          {propertyType === 'builder_floor' && (
            <div>
              <SectionTitle>Builder Floor Type</SectionTitle>
              <div className="max-w-xs">
                <SelectField label="Floor Type" value={resBuilderFloor}
                  options={BUILDER_FLOOR_OPTIONS} onChange={(v) => setResBuilderFloor(v as BuilderFloorType)} />
              </div>
            </div>
          )}
          <AreaSection areaDetails={areaDetails} setAreaDetails={setAreaDetails} />
          <div>
            <SectionTitle>Status &amp; Condition</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Furnishing"      value={resFurnishing}   options={RES_FURNISHING_OPTIONS} onChange={(v) => setResFurnishing(v as FurnishingType)} />
              <SelectField label="Availability"    value={resAvailability} options={AVAILABILITY_OPTIONS}   onChange={(v) => setResAvailability(v as AvailabilityStatus)} />
              <SelectField label="Age of Property" value={resPropertyAge}  options={AGE_OPTIONS}            onChange={(v) => setResPropertyAge(v as AgeOfProperty)} />
              <SelectField label="Ownership"       value={resOwnership}    options={OWNERSHIP_OPTIONS}      onChange={setResOwnership} />
            </div>
            {resAvailability === 'Under construction' && (
              <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
                <NumberField label="Possession Year"  value={resPossessionYear}  onChange={setResPossessionYear}  placeholder="e.g. 2026" />
                <TextField  label="Possession Month" value={resPossessionMonth} onChange={setResPossessionMonth} placeholder="e.g. March" />
              </div>
            )}
          </div>
        </>
      )}
      <PricingSection priceDetails={priceDetails} setPriceDetails={setPriceDetails} />
      <div>
        <SectionTitle>Listing Status</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {(['active', 'inactive', 'sold', 'withdrawn', 'pending'] as InventoryStatus[]).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (isResidential)        return renderResidentialProfile();
    if (isOffice)             return renderOfficeProfile();
    if (isRetail)             return renderRetailProfile();
    if (isPlotLandCommercial) return renderPlotLandProfile();
    if (isStorage)            return renderStorageProfile();
    if (isIndustry)           return renderIndustryProfile();
    if (isHospitality)        return renderHospitalityProfile();
    if (isCommercialOther)    return renderCommercialOtherProfile();
    return (
      <div className="py-10 text-center text-gray-400">
        <p className="text-sm">Select a property type in Step 1 to see property details.</p>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      default: return null;
    }
  };

  const stepTitles = [
    'Basic Details',
    'Owner Details',
    'Tell us about your property',
  ];

  //  Layout 

  return (
    <div className="-m-4">
      {/* Page Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review your lead sources and evaluate their performance.</p>
        </div>
        <div className="ml-auto">
          <BulkUploadButton module="inventory" />
        </div>
      </div>

      <div className="flex max-w-6xl mx-auto px-3 py-4 gap-6 sm:px-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
        {/*  Left: Stepper  */}
        <div className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-8">
            <nav aria-label="Form steps">
              {STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                const isDone   = idx < currentStep;
                return (
                  <div key={step.key} className="flex items-start mb-1">
                    <div className="flex flex-col items-center mr-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold transition-colors ${
                        isDone   ? 'bg-green-500 text-white' :
                        isActive ? 'bg-gray-900 text-white'  : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx + 1}
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 my-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-0.5 pb-6">
                      <p className={`text-xs font-medium leading-tight ${
                        isActive ? 'text-gray-900' : isDone ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/*  Right: Step Content  */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
            {/* Step header */}
            <div className="px-4 pt-6 pb-4 border-b border-gray-100 sm:px-8 sm:pt-8">
              <h2 className="text-xl font-bold text-gray-900">{stepTitles[currentStep]}</h2>
            </div>

            {/* Step body */}
            <div className="px-4 py-4 sm:px-8 sm:py-6">{renderCurrentStep()}</div>

            {/* Error */}
            {submitError && (
              <div className="p-3 mx-4 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 sm:mx-8">
                {submitError}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sm:px-8 sm:py-5">
              <button
                onClick={currentStep === 0 ? () => navigate('/inventory') : goBack}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </button>

              {/* Mobile dots */}
              <div className="flex items-center gap-1.5 md:hidden">
                {STEPS.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-gray-900' : idx < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                ))}
              </div>

              {currentStep === STEPS.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white transition-colors bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Submitting</>
                  ) : (
                    <><Check className="w-4 h-4" />Submit Inventory</>
                  )}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white transition-colors bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddInventoryPage;
