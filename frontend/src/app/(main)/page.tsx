'use client';

import React, { useEffect, useState } from 'react';
import { StockQIndex } from '@/types/stockQIndex';
import { homeService } from '@/services/homeService';
import StockChart from '@/components/charts/StockChart';
import TimePeriodSelector from '@/components/charts/TimePeriodSelector';
import LatestPosts from '@/components/home/LatestPosts';
import { Post } from '@/types/post';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyPrice } from '@/types/currencyPrice';
import { currencyPriceService } from '@/services/currencyPriceService';
import { Button } from '@/components/ui/button';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Currency data states
  const [currencySymbols, setCurrencySymbols] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [currencyData, setCurrencyData] = useState<CurrencyPrice[]>([]);
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  // Stock ID to use for fetching data
  const stockId = 1211;

  // Fetch QIndices data based on stockId and timePeriod
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Calculate date range
      const today = new Date();
      const endDate = formatDate(today);
      const fromDate = new Date();
      let startDate: string;

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

  // Fetch available currency symbols
  useEffect(() => {
    const fetchCurrencySymbols = async () => {
      try {
        const response = await currencyPriceService.fetchCurrencyPrices(1, 100);
        // Extract unique symbols
        const symbols = [...new Set(response.data.map(item => item.symbol))];
        setCurrencySymbols(symbols);
        
        // Set default selected currency if available
        if (symbols.length > 0 && !selectedCurrency) {
          setSelectedCurrency(symbols[0]);
        }
      } catch (err) {
        console.error('Error fetching currency symbols:', err);
        setCurrencyError('Failed to load currency symbols');
      }
    };
    
    fetchCurrencySymbols();
  }, []);

  // Fetch currency data when selected currency changes
  useEffect(() => {
    if (!selectedCurrency) return;
    
    const fetchCurrencyData = async () => {
      setIsCurrencyLoading(true);
      setCurrencyError(null);
      
      // Calculate date range (use same logic as for QIndices)
      const today = new Date();
      const endDate = formatDate(today);
      const fromDate = new Date();
      fromDate.setMonth(today.getMonth() - 3); // Default to 3 months
      const startDate = formatDate(fromDate);
      
      try {
        const filters = {
          symbol: selectedCurrency,
          startDate: startDate,
          endDate: endDate
        };
        
        const response = await currencyPriceService.fetchCurrencyPrices(1, 500, undefined, filters);
        setCurrencyData(response.data);
      } catch (err) {
        console.error(`Error fetching currency data for ${selectedCurrency}:`, err);
        setCurrencyError(`Failed to load data for ${selectedCurrency}`);
        setCurrencyData([]);
      } finally {
        setIsCurrencyLoading(false);
      }
    };
    
    fetchCurrencyData();
  }, [selectedCurrency]);

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

  // Currency related sample news data
  const currencyNews = [
    {
      id: 1,
      title: "USD tăng mạnh so với EUR sau cuộc họp của Fed",
      date: "2023-11-30",
      summary: "USD tăng mạnh sau khi Fed tuyên bố giữ nguyên lãi suất nhưng dự kiến sẽ có các đợt cắt giảm vào năm sau."
    },
    {
      id: 2,
      title: "Giá vàng thiết lập kỷ lục mới do căng thẳng địa chính trị",
      date: "2023-11-28",
      summary: "XAUUSD đạt mức cao nhất mọi thời đại do nhu cầu tài sản an toàn tăng cao giữa bối cảnh căng thẳng địa chính trị."
    },
    {
      id: 3,
      title: "EUR giảm sau dữ liệu lạm phát EU thấp hơn dự báo",
      date: "2023-11-25",
      summary: "EUR giảm giá so với các đồng tiền chính khác sau khi dữ liệu lạm phát mới nhất của Eurozone thấp hơn dự báo."
    },
    {
      id: 4,
      title: "JPY tăng sau khi BOJ ám chỉ thắt chặt chính sách",
      date: "2023-11-20",
      summary: "Đồng yên Nhật tăng mạnh sau khi Ngân hàng Trung ương Nhật Bản ám chỉ có thể thắt chặt chính sách tiền tệ."
    }
  ];

  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Biểu đồ phân tích VNINDEX</h2>
            <TimePeriodSelector selectedPeriod={timePeriod} onChange={handleTimePeriodChange} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="p-6 py-0">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[300px] w-full" />
                      <Skeleton className="h-[250px] w-full" />
                      <Skeleton className="h-[200px] w-full" />
                    </div>
                  ) : qIndices.length > 0 ? (
                    <div className="space-y-6 py-0">
                      {/* Price Chart */}
                      <div>
                        <StockChart
                          chartType="candlestick"
                          data={qIndices}
                          height={250}
                          hideXAxis={true}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="market-charts"
                        />
                      </div>

                      {/* Trend Q & FQ */}
                      <div className="relative -mt-6">
                        <StockChart
                          chartType="mixed"
                          data={qIndices}
                          lineOptions={{
                            fields: ['trend_q'],
                            colors: ['#2962FF'],
                            smooth: true
                          }}
                          histogramOptions={{
                            fields: ['fq'],
                            colors: ['#FF6D0080']
                          }}
                          height={150}
                          hideXAxis={true}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="market-charts"
                        />
                      </div>

                      {/* QV1 Values */}
                      <div className="relative -mt-6">
                        <StockChart
                          chartType="histogram"
                          data={qIndices}
                          height={150}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="market-charts"
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
            <div className="lg:col-span-1">
              <LatestPosts posts={posts} isLoading={isLoadingPosts} />
            </div>
          </div>
        </section>

        {/* Currency Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Thị trường Tiền tệ</h2>
          
          {currencyError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {currencyError}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {/* Currency Symbol Selector */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-md font-medium mb-3">Chọn cặp tiền tệ</h3>
                <div className="flex flex-wrap gap-2">
                  {currencySymbols.length > 0 ? (
                    currencySymbols.map((symbol) => (
                      <Button
                        key={symbol}
                        variant={selectedCurrency === symbol ? "default" : "outline"}
                        onClick={() => setSelectedCurrency(symbol)}
                        className="text-sm"
                      >
                        {symbol}
                      </Button>
                    ))
                  ) : (
                    <div className="text-muted-foreground">Đang tải danh sách tiền tệ...</div>
                  )}
                </div>
              </div>
              
              {/* Currency Charts */}
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="p-6 py-0">
                  {isCurrencyLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[300px] w-full" />
                      <Skeleton className="h-[200px] w-full" />
                    </div>
                  ) : currencyData.length > 0 ? (
                    <div className="space-y-6 py-0">
                      {/* Currency Price Chart */}
                      <div>
                        <h3 className="text-lg font-medium my-3">{selectedCurrency} Price Chart</h3>
                        <StockChart
                          chartType="candlestick"
                          data={currencyData}
                          height={300}
                          hideXAxis={true}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="currency-charts"
                        />
                      </div>

                      {/* Currency Trend Q & FQ */}
                      <div className="relative -mt-6">
                        <h3 className="text-lg font-medium my-3 z-10">{selectedCurrency} Trend Q & FQ</h3>
                        <StockChart
                          chartType="mixed"
                          data={currencyData}
                          lineOptions={{
                            fields: ['trend_q'],
                            colors: ['#2962FF'],
                            smooth: true
                          }}
                          histogramOptions={{
                            fields: ['fq'],
                            colors: ['#FF6D0080']
                          }}
                          height={250}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="currency-charts"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      {selectedCurrency ? 
                        `Không có dữ liệu cho ${selectedCurrency}` : 
                        'Vui lòng chọn một loại tiền tệ'
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Currency News */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">Tin tức Tiền tệ</h3>
                  <div className="space-y-4">
                    {currencyNews.map(news => (
                      <div key={news.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <h4 className="font-medium text-sm mb-1">{news.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{news.date}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{news.summary}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
