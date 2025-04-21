import { Category, CategoryInput } from '@/types/category';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'; // Default if not set

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) { // No Content
        return null as T; // Or handle appropriately
    }
    return response.json();
}

export const categoryService = {
    getAllCategories: async (): Promise<Category[]> => {
        const response = await fetch(`${API_BASE_URL}/categories`);
        return handleResponse<Category[]>(response);
    },

    getCategoryById: async (id: string): Promise<Category> => {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`);
        return handleResponse<Category>(response);
    },

    createCategory: async (categoryData: CategoryInput): Promise<Category> => {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if needed: 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData),
        });
        return handleResponse<Category>(response);
    },

    updateCategory: async (id: string, categoryData: CategoryInput): Promise<Category> => {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if needed
            },
            body: JSON.stringify(categoryData),
        });
        return handleResponse<Category>(response);
    },

    deleteCategory: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: {
                // Add Authorization header if needed
            },
        });
        await handleResponse<null>(response); // Expecting 204 No Content
    },
}; 