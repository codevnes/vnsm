'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Upload,
  PlusCircle,
  LoaderCircle,
  ArrowLeft
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
// import { toast } from 'sonner';
import { useQIndicesManagement } from '@/hooks/useQIndicesManagement';
import { QIndexFormDialog } from '@/components/stocks/QIndexFormDialog';
import { DeleteQIndexDialog } from '@/components/stocks/DeleteQIndexDialog';
import { ImportQIndexSheet } from '@/components/stocks/ImportQIndexSheet';
import { DatePickerInput } from '@/components/ui/datepicker';

export default function StockQIndicesPage() {
    // Authentication is now checked at the layout level
    const params = useParams();
    const stockId = params.id as string;

    // Use the custom hook for QIndices management
    const {
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
    } = useQIndicesManagement({ stockId });

    // Handle date filter changes
    const handleDateFilterChange = (field: 'from' | 'to', date: Date | null) => {
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : undefined;
        updateFilters({
            ...(field === 'from' ? { date_from: formattedDate } : {}),
            ...(field === 'to' ? { date_to: formattedDate } : {})
        });
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/stocks">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">
                        {isLoading ? "Loading..." : `Q-indices: ${stock?.symbol || 'Stock'}`}
                    </h1>
                    {stock && (
                        <p className="text-muted-foreground">{stock.name}</p>
                    )}
                </div>
            </div>

            <Separator />

            {/* Filters and actions row */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="w-[180px]">
                        <DatePickerInput
                            placeholder="From date"
                            value={filters.date_from || null}
                            onChange={(date) => handleDateFilterChange('from', date)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="w-[180px]">
                        <DatePickerInput
                            placeholder="To date"
                            value={filters.date_to || null}
                            onChange={(date) => handleDateFilterChange('to', date)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={openImportSheet} disabled={!stock || isLoading}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Q-indices
                    </Button>
                    <Button onClick={() => openFormDialog()} disabled={!stock || isLoading}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Q-index
                    </Button>
                </div>
            </div>

            {/* QIndex Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Open</TableHead>
                            <TableHead>High</TableHead>
                            <TableHead>Low</TableHead>
                            <TableHead>Close</TableHead>
                            <TableHead>Trend Q</TableHead>
                            <TableHead>FQ</TableHead>
                            <TableHead>QV1</TableHead>
                            <TableHead>Band Down</TableHead>
                            <TableHead>Band Up</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center">
                                    <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : qIndices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center">
                                    No Q-indices found for this stock.
                                </TableCell>
                            </TableRow>
                        ) : (
                            qIndices.map(qIndex => (
                                <TableRow key={qIndex.id}>
                                    <TableCell>{format(new Date(qIndex.date), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell>{qIndex.open || '-'}</TableCell>
                                    <TableCell>{qIndex.high || '-'}</TableCell>
                                    <TableCell>{qIndex.low || '-'}</TableCell>
                                    <TableCell>{qIndex.close || '-'}</TableCell>
                                    <TableCell>{qIndex.trend_q || '-'}</TableCell>
                                    <TableCell>{qIndex.fq || '-'}</TableCell>
                                    <TableCell>{qIndex.qv1 || '-'}</TableCell>
                                    <TableCell>{qIndex.band_down || '-'}</TableCell>
                                    <TableCell>{qIndex.band_up || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openFormDialog(qIndex)}>
                                            <span className="sr-only">Edit</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                            </svg>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(qIndex)}>
                                            <span className="sr-only">Delete</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                            </svg>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && qIndices.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {qIndices.length} of {pagination.totalItems} items
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs and Sheets */}
            {isFormOpen && (
                <QIndexFormDialog
                    isOpen={isFormOpen}
                    onOpenChange={closeFormDialog}
                    onSubmit={handleFormSubmit}
                    initialData={editingQIndex}
                    stock={stock!}
                    isSubmitting={isSubmitting}
                    formError={formError}
                />
            )}

            {deletingQIndex && (
                <DeleteQIndexDialog
                    isOpen={!!deletingQIndex}
                    onOpenChange={(open) => !open && closeDeleteDialog()}
                    onConfirm={handleDeleteConfirm}
                    qIndex={deletingQIndex}
                    isDeleting={isDeleting}
                    deleteError={deleteError}
                />
            )}

            {isImportOpen && (
                <ImportQIndexSheet
                    isOpen={isImportOpen}
                    onOpenChange={closeImportSheet}
                    onSubmit={handleImportSubmit}
                    isImporting={isImporting}
                    importError={importError}
                    importResult={importResult}
                    stock={stock!}
                />
            )}
        </div>
    );
}