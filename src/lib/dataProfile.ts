import Papa from 'papaparse';
import type { ColumnProfile, DataProfile, ColumnType } from '@/types/dashboard';

/**
 * Determines the column type based on sample values
 */
function detectColumnType(values: string[]): ColumnType {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonEmptyValues.length === 0) {
    return 'unknown';
  }

  // Check if all values are numeric
  const numericCount = nonEmptyValues.filter(v => !isNaN(Number(v)) && v.trim() !== '').length;
  const numericRatio = numericCount / nonEmptyValues.length;

  if (numericRatio > 0.8) {
    return 'numeric';
  }

  // Check if values look like dates
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO date
    /^\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY or DD/MM/YYYY
    /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    /^\d{1,2}-\d{1,2}-\d{4}/, // MM-DD-YYYY or DD-MM-YYYY
  ];

  const dateCount = nonEmptyValues.filter(v => {
    return datePatterns.some(pattern => pattern.test(v)) || !isNaN(Date.parse(v));
  }).length;
  const dateRatio = dateCount / nonEmptyValues.length;

  if (dateRatio > 0.7) {
    return 'datetime';
  }

  // Check for categorical (limited unique values)
  const uniqueValues = new Set(nonEmptyValues);
  const uniqueRatio = uniqueValues.size / nonEmptyValues.length;

  if (uniqueRatio < 0.5 && uniqueValues.size < 20) {
    return 'categorical';
  }

  // Default to text
  return 'text';
}

/**
 * Profiles a CSV file and returns column metadata
 */
export function profileCSV(csvContent: string): DataProfile {
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep all values as strings for analysis
  });

  const data = parseResult.data as Record<string, string>[];
  const rowCount = data.length;
  const columnNames = Object.keys(data[0] || {});

  const columns: ColumnProfile[] = columnNames.map(name => {
    // Collect all values for this column
    const values = data.map(row => row[name]);

    // Calculate missing rate
    const missingCount = values.filter(v =>
      v === null || v === undefined || v === '' || v === 'null' || v === 'undefined'
    ).length;
    const missingRate = missingCount / rowCount;

    // Get sample values (non-empty, up to 10)
    const nonEmptyValues = values.filter(v =>
      v !== null && v !== undefined && v !== '' && v !== 'null' && v !== 'undefined'
    );
    const sampleValues = nonEmptyValues.slice(0, 10);

    // Count unique values
    const uniqueCount = new Set(nonEmptyValues).size;

    // Detect column type
    const type = detectColumnType(values);

    return {
      name,
      type,
      sampleValues,
      missingRate,
      uniqueCount,
    };
  });

  return {
    columns,
    rowCount,
  };
}

/**
 * Parses CSV content and returns the data as an array of objects
 */
export function parseCSV(csvContent: string): Record<string, any>[] {
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // Automatically convert numeric values
  });

  return parseResult.data as Record<string, any>[];
}
