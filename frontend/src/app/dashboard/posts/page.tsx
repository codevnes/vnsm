'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/post';
import { postService } from '@/services/postService';
import { DataTable } from '@/components/ui/data-table';
import { getPostColumns } from '@/components/posts/post-columns';
import { toast } from 'sonner';
import { PlusCircle, RefreshCw, ArrowDownUp, Moon, Sun } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

// Reusable Delete Dialog (Could be moved to a common ui component)
interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    postTitle: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    postTitle
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Bài viết
                        &quot;<strong>{postTitle}</strong>&quot; sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
                        Xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const ITEMS_PER_PAGE = 10; // Or get from state/config

const PostsPage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { theme, setTheme } = useTheme();

    const [posts, setPosts] = useState<Post[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSortDesc, setIsSortDesc] = useState<boolean>(true);

    // State for Delete Dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);

    // Get page from query params or default to 1
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Fetch posts based on current page
    const fetchPosts = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);
        setIsDeleteDialogOpen(false);
        setPostToDelete(null);
        try {
            const response = await postService.getAllPosts({ page, limit: ITEMS_PER_PAGE });
            setPosts(response.data);
            setTotalItems(response.pagination.totalItems);
        } catch (err: any) {
            const message = err.message || 'Không thể tải danh sách bài viết';
            setError(message);
            toast.error('Lỗi tải dữ liệu', { description: message });
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed if only using page

    useEffect(() => {
        fetchPosts(currentPage);
    }, [fetchPosts, currentPage]);

    // --- Action Handlers ---
    const handleEdit = useCallback((id: string) => {
        router.push(`/dashboard/posts/${id}/edit`);
    }, [router]);

    const handleDeleteRequest = useCallback((post: Post) => {
        setPostToDelete(post);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!postToDelete) return;
        try {
            await postService.deletePost(postToDelete.id);
            toast.success(`Đã xóa bài viết "${postToDelete.title}".`);
            // Refetch posts for the current page after deletion
            fetchPosts(currentPage);
        } catch (error: any) {
            toast.error('Lỗi khi xóa bài viết', {
                description: error.message || 'Không thể xóa bài viết.',
            });
            // Close dialog even on error
            setIsDeleteDialogOpen(false);
            setPostToDelete(null);
        }
    }, [postToDelete, fetchPosts, currentPage]);

    // Toggle sort order
    const toggleSortOrder = useCallback(() => {
        setIsSortDesc(!isSortDesc);
        // Would normally update API call with sort order parameter
    }, [isSortDesc]);

    // Toggle theme
    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    // Define columns using useMemo
    const columns = useMemo(() => getPostColumns({
        onEdit: handleEdit,
        onDeleteRequest: handleDeleteRequest
    }), [handleEdit, handleDeleteRequest]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const params = new URLSearchParams(searchParams);
            params.set('page', newPage.toString());
            router.push(`${pathname}?${params.toString()}`);
            // Fetching is handled by the useEffect watching currentPage
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
                <CardHeader className="border-b dark:border-gray-700 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">Quản lý bài viết</CardTitle>
                            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Tổng số: {totalItems} bài viết</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={toggleTheme}
                                className="h-9 w-9 dark:border-gray-700 dark:text-gray-100"
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchPosts(currentPage)} 
                                className="flex items-center gap-1 dark:border-gray-700 dark:text-gray-100"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span>Làm mới</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={toggleSortOrder} 
                                className="flex items-center gap-1 dark:border-gray-700 dark:text-gray-100"
                            >
                                <ArrowDownUp className="h-4 w-4" />
                                <span>{isSortDesc ? 'Mới nhất' : 'Cũ nhất'}</span>
                            </Button>
                            <Link href="/dashboard/posts/create" passHref>
                                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Tạo bài viết
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {loading && <div className="flex justify-center py-8"><p>Đang tải dữ liệu...</p></div>}
                    {error && !loading && <p className="text-red-500 py-4">Lỗi: {error}. Vui lòng làm mới trang.</p>}
                    {!loading && !error && (
                        <>
                            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                                <DataTable
                                    columns={columns}
                                    data={posts}
                                    filterColumnId="title"
                                    filterInputPlaceholder="Tìm kiếm bài viết theo tiêu đề..."
                                />
                            </div>
                            {/* Custom Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2 py-4 mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="dark:border-gray-700 dark:text-gray-300"
                                    >
                                        Trang trước
                                    </Button>
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">
                                        Trang {currentPage}/{totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="dark:border-gray-700 dark:text-gray-300"
                                    >
                                        Trang sau
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Render Delete Confirmation Dialog */}
            {postToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    postTitle={postToDelete.title}
                />
            )}
        </div>
    );
};

export default PostsPage;