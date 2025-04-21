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
import { PlusCircle } from 'lucide-react';
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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the post
                        &quot;<strong>{postTitle}</strong>&quot;.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
                        Delete
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

    const [posts, setPosts] = useState<Post[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
            const message = err.message || 'Failed to fetch posts';
            setError(message);
            toast.error('Error fetching posts', { description: message });
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
            toast.success(`Post "${postToDelete.title}" deleted.`);
            // Refetch posts for the current page after deletion
            fetchPosts(currentPage);
        } catch (error: any) {
            toast.error('Error deleting post', {
                description: error.message || 'Could not delete post.',
            });
            // Close dialog even on error
            setIsDeleteDialogOpen(false);
            setPostToDelete(null);
        }
    }, [postToDelete, fetchPosts, currentPage]);

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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Posts</h1>
                <Link href="/dashboard/posts/create" passHref>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Post
                    </Button>
                </Link>
            </div>

            {loading && <p>Loading posts...</p>}
            {error && !loading && <p className="text-red-500">Error: {error}. Please try refreshing.</p>}
            {!loading && !error && (
                <>
                    <DataTable
                        columns={columns}
                        data={posts}
                        filterColumnId="title" // Allow filtering by title
                        filterInputPlaceholder="Filter posts by title..."
                    />
                    {/* Custom Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                 </>
            )}

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