'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, ChartOptions, ChartTypeRegistry } from 'chart.js';
import ChartJS from 'chart.js/auto';
import { 
  BarControllerDatasetOptions, 
  LineControllerDatasetOptions,
  ChartDataset 
} from 'chart.js';

// Custom typed dataset interface for mixed charts
interface MixedChartDataset extends Omit<ChartDataset<'bar' | 'line', number[]>, 'type'> {
  type?: 'bar' | 'line';
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  order?: number;
  yAxisID?: string;
  tension?: number;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  pointRadius?: number;
  pointHoverRadius?: number;
  pointBorderWidth?: number;
  pointHoverBackgroundColor?: string;
  fill?: boolean;
  datalabels?: any; // For plugins
}

// Define interfaces for our component props
interface BaseChartData {
  labels: string[];
}

interface SingleChartData extends BaseChartData {
  datasets: ChartDataset<'bar' | 'line', number[]>[];
}

interface MixedChartData extends BaseChartData {
  datasets: MixedChartDataset[];
}

export type ChartData = SingleChartData | MixedChartData;

export interface ChartJSProps {
  type: 'bar' | 'line' | 'mixed';
  data: ChartData;
  options?: ChartOptions<'bar' | 'line'>;
  height?: number;
  width?: number | string;
  className?: string;
  plugins?: any[];
}

const ChartJSComponent: React.FC<ChartJSProps> = ({
  type,
  data,
  options,
  height = 300,
  width,
  className,
  plugins,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Nếu không có canvas hoặc không có dữ liệu, không tạo biểu đồ
    if (!chartRef.current || !data) return;

    // Xóa biểu đồ cũ nếu đã tồn tại
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Tạo biểu đồ mới
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Cấu hình mặc định cho dark mode
    const defaultOptions: ChartOptions<'bar' | 'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.7)',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
        },
      },
      // Màu mặc định cho các loại biểu đồ
      elements: {
        bar: {
          backgroundColor: 'rgba(0, 123, 255, 0.7)', // Màu xanh cho cột
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1,
          borderRadius: 5, // Làm tròn góc trên của cột
        },
        line: {
          borderColor: 'rgba(220, 53, 69, 0.9)', // Màu đỏ cho đường
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4, // Làm cho đường cong mượt hơn
        },
        point: {
          backgroundColor: 'rgba(220, 53, 69, 0.9)',
          borderColor: '#fff',
          borderWidth: 1,
          radius: 4,
        },
      },
    };

    // Kết hợp options mặc định với options được truyền vào
    const mergedOptions = { ...defaultOptions, ...options };

    // Config object with plugins
    const config: any = {
      type: type === 'mixed' ? 'bar' : type,
      data: type === 'mixed' 
        ? {
            ...data,
            datasets: (data as MixedChartData).datasets.map(dataset => ({
              ...dataset,
              type: dataset.type || 'bar'
            }))
          }
        : data,
      options: mergedOptions,
    };

    // Add plugins if they exist
    if (plugins && plugins.length > 0) {
      config.plugins = plugins;
    }

    // Create the chart
    chartInstance.current = new ChartJS(ctx, config);

    // Cleanup khi component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, options, plugins]);

  return (
    <div className={className} style={{ height, width: width || '100%' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default ChartJSComponent;