import { PeRecord, PeRecordFilters } from '@/types/peRecord';
import { PaginatedResponse } from '@/types/common';
import axios from 'axios';

// Default API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// PeRecord service methods
export const peRecordService = {
  // Fetch all PE records with pagination and filtering
  async fetchPeRecords(
    page = 1,
    limit = 10,
    token?: string,
    filters?: PeRecordFilters
  ): Promise<PaginatedResponse<PeRecord>> {
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

      const response = await axios.get(`${API_URL}/pe-records?${queryParams.toString()}`, config);
      
      return {
        data: response.data.data,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage
        }
      };
    } catch (error) {
      console.error('Error fetching PE records:', error);
      throw error;
    }
  },

  // Fetch PE records by symbol
  async fetchPeRecordsBySymbol(
    symbol: string,
    page = 1,
    limit = 10,
    token?: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<PeRecord>> {
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
        `${API_URL}/pe-records/symbol/${symbol}?${queryParams.toString()}`,
        config
      );
      
      return {
        data: response.data.data,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage
        }
      };
    } catch (error) {
      console.error(`Error fetching PE records for symbol ${symbol}:`, error);
      throw error;
    }
  },

  // Create a new PE record entry
  async createPeRecord(peRecordData: Omit<PeRecord, 'id'>, token: string): Promise<PeRecord> {
    try {
      const response = await axios.post(
        `${API_URL}/pe-records`,
        peRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating PE record:', error);
      throw error;
    }
  },

  // Update an existing PE record entry
  async updatePeRecord(id: string, peRecordData: Partial<PeRecord>, token: string): Promise<PeRecord> {
    try {
      const response = await axios.put(
        `${API_URL}/pe-records/${id}`,
        peRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating PE record with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a PE record entry
  async deletePeRecord(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/pe-records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(`Error deleting PE record with ID ${id}:`, error);
      throw error;
    }
  },

  // Import PE records from CSV file
  async importPeRecords(file: File, token: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/pe-records/import`,
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
        imported: response.data.createdCount + response.data.updatedCount,
        total: response.data.errors ? response.data.errors.length : 0
      };
    } catch (error) {
      console.error('Error importing PE records:', error);
      throw error;
    }
  }
}; 