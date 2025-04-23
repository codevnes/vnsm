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
    <div className="py-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-100">
      <div className="container mx-auto px-4 transition-all duration-300 ease-in-out">
        {error && (
          <div className="bg-red-900/60 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 shadow-lg backdrop-blur-sm">
            {error}
          </div>
        )}
        
        <section className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200 pb-1">Biểu đồ phân tích VNINDEX</h2>
              {latestData && (
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-semibold mr-2 text-white">{latestData.close}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${priceChange >= 0 ? 'bg-green-500/30 text-green-300 border border-green-500/50' : 'bg-red-500/30 text-red-300 border border-red-500/50'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <TimePeriodSelector selectedPeriod={timePeriod} onChange={handleTimePeriodChange} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-blue-900/20 hover:shadow-2xl">
                <CardContent className="p-6 py-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[300px] w-full bg-gray-700/50" />
                      <Skeleton className="h-[250px] w-full bg-gray-700/50" />
                      <Skeleton className="h-[200px] w-full bg-gray-700/50" />
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
                      <div className="relative">
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
                      <div className="relative">
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
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Không có dữ liệu cho giai đoạn đã chọn.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Latest Posts */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm h-full transition-all duration-300 hover:shadow-teal-900/20 hover:shadow-2xl">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-200 pb-1">Tin tức thị trường</h3>
                  
                  {isLoadingPosts ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full bg-gray-700/50" />
                      <Skeleton className="h-16 w-full bg-gray-700/50" />
                      <Skeleton className="h-16 w-full bg-gray-700/50" />
                    </div>
                  ) : posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0 hover:bg-gray-700/30 transition-all duration-300 rounded-lg p-2">
                          <h4 className="font-medium text-sm mb-1 text-white">{post.title}</h4>
                          <p className="text-xs text-gray-400 mb-2">
                            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-sm text-gray-300 line-clamp-2">{post.description || ''}</p>
                        </div>
                      ))}
                      <div className="pt-2 text-center">
                        <Button variant="outline" size="sm" className="text-teal-400 border-teal-800 hover:bg-teal-950 hover:text-teal-300 transition-all duration-300">
                          Xem thêm tin tức
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      Không có bài viết mới.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Market Movers Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200 pb-1">Cổ phiếu biến động mạnh</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Top Gainers */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-green-900/30 hover:shadow-2xl group">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-green-900/40 to-green-800/20 p-4 border-b border-green-700/30 group-hover:from-green-800/50 group-hover:to-green-700/30 transition-all duration-300">
                  <h3 className="font-semibold text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    Top Tăng
                  </h3>
                </div>
                <div className="divide-y divide-gray-700/30">
                  {/* Sample data - in a real app, this would be dynamic */}
                  {[
                    { symbol: 'VHM', price: 49.95, change: 6.83 },
                    { symbol: 'VIC', price: 44.25, change: 6.12 },
                    { symbol: 'GVR', price: 27.40, change: 5.39 },
                    { symbol: 'MSN', price: 73.30, change: 5.17 },
                    { symbol: 'TPB', price: 16.95, change: 4.95 },
                  ].map((stock) => (
                    <div key={stock.symbol} className="p-4 hover:bg-green-900/20 transition-all duration-300 flex justify-between items-center">
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{stock.price.toLocaleString()}</div>
                        <div className="text-sm text-green-400 flex items-center justify-end">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          +{stock.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Losers */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-red-900/30 hover:shadow-2xl group">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-red-900/40 to-red-800/20 p-4 border-b border-red-700/30 group-hover:from-red-800/50 group-hover:to-red-700/30 transition-all duration-300">
                  <h3 className="font-semibold text-red-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 011-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L19 10.586 19.707 9.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0L8 14.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0L10 13.586l3.293-3.293L12 8.414V13z" clipRule="evenodd" />
                    </svg>
                    Top Giảm
                  </h3>
                </div>
                <div className="divide-y divide-gray-700/30">
                  {[
                    { symbol: 'SSI', price: 28.60, change: -5.75 },
                    { symbol: 'VND', price: 22.15, change: -4.95 },
                    { symbol: 'HPG', price: 25.80, change: -4.44 },
                    { symbol: 'TCB', price: 35.60, change: -3.92 },
                    { symbol: 'CTG', price: 32.45, change: -3.56 },
                  ].map((stock) => (
                    <div key={stock.symbol} className="p-4 hover:bg-red-900/20 transition-all duration-300 flex justify-between items-center">
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{stock.price.toLocaleString()}</div>
                        <div className="text-sm text-red-400 flex items-center justify-end">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {stock.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Volume Leaders */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-blue-900/30 hover:shadow-2xl group">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 p-4 border-b border-blue-700/30 group-hover:from-blue-800/50 group-hover:to-blue-700/30 transition-all duration-300">
                  <h3 className="font-semibold text-blue-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Khối lượng lớn
                  </h3>
                </div>
                <div className="divide-y divide-gray-700/30">
                  {[
                    { symbol: 'HPG', price: 25.80, volume: 16543200 },
                    { symbol: 'MBB', price: 22.15, volume: 12758300 },
                    { symbol: 'STB', price: 27.90, volume: 10589600 },
                    { symbol: 'SSI', price: 28.60, volume: 9856400 },
                    { symbol: 'VND', price: 22.15, volume: 8742100 },
                  ].map((stock) => (
                    <div key={stock.symbol} className="p-4 hover:bg-blue-900/20 transition-all duration-300 flex justify-between items-center">
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{stock.price.toLocaleString()}</div>
                        <div className="text-sm text-blue-300">{(stock.volume / 1000000).toFixed(1)}M CP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Value Leaders */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-purple-900/30 hover:shadow-2xl group">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/20 p-4 border-b border-purple-700/30 group-hover:from-purple-800/50 group-hover:to-purple-700/30 transition-all duration-300">
                  <h3 className="font-semibold text-purple-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092c-.514.12-1 .287-1.342.507C7.07 6.25 7 6.7 7 7a1 1 0 001 1h1.73v5.1c-.076.07-.256.17-.423.315-.167.072-.41.17-.72.295-.315.125-.547.137-.764.137-.348 0-.655-.128-.832-.4a1 1 0 00-1.8.8c.168.657.658 1.144 1.359 1.337.463.13 1.105.19 1.937.19.265 0 .526-.007.786-.02.273.195.573.385.874.552.53.286 1.003.552 1.472.745.192.077.4.144.615.205a1.002 1.002 0 001.27-.613 1 1 0 00-.613-1.27 5.478 5.478 0 01-.415-.14c-.34-.14-.718-.353-1.133-.59-.19-.11-.393-.225-.603-.35V8h1.73a1 1 0 001-1c0-.3-.07-.75-.66-1.400C14.1 5.287 13.614 5.12 13.1 5v-.092A1 1 0 0010 5z" clipRule="evenodd" />
                    </svg>
                    Giá trị giao dịch
                  </h3>
                </div>
                <div className="divide-y divide-gray-700/30">
                  {[
                    { symbol: 'VHM', price: 49.95, value: 825.7 },
                    { symbol: 'HPG', price: 25.80, value: 415.8 },
                    { symbol: 'VNM', price: 72.3, value: 352.9 },
                    { symbol: 'VIC', price: 44.25, value: 344.6 },
                    { symbol: 'MSN', price: 73.30, value: 325.4 },
                  ].map((stock) => (
                    <div key={stock.symbol} className="p-4 hover:bg-purple-900/20 transition-all duration-300 flex justify-between items-center">
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{stock.price.toLocaleString()}</div>
                        <div className="text-sm text-purple-300">{stock.value} tỷ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Currency Section */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 pb-1">Thị trường Tiền tệ</h2>
            {selectedCurrency && !isCurrencyLoading && currencyData.length > 0 && (
              <div className="flex items-center mt-2 md:mt-0">
                <span className="font-semibold mr-2 text-white">{selectedCurrency}</span>
                {currencyData.length > 1 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currencyData[currencyData.length-1].close >= currencyData[currencyData.length-2].close 
                    ? 'bg-green-500/30 text-green-300 border border-green-500/50' 
                    : 'bg-red-500/30 text-red-300 border border-red-500/50'
                  }`}>
                    {currencyData[currencyData.length-1].close >= currencyData[currencyData.length-2].close ? '+' : ''}
                    {((currencyData[currencyData.length-1].close - currencyData[currencyData.length-2].close) / 
                      currencyData[currencyData.length-2].close * 100).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
          
          {currencyError && (
            <div className="bg-red-900/60 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 shadow-lg backdrop-blur-sm">
              {currencyError}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {/* Currency Symbol Selector */}
              <div className="bg-gray-800/60 rounded-xl shadow-xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm hover:shadow-amber-900/20 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-md font-medium mb-4 text-white">Chọn cặp tiền tệ</h3>
                <div className="flex flex-wrap gap-2">
                  {currencySymbols.length > 0 ? (
                    currencySymbols.map((symbol) => (
                      <Button
                        key={symbol}
                        variant={selectedCurrency === symbol ? "default" : "outline"}
                        onClick={() => setSelectedCurrency(symbol)}
                        className={`text-sm transition-all duration-300 transform hover:scale-105 ${
                          selectedCurrency === symbol
                            ? 'bg-gradient-to-r from-amber-600 to-yellow-700 border-0 text-white shadow-lg hover:shadow-amber-600/30'
                            : 'border border-amber-800 text-amber-300 hover:border-amber-600 hover:text-amber-200 hover:bg-amber-950/50'
                        }`}
                      >
                        {symbol}
                      </Button>
                    ))
                  ) : (
                    <div className="text-gray-400">Đang tải danh sách tiền tệ...</div>
                  )}
                </div>
              </div>
              
              {/* Currency Charts */}
              <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm hover:shadow-amber-900/20 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  {isCurrencyLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[300px] w-full bg-gray-700/50" />
                      <Skeleton className="h-[200px] w-full bg-gray-700/50" />
                    </div>
                  ) : currencyData.length > 0 ? (
                    <div className="space-y-6">
                      {/* Currency Price Chart */}
                      <div>
                        <h3 className="text-lg font-medium my-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092c-.514.12-1 .287-1.342.507C7.07 6.25 7 6.7 7 7a1 1 0 001 1h1.73v5.1c-.076.07-.256.17-.423.315-.167.072-.41.17-.72.295-.315.125-.547.137-.764.137-.348 0-.655-.128-.832-.4a1 1 0 00-1.8.8c.168.657.658 1.144 1.359 1.337.463.13 1.105.19 1.937.19.265 0 .526-.007.786-.02.273.195.573.385.874.552.53.286 1.003.552 1.472.745.192.077.4.144.615.205a1.002 1.002 0 001.27-.613 1 1 0 00-.613-1.27 5.478 5.478 0 01-.415-.14c-.34-.14-.718-.353-1.133-.59-.19-.11-.393-.225-.603-.35V8h1.73a1 1 0 001-1c0-.3-.07-.75-.66-1.400C14.1 5.287 13.614 5.12 13.1 5v-.092A1 1 0 0010 5z" clipRule="evenodd" />
                          </svg>
                          {selectedCurrency} Price Chart
                        </h3>
                        <div className="mt-4 relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg blur opacity-75"></div>
                          <div className="relative">
                            <StockChart
                              chartType="candlestick"
                              data={currencyData}
                              height={300}
                              hideXAxis={true}
                              rightPriceScaleMinimumWidth={50}
                              syncGroup="currency-charts"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Currency Trend Q & FQ */}
                      <div className="relative">
                        <h3 className="text-lg font-medium my-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                          </svg>
                          {selectedCurrency} Trend Q & FQ
                        </h3>
                        <div className="mt-4 relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur opacity-75"></div>
                          <div className="relative">
                            <StockChart
                              chartType="mixed"
                              data={currencyData}
                              lineOptions={{
                                fields: ['trend_q'],
                                colors: ['#60A5FA'],
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
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
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
              <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm hover:shadow-amber-900/20 hover:shadow-2xl transition-all duration-300 h-full">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 pb-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                      <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                    </svg>
                    Tin tức Tiền tệ
                  </h3>
                  <div className="space-y-4 mt-4">
                    {currencyNews.map(news => (
                      <div key={news.id} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0 hover:bg-gray-700/30 transition-all duration-300 rounded-lg p-3 group">
                        <h4 className="font-medium text-sm mb-1 text-white group-hover:text-amber-300 transition-colors duration-300">{news.title}</h4>
                        <p className="text-xs text-gray-400 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {news.date}
                        </p>
                        <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">{news.summary}</p>
                      </div>
                    ))}
                    <div className="pt-2 text-center">
                      <Button variant="outline" size="sm" className="text-amber-400 border-amber-800 hover:bg-amber-950/50 hover:text-amber-300 transition-all duration-300">
                        Xem thêm tin tức
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Market Analysis & Economic Calendar Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-200 pb-1">Phân tích & Sự kiện kinh tế</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Technical Analysis */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-indigo-900/30 hover:shadow-2xl group">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-blue-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Phân tích kỹ thuật
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-700/40 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all duration-300 group-hover:border-indigo-800/50 hover:shadow-indigo-900/10 hover:shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">VNINDEX</span>
                      <span className="text-sm bg-green-500/30 text-green-300 border border-green-500/50 px-3 py-0.5 rounded-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        Mua
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-gray-400">RSI(14)</div>
                        <div className="font-medium text-white">58.6</div>
                      </div>
                      <div>
                        <div className="text-gray-400">MACD</div>
                        <div className="font-medium text-green-400">+3.21</div>
                      </div>
                      <div>
                        <div className="text-gray-400">SMA(20)</div>
                        <div className="font-medium text-white">1,254.8</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/40 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all duration-300 group-hover:border-indigo-800/50 hover:shadow-indigo-900/10 hover:shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">VN30</span>
                      <span className="text-sm bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 px-3 py-0.5 rounded-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Trung lập
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-gray-400">RSI(14)</div>
                        <div className="font-medium text-white">52.1</div>
                      </div>
                      <div>
                        <div className="text-gray-400">MACD</div>
                        <div className="font-medium text-red-400">-1.45</div>
                      </div>
                      <div>
                        <div className="text-gray-400">SMA(20)</div>
                        <div className="font-medium text-white">1,275.3</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/40 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all duration-300 group-hover:border-indigo-800/50 hover:shadow-indigo-900/10 hover:shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">HNX-INDEX</span>
                      <span className="text-sm bg-red-500/30 text-red-300 border border-red-500/50 px-3 py-0.5 rounded-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                        Bán
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-gray-400">RSI(14)</div>
                        <div className="font-medium text-white">45.3</div>
                      </div>
                      <div>
                        <div className="text-gray-400">MACD</div>
                        <div className="font-medium text-red-400">-2.78</div>
                      </div>
                      <div>
                        <div className="text-gray-400">SMA(20)</div>
                        <div className="font-medium text-white">235.6</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Market Sentiment */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-pink-900/30 hover:shadow-2xl group">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                  </svg>
                  Tâm lý thị trường
                </h3>
                
                <div className="mb-6 bg-gray-700/40 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all duration-300 group-hover:border-pink-800/50 hover:shadow-pink-900/10 hover:shadow-lg">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-300">Tâm lý nhà đầu tư</span>
                    <span className="text-sm font-medium text-orange-400">Lo sợ (32/100)</span>
                  </div>
                  <div className="w-full bg-gray-600/50 rounded-full h-3">
                    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-green-500 h-3 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Cực độ sợ hãi</span>
                    <span>Trung lập</span>
                    <span>Cực độ tham lam</span>
                  </div>
                </div>
                
                <div className="space-y-4 bg-gray-700/40 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-all duration-300 group-hover:border-pink-800/50 hover:shadow-pink-900/10 hover:shadow-lg">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-pink-400 mr-2"></span>
                      Chỉ số put/call
                    </span>
                    <span className="font-medium text-white">1.15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-purple-400 mr-2"></span>
                      Tỷ lệ tăng/giảm
                    </span>
                    <span className="font-medium text-white">0.86</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-indigo-400 mr-2"></span>
                      Khối lượng giao dịch (sv TB)
                    </span>
                    <span className="font-medium text-green-400">+28.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                      Khối ngoại (tuần)
                    </span>
                    <span className="font-medium text-red-400">-1,254 tỷ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-teal-400 mr-2"></span>
                      Tỷ lệ cổ phiếu trên MA(50)
                    </span>
                    <span className="font-medium text-white">48.6%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Economic Calendar */}
            <Card className="bg-gray-800/50 shadow-xl rounded-xl overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-cyan-900/30 hover:shadow-2xl group">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Lịch kinh tế
                </h3>
                
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-300 mb-2 bg-gray-700/20 px-3 py-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Hôm nay, {new Date().toLocaleDateString('vi-VN')}
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-3 py-2 bg-yellow-900/10 rounded-r-lg hover:bg-yellow-900/20 transition-all duration-300 hover:translate-x-1">
                    <div className="text-sm font-medium text-white">08:30 - PMI Sản xuất (Việt Nam)</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="text-yellow-400 mr-2">Trung bình</span>
                      Dự báo: 50.2 | Trước đó: 49.8
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-3 py-2 bg-red-900/10 rounded-r-lg hover:bg-red-900/20 transition-all duration-300 hover:translate-x-1">
                    <div className="text-sm font-medium text-white">14:00 - CPI Eurozone (YoY)</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="text-red-400 mr-2">Cao</span>
                      Dự báo: 2.8% | Trước đó: 2.6%
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-900/10 rounded-r-lg hover:bg-green-900/20 transition-all duration-300 hover:translate-x-1">
                    <div className="text-sm font-medium text-white">19:30 - Đơn xin trợ cấp thất nghiệp Mỹ</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="text-green-400 mr-2">Thấp</span>
                      Dự báo: 238K | Trước đó: 242K
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-300 mt-6 mb-2 bg-gray-700/20 px-3 py-2 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Ngày mai, {new Date(Date.now() + 86400000).toLocaleDateString('vi-VN')}
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-3 py-2 bg-red-900/10 rounded-r-lg hover:bg-red-900/20 transition-all duration-300 hover:translate-x-1">
                    <div className="text-sm font-medium text-white">07:30 - Doanh số bán lẻ (Việt Nam)</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="text-red-400 mr-2">Cao</span>
                      Dự báo: +5.4% | Trước đó: +5.2%
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-3 py-2 bg-green-900/10 rounded-r-lg hover:bg-green-900/20 transition-all duration-300 hover:translate-x-1">
                    <div className="text-sm font-medium text-white">19:30 - Báo cáo việc làm phi nông nghiệp Mỹ</div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <span className="text-green-400 mr-2">Thấp</span>
                      Dự báo: 185K | Trước đó: 175K
                    </div>
                  </div>
                  
                  <div className="pt-4 text-center">
                    <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-800 hover:bg-cyan-950/50 hover:text-cyan-300 transition-all duration-300">
                      Xem lịch đầy đủ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
