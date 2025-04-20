'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, LoaderCircle, AlertCircle } from 'lucide-react'; // Import only used icons

// Import modular components
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaPagination } from '@/components/media/MediaPagination';
import { UploadSheet } from '@/components/media/UploadSheet';
import { EditDialog } from '@/components/media/EditDialog';
import { DeleteAlertDialog } from '@/components/media/DeleteAlertDialog';
import { useMediaManagement } from '@/hooks/useMediaManagement';

export default function MediaManagementPage() {
    // Authentication is now checked at the layout level

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
                    <LoaderCircle className="w-8 h-8 animate-spin text-muted-foreground" />
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