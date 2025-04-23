'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Search, 
  LoaderCircle, 
  Upload, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash
} from 'lucide-react';
import { FinancialRatioRecord, FinancialRatioRecordFilters } from '@/types/financialRatioRecord';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { financialRatioRecordService } from '@/services/financialRatioRecordService';
import { ImportFinancialRatioRecordSheet } from '@/components/financial-ratio-records/ImportFinancialRatioRecordSheet';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { FinancialRatioRecordFormDialog } from '@/components/financial-ratio-records/FinancialRatioRecordFormDialog';
import { DeleteFinancialRatioRecordDialog } from '@/components/financial-ratio-records/DeleteFinancialRatioRecordDialog';

export default function FinancialRatioRecordsPage() {
  // Authentication is now checked at the layout level
  const { user, token } = useAuth();
  const [financialRatioRecords, setFinancialRatioRecords] = useState<FinancialRatioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Form dialog state for create/edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRatioRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<FinancialRatioRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Debounce search to avoid excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchFinancialRatioRecords = async () => {
      try {
        setLoading(true);
        console.log(`Fetching page ${pagination.currentPage} with ${pagination.itemsPerPage} items per page`);

        // Create filters for the API call
        const filters: FinancialRatioRecordFilters = {};
        if (debouncedSearch) {
          filters.symbol = debouncedSearch.toUpperCase();
        }

        const response = await financialRatioRecordService.fetchFinancialRatioRecords(
          pagination.currentPage,
          pagination.itemsPerPage,
          token || undefined,
          filters
        );

        console.log('API Response:', response);

        // Đảm bảo cài đặt data đúng với response từ API
        setFinancialRatioRecords(response.data);

        // Update pagination info
        setPagination(prev => ({
          currentPage: response.pagination.currentPage || prev.currentPage,
          totalPages: response.pagination.totalPages || prev.totalPages,
          totalItems: response.pagination.totalItems || prev.totalItems,
          itemsPerPage: response.pagination.itemsPerPage || prev.itemsPerPage
        }));

        setError(null);
      } catch (err: any) {
        console.error('Error fetching Financial Ratio records:', err);
        setError('Failed to load Financial Ratio records. ' + (err.message || 'Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFinancialRatioRecords();
    }
  }, [user, token, pagination.currentPage, pagination.itemsPerPage, debouncedSearch]);

  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    console.log(`Navigating to page ${page}`);
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Handle import
  const handleImport = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const result = await financialRatioRecordService.importFinancialRatioRecords(file, token || '');
      setImportResult(result);

      if (result.success) {
        toast.success(`Đã import thành công ${result.imported} bản ghi Financial Ratio`);
        // Refresh the list
        const response = await financialRatioRecordService.fetchFinancialRatioRecords(
          pagination.currentPage,
          pagination.itemsPerPage,
          token || undefined,
          {}
        );
        setFinancialRatioRecords(response.data);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems,
          itemsPerPage: response.pagination.itemsPerPage
        });
      } else {
        toast.error('Import thất bại');
      }
    } catch (error: any) {
      console.error('Error importing Financial Ratio records:', error);
      setImportError(error.message || 'Đã xảy ra lỗi trong quá trình import');
      toast.error('Import thất bại: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsImporting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Update pagination limit (items per page)
  const updateItemsPerPage = (newLimit: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage: newLimit, currentPage: 1 }));
  };

  // Handle create new record
  const handleCreateRecord = () => {
    setEditingRecord(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Handle edit record
  const handleEditRecord = (id: string) => {
    const record = financialRatioRecords.find(r => r.id.toString() === id);
    if (record) {
      setEditingRecord(record);
      setFormError(null);
      setIsFormOpen(true);
    }
  };

  // Handle delete record
  const handleDeleteRecord = (id: string) => {
    const record = financialRatioRecords.find(r => r.id.toString() === id);
    if (record) {
      setDeletingRecord(record);
      setDeleteError(null);
      setIsDeleteOpen(true);
    }
  };

  // Handle form submission (create/update)
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      if (editingRecord) {
        // Update existing record
        await financialRatioRecordService.updateFinancialRatioRecord(
          editingRecord.id.toString(),
          data,
          token || ''
        );
        toast.success(`Financial Ratio cho ${data.symbol} đã được cập nhật thành công`);
      } else {
        // Create new record
        await financialRatioRecordService.createFinancialRatioRecord(data, token || '');
        toast.success(`Financial Ratio cho ${data.symbol} đã được tạo thành công`);
      }
      
      // Refresh the records
      const response = await financialRatioRecordService.fetchFinancialRatioRecords(
        pagination.currentPage,
        pagination.itemsPerPage,
        token || undefined,
        {}
      );
      
      setFinancialRatioRecords(response.data);
      setPagination(prev => ({
        currentPage: response.pagination.currentPage || prev.currentPage,
        totalPages: response.pagination.totalPages || prev.totalPages,
        totalItems: response.pagination.totalItems || prev.totalItems,
        itemsPerPage: response.pagination.itemsPerPage || prev.itemsPerPage
      }));
      
      // Close the form
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error saving Financial Ratio record:', error);
      setFormError(error.message || 'Đã xảy ra lỗi khi lưu bản ghi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await financialRatioRecordService.deleteFinancialRatioRecord(
        deletingRecord.id.toString(),
        token || ''
      );
      
      toast.success(`Financial Ratio cho ${deletingRecord.symbol} đã được xóa thành công`);
      
      // Refresh the records
      const response = await financialRatioRecordService.fetchFinancialRatioRecords(
        pagination.currentPage,
        pagination.itemsPerPage,
        token || undefined,
        {}
      );
      
      setFinancialRatioRecords(response.data);
      setPagination(prev => ({
        currentPage: response.pagination.currentPage || prev.currentPage,
        totalPages: response.pagination.totalPages || prev.totalPages,
        totalItems: response.pagination.totalItems || prev.totalItems,
        itemsPerPage: response.pagination.itemsPerPage || prev.itemsPerPage
      }));
      
      // Close the dialog
      setIsDeleteOpen(false);
    } catch (error: any) {
      console.error('Error deleting Financial Ratio record:', error);
      setDeleteError(error.message || 'Đã xảy ra lỗi khi xóa bản ghi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Ratio Records</h1>
          <p className="text-muted-foreground">
            Quản lý và xem dữ liệu Financial Ratio (Debt/Equity, Assets/Equity, Debt/Equity %)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateRecord}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo mới
          </Button>
          <Button onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm theo mã cổ phiếu..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
          <span>Đang tải dữ liệu Financial Ratio...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      ) : financialRatioRecords.length === 0 ? (
        <div className="rounded-md bg-muted p-4 text-center">
          {searchTerm ? 'Không tìm thấy dữ liệu Financial Ratio phù hợp' : 'Không có dữ liệu Financial Ratio. Hãy import dữ liệu trước.'}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Report Date</TableHead>
                <TableHead>Debt/Equity</TableHead>
                <TableHead>Assets/Equity</TableHead>
                <TableHead>Debt/Equity %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialRatioRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.symbol}</TableCell>
                  <TableCell>{formatDate(record.reportDate)}</TableCell>
                  <TableCell>{record.debtEquity !== null ? record.debtEquity.toFixed(2) : '-'}</TableCell>
                  <TableCell>{record.assetsEquity !== null ? record.assetsEquity.toFixed(2) : '-'}</TableCell>
                  <TableCell>{record.debtEquityPct !== null ? record.debtEquityPct.toFixed(2) : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditRecord(record.id.toString())}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Sửa
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteRecord(record.id.toString())}
                      >
                        <Trash className="mr-1 h-3 w-3" />
                        Xoá
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {financialRatioRecords.length} trên {pagination.totalItems} bản ghi
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Số bản ghi mỗi trang:</span>
                <select 
                  className="h-8 w-16 rounded-md border border-input bg-background px-2"
                  value={pagination.itemsPerPage}
                  onChange={(e) => updateItemsPerPage(Number(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Numeric Pagination */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
                  // Calculate which pages to show based on current page
                  let pageNum = 1; // Default to page 1 to avoid NaN
                  const totalPages = pagination.totalPages || 1;
                  const currentPage = pagination.currentPage || 1;
                  
                  if (totalPages <= 5) {
                    // If 5 or fewer total pages, show all pages
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // If near the beginning, show first 5 pages
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // If near the end, show last 5 pages
                    pageNum = totalPages - 4 + i;
                  } else {
                    // Otherwise show 2 pages before and 2 pages after the current page
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Current page / Total pages indicator */}
              <div className="text-sm ml-2">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </div>

              {/* Direct Page Input for quick navigation */}
              <div className="flex items-center ml-2">
                <Input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  className="w-16 h-8"
                  placeholder="Đến trang"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = parseInt((e.target as HTMLInputElement).value);
                      if (!isNaN(target) && target >= 1 && target <= pagination.totalPages) {
                        goToPage(target);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Form Dialog for Create/Edit */}
      <FinancialRatioRecordFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingRecord}
        isSubmitting={isSubmitting}
        formError={formError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteFinancialRatioRecordDialog
        record={deletingRecord}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        deleteError={deleteError}
      />

      {/* Import Dialog */}
      <ImportFinancialRatioRecordSheet
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        isImporting={isImporting}
        importError={importError}
        importResult={importResult}
      />
    </div>
  );
}