'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Use Next.js Image component
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription // Added for better card structure
} from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter, // Added for sheet buttons
    SheetClose // Added for closing sheet easily
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose // Added for closing dialog easily
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Use Textarea for alt text
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'; // Import icons

// Define the structure of an image object based on backend API
interface ImageType {
    id: number;
    url: string;
    altText: string | null;
    processedFilename: string;
    width?: number;
    height?: number;
    createdAt: string;
    // Add other fields if needed from your backend response
}

// Define the structure of the pagination info from backend API
interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasNextPage: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 8; // How many images to show per page

// Import modular components
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaPagination } from '@/components/media/MediaPagination';
import { UploadSheet } from '@/components/media/UploadSheet';
import { EditDialog } from '@/components/media/EditDialog';
import { DeleteAlertDialog } from '@/components/media/DeleteAlertDialog';
import { useMediaManagement } from '@/hooks/useMediaManagement';

export default function MediaManagementPage() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    // Use the custom hook for state and logic
    const {
        images,
        pagination,
        isLoading,
        error,
        isSheetOpen,
        isUploading,
        uploadError,
        handleSheetOpenChange,
        handleUploadSubmit,
        editingImage,
        isEditing,
        editError,
        openEditDialog,
        closeEditDialog,
        handleEditSubmit,
        deletingImageId,
        isDeleting,
        deleteError,
        openDeleteDialog,
        closeDeleteDialog,
        handleDeleteConfirm,
        handleNextPage,
        handlePrevPage,
    } = useMediaManagement();

    // Authentication Check / Loading State
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                 {loading
                    ? <Loader2 className="w-8 h-8 animate-spin" />
                    : "Redirecting to login..."
                }
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Media Management</h1>
                <Button onClick={() => handleSheetOpenChange(true)}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Image
                </Button>
            </div>

            {/* Global Error Display */}
            {error && (
                 <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0"/>
                    Error fetching images: {error}
                </div>
            )}

            {/* Content Area */}
            {isLoading && images.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : !isLoading && images.length === 0 ? (
                 <div className="p-6 text-center border rounded-md bg-muted text-muted-foreground">
                    No images uploaded yet.
                </div>
            ) : (
                <>
                    <MediaGrid
                        images={images}
                        onEdit={openEditDialog} // Pass handler from hook
                        onDelete={openDeleteDialog} // Pass handler from hook
                    />
                    <MediaPagination
                        pagination={pagination}
                        onPrevPage={handlePrevPage}
                        onNextPage={handleNextPage}
                        isLoading={isLoading}
                    />
                </>
            )}

            {/* Modals/Sheets Rendered Here (controlled by hook state) */}
            <UploadSheet
                isOpen={isSheetOpen}
                onOpenChange={handleSheetOpenChange}
                onSubmit={handleUploadSubmit}
                isUploading={isUploading}
                uploadError={uploadError}
            />

            <EditDialog
                image={editingImage} // Pass the image object being edited
                isOpen={!!editingImage} // Open if editingImage is not null
                onOpenChange={(open) => !open && closeEditDialog()} // Close handler from hook
                onSubmit={handleEditSubmit} // Pass handler from hook
                isEditing={isEditing}
                editError={editError}
            />

            <DeleteAlertDialog
                isOpen={deletingImageId !== null} // Open if deletingImageId is not null
                onOpenChange={(open) => !open && closeDeleteDialog()} // Close handler from hook
                onConfirm={handleDeleteConfirm} // Pass handler from hook
                isDeleting={isDeleting}
                deleteError={deleteError}
            />
        </div>
    );
} 