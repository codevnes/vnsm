// Define the FinancialRatioRecord interface to match the backend model
export interface FinancialRatioRecord {
  id: string;
  symbol: string;
  reportDate: string;
  debtEquity: number | null;
  assetsEquity: number | null;
  debtEquityPct: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Type for filtering Financial Ratio records
export interface FinancialRatioRecordFilters {
  symbol?: string;
  startDate?: string;
  endDate?: string;
}