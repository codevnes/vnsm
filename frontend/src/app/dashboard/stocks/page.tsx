'use client';

import React, { useState } from 'react';
import { useStockManagement } from '@/hooks/useStockManagement';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload, PlusCircle, Search } from 'lucide-react';

// Import modular components
import { StockTable } from '@/components/stocks/StockTable';
import { StockPagination } from '@/components/stocks/StockPagination';
import { StockFormDialog } from '@/components/stocks/StockFormDialog';
import { DeleteStockDialog } from '@/components/stocks/DeleteStockDialog';
import { ImportStockSheet } from '@/components/stocks/ImportStockSheet';

export default function StocksManagementPage() {
    // Authentication is now checked at the layout level
    const [searchTerm, setSearchTerm] = useState<string>('');

    const {
        stocks,
        pagination,
        isLoading,
        error,
        // Form Dialog state & handlers
        isFormOpen,
        editingStock,
        isSubmitting,
        formError,
        openFormDialog,
        closeFormDialog,
        handleFormSubmit,
        // Delete Dialog state & handlers
        deletingStock,
        isDeleting,
        deleteError,
        openDeleteDialog,
        closeDeleteDialog,
        handleDeleteConfirm,
        // Import Sheet state & handlers
        isImportOpen,
        isImporting,
        importError,
        importResult,
        openImportSheet,
        closeImportSheet,
        handleImportSubmit,
        // Pagination handler
        goToPage,
        setFilters,
    } = useStockManagement();

    // Handle search input change directly
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm);
        // Call setFilters directly - the hook will debounce the fetch
        if (setFilters) {
            setFilters({ name: newSearchTerm });
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">Stocks Management</h1>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                        />
                    </div>
                    {/* Action Buttons */}
                    <Button variant="outline" onClick={openImportSheet} className="flex-shrink-0">
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </Button>
                    <Button onClick={() => openFormDialog()} className="flex-shrink-0">
                         <PlusCircle className="w-4 h-4 mr-2" />
                         Add Stock
                    </Button>
                </div>
            </div>

            {/* Global Error Display (for fetch errors) */}
            {error && (
                <div className="p-4 text-sm text-destructive-foreground bg-destructive rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span>Error fetching stocks: {error}</span>
                </div>
            )}

            {/* Stock Table */}
            <StockTable
                stocks={stocks}
                onEdit={openFormDialog}
                onDelete={openDeleteDialog}
                isLoading={isLoading}
            />

            {/* Pagination */}
            <StockPagination
                pagination={pagination}
                onPageChange={goToPage}
                isLoading={isLoading}
            />

            {/* Modals / Sheets (rendered conditionally by hook state) */}
            <StockFormDialog
                isOpen={isFormOpen}
                onOpenChange={(open: boolean) => !open && closeFormDialog()}
                onSubmit={handleFormSubmit}
                initialData={editingStock}
                isSubmitting={isSubmitting}
                formError={formError}
            />

             <DeleteStockDialog
                stock={deletingStock}
                isOpen={!!deletingStock}
                onOpenChange={(open: boolean) => !open && closeDeleteDialog()}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
                deleteError={deleteError}
            />

            <ImportStockSheet
                isOpen={isImportOpen}
                onOpenChange={(open: boolean) => !open && closeImportSheet()}
                onSubmit={handleImportSubmit}
                isImporting={isImporting}
                importError={importError}
                importResult={importResult}
            />
        </div>
    );
}