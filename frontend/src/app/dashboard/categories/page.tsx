'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/category';
import { categoryService } from '@/services/categoryService';
import { DataTable } from '@/components/ui/data-table';
import { getCategoryColumns } from '@/components/categories/category-columns';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/error';
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

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    categoryName: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    categoryName
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        category &quot;<strong>{categoryName}</strong>&quot; and potentially affect related data.
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

const CategoriesPage = () => {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err) || 'Failed to fetch categories';
            setError(errorMessage);
            toast.error('Error fetching categories', {
              description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleEdit = useCallback((id: string) => {
        router.push(`/dashboard/categories/${id}/edit`);
    }, [router]);

    const handleDeleteRequest = useCallback((category: Category) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!categoryToDelete) return;
        try {
            await categoryService.deleteCategory(categoryToDelete.id);
            toast.success(`Category "${categoryToDelete.title}" deleted.`);
            fetchCategories();
        } catch (error: unknown) {
            toast.error('Error deleting category', {
              description: getErrorMessage(error) || 'Could not delete category.',
            });
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    }, [categoryToDelete, fetchCategories]);

    const columns = useMemo(() => getCategoryColumns({
        onEdit: handleEdit,
        onDeleteRequest: handleDeleteRequest

    }), [handleEdit, handleDeleteRequest]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Categories</h1>
                <Link href="/dashboard/categories/create" passHref>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Category
                    </Button>
                </Link>
            </div>

            {loading && <p>Loading categories...</p>}
            {error && !loading && <p className="text-red-500">Error: {error}. Please try refreshing.</p>}
            {!loading && !error && (
                <DataTable
                    columns={columns}
                    data={categories}
                    filterColumnId="title"
                    filterInputPlaceholder="Filter by title..."
                />
            )}

            {categoryToDelete && (
                <DeleteConfirmationDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    categoryName={categoryToDelete.title}
                />
            )}
        </div>
    );
};

export default CategoriesPage;