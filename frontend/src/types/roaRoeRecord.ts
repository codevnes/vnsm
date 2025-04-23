// Define the RoaRoeRecord interface to match the backend model
export interface RoaRoeRecord {
  id: string;
  symbol: string;
  reportDate: string;
  roa: number | null;
  roe: number | null;
  roeNganh: number | null;
  roaNganh: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Type for filtering ROA/ROE records
export interface RoaRoeRecordFilters {
  symbol?: string;
  startDate?: string;
  endDate?: string;
} 