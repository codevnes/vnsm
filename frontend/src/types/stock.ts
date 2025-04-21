/**
 * Represents the structure of a Stock object from the backend.
 * Note: IDs might be strings if converted from BigInt in the backend response.
 */
export interface StockType {
    id: string | number; // Allow string if backend serializes BigInt
    symbol: string;
    name: string;
    exchange: string | null;
    industry: string | null;
    createdAt?: string; // Optional based on API response
    updatedAt?: string; // Optional based on API response
    // Add other fields like postCount if included in API response
}

/**
 * Represents the data needed to create or update a stock.
 */
export type StockInput = Omit<StockType, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Represents the pagination info specifically for stocks list (if different from media).
 */
export interface StockPaginationInfo {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
}

/**
 * Represents the data structure for the stock list API response.
 */
export interface StockListResponse {
    data: StockType[];
    pagination: StockPaginationInfo;
}

/**
 * Represents the data structure for single stock API responses (Get by ID, Create, Update).
 */
export type SingleStockResponse = StockType;

/**
 * Represents the summary returned by the bulk import API.
 */
export interface BulkImportSummary {
    successful: number;
    skipped: number;
    totalCsvRows: number;
}

/**
 * Represents an error detail from the bulk import API.
 */
export interface BulkImportError {
    row: number;
    message: string;
    data?: unknown;
}

/**
 * Represents the data structure for the bulk import API response.
 */
export interface BulkImportResponse {
    message: string;
    summary: BulkImportSummary;
    errors: BulkImportError[];
}

// Define the filters type
export interface StockFilters {
    name?: string;     // Filter by name (case-insensitive, partial match)
    symbol?: string; // Filter by symbol (exact match)
    // Add other potential filters here if needed in the future
}

export type FetchStocksResponse = StockListResponse;

// Basic Stock type definition
export interface Stock {
    id: string; // Assuming BigInt serialized to string
    symbol: string;
    name: string;
    // Add other fields like price, market cap, industry, etc., as needed
    price?: number | null;
    marketCap?: number | null;
    industry?: string | null;
    createdAt?: string;
    updatedAt?: string;
}