import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import {
    StockType,
    StockInput,
    StockPaginationInfo,
    BulkImportResponse,
    StockFilters
} from '@/types/stock';
import { stockService } from '@/services/stockService';

const DEFAULT_LIMIT = 10;

// Define default empty filters
const defaultFilters: StockFilters = {};

export const useStockManagement = (initialFilters: StockFilters = defaultFilters) => {
    const { token } = useAuth();

    // Filter state
    const [filters, setFilters] = useState<StockFilters>(initialFilters);

    // Data state
    const [stocks, setStocks] = useState<StockType[]>([]);
    const [pagination, setPagination] = useState<StockPaginationInfo>({ // Use StockPaginationInfo
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: DEFAULT_LIMIT,
        totalPages: 0,
        currentPage: 1,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create/Edit Dialog state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<StockType | null>(null); // null for create, object for edit
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete Dialog state
    const [deletingStock, setDeletingStock] = useState<StockType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Import Sheet state
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);

    // Use fetchData with stockService
    const fetchData = useCallback(async () => {
        if (!token) return; // Không fetch khi chưa có token
        
        setIsLoading(true);
        setError(null);
        try {
            const response = await stockService.fetchStocks(
                pagination.currentPage,
                pagination.itemsPerPage,
                token,
                filters
            );
            setStocks(response.data);
            setPagination(response.pagination);
        } catch (err: any) {
            console.error("Error fetching stocks:", err);
            setError(err.message || "Failed to load stocks");
            toast.error("Failed to load stocks");
        } finally {
            setIsLoading(false);
        }
    }, [pagination.currentPage, pagination.itemsPerPage, token, filters]);

    // Kết hợp tất cả các useEffect thành một effect duy nhất với logic rõ ràng
    useEffect(() => {
        // Track if this effect is still valid (to avoid race conditions)
        let isEffectActive = true;
        
        // Always show loading state when filters or pagination changes
        setIsLoading(true);
        
        // Debounce for filter changes only (not for page changes)
        const handler = setTimeout(() => {
            if (isEffectActive && token) {
                fetchData();
            }
        }, 300); // Giảm thời gian debounce xuống 300ms
        
        // Cleanup
        return () => {
            isEffectActive = false;
            clearTimeout(handler);
        };
    }, [fetchData, token]); // Chỉ phụ thuộc vào fetchData (đã bao gồm filters và pagination) và token

    // --- Create/Edit Logic ---
    const openFormDialog = (stock: StockType | null = null) => {
        setEditingStock(stock); // Set stock for editing, or null for creating
        setFormError(null);
        setIsFormOpen(true);
    };

    const closeFormDialog = () => {
        setIsFormOpen(false);
        setEditingStock(null);
        setFormError(null);
    };

    const handleFormSubmit = useCallback(async (data: StockInput) => {
        if (!token) {
            setFormError("Authentication error.");
            toast.error("Authentication Error", { description: "Please log in again." });
            return;
        }
        setIsSubmitting(true);
        setFormError(null);
        try {
            let message = "";
            if (editingStock) {
                await stockService.updateStock(editingStock.id, data, token);
                message = `Stock '${editingStock.symbol}' updated successfully.`;
            } else {
                await stockService.createStock(data, token);
                message = `Stock '${data.symbol}' created successfully.`;
            }
            closeFormDialog();
            await fetchData();
            toast.success("Success", { description: message });
        } catch (err: any) {
            const errorMessage = err.message || (editingStock ? 'Update failed.' : 'Create failed.');
            setFormError(errorMessage);
            toast.error(editingStock ? "Update Failed" : "Create Failed", { description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }, [token, editingStock, fetchData]);

    // --- Delete Logic ---
    const openDeleteDialog = (stock: StockType) => {
        setDeletingStock(stock);
        setDeleteError(null);
    };

    const closeDeleteDialog = () => {
        setDeletingStock(null);
    };

    const handleDeleteConfirm = useCallback(async () => {
        if (!deletingStock || !token) return;
        setIsDeleting(true);
        setDeleteError(null);
        const stockSymbol = deletingStock.symbol;
        try {
            await stockService.deleteStock(deletingStock.id, token);
            closeDeleteDialog();
            
            // Kiểm tra xem có cần giảm trang không
            if (stocks.length === 1 && pagination.currentPage > 1) {
                setPagination(prev => ({
                    ...prev,
                    currentPage: prev.currentPage - 1
                }));
            } else {
                // Nếu không cần đổi trang, fetch lại data hiện tại
                await fetchData();
            }
            
            toast.success("Stock Deleted", { description: `Stock '${stockSymbol}' was successfully deleted.` });
        } catch (err: any) {
            const errorMessage = err.message || 'Delete failed.';
            setDeleteError(errorMessage);
            toast.error("Delete Failed", { description: errorMessage });
        } finally {
            setIsDeleting(false);
        }
    }, [deletingStock, token, fetchData, stocks.length, pagination.currentPage]);

    // --- Import Logic ---
    const openImportSheet = () => {
        setImportError(null);
        setImportResult(null);
        setIsImportOpen(true);
    };

    const closeImportSheet = () => {
        setIsImportOpen(false);
    };

    const handleImportSubmit = useCallback(async (formData: FormData) => {
        if (!token) {
            setImportError("Authentication error.");
            return;
        }
        setIsImporting(true);
        setImportError(null);
        setImportResult(null);
        try {
            const result = await stockService.bulkImportStocks(formData, token);
            setImportResult(result);
            await fetchData();
            toast.success("Import Complete", {
                 description: `${result.summary.successful} stocks imported/updated, ${result.summary.skipped} skipped.`,
                 action: result.errors.length > 0 ? { label: "View Errors", onClick: () => console.log("Import Errors:", result.errors) } : undefined,
             });
        } catch (err: any) {
            const errorMessage = err.message || 'Import failed.';
            setImportError(errorMessage);
            toast.error("Import Failed", { description: errorMessage });
        } finally {
            setIsImporting(false);
        }
    }, [token, fetchData]);

    // --- Pagination Handlers ---
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination(prev => ({
              ...prev,
              currentPage: page
            }));
            // fetchData sẽ tự động được gọi nhờ dependency của useEffect
        }
    }, [pagination.totalPages]);

    // --- Filter Handler ---
    const updateFilters = useCallback((newFilters: Partial<StockFilters>) => {
        // Update the state immediately. The useEffect above will handle the debounced fetch.
        const updatedFilters = { ...filters, ...newFilters }; 
        // Prevent setting state if filters haven't actually changed shallowly
        if (JSON.stringify(filters) !== JSON.stringify(updatedFilters)) {
            setFilters(updatedFilters);
            // Reset về trang 1 khi lọc thay đổi
            setPagination(prev => ({
                ...prev,
                currentPage: 1
            }));
        }
    }, [filters]);

    // Return states and handlers
    return {
        stocks,
        pagination,
        isLoading,
        error,
        filters, // Expose current filters if needed
        setFilters: updateFilters, // Expose the filter update function
        // Form Dialog
        isFormOpen,
        editingStock,
        isSubmitting,
        formError,
        openFormDialog,
        closeFormDialog,
        handleFormSubmit,
        // Delete Dialog
        deletingStock,
        isDeleting,
        deleteError,
        openDeleteDialog,
        closeDeleteDialog,
        handleDeleteConfirm,
        // Import Sheet
        isImportOpen,
        isImporting,
        importError,
        importResult,
        openImportSheet,
        closeImportSheet,
        handleImportSubmit,
        // Pagination
        goToPage,
    };
}; 