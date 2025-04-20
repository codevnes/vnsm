'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart2, Search, LoaderCircle, Upload } from 'lucide-react';
import { Stock, StockType, StockFilters } from '@/types/stock';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { stockService } from '@/services/stockService';
import { stockQIndexService } from '@/services/stockQIndexService';
import { ImportQIndicesBySymbolSheet } from '@/components/qindices/ImportQIndicesBySymbolSheet';
import { toast } from 'sonner';

// Helper function to convert StockType to Stock
const convertToStock = (stockType: StockType): Stock => {
  return {
    id: String(stockType.id),
    symbol: stockType.symbol,
    name: stockType.name,
    industry: stockType.industry,
    createdAt: stockType.createdAt,
    updatedAt: stockType.updatedAt
  };
};

export default function QIndicesPage() {
  // Authentication is now checked at the layout level
  const { user, token } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
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

  // Debounce search to avoid excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);

        // Create filters for the API call
        const filters: StockFilters = {};
        if (debouncedSearch) {
          // Check if search looks like a stock symbol (all uppercase, no spaces)
          if (debouncedSearch === debouncedSearch.toUpperCase() && !debouncedSearch.includes(' ')) {
            filters.symbol = debouncedSearch;
          } else {
            filters.name = debouncedSearch;
          }
        }

        const response = await stockService.fetchStocks(
          pagination.currentPage,
          pagination.itemsPerPage,
          token,
          filters
        );

        // Convert StockType[] to Stock[]
        const convertedStocks = response.data.map(convertToStock);
        setStocks(convertedStocks);

        // Update pagination info
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems,
          itemsPerPage: response.pagination.itemsPerPage
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStocks();
    }
  }, [user, token, pagination.currentPage, pagination.itemsPerPage, debouncedSearch]);

  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Handle import
  const handleImport = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const result = await stockQIndexService.bulkImportQIndicesBySymbol(file);
      setImportResult(result);

      if (result.success) {
        toast.success(`Successfully imported ${result.imported} Q-index records`);
        // Refresh the stocks list
        const response = await stockService.fetchStocks(
          pagination.currentPage,
          pagination.itemsPerPage,
          token,
          {}
        );
        setStocks(response.data.map(convertToStock));
      } else {
        toast.error('Import failed');
      }
    } catch (error: any) {
      console.error('Error importing Q-indices:', error);
      setImportError(error.message || 'An error occurred during import');
      toast.error('Import failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Q-Indices</h1>
          <p className="text-muted-foreground">
            Manage and view Q-Index data for all your stocks
          </p>
        </div>
        <Button onClick={() => setIsImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import by Symbol
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stocks..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading stocks...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      ) : stocks.length === 0 ? (
        <div className="rounded-md bg-muted p-4 text-center">
          {searchTerm ? 'No stocks match your search' : 'No stocks found. Add some stocks first.'}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    {stock.industry ? (
                      <Badge variant="outline">{stock.industry}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/stocks/${stock.id}/qindices`}>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        View Q-Indices
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {stocks.length} of {pagination.totalItems} stocks
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
        </>
      )}

      {/* Import Sheet */}
      <ImportQIndicesBySymbolSheet
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSubmit={handleImport}
        isImporting={isImporting}
        importError={importError}
        importResult={importResult}
      />
    </div>
  );
}