// frontend/src/services/mediaService.ts

import { ImageListResponse, UploadSuccessData, UpdateImageResponse } from '@/types/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Helper function to handle fetch requests and basic error handling.
 */
async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
        const response = await fetch(url, options);

        // Handle successful responses with no content (e.g., DELETE 204)
        if (response.status === 204) {
            // Can't call response.json() on empty body, return something indicative if needed
            // Or just let it resolve to void/undefined depending on T
            return undefined as T;
        }

        const data = await response.json();

        if (!response.ok) {
            // Use error message from backend if available, otherwise use status text
            throw new Error(data.message || response.statusText || `HTTP error! status: ${response.status}`);
        }

        return data as T;
    } catch (error) {
        console.error('API Fetch Error:', error);
        // Re-throw the error to be caught by the calling function
        throw error;
    }
}

/**
 * Fetches a paginated list of images.
 */
export const fetchImagesAPI = (limit: number, offset: number, token: string | null): Promise<ImageListResponse> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    return fetchAPI<ImageListResponse>(`${API_URL}/images?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers,
    });
};

/**
 * Uploads a new image.
 */
export const uploadImageAPI = (formData: FormData, token: string | null): Promise<{ message: string; data: UploadSuccessData }> => {
    // Note: Don't set Content-Type for FormData, browser does it with boundary
     const headers: HeadersInit = {
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    return fetchAPI<{ message: string; data: UploadSuccessData }>(`${API_URL}/upload/image`, {
        method: 'POST',
        headers,
        body: formData,
    });
};

/**
 * Updates the alt text of an image.
 */
export const updateImageAPI = (id: number, altText: string | null, token: string | null): Promise<UpdateImageResponse> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    return fetchAPI<UpdateImageResponse>(`${API_URL}/images/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ altText }),
    });
};

/**
 * Deletes an image by its ID.
 */
export const deleteImageAPI = (id: number, token: string | null): Promise<void> => {
     const headers: HeadersInit = {
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    // fetchAPI will handle the 204 No Content response appropriately
    return fetchAPI<void>(`${API_URL}/images/${id}`, {
        method: 'DELETE',
        headers,
    });
};