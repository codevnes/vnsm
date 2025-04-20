import { Stock } from './stock';

// Base StockQIndex interface
export interface StockQIndex {
  id: string;
  stock_id: string;
  date: string;
  open: string | null;
  low: string | null;
  high: string | null;
  trend_q: string | null;
  fq: string | null;
  qv1: string | null;
  band_down: string | null;
  band_up: string | null;
  stock?: Stock;
}

// Input type for creating or updating a StockQIndex
export interface StockQIndexInput {
  stock_id: string | number;
  date: string;
  open?: number | null;
  low?: number | null;
  high?: number | null;
  trend_q?: string | null;
  fq?: string | null;
  qv1?: string | null;
  band_down?: number | null;
  band_up?: number | null;
}

// Response structure for listing StockQIndices
export interface StockQIndexListResponse {
  data: StockQIndex[];
  pagination: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// Response structure for a single StockQIndex with full details
export interface StockQIndexDetailResponse extends StockQIndex {
  stock: {
    id: string;
    symbol: string;
    name: string;
    exchange?: string;
    industry?: string;
  };
}

// Filters for fetching StockQIndices
export interface StockQIndexFilters {
  stock_id?: string | number;
  date_from?: string;
  date_to?: string;
}

// Data structure for bulk importing StockQIndices
export interface StockQIndexBulkImportData {
  qIndices: StockQIndexInput[];
}

// Response from bulk import operation
export interface StockQIndexBulkImportResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
} 