import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import dayjs from 'dayjs';
import DropdownSelect from '../../components/common/DropdownSelect';
import ToggleButton from '../../components/common/ToggleButton';
import ActionMenu from '../../components/common/ActionMenu';
import BulkUploadButton from '../../components/common/BulkUploadButton';
import FilterWidgetMenu from '../../components/common/FilterWidgetMenu';
import { useInventory, useInventoryItem, useUpdateInventory, useDeleteInventory, useBulkDeleteInventory } from '../../hooks/useInventory';
import { exportInventory } from '../../services/exportService';
import type { InventoryItem, GetInventoryParams, UpdateInventoryData } from '../../services/inventoryService';

const categoryOptions = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

const formatPrice = (price?: number) => {
  if (!price) return '-';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

const formatArea = (item: InventoryItem) => {
  const a = item.areaDetails;
  if (!a) return '-';
  const parts: string[] = [];
  if (a.carpetArea) parts.push(`${a.carpetArea} sqft (C)`);
  if (a.superBuiltUpArea) parts.push(`${a.superBuiltUpArea} sqft (SB)`);
  if (a.builtUpArea) parts.push(`${a.builtUpArea} sqft (B)`);
  return parts.length > 0 ? parts.join(', ') : '-';
};

const formatPropertyType = (type?: string) =>
  type ? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

const formatOwnership = (own?: string) =>
  own ? own.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

const InventoryPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'residential' | 'commercial'>('residential');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);

  // Sort state
  const [sortByCol, setSortByCol] = useState<'createdAt' | 'priceDetails.expectedPrice'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: 'createdAt' | 'priceDetails.expectedPrice') => {
    if (sortByCol === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortByCol(col); setSortOrder('desc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortByCol !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-gray-700" />
      : <ChevronDown className="w-3 h-3 ml-1 text-gray-700" />;
  };



  const RESIDENTIAL_TYPES = [
    'flat_apartment', 'builder_floor', 'independent_house_villa',
    'plot_land_residential', 'studio_apartment', 'serviced_apartment',
    'farmhouse', 'residential_other',
  ];
  const COMMERCIAL_TYPES = [
    'office', 'retail', 'plot_land_commercial',
    'storage', 'industry', 'hospitality', 'commercial_other',
  ];

  const filterSections = [
    { key: 'status', label: 'Status', items: ['active', 'inactive', 'sold', 'withdrawn', 'pending'] },
    { key: 'propertyType', label: 'Property Type', items: activeCategory === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES },
  ];

  const handleFilterToggle = (sectionKey: string, value: string) => {
    if (sectionKey === 'status') {
      setSelectedStatuses((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else if (sectionKey === 'propertyType') {
      setSelectedPropertyTypes((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  const handleClearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedPropertyTypes([]);
  };

  const activeFilterCount = selectedStatuses.length + selectedPropertyTypes.length;

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailPanelMounted, setDetailPanelMounted] = useState(false);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<UpdateInventoryData>({});

  // Widget (filter) state - now using FilterWidgetMenu component
  // (widgetOpen and widgetRef removed)

  const apiParams: GetInventoryParams = {
    category: activeCategory,
    page,
    limit: 10,
    status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
    propertyType: selectedPropertyTypes.length > 0 ? selectedPropertyTypes[0] : undefined,
    search: searchQuery || undefined,
    sortBy: sortByCol,
    order: sortOrder,
  };

  const { data: inventoryResponse, isLoading, error } = useInventory(apiParams);
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const bulkDeleteMutation = useBulkDeleteInventory();

  const items = inventoryResponse?.data || [];
  const meta = inventoryResponse?.meta;

  const { data: selectedItemResponse } = useInventoryItem(selectedItem ?? '');
  const selectedItemDetails = selectedItemResponse?.data ?? (selectedItem ? items.find((i) => i._id === selectedItem) ?? null : null);

  // Reset propertyType filter when category changes
  useEffect(() => {
    setPage(1);
    setSelectedPropertyTypes([]);
    setSelectedIds([]);
  }, [activeCategory]);

  // Reset page + selectedIds when search/sort/status filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [searchQuery, sortByCol, sortOrder, selectedStatuses]);

  const openDetailPanel = (id: string) => {
    setSelectedItem(id);
    setEditedValues({});
    setEditingField(null);
    setDetailPanelMounted(true);
    requestAnimationFrame(() => setDetailPanelVisible(true));
  };

  const closeDetailPanel = () => {
    setDetailPanelVisible(false);
    setEditingField(null);
    setEditedValues({});
    window.setTimeout(() => {
      setDetailPanelMounted(false);
      setSelectedItem(null);
    }, 300);
  };

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

  const renderEditableField = (
    path: string,
    initialValue: unknown,
    multiline: boolean,
    inputType: 'text' | 'number' = 'text'
  ) => {
    const edited = getValueAtPath(editedValues, path);
    const valueToShow = edited !== undefined ? edited : initialValue;

    if (editingField === path) {
      if (multiline) {
        const strValue = valueToShow == null ? '' : typeof valueToShow === 'string' ? valueToShow : String(valueToShow);
        return (
          <textarea
            autoFocus
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
            value={strValue}
            onBlur={() => setEditingField(null)}
            rows={3}
            onChange={(e) => setEditedValues((prev) => setValueAtPath(prev, path, e.target.value))}
          />
        );
      }

      const inputValue =
        inputType === 'number'
          ? (typeof valueToShow === 'number' ? valueToShow : valueToShow == null || valueToShow === '' ? '' : Number(valueToShow))
          : valueToShow == null
            ? ''
            : typeof valueToShow === 'string'
              ? valueToShow
              : String(valueToShow);

      return (
        <input
          autoFocus
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
          value={inputValue}
          onBlur={() => setEditingField(null)}
          type={inputType}
          onChange={(e) => {
            const raw = e.target.value;
            const nextValue =
              inputType === 'number' ? (raw.trim() === '' ? undefined : Number(raw)) : raw;
            setEditedValues((prev) => setValueAtPath(prev, path, nextValue));
          }}
        />
      );
    }

    const display =
      valueToShow === null || valueToShow === undefined || valueToShow === ''
        ? '-'
        : String(valueToShow);

    return (
      <div
        className="text-sm text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -mx-2"
        onClick={() => setEditingField(path)}
      >
        {display}
      </div>
    );
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    if (Object.keys(editedValues).length === 0) return;

    try {
      await updateMutation.mutateAsync({ id: selectedItem, data: editedValues });
      setEditedValues({});
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteMutation.mutateAsync(selectedItem);
      closeDetailPanel();
    } catch (err) {
      console.error('Failed to delete inventory:', err);
    }
  };

  

  // Filter items by search query client-side — search is now handled server-side, keep as identity pass-through
  const filteredItems = items;

  // Export CSV
  const handleInventoryExport = useCallback(() => exportInventory('csv'), []);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <ActionMenu onExport={handleInventoryExport} />
          <BulkUploadButton module="inventory" />
          <button
            onClick={() => navigate('/inventory/add')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Inventory</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 py-2 mt-4 bg-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FilterWidgetMenu
              sections={filterSections}
              selected={{ status: selectedStatuses, propertyType: selectedPropertyTypes }}
              onToggle={handleFilterToggle}
              onClearAll={handleClearAllFilters}
              activeCount={activeFilterCount}
            />
          </div>

          {/* Category toggle */}
          
            <ToggleButton
              options={categoryOptions}
              activeValue={activeCategory}
              onChange={(v) => setActiveCategory(v as 'residential' | 'commercial')}
            />
          

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-1 w-full sm:w-auto min-w-50 border border-gray-300 rounded-md px-2 py-1.5 bg-white">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search city, area, name…"
              className="flex-1 min-w-20 outline-none text-sm"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 leading-none text-base">&times;</button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border-b border-red-200">
          <span className="text-sm text-red-700 font-medium">{selectedIds.length} selected</span>
          <button
            onClick={async () => { await bulkDeleteMutation.mutateAsync(selectedIds); setSelectedIds([]); }}
            disabled={bulkDeleteMutation.isPending}
            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button onClick={() => setSelectedIds([])} className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 flex flex-col justify-between rounded-bl-lg rounded-br-lg max-h-[55vh]">
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="border-gray-300 rounded"
                    checked={filteredItems.length > 0 && filteredItems.every((i) => selectedIds.includes(i._id))}
                    onChange={(e) => setSelectedIds(e.target.checked ? filteredItems.map((i) => i._id) : [])}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Owner Name</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Contact Number</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Email</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                  {activeCategory === 'residential' ? 'Residential Type' : 'Commercial Type'}
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">City / Location</th>
                <th
                  className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort('priceDetails.expectedPrice')}
                >
                  <span className="inline-flex items-center">Expected Price <SortIcon col="priceDetails.expectedPrice" /></span>
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Area Details</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Ownership</th>
                <th
                  className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort('createdAt')}
                >
                  <span className="inline-flex items-center">Date <SortIcon col="createdAt" /></span>
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">Notes</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap min-w-64">Remarks</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    Loading inventory…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-red-500">
                    Error loading inventory: {(error as any).message}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    No inventory found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className={`group hover:bg-gray-50 cursor-pointer ${selectedItem === item._id ? 'bg-gray-100' : ''}`}
                    onDoubleClick={() => openDetailPanel(item._id)}
                    title="Double-click to open details"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="border-gray-300 rounded"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => setSelectedIds((prev) => prev.includes(item._id) ? prev.filter((i) => i !== item._id) : [...prev, item._id])}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    {/* Owner Name */}
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{item.basicDetails?.ownerName || '-'}</td>
                    {/* Contact Number */}
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{item.basicDetails?.ownerPhone || '-'}</td>
                    {/* Email */}
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{item.basicDetails?.ownerEmail || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {formatPropertyType(item.propertyType)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {[item.locationDetails?.city, item.locationDetails?.location].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatPrice(item.priceDetails?.expectedPrice)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatArea(item)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatOwnership(item.ownership)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY') : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-40 truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 min-w-64 max-w-72 truncate">
                      {item.remarks || '-'}
                    </td>
                    <td
                      className="px-2 py-4 w-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => navigate(`/inventory/${item._id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        title="View details"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {meta ? `${meta.total} total` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: meta?.totalPages || 1 }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${p === page ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, meta?.totalPages || 1))}
              disabled={page === (meta?.totalPages || 1)}
              className="p-2 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {detailPanelMounted && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-200 ${
              detailPanelVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeDetailPanel}
          />

          {/* Sliding Panel */}
          <div
            className={`fixed right-0 top-0 h-full w-full sm:w-104 bg-white shadow-2xl z-70 transform transition-transform duration-300 ${
              detailPanelVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold">Inventory Details</h2>
                  {selectedItemDetails && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full mt-1 ${
                        selectedItemDetails.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : selectedItemDetails.status === 'sold'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {selectedItemDetails.status || 'unknown'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={Object.keys(editedValues).length === 0 || updateMutation.isPending}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-hidden">
                {selectedItemDetails && (
                  <>
                    {/* Owner Details */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Owner Details</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Owner Name</label>
                          {renderEditableField('basicDetails.ownerName', selectedItemDetails.basicDetails?.ownerName, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Owner Phone</label>
                          {renderEditableField('basicDetails.ownerPhone', selectedItemDetails.basicDetails?.ownerPhone, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Alternate Phone</label>
                          {renderEditableField('basicDetails.ownerAlternatePhone', selectedItemDetails.basicDetails?.ownerAlternatePhone, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Owner Email</label>
                          {renderEditableField('basicDetails.ownerEmail', selectedItemDetails.basicDetails?.ownerEmail, false)}
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500">Owner Address</label>
                          {renderEditableField('basicDetails.ownerAddress', selectedItemDetails.basicDetails?.ownerAddress, false)}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Location</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">City</label>
                          {renderEditableField('locationDetails.city', selectedItemDetails.locationDetails?.city, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Area / Location</label>
                          {renderEditableField('locationDetails.location', selectedItemDetails.locationDetails?.location, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Sub Area</label>
                          {renderEditableField('locationDetails.subLocation', selectedItemDetails.locationDetails?.subLocation, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Society</label>
                          {renderEditableField('locationDetails.societyOrApartment', selectedItemDetails.locationDetails?.societyOrApartment, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">House No.</label>
                          {renderEditableField('locationDetails.houseNumber', selectedItemDetails.locationDetails?.houseNumber, false)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Pin Code</label>
                          {renderEditableField('locationDetails.pinCode', selectedItemDetails.locationDetails?.pinCode, false)}
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Property Info</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Category</label>
                            <div className="text-sm text-gray-800 capitalize">{selectedItemDetails.category}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Type</label>
                            <div className="text-sm text-gray-800">{formatPropertyType(selectedItemDetails.propertyType)}</div>
                          </div>
                          {selectedItemDetails.category === 'residential' && (
                            <>
                              <div>
                                <label className="text-xs text-gray-500">Bedrooms</label>
                                {renderEditableField('roomDetails.bedrooms', selectedItemDetails.roomDetails?.bedrooms, false, 'number')}
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Bathrooms</label>
                                {renderEditableField('roomDetails.bathrooms', selectedItemDetails.roomDetails?.bathrooms, false, 'number')}
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Furnishing</label>
                                {renderEditableField('furnishing', (selectedItemDetails as any).furnishing, false)}
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Ownership</label>
                                {renderEditableField('ownership', (selectedItemDetails as any).ownership, false)}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Carpet Area</label>
                            {renderEditableField(
                            'areaDetails.carpetArea',
                            selectedItemDetails.areaDetails?.carpetArea,
                            false,
                            'number'
                          )}
                        </div>
                          {selectedItemDetails.category === 'residential' && (
                            <div>
                              <label className="text-xs text-gray-500">Super Built-up</label>
                              {renderEditableField('areaDetails.superBuiltUpArea', selectedItemDetails.areaDetails?.superBuiltUpArea, false, 'number')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Pricing</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Expected Price (₹)</label>
                          {renderEditableField(
                            'priceDetails.expectedPrice',
                            selectedItemDetails.priceDetails?.expectedPrice,
                            false,
                            'number'
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Price per Sq Ft (₹)</label>
                          {renderEditableField(
                            'priceDetails.pricePerSqFt',
                            selectedItemDetails.priceDetails?.pricePerSqFt,
                            false,
                            'number'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Notes */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Status & Notes</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Status</label>
                          {editingField === 'status' ? (
                            <DropdownSelect
                              autoFocus
                              value={(editedValues.status ?? selectedItemDetails.status) || 'active'}
                              onChange={(v) => setEditedValues((prev) => ({ ...prev, status: v as any }))}
                              onBlur={() => setEditingField(null)}
                              options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'sold', label: 'Sold' },
                                { value: 'withdrawn', label: 'Withdrawn' },
                                { value: 'pending', label: 'Pending' },
                              ]}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -mx-2"
                              onClick={() => setEditingField('status')}
                            >
                              <span
                                className={`w-2 h-2 rounded-full inline-block ${
                                  selectedItemDetails.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                              <span className="text-sm capitalize">
                                {editedValues.status ?? selectedItemDetails.status ?? '-'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Notes</label>
                          {renderEditableField('notes', selectedItemDetails.notes, true)}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Remarks</label>
                          {renderEditableField('remarks', selectedItemDetails.remarks, true)}
                        </div>
                      </div>
                    </div>

                    {/* History removed */}
                  </>
                )}
              </div>
              {selectedItemDetails && (
                <div className="p-4 border-t border-gray-100 shrink-0">
                  <button
                    onClick={() => navigate(`/inventory/${selectedItemDetails._id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span>View Complete Inventory</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryPage;
