import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import DropdownSelect from '../../components/common/DropdownSelect';
import DateTimePickerInput from '../../components/common/DateTimePickerInput';
import { usePropertyLead, useUpdatePropertyLead } from '../../hooks/usePropertyLeads';
import { useFinanceLead, useUpdateFinanceLead } from '../../hooks/useFinanceLeads';
import { useUsers } from '../../hooks/useUsers';
import type { PropertyLead } from '../../services/propertyLeadsService';
import type { FinanceLead } from '../../services/financeLeadsService';

/* ─── Option lists ────────────────────────────────────────────────────────── */
const propertyStageOpts = [
  { value: 'Lead', label: 'Lead' },
  { value: 'Token', label: 'Token' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Dead', label: 'Dead' },
];
const propertyStatusOpts = [
  { value: 'Follow up', label: 'Follow Up' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Busy', label: 'Busy' },
];
const financeStatusOpts = [
  { value: 'Dead', label: 'Dead' },
  { value: 'Follow up', label: 'Follow Up' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Busy', label: 'Busy' },
  { value: 'Closed', label: 'Closed' },
];
const sourceOpts = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Meta', label: 'Meta' },
  { value: '99Acres', label: '99Acres' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Walk in', label: 'Walk in' },
  { value: 'Google', label: 'Google' },
  { value: 'Other', label: 'Other' },
];
const propertyTypeOpts = [
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Residential', label: 'Residential' },
];

/* ─── Section card ────────────────────────────────────────────────────────── */
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

/* ─── Editable text / textarea field ─────────────────────────────────────── */
function EditableField({
  fieldKey, label, value, editedValues, editingField, setEditingField, setEditedValues, multiline = false,
}: {
  fieldKey: string; label: string; value: any;
  editedValues: Record<string, any>;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  setEditedValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  multiline?: boolean;
}) {
  const edited = editedValues[fieldKey];
  const display = edited !== undefined ? edited : value;
  const isDirty = edited !== undefined;
  const isEditing = editingField === fieldKey;

  return (
    <div className="group/field">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        multiline ? (
          <textarea
            autoFocus rows={3}
            className="w-full px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none resize-none"
            value={display ?? ''}
            onChange={(e) => setEditedValues((p) => ({ ...p, [fieldKey]: e.target.value }))}
            onBlur={() => setEditingField(null)}
          />
        ) : (
          <input
            autoFocus type="text"
            className="w-full px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none"
            value={display ?? ''}
            onChange={(e) => setEditedValues((p) => ({ ...p, [fieldKey]: e.target.value }))}
            onBlur={() => setEditingField(null)}
          />
        )
      ) : (
        <div
          onClick={() => setEditingField(fieldKey)}
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
            isDirty ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-800'
          }`}
          title="Click to edit"
        >
          <span className={!display ? 'text-gray-400' : ''}>{display || '-'}</span>
          <Pencil className="w-3 h-3 text-gray-300 group-hover/field:text-gray-500 shrink-0 ml-2 opacity-0 group-hover/field:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}

/* ─── Editable select field ───────────────────────────────────────────────── */
function EditableSelect({
  fieldKey, label, value, options, editedValues, editingField, setEditingField, setEditedValues, disabled = false,
}: {
  fieldKey: string; label: string; value: any;
  options: { value: string; label: string }[];
  editedValues: Record<string, any>;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  setEditedValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  disabled?: boolean;
}) {
  const edited = editedValues[fieldKey];
  const displayVal = edited !== undefined ? edited : value;
  const isDirty = edited !== undefined;
  const isEditing = editingField === fieldKey;
  const matchedLabel = options.find((o) => o.value === displayVal)?.label ?? displayVal;

  return (
    <div className="group/field">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        <DropdownSelect
          autoFocus
          value={displayVal ?? ''}
          onChange={(v) => { setEditedValues((p) => ({ ...p, [fieldKey]: v })); setEditingField(null); }}
          onBlur={() => setEditingField(null)}
          placeholder="— Select —"
          options={options}
        />
      ) : (
        <div
          onClick={() => {
            if (disabled) return;
            setEditingField(fieldKey);
          }}
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors ${
            disabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
              : isDirty
                ? 'cursor-pointer border-blue-300 bg-blue-50 text-blue-900'
                : 'cursor-pointer border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-800'
          }`}
          title={disabled ? 'Locked for this lead state' : 'Click to edit'}
        >
          <span className={!displayVal ? 'text-gray-400' : ''}>{matchedLabel || '-'}</span>
          {!disabled && (
            <Pencil className="w-3 h-3 text-gray-300 group-hover/field:text-gray-500 shrink-0 ml-2 opacity-0 group-hover/field:opacity-100 transition-opacity" />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Editable datetime field ─────────────────────────────────────────────── */
function EditableDateField({
  fieldKey, label, value, editedValues, editingField, setEditingField, setEditedValues,
}: {
  fieldKey: string; label: string; value: any;
  editedValues: Record<string, any>;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  setEditedValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}) {
  const edited = editedValues[fieldKey];
  const displayVal = edited !== undefined ? edited : value;
  const isDirty = edited !== undefined;
  const isEditing = editingField === fieldKey;

  return (
    <div className="group/field">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {isEditing ? (
        <DateTimePickerInput
          value={displayVal ?? ''}
          onChange={(iso) => { setEditedValues((p) => ({ ...p, [fieldKey]: iso })); setEditingField(null); }}
          placeholder="Pick date & time"
        />
      ) : (
        <div
          onClick={() => setEditingField(fieldKey)}
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
            isDirty ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-800'
          }`}
          title="Click to edit"
        >
          <span className={!displayVal ? 'text-gray-400' : ''}>
            {displayVal ? dayjs(displayVal).format('DD MMM YYYY, hh:mm A') : '-'}
          </span>
          <Pencil className="w-3 h-3 text-gray-300 group-hover/field:text-gray-500 shrink-0 ml-2 opacity-0 group-hover/field:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}

/* ─── Read-only display field ─────────────────────────────────────────────── */
function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="px-3 py-2 text-sm text-gray-800 bg-gray-50 rounded-lg border border-transparent">
        {value || '-'}
      </div>
    </div>
  );
}

/* ─── Stage Badge ─────────────────────────────────────────────────────────── */
const stageBadgeColors: Record<string, string> = {
  Lead: 'bg-blue-100 text-blue-700',
  Token: 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
};

/* ─── Main page ───────────────────────────────────────────────────────────── */
const LeadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const domain = (searchParams.get('type') ?? 'property') as 'property' | 'finance';

  /* Fetch */
  const { data: propResponse, isLoading: propLoading } = usePropertyLead(
    domain === 'property' && id ? id : ''
  );
  const { data: finResponse, isLoading: finLoading } = useFinanceLead(
    domain === 'finance' && id ? id : ''
  );

  const isLoading = domain === 'property' ? propLoading : finLoading;
  const rawLead = domain === 'property'
    ? (propResponse?.data ?? (propResponse as any)?.lead)
    : (finResponse?.data ?? (finResponse as any)?.lead);
  const pl = rawLead as PropertyLead | undefined;
  const fl = rawLead as FinanceLead | undefined;

  /* Users for assignment dropdowns */
  const { data: usersData } = useUsers();
  const teamLeadOpts = useMemo(() =>
    (usersData?.users ?? []).filter(u => u.role === 'teamlead' && u.domain === domain)
      .flatMap((u) => [
        { value: u._id, label: u.name },
        { value: u.name, label: u.name },
      ]),
    [usersData, domain]
  );
  const rmOpts = useMemo(() =>
    (usersData?.users ?? []).filter(u => (u.role === 'employee' || u.role === 'rm') && u.domain === domain)
      .flatMap((u) => [
        { value: u._id, label: u.name },
        { value: u.name, label: u.name },
      ]),
    [usersData, domain]
  );

  const getRelationValue = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value._id) return value._id;
    if (value.id) return value.id;
    if (value.name) return value.name;
    return '';
  };
  /* Edit state */
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const updateProperty = useUpdatePropertyLead();
  const updateFinance = useUpdateFinanceLead();
  const isPending = domain === 'property' ? updateProperty.isPending : updateFinance.isPending;
  const hasPendingChanges = Object.keys(editedValues).length > 0;

  const editProps = { editedValues, editingField, setEditingField, setEditedValues };

  const handleSave = async () => {
    if (!id || !hasPendingChanges) return;
    setSaveError('');
    try {
      if (domain === 'property') {
        await updateProperty.mutateAsync({ id, data: editedValues });
      } else {
        await updateFinance.mutateAsync({ id, data: editedValues });
      }
      setEditedValues({});
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Save failed');
    }
  };

  /* ── Loading / error ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!rawLead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <p>Lead not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const stageBadge = pl?.stage ? stageBadgeColors[pl.stage] ?? 'bg-gray-100 text-gray-600' : '';
  const effectiveFinanceStatus = editedValues.status !== undefined ? editedValues.status : fl?.status;
  const effectivePropertyStage = editedValues.stage !== undefined ? editedValues.stage : pl?.stage;

  const isStatusLocked = domain === 'finance'
    ? effectiveFinanceStatus === 'Dead' || effectiveFinanceStatus === 'Closed'
    : effectivePropertyStage === 'Completed' || effectivePropertyStage === 'Dead';

  return (
    <div>
      {/* ─ Top Bar ─ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{rawLead.clientName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500 capitalize">{domain} Lead</span>
              {pl?.stage && (
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${stageBadge}`}>
                  {pl.stage}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveError && <span className="text-sm text-red-500">{saveError}</span>}
          <button
            onClick={handleSave}
            disabled={!hasPendingChanges || isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ─ Content Grid ─ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ── Client Info ── */}
        <SectionCard title="Client Info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditableField fieldKey="clientName" label="Client Name *" value={pl?.clientName ?? fl?.clientName} {...editProps} />
            <EditableField fieldKey="contactNumber" label="Contact Number *" value={pl?.contactNumber ?? fl?.contactNumber} {...editProps} />
            <EditableField fieldKey="email" label="Email" value={pl?.email ?? fl?.email} {...editProps} />
            {domain === 'property' ? (
              <>
                <EditableField fieldKey="budget" label="Budget" value={pl?.budget} {...editProps} />
                <EditableSelect fieldKey="propertyType" label="Property Type" value={pl?.propertyType} options={propertyTypeOpts} {...editProps} />
              </>
            ) : (
              <>
                <EditableField fieldKey="loanRequirement" label="Loan Requirement" value={fl?.loanRequirement} {...editProps} />
                <EditableField fieldKey="eligibility" label="Eligibility" value={fl?.eligibility} {...editProps} />
              </>
            )}
            <EditableField fieldKey="location" label="Location" value={pl?.location ?? fl?.location} {...editProps} />
            <EditableField fieldKey="project" label="Project" value={pl?.project ?? fl?.project} {...editProps} />
          </div>
        </SectionCard>

        {/* ── Status Info ── */}
        <SectionCard title="Status Info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {domain === 'property' && (
              <EditableSelect
                fieldKey="stage" label="Stage"
                value={pl?.stage}
                options={propertyStageOpts}
                {...editProps}
              />
            )}
            <EditableSelect
              fieldKey="status" label="Activity Status"
              value={pl?.status ?? fl?.status}
              options={domain === 'property' ? propertyStatusOpts : financeStatusOpts}
              disabled={isStatusLocked}
              {...editProps}
            />
            <EditableDateField fieldKey="followUpDate" label="Follow Up Date" value={pl?.followUpDate ?? fl?.followUpDate} {...editProps} />
            <ReadField label="Created At" value={rawLead.createdAt ? dayjs(rawLead.createdAt).format('DD MMM YYYY, hh:mm A') : undefined} />
            <EditableSelect
              fieldKey="source" label="Source"
              value={pl?.source ?? fl?.source}
              options={sourceOpts}
              {...editProps}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <EditableField fieldKey="notes" label="Notes" value={pl?.notes ?? fl?.notes} multiline {...editProps} />
            <EditableField fieldKey="remarks" label="Remarks" value={pl?.remarks ?? fl?.remarks} multiline {...editProps} />
          </div>
        </SectionCard>

        {/* ── Work Info ── */}
        <SectionCard title="Work Info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditableSelect fieldKey="teamLead" label="Team Lead" value={getRelationValue(rawLead.teamLead)} options={teamLeadOpts} {...editProps} />
            <EditableSelect fieldKey="relationshipManager" label="Relationship Manager" value={getRelationValue(rawLead.relationshipManager)} options={rmOpts} {...editProps} />
          </div>
        </SectionCard>

        {/* ── Meta ── */}
        <SectionCard title="Record Info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadField label="Created By" value={rawLead.createdBy?.name} />
            <ReadField label="Created At" value={rawLead.createdAt ? dayjs(rawLead.createdAt).format('DD MMM YYYY') : undefined} />
            <ReadField label="Last Updated" value={rawLead.updatedAt ? dayjs(rawLead.updatedAt).format('DD MMM YYYY, hh:mm A') : undefined} />
            <ReadField label="Lead ID" value={rawLead._id} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default LeadDetailPage;
