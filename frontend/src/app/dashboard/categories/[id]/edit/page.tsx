'use client'; // Required for using hooks like useParams

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CategoryForm } from '@/components/categories/category-form';
import { CategoryFormValues } from '@/lib/schemas/categorySchema';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { toast } from 'sonner';

const EditCategoryPage = () => {
    const router = useRouter();
    const params = useParams();
    const categoryId = params.id as string; 

    const [categoryData, setCategoryData] = useState<Category | null>(null);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch both the specific category and all categories
    const fetchData = useCallback(async () => {
        if (!categoryId) {
            setError('Category ID is missing.');
            toast.error('Error', { description: 'Category ID is missing from URL.' });
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            // Use Promise.all to fetch concurrently
            const [categoryRes, allCategoriesRes] = await Promise.all([
                categoryService.getCategoryById(categoryId),
                categoryService.getAllCategories()
            ]);
            setCategoryData(categoryRes);
            setAllCategories(allCategoriesRes);
        } catch (err: any) {
            const message = err.message || 'Failed to load category data.';
            setError(message);
            toast.error('Error loading data', { description: message });
            // Set category data to null explicitly on error to avoid rendering form with stale/no data
            setCategoryData(null); 
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle form submission
    const onSubmit = async (values: CategoryFormValues) => {
        if (!categoryId) return; 

        setIsSubmitting(true);
        try {
            const dataToSend = {
                ...values,
                description: values.description || null,
                thumbnail: values.thumbnail || null,
                parent_id: values.parent_id || null,
            };

            await categoryService.updateCategory(categoryId, dataToSend);
            toast.success('Category updated successfully!');
            router.push('/dashboard/categories'); 
        } catch (error: any) {
             toast.error('Failed to update category', {
                 description: error.message || 'An unexpected error occurred.',
             });
             setIsSubmitting(false); 
        } 
    };

    // Prepare initial data for the form, ensuring nulls are handled
    const initialDataForForm = categoryData ? {
        id: categoryData.id,
        title: categoryData.title ?? '',
        description: categoryData.description ?? null,
        thumbnail: categoryData.thumbnail ?? null,
        parent_id: categoryData.parent_id ?? null,
    } : undefined;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Edit Category {categoryData ? ` - ${categoryData.title}` : ''}</h1>
            
            {loading && <p>Loading category data...</p>}
            {/* Display error prominently if loading failed */}
            {error && !loading && <p className="text-red-500 font-semibold">Error: {error}. Please try again or go back.</p>}

            {/* Only render form if loading is complete, there was no error, and we have category data */}
            {!loading && !error && categoryData && initialDataForForm && (
                <CategoryForm 
                    onSubmit={onSubmit} 
                    initialData={initialDataForForm} 
                    allCategories={allCategories} 
                    isLoading={isSubmitting} 
                    submitButtonText="Update Category"
                />
            )}
             {/* Explicit message if category not found after loading (implies 404 or data fetch issue) */}
             {!loading && !error && !categoryData && (
                 <p className="text-orange-500">Could not load data for category ID: {categoryId}. It might not exist.</p>
             )}
        </div>
    );
};

export default EditCategoryPage; 