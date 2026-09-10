/**
 * Exports data to CSV and triggers a download.
 * Compatible with Google Sheets, Microsoft Excel, and standard CSV readers.
 * Supports both:
 *  - exportToCsv(filename, headers, rows)
 *  - exportToCsv(arrayOfObjects, filename)
 */
export function exportToCsv(
  arg1: string | Record<string, any>[],
  arg2?: string | string[],
  arg3?: (string | number | undefined | null)[][]
) {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  let filename = 'export';
  let headers: string[] = [];
  let rows: (string | number | undefined | null)[][] = [];

  if (Array.isArray(arg1)) {
    // Called as: exportToCsv(arrayOfObjects, filename)
    filename = typeof arg2 === 'string' ? arg2 : 'export';
    if (arg1.length > 0) {
      headers = Object.keys(arg1[0]);
      rows = arg1.map(item => headers.map(h => item[h]));
    }
  } else {
    // Called as: exportToCsv(filename, headers, rows)
    filename = arg1;
    headers = (arg2 as string[]) || [];
    rows = arg3 || [];
  }

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM so Excel and Sheets decode accents/currencies properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies table data formatted as tab-separated values (TSV) to clipboard,
 * which pastes directly into Google Sheets cleanly across cells.
 */
export async function copyForGoogleSheets(
  headers: string[],
  rows: (string | number | undefined | null)[][]
): Promise<boolean> {
  try {
    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row =>
        row.map(c => (c !== undefined && c !== null ? String(c) : '')).join('\t')
      ),
    ].join('\n');

    await navigator.clipboard.writeText(tsvContent);
    return true;
  } catch (err) {
    console.error('Failed to copy TSV to clipboard', err);
    return false;
  }
}
