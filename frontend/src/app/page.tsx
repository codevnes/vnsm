'use client';

import React, { useEffect, useState } from 'react';
import { StockQIndex } from '@/types/stockQIndex';
import { homeService } from '@/services/homeService';
import StockChart from '@/components/charts/StockChart';
import TimePeriodSelector from '@/components/charts/TimePeriodSelector';
import LatestPosts from '@/components/home/LatestPosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, BarChart2, TrendingUp, Activity } from 'lucide-react';

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type TimePeriod = '3m' | '6m' | '1y' | '5y';

export default function Home() {
  // State now holds data directly fetched from API based on timePeriod
  const [qIndices, setQIndices] = useState<StockQIndex[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('3m');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stock ID to use for fetching data
  const stockId = 526;

  // Fetch QIndices data based on stockId and timePeriod
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Calculate date range
      const today = new Date();
      const endDate = formatDate(today);
      let startDate: string;
      const fromDate = new Date();

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
          fromDate.setMonth(today.getMonth() - 3); // Default to 3m
      }
      startDate = formatDate(fromDate);

      try {
        // Fetch data for the calculated date range, sort ascending for charts
        const response = await homeService.fetchQIndices(
            stockId, 
            'date', 
            'asc', 
            startDate, 
            endDate
        );
        
        const rawData = response.data || [];
        setQIndices(rawData);
      } catch (err) {
        console.error('Error fetching QIndices:', err);
        setError('Failed to load chart data. Please try again later.');
        setQIndices([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  // Re-fetch data when stockId or timePeriod changes
  }, [stockId, timePeriod]); 

  // Fetch latest posts (remains the same)
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const posts = await homeService.fetchLatestPosts();
        setPosts(posts);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle time period change - simply updates state, useEffect handles refetch
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  // Get the latest index data for summary stats
  const latestData = qIndices.length > 0 ? qIndices[qIndices.length - 1] : null;
  const previousData = qIndices.length > 1 ? qIndices[qIndices.length - 2] : null;
  
  // Calculate change percentages
  const priceChange = latestData && previousData && latestData.close && previousData.close
    ? ((parseFloat(latestData.close.toString()) - parseFloat(previousData.close.toString())) / parseFloat(previousData.close.toString())) * 100
    : 0;
  
  const trendQChange = latestData && previousData && latestData.trend_q && previousData.trend_q
    ? ((parseFloat(latestData.trend_q.toString()) - parseFloat(previousData.trend_q.toString())) / parseFloat(previousData.trend_q.toString())) * 100
    : 0;
  
  const fqChange = latestData && previousData && latestData.fq && previousData.fq
    ? ((parseFloat(latestData.fq.toString()) - parseFloat(previousData.fq.toString())) / parseFloat(previousData.fq.toString())) * 100
    : 0;

  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-8">Tổng quan thị trường</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Market Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Price Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Giá hiện tại</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold">
                        {latestData?.close ? parseFloat(latestData.close.toString()).toLocaleString('vi-VN') : 'N/A'}
                      </h3>
                    )}
                    {isLoading ? (
                      <Skeleton className="h-4 w-16 mt-1" />
                    ) : (
                      <p className={`text-sm font-medium flex items-center mt-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        <ArrowUpRight className={`ml-1 h-3 w-3 ${priceChange >= 0 ? '' : 'transform rotate-180'}`} />
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trend Q Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Trend Q</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold">
                        {latestData?.trend_q ? parseFloat(latestData.trend_q.toString()).toFixed(2) : 'N/A'}
                      </h3>
                    )}
                    {isLoading ? (
                      <Skeleton className="h-4 w-16 mt-1" />
                    ) : (
                      <p className={`text-sm font-medium flex items-center mt-1 ${trendQChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trendQChange >= 0 ? '+' : ''}{trendQChange.toFixed(2)}%
                        <ArrowUpRight className={`ml-1 h-3 w-3 ${trendQChange >= 0 ? '' : 'transform rotate-180'}`} />
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FQ Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">FQ Index</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold">
                        {latestData?.fq ? parseFloat(latestData.fq.toString()).toFixed(2) : 'N/A'}
                      </h3>
                    )}
                    {isLoading ? (
                      <Skeleton className="h-4 w-16 mt-1" />
                    ) : (
                      <p className={`text-sm font-medium flex items-center mt-1 ${fqChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {fqChange >= 0 ? '+' : ''}{fqChange.toFixed(2)}%
                        <ArrowUpRight className={`ml-1 h-3 w-3 ${fqChange >= 0 ? '' : 'transform rotate-180'}`} />
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                    <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volume Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Khối lượng</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <h3 className="text-2xl font-bold">
                        {latestData?.qv1 ? (parseFloat(latestData.qv1.toString()) / 1000).toFixed(2) + 'K' : 'N/A'}
                      </h3>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Cập nhật {latestData?.date ? new Date(latestData.date).toLocaleDateString('vi-VN') : ''}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <BarChart2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Biểu đồ phân tích</h2>
            <TimePeriodSelector selectedPeriod={timePeriod} onChange={handleTimePeriodChange} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[300px] w-full" />
                      <Skeleton className="h-[250px] w-full" />
                      <Skeleton className="h-[200px] w-full" />
                    </div>
                  ) : qIndices.length > 0 ? (
                    <div className="space-y-6">
                      {/* Price Chart */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Biểu đồ giá</h3>
                        <StockChart
                          chartType="candlestick"
                          data={qIndices as any}
                          height={300}
                          hideXAxis={true}
                          rightPriceScaleMinimumWidth={60}
                        />
                      </div>
                      
                      {/* Trend Q & FQ */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Trend Q & FQ</h3>
                        <StockChart
                          chartType="line"
                          data={qIndices as any}
                          lineOptions={{ 
                            fields: ['trend_q', 'fq'], 
                            colors: ['#2962FF', '#FF6D00'],
                            smooth: true
                          }}
                          height={250}
                          hideXAxis={true}
                          rightPriceScaleMinimumWidth={60}
                        />
                      </div>
                      
                      {/* QV1 Values */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">QV1 Values</h3>
                        <StockChart
                          chartType="histogram"
                          data={qIndices as any}
                          height={200}
                          rightPriceScaleMinimumWidth={60}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Không có dữ liệu cho giai đoạn đã chọn.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Latest Posts */}
            <div className="lg:col-span-1 ">
              <LatestPosts posts={posts} isLoading={isLoadingPosts} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
