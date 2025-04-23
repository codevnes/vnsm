import { EpsRecord, EpsRecordFilters } from '@/types/epsRecord';
import { PaginatedResponse } from '@/types/common';
import axios from 'axios';

// Default API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// EpsRecord service methods
export const epsRecordService = {
  // Fetch all EPS records with pagination and filtering
  async fetchEpsRecords(
    page = 1,
    limit = 10,
    token?: string,
    filters?: EpsRecordFilters
  ): Promise<PaginatedResponse<EpsRecord>> {
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

      const response = await axios.get(`${API_URL}/eps-records?${queryParams.toString()}`, config);
      
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
      console.error('Error fetching EPS records:', error);
      throw error;
    }
  },

  // Fetch EPS records by symbol
  async fetchEpsRecordsBySymbol(
    symbol: string,
    page = 1,
    limit = 10,
    token?: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<EpsRecord>> {
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
        `${API_URL}/eps-records/symbol/${symbol}?${queryParams.toString()}`,
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
      console.error(`Error fetching EPS records for symbol ${symbol}:`, error);
      throw error;
    }
  },

  // Create a new EPS record entry
  async createEpsRecord(epsRecordData: Omit<EpsRecord, 'id'>, token: string): Promise<EpsRecord> {
    try {
      const response = await axios.post(
        `${API_URL}/eps-records`,
        epsRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating EPS record:', error);
      throw error;
    }
  },

  // Update an existing EPS record entry
  async updateEpsRecord(id: string, epsRecordData: Partial<EpsRecord>, token: string): Promise<EpsRecord> {
    try {
      const response = await axios.put(
        `${API_URL}/eps-records/${id}`,
        epsRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating EPS record with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete an EPS record entry
  async deleteEpsRecord(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/eps-records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(`Error deleting EPS record with ID ${id}:`, error);
      throw error;
    }
  },

  // Import EPS records from CSV file
  async importEpsRecords(file: File, token: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/eps-records/import`,
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
      console.error('Error importing EPS records:', error);
      throw error;
    }
  }
}; 