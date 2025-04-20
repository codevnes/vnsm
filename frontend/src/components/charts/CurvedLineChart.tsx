'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for ApexCharts since it requires window object
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Định nghĩa kiểu dữ liệu cho điểm dữ liệu
type StockDataPoint = {
  date: string;
  trend_q?: number | string | null;
  fq?: number | string | null;
  [key: string]: any;
};

interface CurvedLineChartProps {
  data: StockDataPoint[];
  width?: number;
  height?: number;
  fields?: Array<'trend_q' | 'fq'>;
  colors?: string[];
  hideXAxis?: boolean;
  rightPriceScaleMinimumWidth?: number; // Không sử dụng trong ApexCharts
}

const CurvedLineChart: React.FC<CurvedLineChartProps> = ({
  data,
  width = 800,
  height = 300,
  fields = ['trend_q', 'fq'],
  colors = ['#2962FF', '#FF6D00'],
  hideXAxis = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-[#1E1E1E] text-white"
        style={{ width: '100%', height: `${height}px` }}
      >
        Không có dữ liệu
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho ApexCharts
  const categories = data.map(item => {
    // Format date to dd/MM/yyyy
    const date = new Date(item.date);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  });

  // Tạo series dữ liệu
  const series = fields.map((field, index) => {
    const fieldValues = data.map(item => {
      const val = item[field];
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(val as string);
      return isNaN(num) ? null : num;
    });

    return {
      name: field === 'trend_q' ? 'Trend Q' : field === 'fq' ? 'FQ' : field,
      data: fieldValues,
      color: colors[index] || undefined
    };
  });

  // Cấu hình ApexCharts
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'line' as const,
      background: '#1E1E1E',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth',
      width: fields.map((field, index) => {
        return 2; // Độ rộng đường
      }),
      dashArray: fields.map((field) => {
        return field === 'fq' ? 5 : 0; // FQ là đường nét đứt, Trend Q là đường liền
      })
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      row: {
        colors: ['transparent'],
        opacity: 0.5
      }
    },
    colors: colors,
    xaxis: {
      categories: categories,
      labels: {
        show: !hideXAxis,
        style: {
          colors: '#DDD'
        },
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true
      },
      axisBorder: {
        show: !hideXAxis,
        color: 'rgba(255, 255, 255, 0.2)'
      },
      axisTicks: {
        show: !hideXAxis,
        color: 'rgba(255, 255, 255, 0.2)'
      },
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#DDD'
        },
        formatter: (value: number) => {
          return value.toFixed(2);
        }
      }
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: 'dark',
      x: {
        formatter: function(val: number, opts: any) {
          return categories[val - 1]; // Trả về ngày từ categories
        }
      },
      y: {
        formatter: function(val: number) {
          return val.toFixed(4);
        }
      }
    },
    markers: {
      size: 0,
      hover: {
        size: 5
      }
    },
    theme: {
      mode: 'dark'
    },
    legend: {
      labels: {
        colors: '#DDD'
      }
    }
  };

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <ApexChart
        options={options}
        series={series}
        type="line"
        width="100%"
        height={height}
      />
    </div>
  );
};

export default CurvedLineChart; 