'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart2, Search, Loader2 } from 'lucide-react';
import { Stock, StockType } from '@/types/stock';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import * as stockService from '@/services/stockService';

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
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await stockService.fetchStocksAPI(1, 100, token);
        // Convert StockType[] to Stock[]
        const convertedStocks = response.data.map(convertToStock);
        setStocks(convertedStocks);
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
  }, [user, token]);

  // Filter stocks based on search term
  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>Loading authentication...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Router will redirect, no need to render anything
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Q-Indices</h1>
          <p className="text-muted-foreground">
            Manage and view Q-Index data for all your stocks
          </p>
        </div>
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
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading stocks...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="rounded-md bg-muted p-4 text-center">
          {searchTerm ? 'No stocks match your search' : 'No stocks found. Add some stocks first.'}
        </div>
      ) : (
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
            {filteredStocks.map((stock) => (
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
      )}
    </div>
  );
} 