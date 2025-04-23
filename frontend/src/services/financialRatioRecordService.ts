import { FinancialRatioRecord, FinancialRatioRecordFilters } from '@/types/financialRatioRecord';
import { PaginatedResponse } from '@/types/common';
import axios from 'axios';

// Default API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// FinancialRatioRecord service methods
export const financialRatioRecordService = {
  // Fetch all Financial Ratio records with pagination and filtering
  async fetchFinancialRatioRecords(
    page = 1,
    limit = 10,
    token?: string,
    filters?: FinancialRatioRecordFilters
  ): Promise<PaginatedResponse<FinancialRatioRecord>> {
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

      const response = await axios.get(`${API_URL}/financial-ratio-records?${queryParams.toString()}`, config);
      
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
      console.error('Error fetching Financial Ratio records:', error);
      throw error;
    }
  },

  // Fetch Financial Ratio records by symbol
  async fetchFinancialRatioRecordsBySymbol(
    symbol: string,
    page = 1,
    limit = 10,
    token?: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<FinancialRatioRecord>> {
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
        `${API_URL}/financial-ratio-records/symbol/${symbol}?${queryParams.toString()}`,
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
      console.error(`Error fetching Financial Ratio records for symbol ${symbol}:`, error);
      throw error;
    }
  },

  // Create a new Financial Ratio record entry
  async createFinancialRatioRecord(financialRatioRecordData: Omit<FinancialRatioRecord, 'id'>, token: string): Promise<FinancialRatioRecord> {
    try {
      const response = await axios.post(
        `${API_URL}/financial-ratio-records`,
        financialRatioRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating Financial Ratio record:', error);
      throw error;
    }
  },

  // Update an existing Financial Ratio record entry
  async updateFinancialRatioRecord(id: string, financialRatioRecordData: Partial<FinancialRatioRecord>, token: string): Promise<FinancialRatioRecord> {
    try {
      const response = await axios.put(
        `${API_URL}/financial-ratio-records/${id}`,
        financialRatioRecordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating Financial Ratio record with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a Financial Ratio record entry
  async deleteFinancialRatioRecord(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/financial-ratio-records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(`Error deleting Financial Ratio record with ID ${id}:`, error);
      throw error;
    }
  },

  // Import Financial Ratio records from CSV or Excel file
  async importFinancialRatioRecords(file: File, token: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/financial-ratio-records/import`,
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
      console.error('Error importing Financial Ratio records:', error);
      throw error;
    }
  }
};