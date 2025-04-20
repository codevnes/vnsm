import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner"; // Import sonner toast
import { ImageType, PaginationInfo } from '@/types/image';
import {
    fetchImagesAPI,
    uploadImageAPI,
    updateImageAPI,
    deleteImageAPI
} from '@/services/mediaService';

const ITEMS_PER_PAGE = 8;

export const useMediaManagement = () => {
    const { token } = useAuth(); // Get token for API calls

    // Data state
    const [images, setImages] = useState<ImageType[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        limit: ITEMS_PER_PAGE,
        offset: 0,
        hasNextPage: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Upload state
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Edit state
    const [editingImage, setEditingImage] = useState<ImageType | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete state
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // --- Data Fetching Logic ---
    const fetchImages = useCallback(async (offset = 0) => {
        if (!token) {
            // If called before token is available, might set loading and wait or just return
            // Depending on how page handles auth loading state
             setIsLoading(true); // Assume we want to show loading until token is ready
             setError(null);
             return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchImagesAPI(ITEMS_PER_PAGE, offset, token);
            setImages(result.data || []);
            setPagination(result.pagination || { total: 0, limit: ITEMS_PER_PAGE, offset, hasNextPage: false });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch images.');
        } finally {
            setIsLoading(false);
        }
    }, [token]); // Re-fetch if token changes (e.g., on login)

    // Initial fetch effect - depends on the token being available
    useEffect(() => {
        fetchImages(0); // Fetch first page when hook mounts or token becomes available
    }, [fetchImages]); // fetchImages dependency includes token

    // --- Upload Logic ---
    const handleUploadSubmit = useCallback(async (formData: FormData) => {
        if (!token) {
            setUploadError("Authentication error.");
            toast.error("Authentication Error", { description: "Please log in again." });
            return;
        }
        setIsUploading(true);
        setUploadError(null);
        try {
            await uploadImageAPI(formData, token);
            setIsSheetOpen(false); // Close sheet on success
            await fetchImages(0); // Refetch from first page
            toast.success("Upload Successful", { description: "Image(s) uploaded successfully." });
        } catch (err: any) {
            const errorMessage = err.message || 'Upload failed.';
            setUploadError(errorMessage);
            toast.error("Upload Failed", { description: errorMessage });
        } finally {
            setIsUploading(false);
        }
    }, [token, fetchImages]);

    // --- Edit Logic ---
    const openEditDialog = (image: ImageType) => {
        setEditingImage(image);
        setEditError(null); // Clear previous errors
    };

    const closeEditDialog = () => {
        setEditingImage(null);
    };

    const handleEditSubmit = useCallback(async (id: number, altText: string | null) => {
        if (!token) {
            setEditError("Authentication error.");
            toast.error("Authentication Error", { description: "Please log in again." });
            return;
        }
        setIsEditing(true);
        setEditError(null);
        try {
            const result = await updateImageAPI(id, altText, token);
            // Update local state optimistically or based on response
            setImages(prevImages =>
                prevImages.map(img => (img.id === id ? result.data : img))
            );
            closeEditDialog(); // Close dialog on success
            toast.success("Update Successful", { description: "Image alt text updated." });
        } catch (err: any) {
            const errorMessage = err.message || 'Update failed.';
            setEditError(errorMessage);
            toast.error("Update Failed", { description: errorMessage });
        } finally {
            setIsEditing(false);
        }
    }, [token]);

    // --- Delete Logic ---
    const openDeleteDialog = (id: number) => {
        setDeletingImageId(id);
        setDeleteError(null);
    };

    const closeDeleteDialog = () => {
        setDeletingImageId(null);
    };

    const handleDeleteConfirm = useCallback(async () => {
        if (!deletingImageId || !token) return;

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteImageAPI(deletingImageId, token);
            // Update local state
            await fetchImages(pagination.offset);
            closeDeleteDialog(); // Close dialog on success
            toast.success("Delete Successful", { description: "Image deleted successfully." });
        } catch (err: any) {
            const errorMessage = err.message || 'Delete failed.';
            setDeleteError(errorMessage);
            toast.error("Delete Failed", { description: errorMessage });
        } finally {
            setIsDeleting(false);
        }
    }, [deletingImageId, token, fetchImages, pagination.offset]);

    // --- Pagination Logic ---
    const handleNextPage = () => {
        if (pagination.hasNextPage) {
            fetchImages(pagination.offset + pagination.limit);
        }
    };

    const handlePrevPage = () => {
        const newOffset = pagination.offset - pagination.limit;
        if (newOffset >= 0) {
            fetchImages(newOffset);
        }
    };

    // --- Sheet/Dialog Controls ---
     const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setUploadError(null); // Clear errors when closing
        }
    };

    // Return state and handlers for the component to use
    return {
        // Data
        images,
        pagination,
        isLoading,
        error,
        // Upload
        isSheetOpen,
        isUploading,
        uploadError,
        handleSheetOpenChange,
        handleUploadSubmit,
        // Edit
        editingImage,
        isEditing,
        editError,
        openEditDialog,
        closeEditDialog,
        handleEditSubmit,
        // Delete
        deletingImageId,
        isDeleting,
        deleteError,
        openDeleteDialog,
        closeDeleteDialog,
        handleDeleteConfirm,
        // Pagination
        handleNextPage,
        handlePrevPage,
    };
}; 