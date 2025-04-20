'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryForm } from '@/components/categories/category-form';
import { CategoryFormValues } from '@/lib/schemas/categorySchema';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { toast } from 'sonner';

const CreateCategoryPage = () => {
    const router = useRouter();
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorFetching, setErrorFetching] = useState<string | null>(null);

    // Fetch all categories for the parent dropdown
    const fetchAllCategories = useCallback(async () => {
        setLoadingCategories(true);
        setErrorFetching(null);
        try {
            const data = await categoryService.getAllCategories();
            setAllCategories(data);
        } catch (err: any) {
            const message = err.message || 'Failed to load categories for parent selection.';
            setErrorFetching(message);
            toast.error('Error loading prerequisite data', { description: message });
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCategories();
    }, [fetchAllCategories]);

    // Handle form submission
    const onSubmit = async (values: CategoryFormValues) => {
        setIsSubmitting(true);
        try {
            // Ensure empty strings for optional fields become null
            const dataToSend = {
                ...values,
                description: values.description || null,
                thumbnail: values.thumbnail || null,
                parent_id: values.parent_id || null,
            };
            
            await categoryService.createCategory(dataToSend);
            toast.success('Category created successfully!');
            router.push('/dashboard/categories'); // Redirect to list page on success
            // Optionally, revalidate cache or data if needed immediately on the list page
            // router.refresh(); // Could potentially use this if list page uses server-side fetching
        } catch (error: any) {
             toast.error('Failed to create category', {
                 description: error.message || 'An unexpected error occurred.',
             });
             setIsSubmitting(false); // Keep form active on error
        } 
        // No finally block needed to set isSubmitting to false if navigating away on success
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Create New Category</h1>
            
            {loadingCategories && <p>Loading form data...</p>}
            {errorFetching && <p className="text-red-500">Error: {errorFetching}</p>}

            {!loadingCategories && !errorFetching && (
                <CategoryForm 
                    onSubmit={onSubmit} 
                    allCategories={allCategories}
                    isLoading={isSubmitting} // Pass submission loading state
                    submitButtonText="Create Category"
                />
            )}
        </div>
    );
};

export default CreateCategoryPage; 