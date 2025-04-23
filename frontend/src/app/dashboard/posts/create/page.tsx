'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ModernPostForm } from '@/components/posts/modern-post-form';
import { PostFormValues } from '@/lib/schemas/postSchema';
import { postService } from '@/services/postService';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

// --- Placeholder for actual auth ---
const MOCK_USER_ID = "1"; // Replace with ID from auth context

const CreatePostPage = () => {
    const router = useRouter();
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allStocks, setAllStocks] = useState<Stock[]>([]);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorFetching, setErrorFetching] = useState<string | null>(null);

    // Fetch categories and stocks for dropdowns
    const fetchPrerequisites = useCallback(async () => {
        setLoadingData(true);
        setErrorFetching(null);
        try {
            // In a real app, we'd fetch stocks too
            const [catData] = await Promise.all([
                categoryService.getAllCategories(),
                // Replace with actual stocks API call
                Promise.resolve([])
            ]);
            setAllCategories(catData);
            // Placeholder - replace with actual stock data
            setAllStocks([]);
        } catch (err: any) {
            const message = err.message || 'Không thể tải dữ liệu danh mục.';
            setErrorFetching(message);
            toast.error('Lỗi tải dữ liệu', { description: message });
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchPrerequisites();
    }, [fetchPrerequisites]);

    // Handle form submission
    const handleSubmit = async (values: PostFormValues) => {
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
            toast.success('Tạo bài viết thành công!', {
                description: 'Bài viết của bạn đã được đăng thành công.'
            });
            router.push('/dashboard/posts');
        } catch (error: any) {
            toast.error('Tạo bài viết thất bại', {
                description: error.message || 'Đã xảy ra lỗi không xác định.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-300 text-lg">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (errorFetching) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-xl p-8 border border-red-500/30">
                    <h1 className="text-2xl font-bold text-white mb-4">Không thể tải dữ liệu</h1>
                    <p className="text-red-400 mb-6">{errorFetching}</p>
                    <button 
                        onClick={() => fetchPrerequisites()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ModernPostForm
                onSubmit={handleSubmit}
                allCategories={allCategories}
                allStocks={allStocks}
                isLoading={isSubmitting}
                submitButtonText="Tạo bài viết mới"
            />
        </div>
    );
};

export default CreatePostPage; 