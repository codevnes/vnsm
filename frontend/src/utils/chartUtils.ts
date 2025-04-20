import { StockQIndex } from '@/types/stockQIndex';

// Function to format data for candlestick chart
export const formatCandlestickData = (data: StockQIndex[]) => {
  return data.map(item => {
    // Convert date to timestamp in seconds
    const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
    return {
      time: timestamp,
      open: parseFloat(item.open?.toString() || '0'),
      high: parseFloat(item.high?.toString() || '0'),
      low: parseFloat(item.low?.toString() || '0'),
      close: parseFloat(item.close?.toString() || '0'),
    };
  }).sort((a, b) => a.time - b.time);
};

// Function to format data for line chart
export const formatLineData = (data: StockQIndex[], field: 'trend_q' | 'fq') => {
  return data.map(item => {
    // Convert date to timestamp in seconds
    const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
    return {
      time: timestamp,
      value: parseFloat(item[field]?.toString() || '0'),
    };
  }).sort((a, b) => a.time - b.time);
};

// Function to format data for histogram chart
export const formatHistogramData = (data: StockQIndex[]) => {
  return data.map(item => {
    // Convert date to timestamp in seconds
    const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
    const value = parseFloat(item.qv1?.toString() || '0');
    return {
      time: timestamp,
      value: value,
      color: value >= 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)',
    };
  }).sort((a, b) => a.time - b.time);
};

// Function to filter data based on time period
export const filterDataByTimePeriod = (data: StockQIndex[], period: '3m' | '6m' | '1y' | '5y') => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '3m':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case '6m':
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case '1y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case '5y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 5));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 3));
  }

  return data.filter(item => new Date(item.date) >= startDate);
};
