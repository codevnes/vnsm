import { Category } from './category'; // Assuming Category type exists
import { User } from './user'; // Assuming User type exists
import { Stock } from './stock'; // Assuming Stock type exists

// Basic shape for related data included in API responses
interface RelatedCategory {
    id: string;
    title: string;
    slug: string;
}

interface RelatedUser {
    id: string;
    full_name: string; // Or whatever field your API sends
    email?: string; // Optional, based on API response
}

interface RelatedStock {
    id: string;
    // Add other basic stock fields if included, e.g., name, symbol
    symbol?: string;
    name?: string;
}

// Main Post interface based on backend response
export interface Post {
    id: string; // BigInt serialized as string
    title: string;
    slug: string;
    description: string | null;
    content: string | null;
    thumbnail: string | null;
    category_id: string; // BigInt serialized as string
    stock_id: string | null; // BigInt serialized as string or null
    user_id: string; // BigInt serialized as string
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string

    // Included relations (adjust based on actual API includes)
    category: RelatedCategory;
    user: RelatedUser;
    stock: RelatedStock | null;
}

// Type for input data when creating/updating a Post
export interface PostInput {
    title: string;
    description?: string | null;
    content?: string | null;
    thumbnail?: string | null;
    category_id: string; // Sent as string to match backend expectation before BigInt conversion
    stock_id?: string | null; // Sent as string or null
    user_id: string; // Required in body for now (string)
    slug?: string | null; // Optional slug input
}

// Type for the paginated response from getAllPosts
export interface PaginatedPostsResponse {
    data: Post[];
    pagination: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
} 