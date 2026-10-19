import React, { useState, useRef, useCallback } from 'react';
import Modal from './Modal';
import { propertyLeadsService } from '../../services/propertyLeadsService';
import { financeLeadsService } from '../../services/financeLeadsService';
import { inventoryService } from '../../services/inventoryService';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';

interface Props {
  module: 'property' | 'finance' | 'inventory';
}

// ─── Sample CSV templates ────────────────────────────────────────────

const SAMPLE_HEADERS: Record<string, string[]> = {
  property: [
    'clientName', 'contactNumber', 'email', 'budget', 'location',
    'project', 'propertyType', 'source', 'followUpDate', 'status',
    'notes', 'remarks', 'transferToName',
  ],
  finance: [
    'clientName', 'contactNumber', 'email', 'loanRequirement',
    'location', 'Eligibility', 'source', 'followUpDate', 'status',
    'notes', 'remarks',
  ],
  inventory: [
    'category', 'propertyType', 'status', 'city', 'area', 'subArea',
    'apartmentSociety', 'houseNumber', 'pinCode', 'bedrooms', 'bathrooms',
    'carpetArea', 'builtUpArea', 'expectedPrice', 'furnishing',
    'availabilityStatus', 'ownership', 'ownerName', 'ownerPhone',
    'ownerEmail', 'notes', 'remarks',
  ],
};

const SAMPLE_ROWS: Record<string, string[][]> = {
  property: [
    ['John Doe', '9876543210', 'john@example.com', '50L', 'Gurgaon', 'DLF Phase 5', 'flat_apartment', 'Website', '2025-02-15', 'Follow up', 'Interested in 3BHK', '', ''],
    ['Jane Smith', '9123456789', 'jane@example.com', '1.2Cr', 'Noida', 'ATS Greens', 'independent_house_villa', 'Referral', '2025-02-20', 'New', 'Looking for villa', 'Premium client', ''],
  ],
  finance: [
    ['Rajesh Kumar', '9876543210', 'rajesh@example.com', '30L Home Loan', 'Mumbai', 'Salaried 8LPA', 'MagicBricks', '2025-02-15', 'Follow up', 'Pre-approved by HDFC', ''],
    ['Priya Sharma', '9123456789', 'priya@example.com', '50L Business Loan', 'Delhi', 'Business 15LPA', 'Direct', '2025-02-20', 'New', 'Needs documentation help', ''],
  ],
  inventory: [
    ['residential', 'flat_apartment', 'active', 'Gurgaon', 'Sector 56', 'Golf Course Road', 'DLF Park Place', 'A-1203', '122002', '3', '2', '1200', '1450', '15000000', 'furnished', 'ready_to_move', 'freehold', 'Rajesh Sharma', '9876543210', 'rajesh@email.com', 'Corner unit', 'Premium property'],
    ['commercial', 'office', 'active', 'Noida', 'Sector 62', '', 'iThum Tower', 'B-305', '201309', '', '', '2000', '2400', '25000000', 'semi_furnished', 'ready_to_move', 'leasehold', 'Suresh Gupta', '9123456789', 'suresh@email.com', 'IT corridor', ''],
  ],
};

const MODULE_META: Record<string, { label: string; color: string }> = {
  property:  { label: 'Property Leads', color: 'blue' },
  finance:   { label: 'Finance Leads', color: 'emerald' },
  inventory: { label: 'Inventory',     color: 'purple' },
};

// ─── Component ───────────────────────────────────────────────────────

const BulkUploadButton: React.FC<Props> = ({ module }) => {
  const currentUser = getCurrentUser();
  const role = String(currentUser?.role || '').toUpperCase();
  const canBulkUpload = role === 'ADMIN' || role === 'SUPERADMIN';

  if (!canBulkUpload) return null;

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ inserted: number; failed: number } | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = MODULE_META[module];

  const openModal = () => { setIsOpen(true); setResult(null); setError(''); };
  const closeModal = () => { setIsOpen(false); setFile(null); setResult(null); setError(''); };

  const isValidFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ['csv', 'xls', 'xlsx'].includes(ext || '');
  };

  const handleFile = (f: File) => {
    if (!isValidFile(f)) {
      setError('Only CSV, XLS, or XLSX files are supported.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const onConfirm = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let res: any;
      if (module === 'property') res = await propertyLeadsService.bulkUpload(file);
      else if (module === 'finance') res = await financeLeadsService.bulkUpload(file);
      else res = await inventoryService.bulkUpload(file);

      setResult({
        inserted: res?.summary?.inserted ?? res?.added ?? res?.inserted ?? 0,
        failed: res?.summary?.failed ?? res?.failed ?? 0,
      });
      setFile(null);
    } catch (err: any) {
      console.error('Bulk upload error', err);
      setError(err?.message || 'Bulk upload failed. Please check your file format.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const headers = SAMPLE_HEADERS[module];
    const rows = SAMPLE_ROWS[module];
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => (c.includes(',') ? `"${c}"` : c)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module}_bulk_upload_sample.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  };
  const btnColor = colorMap[meta.color] || colorMap.blue;

  return (
    <div>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Bulk Upload
      </button>

      <Modal isOpen={isOpen} onClose={closeModal} panelClassName="max-w-lg">
        <div className="p-0">
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${btnColor} flex items-center justify-center`}>
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Bulk Upload</h3>
                <p className="text-xs text-gray-500">{meta.label}</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5 space-y-4">
            {/* Download Sample */}
            <button
              onClick={downloadSample}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all group"
            >
              <Download className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">Download Sample Template</p>
                <p className="text-xs text-gray-400">CSV file with correct headers & example rows</p>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">.CSV</span>
            </button>

            {/* Drop Zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : file
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={onFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-70">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium mt-1"
                  >
                    Remove & choose another
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileUp className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Click to browse</span> or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Supports CSV, XLS, XLSX</p>
                  </div>
                </div>
              )}
            </div>

            {/* Result message */}
            {result && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Upload complete</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {result.inserted} records inserted{result.failed > 0 ? `, ${result.failed} failed` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={onConfirm}
                disabled={loading || !file}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4" />Upload File</>
                )}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BulkUploadButton;