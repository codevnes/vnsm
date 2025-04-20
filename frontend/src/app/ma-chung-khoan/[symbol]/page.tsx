'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getStockBySymbolAPI } from '@/services/stockService';
import { homeService } from '@/services/homeService';
import StockChart from '@/components/charts/StockChart';
import TimePeriodSelector from '@/components/charts/TimePeriodSelector';
import { StockQIndex } from '@/types/stockQIndex';

// Helper function to format date
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Types for our stock data
interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  industry?: string;
}

type TimePeriod = '3m' | '6m' | '1y' | '5y';

// Stock detail page component
export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  
  const [stock, setStock] = useState<Stock | null>(null);
  const [qIndices, setQIndices] = useState<StockQIndex[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('3m');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  // Fetch stock data
  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) return;
      
      try {
        setLoading(true);
        const data = await getStockBySymbolAPI(symbol);
        setStock(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching stock:', err);
        setError('Không thể tải thông tin cổ phiếu. Vui lòng thử lại sau.');
        setStock(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  // Fetch QIndex data
  useEffect(() => {
    const fetchQIndexData = async () => {
      if (!stock) return;
      
      setChartLoading(true);
      setChartError(null);

      // Calculate date range
      const today = new Date();
      const endDate = formatDate(today);
      let fromDate = new Date();

      switch (timePeriod) {
        case '3m':
          fromDate.setMonth(today.getMonth() - 3);
          break;
        case '6m':
          fromDate.setMonth(today.getMonth() - 6);
          break;
        case '1y':
          fromDate.setFullYear(today.getFullYear() - 1);
          break;
        case '5y':
          fromDate.setFullYear(today.getFullYear() - 5);
          break;
        default:
          fromDate.setMonth(today.getMonth() - 3);
      }
      const startDate = formatDate(fromDate);

      try {
        // Fetch QIndex data for the stock
        const response = await homeService.fetchQIndices(
          parseInt(stock.id),
          'date',
          'asc',
          startDate,
          endDate
        );
        
        const rawData = response.data || [];
        setQIndices(rawData);
      } catch (err) {
        console.error('Error fetching QIndices:', err);
        setChartError('Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.');
        setQIndices([]);
      } finally {
        setChartLoading(false);
      }
    };

    if (stock) {
      fetchQIndexData();
    }
  }, [stock, timePeriod]);

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            {error || `Không tìm thấy cổ phiếu với mã: ${symbol}`}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vui lòng kiểm tra lại mã cổ phiếu hoặc thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Stock header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                {stock.symbol}
                <span className="text-lg ml-3 opacity-80">|</span>
                <span className="text-xl ml-3 font-normal opacity-90">{stock.name}</span>
              </h1>
              <div className="mt-2 text-blue-100">
                {stock.exchange && (
                  <span className="inline-block mr-3">
                    <span className="font-medium">Sàn:</span> {stock.exchange}
                  </span>
                )}
                {stock.industry && (
                  <span className="inline-block">
                    <span className="font-medium">Ngành:</span> {stock.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overview card */}
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Tổng quan</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 text-gray-600 dark:text-gray-400">Mã cổ phiếu</td>
                    <td className="py-2 text-right font-medium">{stock.symbol}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 text-gray-600 dark:text-gray-400">Tên công ty</td>
                    <td className="py-2 text-right">{stock.name}</td>
                  </tr>
                  {stock.exchange && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 text-gray-600 dark:text-gray-400">Sàn giao dịch</td>
                      <td className="py-2 text-right">{stock.exchange}</td>
                    </tr>
                  )}
                  {stock.industry && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 text-gray-600 dark:text-gray-400">Ngành</td>
                      <td className="py-2 text-right">{stock.industry}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Chart section */}
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Biểu đồ giá</h3>
                <TimePeriodSelector 
                  selectedPeriod={timePeriod} 
                  onChange={handleTimePeriodChange} 
                />
              </div>
              
              {chartLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : chartError ? (
                <div className="p-4 text-center text-red-500 dark:text-red-400">
                  {chartError}
                </div>
              ) : qIndices.length > 0 ? (
                <div className="h-[300px] w-full">
                  <StockChart 
                    data={qIndices}
                    chartType="candlestick"
                    lineOptions={{
                      fields: ['trend_q', 'fq'],
                      colors: ['#5BD3DD', '#F1C232'],
                    }}
                    height={300}
                    width={undefined}
                    title={`${stock.symbol} - Biểu đồ giá`}
                  />
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Không có dữ liệu biểu đồ cho giai đoạn này.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 