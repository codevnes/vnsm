import { Image } from "@/types/image"; // Assuming Image type definition exists or will be created

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Basic error/response handling (can be expanded)
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) { 
        return null as T; 
    }
    return response.json();
}

// Type for the data returned by the upload endpoint
interface UploadResponseData {
    id: number;
    url: string;
    altText: string | null;
    filename: string;
}

// Type for the paginated response from getAllImages
interface PaginatedImagesResponse {
    message: string;
    data: Image[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasNextPage: boolean;
    };
}

export const imageService = {
    /**
     * Fetches a paginated list of images.
     */
    getAllImages: async (limit: number = 20, offset: number = 0): Promise<PaginatedImagesResponse> => {
        const response = await fetch(`${API_BASE_URL}/images?limit=${limit}&offset=${offset}`);
        return handleResponse<PaginatedImagesResponse>(response);
    },

    /**
     * Uploads an image file.
     * @param imageFile The File object to upload.
     * @param altText Optional alt text for the image.
     * @returns The data of the uploaded image (including URL).
     */
    uploadImage: async (imageFile: File, altText?: string): Promise<UploadResponseData> => {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (altText) {
            formData.append('altText', altText);
        }

        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'POST',
            // Content-Type is set automatically by browser for FormData
            // Add Authorization header if needed
            body: formData,
        });
        
        // The backend returns { message: string, data: UploadResponseData }
        const result = await handleResponse<{ message: string, data: UploadResponseData }>(response);
        return result.data; 
    },

    // Add getImageById, updateImage, deleteImage if needed later
}; 