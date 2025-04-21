import axios from 'axios';
import { StockQIndex } from '@/types/stockQIndex';
import { Post } from '@/types/post';

// Create a non-authenticated API instance for public pages
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface QIndicesResponse {
  data: StockQIndex[];
  // Adjust meta based on potential backend response changes
  meta?: {
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    itemsPerPage?: number;
  };
  pagination?: { // Support the structure seen in the controller snippet
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
}

export const homeService = {
  /**
   * Fetch QIndices data for a specific stock, optionally filtered by date range.
   */
  fetchQIndices: async (
    stockId: number,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'asc', // Default to asc for date range
    startDate?: string | null, // Optional date from
    endDate?: string | null    // Optional date to
  ): Promise<QIndicesResponse> => {
    try {
      // Build params, include date filters if provided
      const params: Record<string, unknown> = {
        page: 1,
        // Remove limit or set very high if dates aren't used? Controller implies limit is used.
        // Let's keep limit=1 initially, backend might ignore if dates present
        // A better backend would not require limit if dates are set, or allow limit=0
        limit: 10000, // Set a very high limit if fetching by date range
        sortBy,
        sortOrder,
        stock_id: stockId
      };

      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      // Use publicApi for unauthenticated requests
      const response = await publicApi.get(`/qindices`, { params }); // Use the built params object

      // Handle potentially different pagination structures
      const responseData = response.data;
      if (responseData.pagination && !responseData.meta) {
         return {
            data: responseData.data,
            meta: responseData.pagination // Map pagination to meta if needed
         };
      }

      return responseData;
    } catch (error) {
      console.error(`Error fetching QIndices:`, error);
      // Return empty data to prevent UI errors
      return {
        data: [],
        meta: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 0 // Limit removed from args
        }
      };
    }
  },

  /**
   * Fetch latest posts
   */
  fetchLatestPosts: async (limit: number = 5): Promise<Post[]> => {
    try {
      // Replace with actual API endpoint when available
      // Use publicApi for unauthenticated requests
      const response = await publicApi.get(`/posts`, {
        params: {
          page: 1,
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching latest posts:`, error);
      // Return empty array if API is not available yet
      return [];
    }
  }
};
