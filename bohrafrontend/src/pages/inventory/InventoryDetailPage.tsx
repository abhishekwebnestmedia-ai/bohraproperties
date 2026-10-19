import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Pencil, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import DropdownSelect from '../../components/common/DropdownSelect';
import { useInventoryItem, useUpdateInventory, useDeleteInventory } from '../../hooks/useInventory';
import type { UpdateInventoryData, InventoryItem } from '../../services/inventoryService';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const formatPrice = (price?: number) => {
  if (!price) return '-';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const humanize = (val?: string) =>
  val ? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  sold: 'bg-blue-100 text-blue-700',
  rented: 'bg-purple-100 text-purple-700',
};

/* ─── Editable field helpers ──────────────────────────────────────────────── */

const getValueAtPath = (obj: unknown, path: string): unknown => {
  const keys = path.split('.');
  let cur: any = obj;
  for (const key of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[key];
  }
  return cur;
};

const setValueAtPath = (obj: UpdateInventoryData, path: string, value: unknown): UpdateInventoryData => {
  const keys = path.split('.');
  const next: any = { ...(obj as any) };
  let cur: any = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    cur[key] = { ...(cur[key] ?? {}) };
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
  return next as UpdateInventoryData;
};

/* ─── Section Card ───────────────────────────────────────────────────────── */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Field display / edit ───────────────────────────────────────────────── */

function EditableField({
  path,
  label,
  item,
  editedValues,
  editingField,
  setEditingField,
  setEditedValues,
  multiline = false,
  inputType = 'text',
  numericOnly = false,
}: {
  path: string;
  label: string;
  item: InventoryItem;
  editedValues: UpdateInventoryData;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  setEditedValues: React.Dispatch<React.SetStateAction<UpdateInventoryData>>;
  multiline?: boolean;
  inputType?: 'text' | 'number';
  numericOnly?: boolean;
}) {
  const edited = getValueAtPath(editedValues, path);
  const initialValue = getValueAtPath(item, path);
  const valueToShow = edited !== undefined ? edited : initialValue;
  const isEditing = editingField === path;
  const isDirty = edited !== undefined;

  const display =
    valueToShow === null || valueToShow === undefined || valueToShow === ''
      ? '-'
      : String(valueToShow);

  return (
    <div className="group/field">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={3}
            className="w-full px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-0 resize-none"
            value={valueToShow == null ? '' : String(valueToShow)}
            onChange={(e) =>
              setEditedValues((prev) => setValueAtPath(prev, path, e.target.value))
            }
            onBlur={() => setEditingField(null)}
          />
        ) : (
          <input
            autoFocus
            type={inputType}
            className="w-full px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-0"
            value={
              inputType === 'number'
                ? typeof valueToShow === 'number'
                  ? valueToShow
                  : valueToShow == null || valueToShow === ''
                    ? ''
                    : Number(valueToShow)
                : valueToShow == null
                  ? ''
                  : String(valueToShow)
            }
            onChange={(e) => {
              const raw = e.target.value;
              const next = numericOnly
                ? raw.replace(/\D/g, '').slice(0, 10)
                : inputType === 'number' ? (raw.trim() === '' ? undefined : Number(raw)) : raw;
              setEditedValues((prev) => setValueAtPath(prev, path, next));
            }}
            onBlur={() => setEditingField(null)}
          />
        )
      ) : (
        <div
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
            isDirty
              ? 'border-blue-300 bg-blue-50 text-blue-900'
              : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-800'
          }`}
          onClick={() => setEditingField(path)}
          title="Click to edit"
        >
          <span className={display === '-' ? 'text-gray-400' : ''}>{display}</span>
          <Pencil className="w-3 h-3 text-gray-300 group-hover/field:text-gray-500 shrink-0 ml-2 opacity-0 group-hover/field:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}

/* ─── Select editable field ──────────────────────────────────────────────── */

function EditableSelect({
  path,
  label,
  options,
  item,
  editedValues,
  editingField,
  setEditingField,
  setEditedValues,
}: {
  path: string;
  label: string;
  options: { value: string; label: string }[];
  item: InventoryItem;
  editedValues: UpdateInventoryData;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  setEditedValues: React.Dispatch<React.SetStateAction<UpdateInventoryData>>;
}) {
  const edited = getValueAtPath(editedValues, path);
  const initialValue = getValueAtPath(item, path);
  const valueToShow = (edited !== undefined ? edited : initialValue) as string | undefined;
  const isEditing = editingField === path;
  const isDirty = edited !== undefined;

  const matchedLabel = options.find((o) => o.value === valueToShow)?.label ?? humanize(valueToShow);

  return (
    <div className="group/field">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        <DropdownSelect
          autoFocus
          value={valueToShow ?? ''}
          onChange={(v) => setEditedValues((prev) => setValueAtPath(prev, path, v))}
          onBlur={() => setEditingField(null)}
          placeholder="— Select —"
          options={options}
        />
      ) : (
        <div
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
            isDirty
              ? 'border-blue-300 bg-blue-50 text-blue-900'
              : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-800'
          }`}
          onClick={() => setEditingField(path)}
          title="Click to edit"
        >
          <span className={!valueToShow ? 'text-gray-400' : ''}>{matchedLabel || '-'}</span>
          <Pencil className="w-3 h-3 text-gray-300 group-hover/field:text-gray-500 shrink-0 ml-2 opacity-0 group-hover/field:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

const InventoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<UpdateInventoryData>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: response, isLoading, error } = useInventoryItem(id ?? '');
  const item = response?.data ?? null;

  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();

  const hasPendingChanges = Object.keys(editedValues).length > 0;

  const handleSave = async () => {
    if (!id || !hasPendingChanges) return;
    try {
      const payload: any = { ...editedValues };

      // Merge nested objects with existing item values so partial updates
      // don't accidentally wipe sibling fields.
      const nestedKeys = [
        'basicDetails', 'locationDetails', 'roomDetails', 'areaDetails',
        'floorDetails', 'plotDetails', 'priceDetails', 'commercialMeta',
        'otherDetails', 'description', 'financeDetails', 'managementInfo',
        'activityTracking', 'legal', 'ownershipDocuments',
      ] as const;
      nestedKeys.forEach((key) => {
        if (payload[key]) {
          payload[key] = { ...(item?.[key] ?? {}), ...(payload[key] as any) };
        }
      });

      await updateMutation.mutateAsync({ id, data: payload });
      setEditedValues({});
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/inventory');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  /* ── Field prop shorthand ── */
  const fp = (path: string) => ({
    path,
    item: item!,
    editedValues,
    editingField,
    setEditingField,
    setEditedValues,
  });

  /* ── Loading / error states ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Loading inventory details…
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load inventory item. <button onClick={() => navigate('/inventory')} className="ml-2 underline hover:text-red-700 transition-colors">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {humanize(item.propertyType)}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[item.status ?? 'inactive'] ?? statusColors.inactive
              }`}
            >
              {humanize(item.status)}
            </span>
            {item.locationDetails?.city && (
              <span className="text-sm text-gray-500">
                {[item.locationDetails.city, item.locationDetails?.location].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">ID: {item._id}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasPendingChanges && (
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasPendingChanges || updateMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confirm?</span>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* ─ Owner / Basic Details ─ */}
        <SectionCard title="Owner Details">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditableField {...fp('basicDetails.ownerName')} label="Owner Name" />
            <EditableField {...fp('basicDetails.ownerPhone')} label="Owner Phone" numericOnly />
            <EditableField {...fp('basicDetails.ownerAlternatePhone')} label="Alternate Phone" numericOnly />
            <EditableField {...fp('basicDetails.ownerEmail')} label="Owner Email" />
            <EditableField {...fp('basicDetails.ownerAddress')} label="Owner Address" />
            <EditableField {...fp('basicDetails.coOwnerName')} label="Co-Owner Name" />
            <EditableField {...fp('basicDetails.coOwnerPhone')} label="Co-Owner Phone" numericOnly />
            <EditableField {...fp('basicDetails.coOwnerEmail')} label="Co-Owner Email" />
            <EditableField {...fp('basicDetails.authorizedRepName')} label="Authorized Rep Name" />
            <EditableField {...fp('basicDetails.authorizedRepPhone')} label="Authorized Rep Phone" numericOnly />
            <EditableField {...fp('basicDetails.authorizedRepEmail')} label="Authorized Rep Email" />
          </div>
        </SectionCard>

        {/* ─ Location ─ */}
        <SectionCard title="Location">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditableField {...fp('locationDetails.city')} label="City" />
            <EditableField {...fp('locationDetails.location')} label="Area / Location" />
            <EditableField {...fp('locationDetails.subLocation')} label="Sub Area" />
            <EditableField {...fp('locationDetails.societyOrApartment')} label="Apartment / Society" />
            <EditableField {...fp('locationDetails.houseNumber')} label="House / Unit No." />
            <EditableField {...fp('locationDetails.pinCode')} label="Pin Code" />
          </div>
        </SectionCard>

        {/* ─ Property Info ─ */}
        <SectionCard title="Property Info">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditableSelect
              {...fp('category')}
              label="Category"
              options={[
                { value: 'residential', label: 'Residential' },
                { value: 'commercial', label: 'Commercial' },
              ]}
            />
            <EditableSelect
              {...fp('propertyType')}
              label="Property Type"
              options={
                item.category === 'residential'
                  ? [
                      { value: 'flat_apartment', label: 'Flat / Apartment' },
                      { value: 'builder_floor', label: 'Builder Floor' },
                      { value: 'independent_house_villa', label: 'Independent House / Villa' },
                      { value: 'plot_land_residential', label: 'Plot / Land' },
                      { value: 'studio_apartment', label: 'Studio Apartment' },
                      { value: 'serviced_apartment', label: 'Serviced Apartment' },
                      { value: 'farmhouse', label: 'Farmhouse' },
                      { value: 'residential_other', label: 'Other' },
                    ]
                  : [
                      { value: 'office', label: 'Office' },
                      { value: 'retail', label: 'Retail' },
                      { value: 'storage', label: 'Storage / Warehouse' },
                      { value: 'industry', label: 'Industrial' },
                      { value: 'hospitality', label: 'Hospitality' },
                      { value: 'plot_land_commercial', label: 'Plot / Land' },
                      { value: 'commercial_other', label: 'Other' },
                    ]
              }
            />
            <EditableSelect
              {...fp('status')}
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'sold', label: 'Sold' },
                { value: 'withdrawn', label: 'Withdrawn' },
                { value: 'pending', label: 'Pending' },
              ]}
            />

            {item.category === 'residential' && (
              <>
                <EditableField {...fp('roomDetails.bedrooms')} label="Bedrooms" inputType="number" />
                <EditableField {...fp('roomDetails.bathrooms')} label="Bathrooms" inputType="number" />
                <EditableField {...fp('roomDetails.balconies')} label="Balconies" inputType="number" />
                <EditableSelect
                  {...fp('furnishing')}
                  label="Furnishing"
                  options={[
                    { value: 'Furnished', label: 'Furnished' },
                    { value: 'Semi-Furnished', label: 'Semi-Furnished' },
                    { value: 'Un-Furnished', label: 'Un-Furnished' },
                  ]}
                />
                <EditableSelect
                  {...fp('availabilityStatus')}
                  label="Availability"
                  options={[
                    { value: 'Ready to move', label: 'Ready to Move' },
                    { value: 'Under construction', label: 'Under Construction' },
                  ]}
                />
                <EditableSelect
                  {...fp('propertyAge')}
                  label="Age of Property"
                  options={[
                    { value: '0-1 years', label: '0–1 Year' },
                    { value: '1-5 years', label: '1–5 Years' },
                    { value: '5-10 years', label: '5–10 Years' },
                    { value: '10+ years', label: '10+ Years' },
                  ]}
                />
                <EditableSelect
                  {...fp('ownership')}
                  label="Ownership"
                  options={[
                    { value: 'Freehold', label: 'Freehold' },
                    { value: 'Leasehold', label: 'Leasehold' },
                    { value: 'Co-operative society', label: 'Co-operative Society' },
                    { value: 'Power of Attorney', label: 'Power of Attorney' },
                  ]}
                />
              </>
            )}

            {item.category === 'commercial' && (
              <>
                <EditableField {...fp('commercialMeta.washrooms')} label="Washrooms" inputType="number" />
                <EditableField {...fp('commercialMeta.parking')} label="Parking" inputType="number" />
                <EditableSelect
                  {...fp('commercialMeta.officeType')}
                  label="Office Type"
                  options={[
                    { value: 'ready_to_move', label: 'Ready to Move' },
                    { value: 'bare_shell', label: 'Bare Shell' },
                    { value: 'co_working', label: 'Co-Working' },
                  ]}
                />
              </>
            )}

            <EditableField {...fp('floorDetails.totalFloors')} label="Total Floors" inputType="number" />
            <EditableField {...fp('floorDetails.propertyOnFloor')} label="Property on Floor" inputType="number" />
          </div>
        </SectionCard>

        {/* ─ Area Details ─ */}
        <SectionCard title="Area Details">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditableField {...fp('areaDetails.carpetArea')} label="Carpet Area (sqft)" inputType="number" />
            <EditableField {...fp('areaDetails.builtUpArea')} label="Built-up Area (sqft)" inputType="number" />
            {item.category === 'residential' && (
              <EditableField {...fp('areaDetails.superBuiltUpArea')} label="Super Built-up Area (sqft)" inputType="number" />
            )}
            {['plot_land_residential', 'plot_land_commercial'].includes(item.propertyType || '') && (
              <>
                <EditableField {...fp('areaDetails.plotArea')} label="Plot Area (sqft)" inputType="number" />
                <EditableField {...fp('areaDetails.plotLength')} label="Plot Length (ft)" inputType="number" />
                <EditableField {...fp('areaDetails.plotBreadth')} label="Plot Breadth (ft)" inputType="number" />
              </>
            )}
          </div>
        </SectionCard>

        {/* ─ Pricing ─ */}
        <SectionCard title="Pricing">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <EditableField {...fp('priceDetails.expectedPrice')} label="Expected Price (₹)" inputType="number" />
              {item.priceDetails?.expectedPrice && (
                <p className="text-xs text-gray-400 mt-1 pl-3">
                  = {formatPrice(item.priceDetails.expectedPrice)}
                </p>
              )}
            </div>
            <EditableField {...fp('priceDetails.pricePerSqFt')} label="Price per Sq Ft (₹)" inputType="number" />
          </div>
        </SectionCard>

        {/* ─ Status & Notes ─ */}
        <SectionCard title="Status &amp; Notes">
          <div className="space-y-4">
            <EditableField {...fp('notes')} label="Notes" multiline />
            <EditableField {...fp('remarks')} label="Remarks" multiline />
            <EditableField {...fp('internalNotes')} label="Internal Notes" multiline />
          </div>
        </SectionCard>

        {/* ─ Timestamps ─ */}
        <SectionCard title="Timestamps">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
              <p className="text-sm text-gray-800">
                {item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY, hh:mm A') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Last Updated</p>
              <p className="text-sm text-gray-800">
                {item.updatedAt ? dayjs(item.updatedAt).format('DD MMM YYYY, hh:mm A') : '-'}
              </p>
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
};

export default InventoryDetailPage;
