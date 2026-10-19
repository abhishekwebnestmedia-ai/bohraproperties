import { useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';

interface ActionMenuProps {
  onExport: () => Promise<void>;
  label?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const ActionMenu = ({ onExport, label = 'Export CSV', isLoading = false, disabled = false }: ActionMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const currentUser = getCurrentUser();
  const role = String(currentUser?.role || '').toUpperCase();
  const canExport = role === 'ADMIN' || role === 'SUPERADMIN';

  if (!canExport) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport();
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isLoading || isExporting}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span>{isExporting ? 'Exporting…' : label}</span>
    </button>
  );
};

export default ActionMenu;
