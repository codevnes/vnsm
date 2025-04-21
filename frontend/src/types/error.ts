/**
 * Custom error type for use throughout the application
 * Provides a consistent way to handle errors with proper typing
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Type guard to check if an unknown error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

/**
 * Helper function to extract error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error || 'An unknown error occurred');
}
