/**
 * Common type for representing pagination information in API responses
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Generic paginated response type that can be used with different data types
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Common API error response type
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Generic API response for successful operations
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
} 