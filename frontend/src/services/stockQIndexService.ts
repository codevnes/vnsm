import { api } from "@/lib/api";
import {
  StockQIndex,
  StockQIndexInput,
  StockQIndexListResponse,
  StockQIndexDetailResponse,
  StockQIndexFilters,
  StockQIndexBulkImportData,
  StockQIndexBulkImportResponse
} from "@/types/stockQIndex";

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
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
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
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
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
      console.log('Uploading file:', file.name, file.size, file.type);

      const formData = new FormData();
      formData.append('file', file);

      console.log('Making API call to /qindices/bulk-import-by-symbol');
      const response = await api.post(`/qindices/bulk-import-by-symbol`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error bulk importing Q-indices by symbol:`, error);
      throw error;
    }
  }
};