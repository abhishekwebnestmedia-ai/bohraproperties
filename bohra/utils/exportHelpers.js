const xlsx = require('xlsx');

/**
 * Format property lead for export
 */
const formatPropertyLead = (lead) => {
  return {
    'Client Name': lead.clientName || '',
    'Contact Number': lead.contactNumber || '',
    'Email': lead.email || '',
    'Budget': lead.budget || '',
    'Location': lead.location || '',
    'Project': lead.project || '',
    'Team Lead': lead.teamLead?.name || '',
    'Relationship Manager': lead.relationshipManager?.name || '',
    'Transfer To': lead.transferTo?.name || '',
    'Source': lead.source || '',
    'Stage': lead.stage || '',
    'Status': lead.status || '',
    'Created Date': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    'Follow Up Date': lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    'Notes': lead.notes || '',
    'Remarks': lead.remarks || '',
  };
};

/**
 * Format finance lead for export
 */
const formatFinanceLead = (lead) => {
  return {
    'Client Name': lead.clientName || '',
    'Contact Number': lead.contactNumber || '',
    'Email': lead.email || '',
    'Loan Requirement': lead.loanRequirement || '',
    'Location': lead.location || '',
    'Eligibility': lead.Eligibility || '',
    'Team Lead': lead.teamLead?.name || '',
    'Relationship Manager': lead.relationshipManager?.name || '',
    'Transfer To': lead.transferTo?.name || '',
    'Source': lead.source || '',
    'Status': lead.status || '',
    'Created Date': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    'Follow Up Date': lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    'Notes': lead.notes || '',
    'Remarks': lead.remarks || '',
  };
};

/**
 * Format inventory item for export
 */
const formatInventoryItem = (item) => {
  // Helper to format property type
  const formatPropertyType = (type) => {
    if (!type) return '';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Helper to format ownership
  const formatOwnership = (own) => {
    if (!own) return '';
    return own
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Helper to get area details
  const getAreaDetails = (item) => {
    const parts = [];
    if (item.propertyProfile?.carpetArea) parts.push(`${item.propertyProfile.carpetArea} sqft (C)`);
    if (item.propertyProfile?.superBuiltUpArea) parts.push(`${item.propertyProfile.superBuiltUpArea} sqft (SB)`);
    if (item.propertyProfile?.builtUpArea) parts.push(`${item.propertyProfile.builtUpArea} sqft (B)`);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  // Helper to format price
  const formatPrice = (price) => {
    if (!price) return '';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Schema stores data in nested objects: basicDetails, locationDetails, areaDetails, priceDetails
  const basic = item.basicDetails || {};
  const loc   = item.locationDetails || {};
  const area  = item.areaDetails || {};
  const price = item.priceDetails || {};

  return {
    'Owner Name':        basic.ownerName        || '',
    'Owner Phone':       basic.ownerPhone        || '',
    'Owner Email':       basic.ownerEmail        || '',
    'Co-Owner Name':     basic.coOwnerName       || '',
    'Property Type':     formatPropertyType(item.propertyType),
    'Category':          item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : '',
    'City':              loc.city               || '',
    'Location':          loc.location           || '',
    'Sub Location':      loc.subLocation        || '',
    'Society / Apt':     loc.societyOrApartment || '',
    'Pin Code':          loc.pinCode            || '',
    'Expected Price':    formatPrice(price.expectedPrice),
    'Price / Sq Ft':     price.pricePerSqFt ? `₹${price.pricePerSqFt}` : '',
    'Carpet Area':       area.carpetArea       ? `${area.carpetArea} sqft`       : '',
    'Built Up Area':     area.builtUpArea      ? `${area.builtUpArea} sqft`      : '',
    'Super Built Up':    area.superBuiltUpArea ? `${area.superBuiltUpArea} sqft` : '',
    'Plot Area':         area.plotArea         ? `${area.plotArea} sqft`         : '',
    'Ownership':         item.ownership         || '',
    'Furnishing':        item.furnishing         || '',
    'Availability':      item.availabilityStatus  || '',
    'Property Age':      item.propertyAge         || '',
    'Status':            item.status              || '',
    'Visibility':        item.visibility          || '',
    'Created Date':      item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '',
    'Notes':             item.notes     || '',
    'Remarks':           item.remarks   || '',
  };
};

/**
 * Generate Excel file with properly formatted data
 */
const generateExcel = (data, sheetName = 'Data', dataType = 'property') => {
  try {
    console.log(`   generateExcel invoked type=${dataType} incoming rows=${data.length}`);
    let formattedData;
    if (dataType === 'property') {
      formattedData = data.map((d) => formatPropertyLead(d));
    } else if (dataType === 'finance') {
      formattedData = data.map((d) => formatFinanceLead(d));
    } else if (dataType === 'inventory') {
      formattedData = data.map((d) => formatInventoryItem(d));
    } else {
      formattedData = data;
    }
    console.log(`   formatted rows=${formattedData.length}`);
    if (formattedData.length > 0) {
      console.log('   first formatted record sample', formattedData[0]);
    }

    const worksheet = xlsx.utils.json_to_sheet(formattedData);

    // Compute sensible column widths based on content to avoid Excel showing '###'
    // Widths are capped to a reasonable range so extremely long text doesn't
    // create huge columns. Use `wch` (character width) for XLSX.
    const firstRow = formattedData[0] || {};
    const headers = Object.keys(firstRow);
    const colWidths = headers.map((h) => {
      const headerLen = String(h || '').length;
      let maxLen = headerLen;
      for (let i = 0; i < formattedData.length; i++) {
        const v = formattedData[i][h];
        const s = v == null ? '' : String(v);
        if (s.length > maxLen) maxLen = s.length;
      }
      // add a small padding, clamp between 10 and 60 characters
      const wch = Math.min(Math.max(maxLen + 2, 10), 60);
      return { wch };
    });
    worksheet['!cols'] = colWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
  } catch (error) {
    console.error('Excel generation error:', error);
    throw new Error('Failed to generate Excel file');
  }
};

/**
 * Generate CSV from properly formatted data
 */
const generateCSV = (data, dataType = 'property') => {
  try {
    let formattedData;
    if (dataType === 'property') {
      formattedData = data.map((d) => formatPropertyLead(d));
    } else if (dataType === 'finance') {
      formattedData = data.map((d) => formatFinanceLead(d));
    } else if (dataType === 'inventory') {
      formattedData = data.map((d) => formatInventoryItem(d));
    } else {
      formattedData = data;
    }

    if (formattedData.length === 0) {
      return '';
    }

    // Get all keys from first record (preserve insertion order — do NOT sort)
    const headers = Object.keys(formattedData[0]);

    // Create CSV header row
    const headerRow = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');

    // Create data rows
    const dataRows = formattedData.map((record) => {
      return headers
        .map((header) => {
          const value = record[header] || '';
          // Escape quotes in values
          const escapedValue = String(value).replace(/"/g, '""');
          // Quote values that contain commas, quotes, or newlines
          if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
            return `"${escapedValue}"`;
          }
          return escapedValue;
        })
        .join(',');
    });

    // UTF-8 BOM prefix so Excel opens the file with correct encoding
    return '\uFEFF' + [headerRow, ...dataRows].join('\n');
  } catch (error) {
    console.error('CSV generation error:', error);
    throw new Error('Failed to generate CSV file');
  }
};

module.exports = {
  formatPropertyLead,
  formatFinanceLead,
  formatInventoryItem,
  generateExcel,
  generateCSV,
};
