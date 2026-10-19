import api from './api';

type ExportFormat = 'csv' | 'excel';

// convert blob to text for error message extraction
const blobToText = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
};

/**
 * Download file from blob data
 */
const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  // Delay URL revocation to allow download to start
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

/**
 * Export Property Leads as CSV or Excel
 */
export const exportPropertyLeads = async (format: ExportFormat = 'csv'): Promise<void> => {
  try {
    const response = await api.get('/pleads/export', {
      params: { format },
      // responseType is blob so we can save whatever comes back
      responseType: 'blob',
    });

    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const timestamp = new Date().getTime();
    const filename = `property-leads-${timestamp}.${ext}`;

    console.log('export blob size', response.data.size, 'bytes');
    downloadFile(response.data, filename);
  } catch (error: any) {
    console.error('Error exporting property leads:', error);
    // axios interceptor transforms responses into Error with message
    const msg = error.message ||
      (error?.response?.data ? await blobToText(error.response.data) : null);
    throw new Error(msg || 'Failed to export property leads. Please try again.');
  }
};

/**
 * Export Finance Leads as CSV or Excel
 */
export const exportFinanceLeads = async (format: ExportFormat = 'csv'): Promise<void> => {
  try {
    const response = await api.get('/fleads/export', {
      params: { format },
      responseType: 'blob',
    });

    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const timestamp = new Date().getTime();
    const filename = `finance-leads-${timestamp}.${ext}`;

    console.log('export blob size', response.data.size, 'bytes');
    downloadFile(response.data, filename);
  } catch (error: any) {
    console.error('Error exporting finance leads:', error);
    const msg = error.message ||
      (error?.response?.data ? await blobToText(error.response.data) : null);
    throw new Error(msg || 'Failed to export finance leads. Please try again.');
  }
};

/**
 * Export Inventory as CSV or Excel
 */
export const exportInventory = async (format: ExportFormat = 'csv'): Promise<void> => {
  try {
    const response = await api.get('/inventory/export', {
      params: { format },
      responseType: 'blob',
    });

    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const timestamp = new Date().getTime();
    const filename = `inventory-${timestamp}.${ext}`;

    console.log('export blob size', response.data.size, 'bytes');
    downloadFile(response.data, filename);
  } catch (error: any) {
    console.error('Error exporting inventory:', error);
    const msg = error.message ||
      (error?.response?.data ? await blobToText(error.response.data) : null);
    throw new Error(msg || 'Failed to export inventory. Please try again.');
  }
};
