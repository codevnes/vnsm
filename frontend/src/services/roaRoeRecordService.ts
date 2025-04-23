import { RoaRoeRecord, RoaRoeRecordFilters } from '@/types/roaRoeRecord';
import { PaginatedResponse } from '@/types/common';
import axios from 'axios';

// Default API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// RoaRoeRecord service methods
export const roaRoeRecordService = {
  // Fetch all ROA/ROE records with pagination and filtering
  async fetchRoaRoeRecords(
    page = 1,
    limit = 10,
    token?: string,
    filters?: RoaRoeRecordFilters
  ): Promise<PaginatedResponse<RoaRoeRecord>> {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters) {
        if (filters.symbol) queryParams.append('symbol', filters.symbol);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
      }

      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const response = await axios.get(`${API_URL}/roa-roe-records?${queryParams.toString()}`, config);
      
      return {
        data: response.data.data,
        pagination: {
          currentPage: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.total,
          itemsPerPage: response.data.pagination.limit
        }
      };
    } catch (error) {
      console.error('Error fetching ROA/ROE records:', error);
      throw error;
    }
  },

  // Fetch ROA/ROE records by symbol
  async fetchRoaRoeRecordsBySymbol(
    symbol: string,
    page = 1,
    limit = 10,
    token?: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<RoaRoeRecord>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters) {
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
      }

      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const response = await axios.get(
        `${API_URL}/roa-roe-records/symbol/${symbol}?${queryParams.toString()}`,
        config
      );
      
      return {
        data: response.data.data,
        pagination: {
          currentPage: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.total,
          itemsPerPage: response.data.pagination.limit
        }
      };
    } catch (error) {
      console.error(`Error fetching ROA/ROE records for symbol ${symbol}:`, error);
      throw error;
    }
  },

  // Create a new ROA/ROE record entry
  async createRoaRoeRecord(roaRoeRecordData: Omit<RoaRoeRecord, 'id'>, token: string): Promise<RoaRoeRecord> {
    try {
      const response = await axios.post(
        `${API_URL}/roa-roe-records`,
        roaRoeRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating ROA/ROE record:', error);
      throw error;
    }
  },

  // Update an existing ROA/ROE record entry
  async updateRoaRoeRecord(id: string, roaRoeRecordData: Partial<RoaRoeRecord>, token: string): Promise<RoaRoeRecord> {
    try {
      const response = await axios.put(
        `${API_URL}/roa-roe-records/${id}`,
        roaRoeRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating ROA/ROE record with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a ROA/ROE record entry
  async deleteRoaRoeRecord(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/roa-roe-records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(`Error deleting ROA/ROE record with ID ${id}:`, error);
      throw error;
    }
  },

  // Import ROA/ROE records from CSV or Excel file
  async importRoaRoeRecords(file: File, token: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/roa-roe-records/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return {
        success: true,
        message: response.data.message,
        imported: response.data.imported,
        total: response.data.total
      };
    } catch (error) {
      console.error('Error importing ROA/ROE records:', error);
      throw error;
    }
  }
}; 