import { useState } from "react";
import { Calendar, Search, Loader2, Edit2, Trash2 } from "lucide-react";
import DropdownSelect from "../../components/common/DropdownSelect";
import RangeToggle from "../../components/common/RangeToggle";
import StatCardWithChart from "../../components/operations/StatCardWithChart";
import SpendingModal from "../../components/modal/SpendingModal";
import { useSpendings, useSpendingStats, useDeleteSpending } from "../../hooks/useSpendings";
import type { SpendingEntry } from "../../services/spendingService";

const ITEMS_PER_PAGE = 10;

const SpendingPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSpending, setSelectedSpending] = useState<SpendingEntry | null>(null);

  // Fetch spending data
  const { data: spendingsData, isLoading: spendingsLoading, error: spendingsError } = useSpendings(currentPage, ITEMS_PER_PAGE, filterType);
  const { data: statsData, isLoading: statsLoading } = useSpendingStats(range);
  const deleteSpending = useDeleteSpending();

  // Calculate stats for cards
  const metaStats = statsData?.data?.find(item => item.type === 'Meta');
  const whatsappStats = statsData?.data?.find(item => item.type === 'WhatsApp');

  // Mock chart data (would come from API in production)
  const metaChartData = [
    { value: 30 }, { value: 45 }, { value: 60 }, { value: 50 }, { value: 75 },
    { value: 65 }, { value: 70 }, { value: 90 }, { value: 75 }, { value: 85 },
  ];

  const whatsappChartData = [
    { value: 40 }, { value: 50 }, { value: 45 }, { value: 70 }, { value: 80 },
    { value: 65 }, { value: 75 }, { value: 95 }, { value: 85 }, { value: 90 },
  ];

  const totalPages = spendingsData?.meta?.pages || 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 10;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage > 5) {
        pages.push(1);
        pages.push("...");
      }

      const start = Math.max(1, currentPage - 4);
      const end = Math.min(totalPages, currentPage + 5);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 5) {
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    if (currentPage > 10) {
      setCurrentPage(Math.max(1, currentPage - 10));
    } else if (currentPage > 1) {
      setCurrentPage(1);
    }
  };

  const handleNext = () => {
    if (currentPage <= totalPages - 10) {
      setCurrentPage(currentPage + 10);
    } else if (currentPage < totalPages) {
      setCurrentPage(totalPages);
    }
  };

  const handleAddSpending = () => {
    setModalMode("add");
    setSelectedSpending(null);
    setModalOpen(true);
  };

  const handleEditSpending = (spending: SpendingEntry) => {
    setModalMode("edit");
    setSelectedSpending(spending);
    setModalOpen(true);
  };

  const handleDeleteSpending = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this spending entry?')) {
      try {
        await deleteSpending.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete spending:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add/Update Spending</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your lead sources and evaluate their performance
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <RangeToggle
            options={[
              { value: 'daily', label: 'Day' },
              { value: 'weekly', label: 'Week' },
              { value: 'monthly', label: 'Month' },
              { value: 'yearly', label: 'Year' },
            ]}
            activeValue={range}
            onChange={(v) => setRange(v as 'daily' | 'weekly' | 'monthly' | 'yearly')}
          />
          <button 
            onClick={handleAddSpending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Add New Spending
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCardWithChart
            title="Meta"
            value={metaStats?.currentAmount ? `${(metaStats.currentAmount / 1000).toFixed(0)}k` : '0'}
            change={metaStats?.changePercent ? `${metaStats.changePercent > 0 ? '+' : ''}${metaStats.changePercent.toFixed(2)}%` : '0%'}
            isPositive={metaStats?.changePercent ? metaStats.changePercent >= 0 : true}
            chartData={metaChartData}
            chartColor="#3b82f6"
          />
          <StatCardWithChart
            title="WhatsApp"
            value={whatsappStats?.currentAmount ? `${(whatsappStats.currentAmount / 1000).toFixed(0)}k` : '0'}
            change={whatsappStats?.changePercent ? `${whatsappStats.changePercent > 0 ? '+' : ''}${whatsappStats.changePercent.toFixed(2)}%` : '0%'}
            isPositive={whatsappStats?.changePercent ? whatsappStats.changePercent >= 0 : true}
            chartData={whatsappChartData}
            chartColor="#10b981"
          />
        </div>
      )}

      {/* Filters and Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex flex-wrap gap-3 p-4 border-b border-gray-200">
          <div style={{ width: "160px" }}>
            <DropdownSelect
              value={filterType}
              onChange={(v) => setFilterType(v)}
              placeholder="Type"
              options={[
                { value: 'Meta', label: 'Meta' },
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Google', label: 'Google' },
                { value: 'Referral', label: 'Referral' },
                { value: '99Acres', label: '99Acres' },
                { value: 'Walk in', label: 'Walk in' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Created</span>
            </button>
          </div>

          <div className="relative">
            <button className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        {spendingsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : spendingsError ? (
          <div className="p-4 m-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-sm text-red-600">Failed to load spending data. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-900">
                      Created
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-900">
                      Author
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-900">
                      Note
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spendingsData?.data && spendingsData.data.length > 0 ? (
                    spendingsData.data.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {entry.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {entry.createdBy.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          ₹{entry.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {entry.note}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditSpending(entry)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSpending(entry._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-sm text-center text-gray-500">
                        No spending entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {spendingsData?.data && spendingsData.data.length > 0 && (
              <div className="flex items-center justify-center gap-1 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev 10
                </button>
                {getPageNumbers().map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-1 text-sm rounded ${
                        page === currentPage
                          ? "text-white bg-gray-900 font-medium"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={handleNext}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next 10
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Spending Modal */}
      <SpendingModal
        key={selectedSpending?._id ?? 'add'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        spending={selectedSpending}
      />
    </div>
  );
};

export default SpendingPage;
