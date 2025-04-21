/**
 * Represents the structure of an Image object fetched from the backend.
 */
export interface Image {
    id: number; // Or string if your backend serializes BigInts as strings
    filename: string;
    processedFilename: string;
    path: string;
    url: string;
    altText: string | null;
    mimetype: string;
    size: number;
    width: number | null;
    height: number | null;
    createdAt: string; // Assuming ISO string format
    // Add updatedAt if applicable
    updatedAt?: string;
}

/**
 * Represents the pagination information returned by the backend API.
 */
export interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasNextPage: boolean;
}

/**
 * Represents the data structure returned by the successful upload API call.
 */
export type UploadSuccessData = Image;

/**
 * Represents the data structure returned by the successful image list API call.
 */
export interface ImageListResponse {
    message: string;
    data: Image[];
    pagination: PaginationInfo;
}

/**
 * Represents the data structure returned by the successful single image API call.
 */
export interface SingleImageResponse {
    message: string;
    data: Image;
}

/**
 * Represents the data structure returned by the successful image update API call.
 */
export type UpdateImageResponse = SingleImageResponse;