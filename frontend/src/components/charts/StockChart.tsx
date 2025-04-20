'use client';

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  Time,
  LineStyle,
  CrosshairMode,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  HistogramSeriesOptions,
  BarData,
  LineData,
  HistogramData,
  WhitespaceData,
  CandlestickData,
  SeriesType,
  Logical,
  SeriesOptionsMap,
  TickMarkType,
  Point,
  IRange,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';

// Placeholder type
type StockDataPoint = {
  date: string;
  open?: number | string | null;
  high?: number | string | null;
  low?: number | string | null;
  close?: number | string | null;
  trend_q?: number | string | null;
  fq?: number | string | null;
  qv1?: number | string | null;
  [key: string]: any;
};

// Helper function
const formatDateForChart = (dateString: string): UTCTimestamp | null => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string encountered:", dateString);
      return null;
    }
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000) as UTCTimestamp;
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return null;
  }
};

interface StockChartProps {
  data: StockDataPoint[];
  chartType: 'candlestick' | 'line' | 'histogram';
  lineOptions?: {
    fields: Array<'trend_q' | 'fq'>;
    colors: string[];
    styles?: Array<{
      lineWidth?: number;
      lineType?: number; // 0 = simple, 1 = stepped line
      lineStyle?: number; // 0 = solid, 1 = dashed, 2 = dotted, etc.
    }>;
    smooth?: boolean;
  };
  height?: number;
  width?: number;
  title?: string;
  showTimeScale?: boolean;
  syncGroup?: string;
  rightPriceScaleMinimumWidth?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  hideXAxis?: boolean;
}

declare global {
  interface Window {
    chartSyncRegistry?: { [key: string]: IChartApi[] };
  }
}

const StockChart: React.FC<StockChartProps> = ({
  data,
  chartType,
  lineOptions,
  height = 300,
  width = 600,
  title = '',
  showTimeScale = true,
  syncGroup,
  rightPriceScaleMinimumWidth,
  margin,
  hideXAxis = false
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType>[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);

  // Refs for sync handlers with initial null value
  const syncTimeScaleHandlerRef = useRef<((timeRange: IRange<Time> | null) => void) | null>(null);
  const syncCrosshairHandlerRef = useRef<((param: any) => void) | null>(null);

  useEffect(() => {
    // --- Initial Checks & Cleanup --- 
    if (!chartContainerRef.current || !data || data.length === 0) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = [];
      }
      if (tooltipRef.current && tooltipRef.current.parentNode) {
          tooltipRef.current.parentNode.removeChild(tooltipRef.current);
          tooltipRef.current = null;
      }
      if (titleRef.current && titleRef.current.parentNode) {
          titleRef.current.parentNode.removeChild(titleRef.current);
          titleRef.current = null;
      }
      return;
    }

    // Clear previous chart instance if dependencies change
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = [];
    }
    if (tooltipRef.current && tooltipRef.current.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
        tooltipRef.current = null;
    }
    if (titleRef.current && titleRef.current.parentNode) {
        titleRef.current.parentNode.removeChild(titleRef.current);
        titleRef.current = null;
    }

    // --- Chart Creation --- 
    const containerWidth = width || chartContainerRef.current.clientWidth || 800;

    // Create tooltip element (if not already created by a previous render)
    if (!tooltipRef.current && chartContainerRef.current) {
      tooltipRef.current = document.createElement('div');
      Object.assign(tooltipRef.current.style, {
          position: 'absolute', zIndex: '1000', backgroundColor: 'rgba(30, 30, 40, 0.9)',
          color: '#DDD', padding: '8px', fontSize: '12px', borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)', pointerEvents: 'none', display: 'none'
      });
      chartContainerRef.current.appendChild(tooltipRef.current);
    }

    // Format number function
    const formatCompactNumber = (price: number): string => {
      if (Math.abs(price) >= 1_000_000_000) {
        return (price / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'b';
      } else if (Math.abs(price) >= 1_000_000) {
        // Format millions to include a decimal place even with exact millions
        const millions = price / 1_000_000;
        if (millions % 1 === 0) {
          return millions.toFixed(1).replace(/\.0$/, '') + 'm';
        } else {
          return millions.toFixed(1) + 'm';
        }
      } else if (Math.abs(price) >= 1_000) {
        // Format thousands with 'k' suffix and maintain decimal precision
        const thousands = price / 1_000;
        if (thousands % 1 === 0) {
          return thousands.toFixed(0) + 'k';
        } else {
          return thousands.toFixed(1) + 'k';
        }
      } else if (Math.abs(price) < 0.01 && price !== 0) {
        // Small numbers in scientific notation
        return price.toExponential(1);
      } else {
        // Regular numbers with appropriate decimal places
        return price.toFixed(Math.abs(price) < 1 ? 2 : price % 1 === 0 ? 0 : 1).replace(/\.0$/, '');
      }
    };

    const chart = createChart(chartContainerRef.current, {
      width: containerWidth, 
      height, 
      layout: { 
        background: { type: ColorType.Solid, color: 'oklch(27.8% .033 256.848)' }, 
        textColor: '#DDD' 
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      timeScale: { 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        timeVisible: showTimeScale && !hideXAxis, 
        secondsVisible: false, 
        visible: showTimeScale && !hideXAxis, 
        rightOffset: 5, 
        barSpacing: 6, 
        fixLeftEdge: true, 
        fixRightEdge: true,
        tickMarkFormatter: (time: UTCTimestamp, tickMarkType: TickMarkType, locale: string) => {
            const d = new Date(time * 1000);
            switch (tickMarkType) {
                case TickMarkType.Year: return d.getFullYear().toString();
                case TickMarkType.Month: return d.toLocaleDateString(locale, { month: 'short' });
                case TickMarkType.DayOfMonth: return d.getDate().toString();
                case TickMarkType.Time: return d.toLocaleTimeString(locale);
                case TickMarkType.TimeWithSeconds: return d.toLocaleTimeString(locale, { hour12: false });
                default: return `${d.getDate()}/${d.getMonth() + 1}`; }
        },
      },
      rightPriceScale: { 
        borderColor: 'rgba(255, 255, 255, 0.2)', 
        scaleMargins: { 
          top: margin?.top ? margin.top / height : 0.1, 
          bottom: margin?.bottom ? margin.bottom / height : 0.1 
        }, 
        autoScale: true, 
        minimumWidth: rightPriceScaleMinimumWidth,
      },
      crosshair: { mode: CrosshairMode.Magnet, vertLine: { color: 'rgba(255, 255, 255, 0.4)', width: 1, style: LineStyle.Dashed, visible: true, labelVisible: true }, horzLine: { color: 'rgba(255, 255, 255, 0.4)', width: 1, style: LineStyle.Dashed, visible: true, labelVisible: true } },
      localization: { 
        locale: 'vi-VN', 
        dateFormat: 'dd/MM/yyyy',
        priceFormatter: (price: number) => formatCompactNumber(price),
      },
    });

    chartRef.current = chart;
    seriesRef.current = [];

    // Add Title
    if (title && chartContainerRef.current) {
        titleRef.current = document.createElement('div');
        Object.assign(titleRef.current.style, {
            position: 'absolute', top: '10px', left: '10px', color: '#DDD', fontSize: '16px',
            fontWeight: 'bold', zIndex: '10'
        });
        titleRef.current.innerText = title;
        chartContainerRef.current.appendChild(titleRef.current);
    }

    // --- Data Processing --- 
    const processedData = data
      .map(item => ({ ...item, time: formatDateForChart(item.date) }))
      .filter((item): item is StockDataPoint & { time: UTCTimestamp } => item !== null)
      .sort((a, b) => a.time - b.time);

    const safeParseFloat = (value: any): number | undefined => {
       if (value === null || value === undefined || value === '') return undefined;
       const num = parseFloat(value);
       return isNaN(num) ? undefined : num;
    }

    // --- Add Series (Using v5 API calls with Series Constructors) --- 
    if (processedData.length > 0) {
       if (chartType === 'candlestick') {
          // v5 API: Use addSeries with Series Constructor
          const candlestickSeries = chart.addSeries(CandlestickSeries, {
              upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
              wickUpColor: '#26a69a', wickDownColor: '#ef5350',
          });
          const candlestickData = processedData
              .map(item => {
                  const open = safeParseFloat(item.open);
                  const high = safeParseFloat(item.high);
                  const low = safeParseFloat(item.low);
                  const close = safeParseFloat(item.close);
                  if (open !== undefined && high !== undefined && low !== undefined && close !== undefined) {
                      return { time: item.time, open, high, low, close };
                  }
                  return null;
              })
              .filter((item): item is CandlestickData<UTCTimestamp> => item !== null);
          if (candlestickData.length > 0) {
              candlestickSeries.setData(candlestickData);
              seriesRef.current.push(candlestickSeries);
          }
       } else if (chartType === 'line' && lineOptions) {
          lineOptions.fields.forEach((field, index) => {
              // Get style options if available
              const style = lineOptions.styles?.[index] || {};
              
              // v5 API: Use addSeries with Series Constructor
              const options: any = {
                  color: lineOptions.colors[index] || '#2196F3',
                  lineWidth: 3,
                  lineType: style.lineType !== undefined ? style.lineType : 0,
                  lineStyle: field === 'fq' ? 1 : 0, // FQ luôn là đường nét đứt
                  lastPriceAnimation: 1, // Luôn bật animation để đường trông mềm mại hơn
                  crosshairMarkerVisible: true,
                  crosshairMarkerRadius: 6, // Tăng radius cho điểm crosshair
                  title: field === 'trend_q' ? 'Trend Q' : field === 'fq' ? 'FQ' : field
              };
              
              const lineSeries = chart.addSeries(LineSeries, options);
              
              let lineData = processedData
                  .map(item => {
                      const value = safeParseFloat(item[field]);
                      if (value !== undefined) return { time: item.time, value };
                      return null;
                  })
                  .filter((item): item is LineData<UTCTimestamp> => item !== null);
              
              if (lineData.length > 0) {
                  if (lineData.length > 2 && lineOptions.smooth) {
                      lineSeries.applyOptions({
                          priceLineVisible: false,
                          lastValueVisible: false,
                          lastPriceAnimation: 1
                      });
                  }
                  
                  lineSeries.setData(lineData);
                  seriesRef.current.push(lineSeries);
              }
          });
       } else if (chartType === 'histogram') {
           // v5 API: Use addSeries with Series Constructor
           const histogramSeries = chart.addSeries(HistogramSeries, {
                color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', title: 'QV1'
           });
           const histogramData = processedData
               .map(item => {
                   const value = safeParseFloat(item.qv1);
                   if (value !== undefined) {
                       return {
                           time: item.time,
                           value,
                           color: value >= 0 ? 'rgba(38, 166, 154, 0.7)' : 'rgba(239, 83, 80, 0.7)'
                       };
                   }
                   return null;
               })
               .filter((item): item is HistogramData<UTCTimestamp> & { color: string } => item !== null && item.color !== undefined);
            if (histogramData.length > 0) {
               histogramSeries.setData(histogramData);
               seriesRef.current.push(histogramSeries);
            }
       }
    }

    // --- Set Visible Range --- 
    if (processedData.length > 0 && seriesRef.current.length > 0) {
      const firstTime = processedData[0].time;
      const lastTime = processedData[processedData.length - 1].time;
        try { chart.timeScale().setVisibleRange({ from: firstTime, to: lastTime }); }
        catch (e) { console.error("Error setting visible range:", e); chart.timeScale().fitContent(); }
    } else { chart.timeScale().fitContent(); }

    // --- Tooltip Setup --- 
    // Let TS infer param type
    chart.subscribeCrosshairMove((param) => { 
       if (!tooltipRef.current || !chartContainerRef.current || !param.point || !param.time) {
           if(tooltipRef.current) tooltipRef.current.style.display = 'none';
           return;
       }
       const containerWidthLocal = chartContainerRef.current.clientWidth;
       const containerHeightLocal = chartContainerRef.current.clientHeight;
       if (param.point.x < 0 || param.point.x >= containerWidthLocal || param.point.y < 0 || param.point.y >= containerHeightLocal) {
           tooltipRef.current.style.display = 'none';
           return;
       }

      const currentTimestamp = param.time as UTCTimestamp;
      const dataPoint = data.find(item => formatDateForChart(item.date) === currentTimestamp);
      if (!dataPoint) {
          tooltipRef.current.style.display = 'none';
          return;
      }

      const formattedDate = new Date(dataPoint.date).toLocaleDateString('vi-VN');
      const formatNumber = (num: any): string => {
        const numberValue = safeParseFloat(num);
        return numberValue === undefined ? 'N/A' : numberValue.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
      };

      let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px;">${formattedDate}</div>`;
      tooltipContent += `<div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 11px;">`;

      // Explicitly type seriesData map parameters, check for CustomData possibility
      // The `value` type might be complex (BarData | LineData | etc. | CustomData)
      param.seriesData.forEach((value: any, series: ISeriesApi<SeriesType>) => {
          const options = series.options();
          const seriesTitle = (options as any).title || chartType;
          let color = (options as any).color || '#DDD';
          const type = series.seriesType();
          let formattedValue = 'N/A';

          // Check if value exists and is not null/undefined before processing
          if (value === null || value === undefined) return;

          if (type === 'Candlestick' && 'open' in value) {
             const candleData = value as CandlestickData<Time>; // Type assertion
             tooltipContent += `
                <div style="color: #AAA;">Mở:</div> <div style="text-align: right; color: ${(options as CandlestickSeriesOptions).upColor};">${formatNumber(candleData.open)}</div>
                <div style="color: #AAA;">Cao:</div> <div style="text-align: right; color: ${(options as CandlestickSeriesOptions).upColor};">${formatNumber(candleData.high)}</div>
                <div style="color: #AAA;">Thấp:</div> <div style="text-align: right; color: ${(options as CandlestickSeriesOptions).downColor};">${formatNumber(candleData.low)}</div>
                <div style="color: #AAA;">Đóng:</div> <div style="text-align: right; color: ${candleData.close >= candleData.open ? (options as CandlestickSeriesOptions).upColor : (options as CandlestickSeriesOptions).downColor};">${formatNumber(candleData.close)}</div>
             `; return;
          } else if (type === 'Histogram' && 'value' in value) {
              const histoData = value as HistogramData<Time>; // Type assertion
              formattedValue = formatNumber(histoData.value);
              color = histoData.color || color;
          } else if (type === 'Line' && 'value' in value) {
              formattedValue = formatNumber((value as LineData<Time>).value); // Type assertion
          } else if ('value' in value) { // Fallback for other types with a 'value' property (e.g., BarData)
               formattedValue = formatNumber(value.value);
          } else {
             // Handle CustomData or other unknown types if necessary
             // console.log("Unknown series data type for tooltip:", type, value);
             return; // Skip tooltip row for unknown types
          }

          let displayName = seriesTitle;
          if (seriesTitle === 'trend_q') displayName = 'Trend Q'; if (seriesTitle === 'fq') displayName = 'FQ';
          tooltipContent += `<div style="color: ${color};">${displayName}:</div><div style="text-align: right; color: ${color};">${formattedValue}</div>`;
      });

      tooltipContent += `</div>`;
      tooltipRef.current.innerHTML = tooltipContent;
      tooltipRef.current.style.display = 'block';

      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      let finalLeft = param.point.x + 20;
      if (finalLeft + tooltipWidth > containerWidthLocal) finalLeft = param.point.x - tooltipWidth - 20;
      let finalTop = param.point.y - tooltipHeight / 2;
      if (finalTop < 0) finalTop = 5;
      if (finalTop + tooltipHeight > containerHeightLocal) finalTop = containerHeightLocal - tooltipHeight - 5;
      tooltipRef.current.style.left = `${finalLeft}px`;
      tooltipRef.current.style.top = `${finalTop}px`;
    });

    // --- Sync Setup --- 
    if (syncGroup && typeof window !== 'undefined') {
      // Assign handler functions to refs
      syncTimeScaleHandlerRef.current = (timeRange: IRange<Time> | null) => {
          const registry = window.chartSyncRegistry?.[syncGroup] || [];
          const sourceChart = chartRef.current;
          if (!sourceChart || !timeRange) return;
          const logicalRange = sourceChart.timeScale().getVisibleLogicalRange();
          registry.forEach(targetChart => {
              if (targetChart !== sourceChart) {
                  try {
                      targetChart.timeScale().setVisibleRange(timeRange);
                      if (logicalRange) targetChart.timeScale().setVisibleLogicalRange(logicalRange);
                  } catch (e) { console.error("Sync Time Error:", e); }
              }
          });
      };

      // Let TS infer param type
      syncCrosshairHandlerRef.current = (param) => {
          const registry = window.chartSyncRegistry?.[syncGroup] || [];
          const sourceChart = chartRef.current;
          if (!sourceChart || !param.point || !param.time) return;
          registry.forEach(targetChart => {
              if (targetChart !== sourceChart) {
                  try {
                      // Sync only logical position in v5
                      if (param.logical !== undefined) {
                         targetChart.timeScale().scrollToPosition(param.logical, false);
                      }
                  } catch (e) { /* Ignore errors if target chart is removed */ }
              }
          });
      };

      // Add chart to registry
      if (!window.chartSyncRegistry) window.chartSyncRegistry = {};
      if (!window.chartSyncRegistry[syncGroup]) window.chartSyncRegistry[syncGroup] = [];
      if (!window.chartSyncRegistry[syncGroup].includes(chart)) window.chartSyncRegistry[syncGroup].push(chart);

      // Subscribe using the handlers assigned to refs
      if (syncTimeScaleHandlerRef.current) {
          chart.timeScale().subscribeVisibleTimeRangeChange(syncTimeScaleHandlerRef.current);
      }
      if (syncCrosshairHandlerRef.current) {
         chart.subscribeCrosshairMove(syncCrosshairHandlerRef.current);
      }
    }

    // --- Cleanup Function --- 
    return () => {
       // Remove chart from sync group
       if (syncGroup && typeof window !== 'undefined' && window.chartSyncRegistry?.[syncGroup]) {
          window.chartSyncRegistry[syncGroup] = window.chartSyncRegistry[syncGroup].filter(c => c !== chartRef.current);
          if (window.chartSyncRegistry[syncGroup].length === 0) delete window.chartSyncRegistry[syncGroup];
       }

       // Cleanup chart and subscriptions
       if (chartRef.current) {
        if (syncTimeScaleHandlerRef.current) {
            try { chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(syncTimeScaleHandlerRef.current); } catch(e) {}
        }
        if (syncCrosshairHandlerRef.current) {
            try { chartRef.current.unsubscribeCrosshairMove(syncCrosshairHandlerRef.current); } catch(e) {}
        }
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = [];
      }

      // Cleanup DOM elements
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
      if (titleRef.current && titleRef.current.parentNode) {
        titleRef.current.parentNode.removeChild(titleRef.current);
        titleRef.current = null;
      }
    };
  }, [data, chartType, lineOptions, height, width, title, showTimeScale, syncGroup, rightPriceScaleMinimumWidth, margin, hideXAxis]);

  // --- Resize Handler --- 
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        if (newWidth > 0) chartRef.current.resize(newWidth, height);
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);
    return () => {
       clearTimeout(timer);
       window.removeEventListener('resize', handleResize);
    };
  }, [height]);

  return (
    <div className="relative w-full" style={{ minWidth: '100px' }}> 
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
      {(!data || data.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500" style={{ height: `${height}px` }}>
           No data available
        </div>
      )}
    </div>
  );
};

export default StockChart; 