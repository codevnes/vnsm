'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CandlestickChart, 
  Search, 
  LoaderCircle, 
  Upload, 
  Pencil, 
  Trash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CurrencyPrice, CurrencyPriceFilters } from '@/types/currencyPrice';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { currencyPriceService } from '@/services/currencyPriceService';
import { ImportCurrencyPriceSheet } from '@/components/currency-prices/ImportCurrencyPriceSheet';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function CurrencyPricesPage() {
  // Authentication is now checked at the layout level
  const { user, token } = useAuth();
  const [currencyPrices, setCurrencyPrices] = useState<CurrencyPrice[]>([]);
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
    const fetchCurrencyPrices = async () => {
      try {
        setLoading(true);

        // Create filters for the API call
        const filters: CurrencyPriceFilters = {};
        if (debouncedSearch) {
          filters.symbol = debouncedSearch.toUpperCase();
        }

        const response = await currencyPriceService.fetchCurrencyPrices(
          pagination.currentPage,
          pagination.itemsPerPage,
          token || undefined,
          filters
        );

        setCurrencyPrices(response.data);

        // Update pagination info
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems,
          itemsPerPage: response.pagination.itemsPerPage
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching currency prices:', err);
        setError('Failed to load currency prices. ' + (err.message || 'Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCurrencyPrices();
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
      const result = await currencyPriceService.importCurrencyPrices(file, token || '');
      setImportResult(result);

      if (result.success) {
        toast.success(`Successfully imported ${result.imported} currency price records`);
        // Refresh the list
        const response = await currencyPriceService.fetchCurrencyPrices(
          pagination.currentPage,
          pagination.itemsPerPage,
          token || undefined,
          {}
        );
        setCurrencyPrices(response.data);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems,
          itemsPerPage: response.pagination.itemsPerPage
        });
      } else {
        toast.error('Import failed');
      }
    } catch (error: any) {
      console.error('Error importing currency prices:', error);
      setImportError(error.message || 'An error occurred during import');
      toast.error('Import failed: ' + (error.message || 'Unknown error'));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currency Prices</h1>
          <p className="text-muted-foreground">
            Manage and view currency price data
          </p>
        </div>
        <Button onClick={() => setIsImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Data
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by symbol..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading currency prices...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      ) : currencyPrices.length === 0 ? (
        <div className="rounded-md bg-muted p-4 text-center">
          {searchTerm ? 'No currency prices match your search' : 'No currency prices found. Import some data first.'}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>High</TableHead>
                <TableHead>Low</TableHead>
                <TableHead>Close</TableHead>
                <TableHead>TrendQ</TableHead>
                <TableHead>FQ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencyPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">{price.symbol}</TableCell>
                  <TableCell>{formatDate(price.date)}</TableCell>
                  <TableCell>{(typeof price.open === 'number' ? price.open : Number(price.open) || 0).toFixed(4)}</TableCell>
                  <TableCell>{(typeof price.high === 'number' ? price.high : Number(price.high) || 0).toFixed(4)}</TableCell>
                  <TableCell>{(typeof price.low === 'number' ? price.low : Number(price.low) || 0).toFixed(4)}</TableCell>
                  <TableCell>{(typeof price.close === 'number' ? price.close : Number(price.close) || 0).toFixed(4)}</TableCell>
                  <TableCell>{(typeof price.trend_q === 'number' ? price.trend_q : Number(price.trend_q) || 0).toFixed(6)}</TableCell>
                  <TableCell>{(typeof price.fq === 'number' ? price.fq : Number(price.fq) || 0).toFixed(6)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {currencyPrices.length} of {pagination.totalItems} entries
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
              <span className="text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Import Dialog */}
      <ImportCurrencyPriceSheet
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