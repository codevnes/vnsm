import { Post, PostInput, PaginatedPostsResponse } from '@/types/post';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Shared response handler (can be moved to a common util if used elsewhere)
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown API error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) { // No Content
        return null as T; 
    }
    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        // Handle non-JSON responses if necessary, or return as text
        // For now, assuming JSON or No Content
        const text = await response.text();
        console.warn('API returned non-JSON response:', text);
        return text as T; // May cause issues if T is expected to be an object
    }
}

// Interface for query parameters for getAllPosts
interface GetAllPostsParams {
    page?: number;
    limit?: number;
    categoryId?: string; // Use string for query param
    userId?: string;     // Use string for query param
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    // Add search param if implemented
    // search?: string;
}

export const postService = {
    /**
     * Fetches a paginated and filtered list of posts.
     */
    getAllPosts: async (params: GetAllPostsParams = {}): Promise<PaginatedPostsResponse> => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.categoryId) query.append('categoryId', params.categoryId);
        if (params.userId) query.append('userId', params.userId);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        // if (params.search) query.append('search', params.search);

        const response = await fetch(`${API_BASE_URL}/posts?${query.toString()}`);
        return handleResponse<PaginatedPostsResponse>(response);
    },

    /**
     * Fetches a single post by its ID.
     */
    getPostById: async (id: string): Promise<Post> => {
        const response = await fetch(`${API_BASE_URL}/posts/${id}`);
        return handleResponse<Post>(response);
    },

    /**
     * Creates a new post.
     * NOTE: Requires user_id in the input data until auth is implemented.
     */
    createPost: async (postData: PostInput): Promise<Post> => {
        // Add validation or ensure user_id is present if required by backend temporarily
        if (!postData.user_id) {
             throw new Error("User ID is currently required to create a post.");
        }
        
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if needed
            },
            body: JSON.stringify(postData),
        });
        return handleResponse<Post>(response);
    },

    /**
     * Updates an existing post.
     */
    updatePost: async (id: string, postData: Partial<PostInput>): Promise<Post> => {
        // Note: Sending Partial<PostInput> allows sending only changed fields.
        // Backend should handle merging.
        const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if needed
            },
            body: JSON.stringify(postData),
        });
        return handleResponse<Post>(response);
    },

    /**
     * Deletes a post by its ID.
     */
    deletePost: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
            method: 'DELETE',
            headers: {
                // Add Authorization header if needed
            },
        });
        await handleResponse<null>(response); // Expecting 204 No Content
    },
}; 