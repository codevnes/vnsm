import { api } from "@/lib/api";
import {
  StockQIndex,
  StockQIndexInput,
  StockQIndexListResponse,
  StockQIndexDetailResponse,
  StockQIndexFilters,
  StockQIndexBulkImportResponse
} from "@/types/stockQIndex";

// Define QIndicesResponse type similar to homeService
interface QIndicesResponse {
  data: StockQIndex[];
  meta?: {
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    itemsPerPage?: number;
  };
  pagination?: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export const stockQIndexService = {
  /**
   * Fetch all stock Q-indices with optional filters and pagination
   */
  getAllQIndices: async (
    page: number = 1,
    limit: number = 10,
    filters: StockQIndexFilters = {},
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<StockQIndexListResponse> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      // Add filters
      if (filters.stock_id) {
        params.append('stock_id', filters.stock_id.toString());
      }
      if (filters.date_from) {
        params.append('startDate', filters.date_from);
      }
      if (filters.date_to) {
        params.append('endDate', filters.date_to);
      }

      const response = await api.get(`/qindices?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Q-indices:', error);
      throw error;
    }
  },

  /**
   * Get a specific Q-index by ID
   */
  getQIndexById: async (id: string | number): Promise<StockQIndexDetailResponse> => {
    try {
      const response = await api.get(`/qindices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Q-index ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get Q-indices for a specific stock with optional date filtering
   */
  getQIndicesByStockId: async (
    stockId: string | number,
    page: number = 1,
    limit: number = 10,
    dateFrom?: string,
    dateTo?: string,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<StockQIndexListResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      if (dateFrom) {
        params.append('startDate', dateFrom);
      }
      if (dateTo) {
        params.append('endDate', dateTo);
      }

      const response = await api.get(`/stocks/${stockId}/qindices?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Q-indices for stock ${stockId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Q-index record
   */
  createQIndex: async (data: StockQIndexInput): Promise<StockQIndex> => {
    try {
      const response = await api.post('/qindices', data);
      return response.data;
    } catch (error) {
      console.error('Error creating Q-index:', error);
      throw error;
    }
  },

  /**
   * Update an existing Q-index record
   */
  updateQIndex: async (id: string | number, data: Partial<StockQIndexInput>): Promise<StockQIndex> => {
    try {
      const response = await api.put(`/qindices/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating Q-index ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Q-index record
   */
  deleteQIndex: async (id: string | number): Promise<void> => {
    try {
      await api.delete(`/qindices/${id}`);
    } catch (error) {
      console.error(`Error deleting Q-index ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bulk import Q-indices for a stock
   */
  bulkImportQIndices: async (
    formData: FormData
  ): Promise<StockQIndexBulkImportResponse> => {
    try {
      const response = await api.post(`/qindices/bulk-import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error bulk importing Q-indices:`, error);
      throw error;
    }
  },

  /**
   * Bulk import Q-indices by symbol from CSV
   */
  bulkImportQIndicesBySymbol: async (
    file: File
  ): Promise<StockQIndexBulkImportResponse> => {
    try {

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/qindices/bulk-import-by-symbol`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      ('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error bulk importing Q-indices by symbol:`, error);
      throw error;
    }
  },

  /**
   * Improved method to fetch Q-indices data for a specific stock ID
   * Uses object param approach and better error handling
   */
  fetchQIndicesByStockId: async (
    stockId: number | string,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'asc',
    startDate?: string | null,
    endDate?: string | null
  ): Promise<QIndicesResponse> => {
    try {
      // Build params with all needed fields
      const params: Record<string, unknown> = {
        page: 1,
        limit: 1000, // Use a large limit for chart data
        sortBy,
        sortOrder
      };

      // Add date filters if provided
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      // Use object params approach instead of URLSearchParams
      const response = await api.get(`/qindices`, { 
        params: {
          ...params,
          stock_id: stockId
        }
      });

      // Handle different response structures
      const responseData = response.data;
      if (responseData.pagination && !responseData.meta) {
        return {
          data: responseData.data,
          meta: responseData.pagination
        };
      }

      return responseData;
    } catch (error) {
      console.error(`Error fetching Q-indices for stock ${stockId}:`, error);
      // Return empty data instead of throwing to prevent UI errors
      return {
        data: [],
        meta: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 0
        }
      };
    }
  }
};