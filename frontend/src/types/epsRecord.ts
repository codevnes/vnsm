// Define the EpsRecord interface to match the backend model
export interface EpsRecord {
  id: string;
  symbol: string;
  reportDate: string;
  eps: number | null;
  epsNganh: number | null;
  epsRate: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Type for filtering EPS records
export interface EpsRecordFilters {
  symbol?: string;
  startDate?: string;
  endDate?: string;
} 