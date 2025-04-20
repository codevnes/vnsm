'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PostForm } from '@/components/posts/post-form';
import { PostFormValues } from '@/lib/schemas/postSchema';
import { postService } from '@/services/postService';
import { categoryService } from '@/services/categoryService';
// import { stockService } from '@/services/stockService'; // Commented out
import { Post } from '@/types/post';
import { Category } from '@/types/category';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

const EditPostPage = () => {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string; 

    const [postData, setPostData] = useState<Post | null>(null);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allStocks, setAllStocks] = useState<Stock[]>([]); // Keep state
    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch post, categories, and stocks
    const fetchData = useCallback(async () => {
        if (!postId) {
            setError('Post ID is missing.');
            toast.error('Error', { description: 'Post ID is missing from URL.' });
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const [postRes, catRes/*, stockRes */] = await Promise.all([
                postService.getPostById(postId),
                categoryService.getAllCategories(),
                // stockService.getAllStocks() // Commented out
                Promise.resolve([]) // Placeholder
            ]);
            setPostData(postRes);
            setAllCategories(catRes);
            // setAllStocks(stockRes); // Commented out
            setAllStocks([]); // Set empty for now
        } catch (err: any) {
            const message = err.message || 'Failed to load post data.';
            setError(message);
            toast.error('Error loading data', { description: message });
            setPostData(null); // Ensure form doesn't render with partial data
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle form submission
    const onSubmit = async (values: PostFormValues) => {
        if (!postId) return; 

        setIsSubmitting(true);
        try {
            // Prepare data - user_id is not needed for update usually
            const dataToSend: Partial<PostFormValues> = {
                ...values,
                description: values.description || null,
                content: values.content || null,
                thumbnail: values.thumbnail || null,
                stock_id: values.stock_id || null,
                slug: values.slug || null,
                // Don't send user_id for update typically
            };

            await postService.updatePost(postId, dataToSend);
            toast.success('Post updated successfully!');
            router.push('/dashboard/posts'); 
        } catch (error: any) {
             toast.error('Failed to update post', {
                 description: error.message || 'An unexpected error occurred.',
             });
             setIsSubmitting(false); 
        } 
    };

    // FIX: Prepare initial data for the form using useMemo
    const initialDataForForm = useMemo(() => {
        if (!postData) return undefined;
        return {
            id: postData.id, 
            title: postData.title ?? '', // Ensure default for reset
            slug: postData.slug ?? '',
            description: postData.description ?? '', // Ensure default for reset
            content: postData.content ?? '', // Ensure default for reset
            thumbnail: postData.thumbnail ?? null,
            category_id: postData.category_id, // Already string
            stock_id: postData.stock_id, // Already string or null
        };
    }, [postData]); // Only recalculate when postData changes

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Edit Post {postData ? ` - ${postData.title}` : ''}</h1>
            
            {loading && <p>Loading post data...</p>}
            {error && !loading && <p className="text-red-500 font-semibold">Error: {error}. Please try again.</p>}

            {/* Render form only when initialData is ready (derived from postData) */} 
            {!loading && !error && initialDataForForm && (
                <PostForm 
                    onSubmit={onSubmit} 
                    initialData={initialDataForForm} 
                    allCategories={allCategories} 
                    allStocks={allStocks} 
                    isLoading={isSubmitting} 
                    submitButtonText="Update Post"
                />
            )}
             {/* Show specific message if postData is null after loading without error */}
             {!loading && !error && !postData && (
                 <p className="text-orange-500">Could not load data for post ID: {postId}. It might not exist.</p>
             )}
        </div>
    );
};

export default EditPostPage; 