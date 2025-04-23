'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChartJS from '@/components/charts/ChartJS';
import { stockService } from '@/services/stockService';
import { epsRecordService } from '@/services/epsRecordService';
import { peRecordService } from '@/services/peRecordService';
import { roaRoeRecordService } from '@/services/roaRoeRecordService';
import { financialRatioRecordService } from '@/services/financialRatioRecordService';
import { EpsRecord } from '@/types/epsRecord';
import { PeRecord } from '@/types/peRecord';
import { RoaRoeRecord } from '@/types/roaRoeRecord';
import { FinancialRatioRecord } from '@/types/financialRatioRecord';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowUp, ArrowDown, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Chart from 'chart.js/auto';
import StockChart from '@/components/charts/StockChart';
import TimePeriodSelector from '@/components/charts/TimePeriodSelector';
import { StockQIndex } from '@/types/stockQIndex';
import { stockQIndexService } from '@/services/stockQIndexService';
import { Skeleton } from '@/components/ui/skeleton';

// Đăng ký plugin datalabels cho Chart.js
Chart.register(ChartDataLabels);

// Định nghĩa các màu cho biểu đồ
const chartColors = {
  primary: 'rgba(59, 130, 246, 0.75)',    // Xanh dương cho cột chính
  secondary: 'rgba(99, 102, 241, 0.5)',   // Xanh dương nhạt cho cột phụ
  tertiary: 'rgba(16, 185, 129, 0.7)',    // Xanh lá cho cột thứ 3 (nếu cần)
  line: 'rgba(239, 68, 68, 0.9)',         // Đỏ cho đường chính
  line2: 'rgba(249, 115, 22, 0.9)',       // Cam cho đường phụ
  gridLines: 'rgba(148, 163, 184, 0.1)',  // Màu lưới nhạt
};

// Định nghĩa kiểu dữ liệu cho chế độ xem
type ViewMode = 'quarter' | 'year';
type TimePeriod ='1y' | '3y' | '5y' | 'all';

// Helper function to format date as YYYY-MM-DD for API requests
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [epsRecords, setEpsRecords] = useState<EpsRecord[]>([]);
  const [peRecords, setPeRecords] = useState<PeRecord[]>([]);
  const [roaRoeRecords, setRoaRoeRecords] = useState<RoaRoeRecord[]>([]);
  const [financialRatioRecords, setFinancialRatioRecords] = useState<FinancialRatioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('quarter'); // Mặc định xem theo quý
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('3y'); // Mặc định xem 1 năm
  
  // State for Q-indices charts data (similar to home page)
  const [qIndices, setQIndices] = useState<StockQIndex[]>([]);
  const [isLoadingQIndices, setIsLoadingQIndices] = useState(true);
  const [qIndicesError, setQIndicesError] = useState<string | null>(null);
  const [qIndicesTimePeriod, setQIndicesTimePeriod] = useState<'3m' | '6m' | '1y' | '5y'>('3m');
  
  // Hàm xử lý khi thay đổi khoảng thời gian cho biểu đồ phân tích kỹ thuật
  const handleQIndicesTimePeriodChange = (period: '3m' | '6m' | '1y' | '5y') => {
    setQIndicesTimePeriod(period);
  };
  
  // Hàm xử lý khi thay đổi khoảng thời gian
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    // Ở đây có thể thêm logic để lọc dữ liệu theo khoảng thời gian
  };

  // Lấy dữ liệu khi component được mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy thông tin cơ bản về mã chứng khoán
        const stockData = await stockService.getStockBySymbol(symbol);
        setStockInfo(stockData);

        // Lấy dữ liệu EPS
        const epsData = await epsRecordService.fetchEpsRecordsBySymbol(symbol, 1, 100);
        setEpsRecords(epsData.data.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()));

        // Lấy dữ liệu PE
        const peData = await peRecordService.fetchPeRecordsBySymbol(symbol, 1, 100);
        setPeRecords(peData.data.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()));

        // Lấy dữ liệu ROA/ROE
        const roaRoeData = await roaRoeRecordService.fetchRoaRoeRecordsBySymbol(symbol, 1, 100);
        setRoaRoeRecords(roaRoeData.data.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()));

        // Lấy dữ liệu Financial Ratio
        const financialRatioData = await financialRatioRecordService.fetchFinancialRatioRecordsBySymbol(symbol, 1, 100);
        setFinancialRatioRecords(financialRatioData.data.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()));

      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  // Tải dữ liệu Q-indices cho biểu đồ kỹ thuật
  useEffect(() => {
    const fetchQIndicesData = async () => {
      setIsLoadingQIndices(true);
      setQIndicesError(null);

      // Calculate date range
      const today = new Date();
      const endDate = formatDate(today);
      const fromDate = new Date();
      let startDate: string;

      switch (qIndicesTimePeriod) {
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
      }
      startDate = formatDate(fromDate);

      try {
        // Lấy thông tin cơ bản về mã chứng khoán nếu chưa có
        if (!stockInfo) {
          const stockData = await stockService.getStockBySymbol(symbol);
          setStockInfo(stockData);
        }

        // Sử dụng stockId để lấy dữ liệu Q-indices
        if (stockInfo?.id) {
          // Sử dụng phương thức API mới và cải tiến
          const response = await stockQIndexService.fetchQIndicesByStockId(
            stockInfo.id,
            'date',            // Sắp xếp theo ngày
            'asc',             // Tăng dần (cho biểu đồ)
            startDate,         // Ngày bắt đầu theo khoảng thời gian
            endDate            // Ngày kết thúc (hôm nay)
          );

          const rawData = response.data || [];
          setQIndices(rawData);
        }
      } catch (err) {
        console.error('Error fetching Q-indices:', err);
        setQIndicesError('Không thể tải dữ liệu biểu đồ phân tích. Vui lòng thử lại sau.');
        setQIndices([]); // Clear data on error
      } finally {
        setIsLoadingQIndices(false);
      }
    };

    if (symbol) {
      fetchQIndicesData();
    }
  }, [symbol, qIndicesTimePeriod, stockInfo?.id]);

  // Format date để hiển thị trên biểu đồ
  const formatChartDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return viewMode === 'quarter' 
        ? format(date, 'QQQ/yyyy', { locale: vi }) // Hiển thị theo quý
        : format(date, 'yyyy', { locale: vi });    // Hiển thị theo năm
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  // Hàm xử lý dữ liệu theo quý hoặc năm và khoảng thời gian
  const processDataByViewMode = <T extends { reportDate: string }>(data: T[]): T[] => {
    // Lọc dữ liệu theo khoảng thời gian
    const now = new Date();
    let filteredData = [...data];
    
    if (timePeriod !== 'all') {
      const cutoffDate = new Date();
      
      switch (timePeriod) {
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        case '3y':
          cutoffDate.setFullYear(now.getFullYear() - 3);
          break;
        case '5y':
          cutoffDate.setFullYear(now.getFullYear() - 5);
          break;
      }
      
      filteredData = filteredData.filter(item => new Date(item.reportDate) >= cutoffDate);
    }
    
    // Xử lý theo chế độ xem (quý hoặc năm)
    if (viewMode === 'quarter') {
      // Trả về dữ liệu đã lọc khi xem theo quý
      return filteredData;
    } else {
      // Khi xem theo năm, nhóm dữ liệu theo năm và lấy giá trị mới nhất của mỗi năm
      const yearMap = new Map<string, T>();
      
      filteredData.forEach(item => {
        const year = new Date(item.reportDate).getFullYear().toString();
        // Nếu năm chưa có trong map hoặc ngày của item mới hơn item đã có
        if (!yearMap.has(year) || new Date(item.reportDate) > new Date(yearMap.get(year)!.reportDate)) {
          yearMap.set(year, item);
        }
      });
      
      // Chuyển map thành mảng và sắp xếp theo năm
      return Array.from(yearMap.values()).sort(
        (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
      );
    }
  };

  // Chuẩn bị dữ liệu cho biểu đồ EPS - cập nhật khi viewMode hoặc timePeriod thay đổi
  const processedEpsRecords = processDataByViewMode(epsRecords);
  const epsChartData = {
    labels: processedEpsRecords.map(record => formatChartDate(record.reportDate)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'EPS',
        data: processedEpsRecords.map(record => record.eps || 0),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        order: 1,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'bar' as const,
        label: 'EPS Ngành',
        data: processedEpsRecords.map(record => record.epsNganh || 0),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 1,
        order: 2,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'line' as const,
        label: 'EPS Rate',
        data: processedEpsRecords.map(record => record.epsRate || 0),
        borderColor: chartColors.line,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: chartColors.line,
        pointRadius: 4,
        tension: 0.4,
        order: 0,
        datalabels: {
          align: 'top',
          anchor: 'end',
          formatter: (value: number) => `${value.toFixed(2)}%`,
          color: chartColors.line,
          font: {
            weight: 'bold',
            size: 10,
          },
          padding: {
            top: 6,
          },
        },
      },
    ],
  };

  // Chuẩn bị dữ liệu cho biểu đồ PE
  const processedPeRecords = processDataByViewMode(peRecords);
  const peChartData = {
    labels: processedPeRecords.map(record => formatChartDate(record.reportDate)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'PE',
        data: processedPeRecords.map(record => record.pe || 0),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        order: 1,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'bar' as const,
        label: 'PE Ngành',
        data: processedPeRecords.map(record => record.peNganh || 0),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 1,
        order: 2,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'line' as const,
        label: 'PE Rate',
        data: processedPeRecords.map(record => record.peRate || 0),
        borderColor: chartColors.line,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: chartColors.line,
        pointRadius: 4,
        tension: 0.4,
        order: 0,
        datalabels: {
          align: 'top',
          anchor: 'end',
          formatter: (value: number) => `${value.toFixed(2)}%`,
          color: chartColors.line,
          font: {
            weight: 'bold',
            size: 10,
          },
          padding: {
            top: 6,
          },
        },
      },
    ],
  };

  // Chuẩn bị dữ liệu cho biểu đồ ROA/ROE
  const processedRoaRoeRecords = processDataByViewMode(roaRoeRecords);
  const roaRoeChartData = {
    labels: processedRoaRoeRecords.map(record => formatChartDate(record.reportDate)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'ROA',
        data: processedRoaRoeRecords.map(record => record.roa || 0),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        order: 1,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'bar' as const,
        label: 'ROE',
        data: processedRoaRoeRecords.map(record => record.roe || 0),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 1,
        order: 2,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'line' as const,
        label: 'ROE Ngành',
        data: processedRoaRoeRecords.map(record => record.roeNganh || 0),
        borderColor: chartColors.line,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: chartColors.line,
        pointRadius: 4,
        tension: 0.4,
        order: 0,
        datalabels: {
          align: 'top',
          anchor: 'end',
          formatter: (value: number) => `${value.toFixed(2)}%`,
          color: chartColors.line,
          font: {
            weight: 'bold',
            size: 10,
          },
          padding: {
            top: 6,
          },
        },
      },
      {
        type: 'line' as const,
        label: 'ROA Ngành',
        data: processedRoaRoeRecords.map(record => record.roaNganh || 0),
        borderColor: chartColors.line2,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: chartColors.line2,
        pointRadius: 4,
        tension: 0.4,
        order: 0,
        datalabels: {
          align: 'top',
          anchor: 'end',
          formatter: (value: number) => `${value.toFixed(2)}%`,
          color: chartColors.line2,
          font: {
            weight: 'bold',
            size: 10,
          },
          padding: {
            top: 6,
          },
        },
      },
    ],
  };

  // Chuẩn bị dữ liệu cho biểu đồ Financial Ratio
  const processedFinancialRatioRecords = processDataByViewMode(financialRatioRecords);
  const financialRatioChartData = {
    labels: processedFinancialRatioRecords.map(record => formatChartDate(record.reportDate)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Debt/Equity',
        data: processedFinancialRatioRecords.map(record => record.debtEquity || 0),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        order: 1,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'bar' as const,
        label: 'Assets/Equity',
        data: processedFinancialRatioRecords.map(record => record.assetsEquity || 0),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 1,
        order: 2,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        type: 'line' as const,
        label: 'Debt/Equity %',
        data: processedFinancialRatioRecords.map(record => record.debtEquityPct || 0),
        borderColor: chartColors.line,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: chartColors.line,
        pointRadius: 4,
        tension: 0.4,
        order: 0,
        datalabels: {
          align: 'top',
          anchor: 'end',
          formatter: (value: number) => `${value.toFixed(2)}%`,
          color: chartColors.line,
          font: {
            weight: 'bold',
            size: 10,
          },
          padding: {
            top: 6,
          },
        },
      },
    ],
  };

  // Cấu hình chung cho các biểu đồ
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: chartColors.gridLines,
          borderDash: [5, 5],
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          maxRotation: 30,
          minRotation: 30,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: chartColors.gridLines,
          borderDash: [5, 5],
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          padding: 10,
        },
      },
      y1: {
        display: false, // Ẩn trục y bên phải
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
          drawBorder: false,
        },
        ticks: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        borderWidth: 2,
      },
      bar: {
        borderRadius: 4,
      }
    },
    plugins: {
      datalabels: {
        display: function(context: any) {
          return context.dataset.type === 'line';
        },
      },
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          boxWidth: 15,
          boxHeight: 15,
          padding: 15,
          color: 'rgba(148, 163, 184, 0.9)',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: 'bold' as const,
        },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            const value = context.raw !== null ? context.raw : 0;
            const formattedValue = context.dataset.type === 'line' 
              ? `${value.toFixed(2)}%` 
              : value.toFixed(2);
            return `${context.dataset.label}: ${formattedValue}`;
          }
        }
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  };

  // Replace the loading state with this improved version
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        {/* Skeleton for header/banner */}
        <div className="relative overflow-hidden rounded-xl shadow-md bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 animate-pulse">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
                <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 md:w-64">
                <div className="h-14 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="mt-4 h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="mt-4 h-6 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700/20 flex flex-wrap gap-2">
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="ml-auto flex gap-2">
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton for tabs */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1.5 animate-pulse">
            {[1, 2, 3, 4].map((tab) => (
              <div key={tab} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Skeleton for chart cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {[1, 2, 3, 4].map((card) => (
            <div key={card} className="bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden animate-pulse">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </div>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-[250px] bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Replace the error state with this improved version
  if (error) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-2xl w-full bg-white dark:bg-gray-800/60 shadow-lg border-red-200 dark:border-red-900/30 border overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-1">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-red-500 dark:text-red-400">Không thể tải dữ liệu</CardTitle>
              </div>
              <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                Đã xảy ra lỗi khi tải thông tin cho mã chứng khoán này. Vui lòng thử lại sau.
              </CardDescription>
            </CardHeader>
          </div>
          <CardContent className="p-6">
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-100 dark:border-red-900/20">
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Thử lại
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine if stock is up or down (example logic - adjust as needed)
  const stockTrend = stockInfo?.priceChange > 0 ? 'up' : stockInfo?.priceChange < 0 ? 'down' : 'neutral';
  const trendColor = stockTrend === 'up' ? 'text-green-500' : stockTrend === 'down' ? 'text-red-500' : 'text-gray-500';
  const TrendIcon = stockTrend === 'up' ? ArrowUp : stockTrend === 'down' ? ArrowDown : Activity;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header/Banner Section with Stock Information */}
      <div className="relative overflow-hidden rounded-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/90 via-indigo-700/90 to-purple-700/90"></div>
        <div className="absolute inset-0 bg-grid-white/10 opacity-20 bg-[size:20px_20px]"></div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="relative backdrop-blur-sm p-6 md:p-8">
          {/* Stock Symbol and Exchange */}
          <div className="flex flex-col md:flex-row justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{stockInfo?.symbol}</h1>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-md text-white font-medium border border-white/10">
                    {stockInfo?.exchange || 'HOSE'}
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/30 text-emerald-50 rounded-md text-xs font-medium border border-emerald-400/30 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    Đang giao dịch
                  </div>
                </div>
              </div>
              <h2 className="text-xl md:text-2xl text-white/95 font-medium tracking-tight">{stockInfo?.name}</h2>
              
              {/* Stock Description */}
              <p className="text-white/70 text-sm max-w-2xl">
                {stockInfo?.description || 'Thông tin chi tiết về mã chứng khoán'}
              </p>
              
              {/* Industry and Other Data */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-white/90 text-sm backdrop-blur-sm">
                  <span className="text-white/60">Ngành:</span>
                  <span className="font-medium">{stockInfo?.industry || 'Công nghệ'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-white/90 text-sm backdrop-blur-sm">
                  <span className="text-white/60">KLCP:</span>
                  <span className="font-medium">{stockInfo?.outstandingShares ? stockInfo.outstandingShares.toString() : '1,000,000,000'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-white/90 text-sm backdrop-blur-sm">
                  <span className="text-white/60">Room NN:</span>
                  <span className="font-medium">{stockInfo?.foreignRoom || '49%'}</span>
                </div>
              </div>
            </div>
            
            {/* Stock Price and Changes */}
            <div className="mt-6 md:mt-0 bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-white">{stockInfo?.price || '42,500'}</span>
                <span className="text-lg text-white/60 font-medium">VND</span>
              </div>
              
              <div className={`flex items-center mt-2 ${trendColor}`}>
                <div className={`p-1.5 rounded-lg ${stockTrend === 'up' ? 'bg-green-500/20' : stockTrend === 'down' ? 'bg-red-500/20' : 'bg-gray-500/20'} mr-2`}>
                  <TrendIcon className="h-5 w-5" />
                </div>
                <span className="font-medium text-lg">{stockInfo?.priceChange || '+2,300'} ({stockInfo?.priceChangePct || '+5.72'}%)</span>
              </div>
              
              {/* Volume and Trading Value */}
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-md px-3 py-1.5 text-white/80 text-xs flex items-center">
                  <span className="text-white/60 mr-2">Khối lượng:</span>
                  <span className="font-medium">{stockInfo?.volume ? stockInfo.volume.toString() : '1,240,300'}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-md px-3 py-1.5 text-white/80 text-xs flex items-center">
                  <span className="text-white/60 mr-2">GTGD:</span>
                  <span className="font-medium">{stockInfo?.tradingValue ? stockInfo.tradingValue.toString() : '52.7'} tỷ</span>
                </div>
              </div>
              
              {/* Last Updated */}
              <div className="text-white/60 text-xs mt-3 flex items-center">
                <div className="w-2 h-2 rounded-full bg-white/40 mr-2 animate-pulse"></div>
                Cập nhật gần đây
              </div>
            </div>
          </div>

          {/* Price Range and Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <div className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 px-3 py-1.5 rounded-md">
              <span>Trần:</span>
              <span className="text-red-300 font-medium">{stockInfo?.ceiling || '45,500'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 px-3 py-1.5 rounded-md">
              <span>TC:</span>
              <span className="text-yellow-300 font-medium">{stockInfo?.reference || '40,200'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 px-3 py-1.5 rounded-md">
              <span>Sàn:</span>
              <span className="text-blue-300 font-medium">{stockInfo?.floor || '35,000'}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="ml-auto flex items-center gap-3">
              <button className="bg-indigo-500 hover:bg-indigo-600 transition text-white px-4 py-1.5 rounded-md text-sm font-medium border border-indigo-400">
                Mua/Bán
              </button>
              <button className="bg-white/10 hover:bg-white/20 transition text-white p-1.5 rounded-md border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-2xl blur-lg -z-10 opacity-70"></div>
          
          <TabsList className="relative grid grid-cols-2 md:grid-cols-4 gap-1 mb-2 w-full md:w-auto mx-auto bg-white/90 dark:bg-gray-900/80 backdrop-blur-md shadow-lg rounded-xl p-1.5 border border-gray-200/50 dark:border-gray-800/50">
            <TabsTrigger 
              value="overview" 
              className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg py-3 px-4 data-[state=active]:shadow-md transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-2 relative z-10">
                <Activity className="h-4 w-4" />
                <span>Tổng quan</span>
              </div>
              <div className="data-[state=active]:opacity-100 opacity-0 absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg transition-opacity duration-300 -z-0"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="financial" 
              className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg py-3 px-4 data-[state=active]:shadow-md transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-2 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Tài chính</span>
              </div>
              <div className="data-[state=active]:opacity-100 opacity-0 absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg transition-opacity duration-300 -z-0"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="technical" 
              className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg py-3 px-4 data-[state=active]:shadow-md transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-2 relative z-10">
                <TrendingUp className="h-4 w-4" />
                <span>Kỹ thuật</span>
              </div>
              <div className="data-[state=active]:opacity-100 opacity-0 absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg transition-opacity duration-300 -z-0"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="news" 
              className="relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg py-3 px-4 data-[state=active]:shadow-md transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-2 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span>Tin tức</span>
              </div>
              <div className="data-[state=active]:opacity-100 opacity-0 absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg transition-opacity duration-300 -z-0"></div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 space-y-6">

     {/* Q-indices charts section */}
     <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span>Biểu đồ Q-indices - <span className="text-blue-600 dark:text-blue-400">{stockInfo?.symbol}</span></span>
              </h3>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 border border-gray-100 dark:border-gray-700/30">
                <TimePeriodSelector 
                  selectedPeriod={qIndicesTimePeriod} 
                  onChange={handleQIndicesTimePeriodChange} 
                />
              </div>
            </div>

            {qIndicesError && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{qIndicesError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-lg">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg mr-2 text-blue-600 dark:text-blue-400">
                        <Activity className="h-4 w-4" />
                      </div>
                      Biểu đồ phân tích kỹ thuật
                    </CardTitle>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-300 rounded-full px-3 py-1 text-xs font-medium shadow-sm border border-blue-100/50 dark:border-blue-700/30">
                      {qIndices.length > 0 ? `${qIndices.length} điểm dữ liệu` : 'Không có dữ liệu'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  {isLoadingQIndices ? (
                    <div className="space-y-4 py-8">
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </div>
                      <Skeleton className="h-[300px] w-full" />
                      <Skeleton className="h-[250px] w-full" />
                      <Skeleton className="h-[200px] w-full" />
                    </div>
                  ) : qIndices.length > 0 ? (
                    <div className="space-y-8 py-4">
                      {/* Price Chart */}
                      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 rounded-lg p-1 shadow-sm">
                        <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Biểu đồ giá</div>
                        <StockChart
                          chartType="candlestick"
                          data={qIndices}
                          height={250}
                          hideXAxis={true}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="overview-charts"
                        />
                      </div>

                      {/* Trend Q & FQ */}
                      <div className="relative -mt-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 rounded-lg p-1 shadow-sm">
                        <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trend Q & FQ</div>
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
                          syncGroup="overview-charts"
                        />
                      </div>

                      {/* QV1 Values */}
                      <div className="relative -mt-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 rounded-lg p-1 shadow-sm">
                        <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QV1 Values</div>
                        <StockChart
                          chartType="histogram"
                          data={qIndices}
                          height={150}
                          rightPriceScaleMinimumWidth={50}
                          syncGroup="overview-charts"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                          <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p>Không có dữ liệu cho giai đoạn đã chọn.</p>
                        <p className="text-sm text-muted-foreground mt-2">Vui lòng thử chọn một khoảng thời gian khác.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          

          {/* Improved Control Panel */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-2 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-gray-800/30 shadow-sm">
              <h2 className="text-xl font-semibold flex items-center gap-2 px-3 py-2">
                <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 p-1.5 rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <span>Phân tích <span className="text-indigo-600 dark:text-indigo-400">{stockInfo?.symbol || 'Chứng khoán'}</span></span>
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800/90 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700/30 backdrop-blur-sm">
              {/* View Mode Selector (Quarter/Year) */}
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3 whitespace-nowrap">Chế độ xem:</span>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 flex">
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'quarter'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm'
                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                    }`}
                    onClick={() => setViewMode('quarter')}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Quý
                    </div>
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'year'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm'
                        : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                    }`}
                    onClick={() => setViewMode('year')}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <rect x="2" y="3" width="20" height="18" rx="2"></rect>
                        <line x1="2" y1="9" x2="22" y2="9"></line>
                      </svg>
                      Năm
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Time Period Selector */}
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3 whitespace-nowrap">Khoảng thời gian:</span>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 flex flex-wrap">
                  {(['1y', '3y', '5y', 'all'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => handleTimePeriodChange(period)}
                      className={`
                        px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 m-0.5
                        ${timePeriod === period 
                          ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-600/50'}
                      `}
                    >
                      {period === '1y' && '1N'}
                      {period === '3y' && '3N'}
                      {period === '5y' && '5N'}
                      {period === 'all' && 'TẤT CẢ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
     
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EPS Chart Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden group">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg mr-2 text-blue-600 dark:text-blue-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      Biểu đồ EPS
                    </CardTitle>
                    <CardDescription>EPS, EPS Ngành và EPS Rate</CardDescription>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-300 rounded-full px-3 py-1 text-xs font-medium shadow-sm border border-blue-100/50 dark:border-blue-700/30">
                    {processedEpsRecords.length > 0 ? `${processedEpsRecords.length} kỳ báo cáo` : 'Không có dữ liệu'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 px-2 sm:px-6">
                {epsRecords.length > 0 ? (
                  <ChartJS
                    type="mixed"
                    data={epsChartData}
                    options={chartOptions}
                    height={250}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Không có dữ liệu EPS</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PE Chart Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden group">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg mr-2 text-indigo-600 dark:text-indigo-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      Biểu đồ PE
                    </CardTitle>
                    <CardDescription>PE, PE Ngành và PE Rate</CardDescription>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-300 rounded-full px-3 py-1 text-xs font-medium shadow-sm border border-indigo-100/50 dark:border-indigo-700/30">
                    {processedPeRecords.length > 0 ? `${processedPeRecords.length} kỳ báo cáo` : 'Không có dữ liệu'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 px-2 sm:px-6">
                {peRecords.length > 0 ? (
                  <ChartJS
                    type="mixed"
                    data={peChartData}
                    options={chartOptions}
                    height={250}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Không có dữ liệu PE</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ROA/ROE Chart Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden group">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                      <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg mr-2 text-green-600 dark:text-green-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      Biểu đồ Hiệu suất (ROA/ROE)
                    </CardTitle>
                    <CardDescription>ROA, ROE, ROA Ngành và ROE Ngành</CardDescription>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-300 rounded-full px-3 py-1 text-xs font-medium shadow-sm border border-green-100/50 dark:border-green-700/30">
                    {processedRoaRoeRecords.length > 0 ? `${processedRoaRoeRecords.length} kỳ báo cáo` : 'Không có dữ liệu'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 px-2 sm:px-6">
                {roaRoeRecords.length > 0 ? (
                  <ChartJS
                    type="mixed"
                    data={roaRoeChartData}
                    options={chartOptions}
                    height={250}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Không có dữ liệu ROA/ROE</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Ratio Chart Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden group">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg mr-2 text-purple-600 dark:text-purple-400">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      Biểu đồ Cơ cấu tài chính
                    </CardTitle>
                    <CardDescription>Debt/Equity, Assets/Equity và Debt/Equity %</CardDescription>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-300 rounded-full px-3 py-1 text-xs font-medium shadow-sm border border-purple-100/50 dark:border-purple-700/30">
                    {processedFinancialRatioRecords.length > 0 ? `${processedFinancialRatioRecords.length} kỳ báo cáo` : 'Không có dữ liệu'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 px-2 sm:px-6">
                {financialRatioRecords.length > 0 ? (
                  <ChartJS
                    type="mixed"
                    data={financialRatioChartData}
                    options={chartOptions}
                    height={250}
                    plugins={[ChartDataLabels]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Không có dữ liệu cơ cấu tài chính</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 space-y-6">
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Thông tin tài chính {stockInfo?.symbol || 'Chứng khoán'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial Summary Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden col-span-1 md:col-span-2">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                    Số liệu tài chính
                  </CardTitle>
                </div>
            </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Vốn hóa', 'EPS', 'P/E', 'BVPS', 'Nợ/Vốn CSH', 'ROE', 'ROA', 'Biên lợi nhuận'].map((metric, index) => (
                    <div key={index} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">{metric}</h4>
                      <div className="text-lg font-semibold mt-1">
                        {index === 0 ? '1,234 tỷ' : 
                         index === 1 ? '4,321' : 
                         index === 2 ? '10.5' : 
                         index === 3 ? '24,600' : 
                         index === 4 ? '0.45' : 
                         index === 5 ? '18.5%' : 
                         index === 6 ? '8.2%' : '12.7%'}
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>

            {/* Latest Updates Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-lg">
                    <Activity className="h-4 w-4 mr-2 text-green-500" />
                    Cập nhật gần đây
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full p-1.5 mr-3">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Kết quả kinh doanh Q2/2023</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cập nhật: 20/07/2023</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full p-1.5 mr-3">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cổ tức 10% tiền mặt</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cập nhật: 05/05/2023</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full p-1.5 mr-3">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Báo cáo tài chính năm 2022</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cập nhật: 15/03/2023</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income Statement Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden col-span-1 md:col-span-3">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-4 w-4 mr-2 text-indigo-500" />
                    Báo cáo thu nhập
                  </CardTitle>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-full px-3 py-1 text-xs font-medium">
                    Cập nhật Q2/2023
                  </div>
                </div>
            </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left pb-2 font-medium">Chỉ tiêu</th>
                      <th className="text-right pb-2 font-medium">Q2/2023</th>
                      <th className="text-right pb-2 font-medium">Q1/2023</th>
                      <th className="text-right pb-2 font-medium">Q4/2022</th>
                      <th className="text-right pb-2 font-medium">Q3/2022</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Doanh thu thuần', 'Lợi nhuận gộp', 'Lợi nhuận từ HĐKD', 'Lợi nhuận trước thuế', 'Lợi nhuận sau thuế'].map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                        <td className="py-3 font-medium">{item}</td>
                        <td className="text-right py-3">{(Math.random() * 1000).toFixed(0)} tỷ</td>
                        <td className="text-right py-3">{(Math.random() * 1000).toFixed(0)} tỷ</td>
                        <td className="text-right py-3">{(Math.random() * 1000).toFixed(0)} tỷ</td>
                        <td className="text-right py-3">{(Math.random() * 1000).toFixed(0)} tỷ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 space-y-6">
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Phân tích kỹ thuật {stockInfo?.symbol || 'Chứng khoán'}
            </h2>
          </div>

          {/* Three Q-indices charts */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span>Biểu đồ phân tích {stockInfo?.symbol}</span>
              </h3>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 border border-gray-100 dark:border-gray-700/30">
                <TimePeriodSelector 
                  selectedPeriod={qIndicesTimePeriod} 
                  onChange={handleQIndicesTimePeriodChange} 
                />
              </div>
            </div>

            {qIndicesError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {qIndicesError}
              </div>
            )}

            <Card className="bg-white dark:bg-gray-800 shadow-sm mb-6">
              <CardContent className="p-6 py-0">
                {isLoadingQIndices ? (
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
                        syncGroup="stock-charts"
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
                        syncGroup="stock-charts"
                      />
                    </div>

                    {/* QV1 Values */}
                    <div className="relative -mt-6">
                      <StockChart
                        chartType="histogram"
                        data={qIndices}
                        height={150}
                        rightPriceScaleMinimumWidth={50}
                        syncGroup="stock-charts"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-4 w-4 mr-2 text-green-500" />
                  Chỉ báo kỹ thuật
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {[
                    { name: 'RSI (14)', value: '65.8', status: 'neutral' },
                    { name: 'MACD (12,26,9)', value: 'Tăng', status: 'positive' },
                    { name: 'MA20 vs Giá', value: 'Trên MA', status: 'positive' },
                    { name: 'Bollinger Bands', value: 'Giữa dải', status: 'neutral' },
                    { name: 'Stochastic', value: 'Quá mua', status: 'negative' },
                  ].map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm font-medium">{indicator.name}</span>
                      <span className={
                        indicator.status === 'positive' ? 'text-green-500 dark:text-green-400' :
                        indicator.status === 'negative' ? 'text-red-500 dark:text-red-400' :
                        'text-gray-500 dark:text-gray-400'
                      }>{indicator.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                  Hỗ trợ & Kháng cự
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kháng cự</h4>
                    <div className="space-y-2">
                      {['R3: 75,000', 'R2: 72,600', 'R1: 70,200'].map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${95 - index * 10}%` }}></div>
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">{level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Hỗ trợ</h4>
                    <div className="space-y-2">
                      {['S1: 65,800', 'S2: 63,400', 'S3: 61,000'].map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${45 + index * 10}%` }}></div>
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">{level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-4 w-4 mr-2 text-purple-500" />
                  Phân tích xu hướng
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Xu hướng hiện tại</span>
                    <span className="text-green-500 dark:text-green-400 font-medium">Tăng</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm text-gray-500 dark:text-gray-400">Mạnh mẽ</h4>
                      <span className="text-xs text-gray-500">85%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-3">Tín hiệu gần đây</h4>
                    {[
                      { date: '22/05/2023', signal: 'Breakout', direction: 'up' },
                      { date: '15/04/2023', signal: 'Golden Cross', direction: 'up' },
                      { date: '03/03/2023', signal: 'Support Test', direction: 'up' },
                    ].map((signal, index) => (
                      <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-full p-1 ${signal.direction === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                            {signal.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </div>
                          <span className="text-xs">{signal.signal}</span>
                        </div>
                        <span className="text-xs text-gray-500">{signal.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news" className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500 space-y-6">
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tin tức {stockInfo?.symbol || 'Chứng khoán'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              {
                title: 'Công bố báo cáo tài chính quý 2/2023, lợi nhuận vượt kỳ vọng',
                source: 'Vietstock',
                date: '20/07/2023',
                snippet: 'Công ty đã công bố báo cáo tài chính quý 2/2023 với doanh thu đạt 1,234 tỷ đồng, tăng 15% so với cùng kỳ năm trước...',
                category: 'finance'
              },
              {
                title: 'Kế hoạch chi trả cổ tức năm 2023 với tỷ lệ 15%',
                source: 'CafeF',
                date: '15/06/2023',
                snippet: 'Hội đồng quản trị công ty đã thông qua kế hoạch chi trả cổ tức năm 2023 với tỷ lệ 15%, trong đó 10% bằng tiền mặt và 5% bằng cổ phiếu...',
                category: 'dividend'
              },
              {
                title: 'Dự án mới được phê duyệt, tạo động lực tăng trưởng cho công ty',
                source: 'VnEconomy',
                date: '05/05/2023',
                snippet: 'Dự án đầu tư mới của công ty vừa được cơ quan chức năng phê duyệt, dự kiến sẽ tạo động lực tăng trưởng mạnh mẽ trong các năm tới...',
                category: 'project'
              },
              {
                title: 'Phân tích triển vọng cổ phiếu trong quý 3/2023',
                source: 'VNDIRECT',
                date: '01/07/2023',
                snippet: 'Theo báo cáo phân tích mới nhất, cổ phiếu của công ty có triển vọng tích cực trong quý 3/2023 với mức tăng giá dự kiến khoảng 15-20%...',
                category: 'analysis'
              },
              {
                title: 'Đại hội cổ đông thường niên 2023 thông qua nhiều nội dung quan trọng',
                source: 'ĐTCK',
                date: '10/04/2023',
                snippet: 'Đại hội cổ đông thường niên 2023 của công ty đã thông qua nhiều nội dung quan trọng, bao gồm kế hoạch kinh doanh, phân phối lợi nhuận...',
                category: 'meeting'
              }
            ].map((news, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4 md:p-6">
                      <div className={`rounded-full p-4 
                        ${news.category === 'finance' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 
                          news.category === 'dividend' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          news.category === 'project' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          news.category === 'analysis' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                        {news.category === 'finance' ? <TrendingUp className="h-8 w-8" /> :
                         news.category === 'dividend' ? <ArrowUp className="h-8 w-8" /> :
                         news.category === 'project' ? <Activity className="h-8 w-8" /> :
                         news.category === 'analysis' ? <TrendingUp className="h-8 w-8" /> :
                         <Activity className="h-8 w-8" />}
                      </div>
                    </div>
                    <div className="p-4 md:p-6 md:w-3/4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{news.title}</h3>
                        <div className="ml-4 flex-shrink-0">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2.5 py-1">
                            {news.source}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{news.snippet}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">{news.date}</span>
                        <button className="text-primary hover:text-primary/80 text-sm font-medium">Xem thêm</button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
