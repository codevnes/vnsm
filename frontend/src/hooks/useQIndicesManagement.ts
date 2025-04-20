'use client';

import { useState, useEffect, useCallback } from 'react';
import { stockQIndexService } from '@/services/stockQIndexService';
import { stockService } from '@/services/stockService';
import { 
  StockQIndex, 
  StockQIndexInput, 
  StockQIndexBulkImportResponse,
  StockQIndexFilters
} from '@/types/stockQIndex';
import { Stock } from '@/types/stock';
import { toast } from 'sonner';

interface UseQIndicesManagementProps {
  stockId: string | number;
}

export const useQIndicesManagement = ({ stockId }: UseQIndicesManagementProps) => {
  // Data state
  const [stock, setStock] = useState<Stock | null>(null);
  const [qIndices, setQIndices] = useState<StockQIndex[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  });
  const [filters, setFilters] = useState<StockQIndexFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQIndex, setEditingQIndex] = useState<StockQIndex | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete dialog state
  const [deletingQIndex, setDeletingQIndex] = useState<StockQIndex | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Import sheet state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<StockQIndexBulkImportResponse | null>(null);

  // Fetch stock details and Q-indices
  const fetchData = useCallback(async () => {
    if (!stockId) return;
    
    setIsLoading(true);
    try {
      // Fetch stock details
      const stockResponse = await stockService.getStockById(stockId);
      setStock(stockResponse);
      
      // Fetch Q-indices for this stock using the main qindices endpoint with stock_id parameter
      const qIndicesResponse = await stockQIndexService.getAllQIndices(
        pagination.currentPage,
        pagination.itemsPerPage,
        {
          stock_id: stockId,
          date_from: filters.date_from,
          date_to: filters.date_to
        },
        'date',
        'desc'
      );
      
      setQIndices(qIndicesResponse.data);
      setPagination({
        currentPage: qIndicesResponse.pagination.currentPage,
        totalPages: qIndicesResponse.pagination.totalPages,
        itemsPerPage: qIndicesResponse.pagination.itemsPerPage,
        totalItems: qIndicesResponse.pagination.totalItems
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [stockId, pagination.currentPage, pagination.itemsPerPage, filters]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Dialog Handlers
  const openFormDialog = (qIndex?: StockQIndex) => {
    setEditingQIndex(qIndex || null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingQIndex(null);
    setFormError(null);
  };

  const handleFormSubmit = async (data: StockQIndexInput) => {
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      if (editingQIndex) {
        // Update existing Q-index
        await stockQIndexService.updateQIndex(editingQIndex.id, data);
        toast.success("Q-Index updated successfully");
      } else {
        // Create new Q-index
        await stockQIndexService.createQIndex(data);
        toast.success("Q-Index created successfully");
      }
      
      // Close form and refresh data
      closeFormDialog();
      fetchData();
    } catch (error: any) {
      console.error("Error submitting Q-Index:", error);
      setFormError(error.message || "An error occurred while saving Q-Index");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Dialog Handlers
  const openDeleteDialog = (qIndex: StockQIndex) => {
    setDeletingQIndex(qIndex);
    setDeleteError(null);
  };

  const closeDeleteDialog = () => {
    setDeletingQIndex(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQIndex) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await stockQIndexService.deleteQIndex(deletingQIndex.id);
      toast.success("Q-Index deleted successfully");
      
      // Close dialog and refresh data
      closeDeleteDialog();
      fetchData();
    } catch (error: any) {
      console.error("Error deleting Q-Index:", error);
      setDeleteError(error.message || "An error occurred while deleting Q-Index");
    } finally {
      setIsDeleting(false);
    }
  };

  // Import Handlers
  const openImportSheet = () => {
    setIsImportOpen(true);
    setImportError(null);
    setImportResult(null);
  };

  const closeImportSheet = () => {
    setIsImportOpen(false);
    setImportError(null);
    // Keep import result to show success message until the sheet is re-opened
  };

  const handleImportSubmit = async (file: File) => {
    if (!file || !stockId) return;
    
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    
    try {
      // Create FormData with file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stock_id', stockId.toString()); // Add stock_id to the form data
      
      // Send to API using the updated method signature
      const result = await stockQIndexService.bulkImportQIndices(formData);
      
      setImportResult(result);
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} Q-Index records`);
        // Refresh data after successful import
        fetchData();
      }
    } catch (error: any) {
      console.error("Error importing Q-Indices:", error);
      setImportError(error.message || "An error occurred during import");
    } finally {
      setIsImporting(false);
    }
  };

  // Pagination handler
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Filter handlers
  const updateFilters = (newFilters: Partial<StockQIndexFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when changing filters
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  return {
    // Data
    stock,
    qIndices,
    pagination,
    filters,
    isLoading,
    
    // Form Dialog
    isFormOpen,
    editingQIndex,
    isSubmitting,
    formError,
    openFormDialog,
    closeFormDialog,
    handleFormSubmit,
    
    // Delete Dialog
    deletingQIndex,
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
    
    // Pagination & Filtering
    goToPage,
    updateFilters,

    // Refetch
    refreshData: fetchData
  };
}; 