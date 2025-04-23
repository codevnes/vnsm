// Define the PeRecord interface to match the backend model
export interface PeRecord {
  id: string;
  symbol: string;
  reportDate: string;
  pe: number | null;
  peNganh: number | null;
  peRate: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Type for filtering PE records
export interface PeRecordFilters {
  symbol?: string;
  startDate?: string;
  endDate?: string;
} 