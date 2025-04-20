'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PostForm } from '@/components/posts/post-form';
import { PostFormValues } from '@/lib/schemas/postSchema';
import { postService } from '@/services/postService';
import { categoryService } from '@/services/categoryService'; // To fetch categories
// import { stockService } from '@/services/stockService'; // Assuming this exists - Temporarily commented out
import { Category } from '@/types/category';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

// --- TODO: Replace with actual authenticated user ID --- 
const MOCK_USER_ID = "1"; // Replace with ID from auth context

const CreatePostPage = () => {
    const router = useRouter();
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allStocks, setAllStocks] = useState<Stock[]>([]); // Keep state, but fetching is commented
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorFetching, setErrorFetching] = useState<string | null>(null);

    // Fetch categories and stocks for dropdowns
    const fetchPrerequisites = useCallback(async () => {
        setLoadingData(true);
        setErrorFetching(null);
        try {
            // Fetch concurrently - Only fetch categories for now
            const [catData/*, stockData */] = await Promise.all([
                categoryService.getAllCategories(),
                // stockService.getAllStocks() // Fetch stocks - Temporarily commented out
                Promise.resolve([]) // Placeholder for stocks fetch
            ]);
            setAllCategories(catData);
            // setAllStocks(stockData); // Assuming stockService returns Stock[] - Temporarily commented out
            setAllStocks([]); // Set to empty array for now
        } catch (err: any) {
            // Adjust error message if only fetching categories
            const message = err.message || 'Failed to load form prerequisites (categories).'; 
            setErrorFetching(message);
            toast.error('Error loading data', { description: message });
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchPrerequisites();
    }, [fetchPrerequisites]);

    // Handle form submission
    const onSubmit = async (values: PostFormValues) => {
        setIsSubmitting(true);
        try {
            const dataToSend = {
                ...values,
                user_id: MOCK_USER_ID, 
                description: values.description || null,
                content: values.content || null,
                thumbnail: values.thumbnail || null,
                stock_id: values.stock_id || null,
                slug: values.slug || null,
            };
            
            await postService.createPost(dataToSend);
            toast.success('Post created successfully!');
            router.push('/dashboard/posts'); 
        } catch (error: any) {
             toast.error('Failed to create post', {
                 description: error.message || 'An unexpected error occurred.',
             });
             setIsSubmitting(false); 
        } 
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Create New Post</h1>
            
            {loadingData && <p>Loading form data...</p>}
            {errorFetching && <p className="text-red-500">Error: {errorFetching}</p>}

            {!loadingData && !errorFetching && (
                <PostForm 
                    onSubmit={onSubmit} 
                    allCategories={allCategories}
                    allStocks={allStocks} // Pass stocks (currently empty array)
                    isLoading={isSubmitting}
                    submitButtonText="Create Post"
                />
            )}
        </div>
    );
};

export default CreatePostPage; 