import { CurrencyPrice, CurrencyPriceFilters } from '@/types/currencyPrice';
import { PaginatedResponse } from '@/types/common';
import axios from 'axios';

// Default API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// CurrencyPrice service methods
export const currencyPriceService = {
  // Fetch all currency prices with pagination and filtering
  async fetchCurrencyPrices(
    page = 1,
    limit = 10,
    token?: string,
    filters?: CurrencyPriceFilters
  ): Promise<PaginatedResponse<CurrencyPrice>> {
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

      const response = await axios.get(`${API_URL}/currency-prices?${queryParams.toString()}`, config);
      
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
      console.error('Error fetching currency prices:', error);
      throw error;
    }
  },

  // Fetch currency prices by symbol
  async fetchCurrencyPricesBySymbol(
    symbol: string,
    page = 1,
    limit = 10,
    token?: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<CurrencyPrice>> {
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
        `${API_URL}/currency-prices/symbol/${symbol}?${queryParams.toString()}`,
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
      console.error(`Error fetching currency prices for symbol ${symbol}:`, error);
      throw error;
    }
  },

  // Create a new currency price entry
  async createCurrencyPrice(currencyPriceData: Omit<CurrencyPrice, 'id'>, token: string): Promise<CurrencyPrice> {
    try {
      const response = await axios.post(
        `${API_URL}/currency-prices`,
        currencyPriceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating currency price:', error);
      throw error;
    }
  },

  // Update an existing currency price entry
  async updateCurrencyPrice(id: string, currencyPriceData: Partial<CurrencyPrice>, token: string): Promise<CurrencyPrice> {
    try {
      const response = await axios.put(
        `${API_URL}/currency-prices/${id}`,
        currencyPriceData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating currency price with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a currency price entry
  async deleteCurrencyPrice(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/currency-prices/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(`Error deleting currency price with ID ${id}:`, error);
      throw error;
    }
  },

  // Import currency prices from CSV file
  async importCurrencyPrices(file: File, token: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/currency-prices/import`,
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
      console.error('Error importing currency prices:', error);
      throw error;
    }
  }
}; 