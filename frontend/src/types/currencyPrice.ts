// Define the CurrencyPrice interface to match the backend model
export interface CurrencyPrice {
  id: string;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  trend_q: number;
  fq: number;
  createdAt?: string;
  updatedAt?: string;
}

// Type for filtering currency prices
export interface CurrencyPriceFilters {
  symbol?: string;
  startDate?: string;
  endDate?: string;
} 