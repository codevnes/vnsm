// frontend/src/services/stockService.ts
import {
    StockListResponse,
    SingleStockResponse,
    StockInput,
    BulkImportResponse,
    StockFilters
} from '@/types/stock';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Generic fetch helper (consider moving to a shared lib/utils if used elsewhere)
 */
async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
        const response = await fetch(url, options);
        if (response.status === 204) { // Handle No Content for DELETE
            return undefined as T;
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || response.statusText || `HTTP error! status: ${response.status}`);
        }
        return data as T;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error; // Re-throw for handling in hooks/components
    }
}

/**
 * Stock Service - contains all stock-related API functions
 */
export const stockService = {
    /**
     * Fetches a single stock by ID
     */
    getStockById: async (id: string | number, token: string | null = null): Promise<any> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        return fetchAPI(`${API_URL}/stocks/${id}`, {
            method: 'GET',
            headers,
        });
    },

    /**
     * Fetches a single stock by symbol
     */
    getStockBySymbol: async (symbol: string, token: string | null = null): Promise<any> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        return fetchAPI(`${API_URL}/stocks/symbol/${symbol}`, {
            method: 'GET',
            headers,
        });
    },

    /**
     * Search stocks by keyword (searches in both symbol and name)
     */
    searchStocks: async (keyword: string, page: number = 1, limit: number = 10, sortBy: string = 'symbol', sortOrder: string = 'asc', token: string | null = null): Promise<StockListResponse> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        // Build query parameters
        const params = new URLSearchParams();
        params.append('keyword', keyword);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        const queryString = params.toString();

        return fetchAPI<StockListResponse>(`${API_URL}/stocks/search?${queryString}`, {
            method: 'GET',
            headers,
        });
    },

    /**
     * Fetches a paginated list of stocks.
     */
    fetchStocks: (page: number, limit: number, token: string | null, filters: StockFilters = {}): Promise<StockListResponse> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        // Add filters to query params if they exist
        if (filters.name) {
            params.append('name', filters.name);
        }
        if (filters.symbol) {
            params.append('symbol', filters.symbol);
        }
        // Add other filters here...

        const queryString = params.toString();

        return fetchAPI<StockListResponse>(`${API_URL}/stocks?${queryString}`, {
            method: 'GET',
            headers,
        });
    },

    /**
     * Creates a new stock.
     */
    createStock: (stockData: StockInput, token: string | null): Promise<SingleStockResponse> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        return fetchAPI<SingleStockResponse>(`${API_URL}/stocks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(stockData),
        });
    },

    /**
     * Updates an existing stock.
     */
    updateStock: (id: string | number, stockData: Partial<StockInput>, token: string | null): Promise<SingleStockResponse> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        return fetchAPI<SingleStockResponse>(`${API_URL}/stocks/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(stockData),
        });
    },

    /**
     * Deletes a stock by its ID.
     */
    deleteStock: (id: string | number, token: string | null): Promise<void> => {
        const headers: HeadersInit = {
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        return fetchAPI<void>(`${API_URL}/stocks/${id}`, {
            method: 'DELETE',
            headers,
        });
    },

    /**
     * Imports stocks from a CSV file.
     */
    bulkImportStocks: (formData: FormData, token: string | null): Promise<BulkImportResponse> => {
        const headers: HeadersInit = {
             // No Content-Type for FormData
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        return fetchAPI<BulkImportResponse>(`${API_URL}/stocks/bulk-import`, {
            method: 'POST',
            headers,
            body: formData,
        });
    }
};

// Keep the individual function exports for backward compatibility
export const fetchStocksAPI = stockService.fetchStocks;
export const createStockAPI = stockService.createStock;
export const updateStockAPI = stockService.updateStock;
export const deleteStockAPI = stockService.deleteStock;
export const bulkImportStocksAPI = stockService.bulkImportStocks;
export const getStockBySymbolAPI = stockService.getStockBySymbol;
export const searchStocksAPI = stockService.searchStocks; 