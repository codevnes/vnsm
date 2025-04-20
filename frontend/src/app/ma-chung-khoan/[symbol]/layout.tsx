import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { symbol: string };
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the symbol from the URL params
  const symbol = params.symbol.toUpperCase();
  
  // You could fetch the stock data here to get more details for meta tags
  // For now, we'll use the symbol directly
  
  return {
    title: `${symbol} - Thông tin chi tiết và biểu đồ giá | VNSM`,
    description: `Xem thông tin chi tiết, biểu đồ giá và phân tích kỹ thuật cổ phiếu ${symbol}. Dữ liệu lịch sử, tiềm năng đầu tư và so sánh trong ngành.`,
    keywords: `${symbol}, cổ phiếu ${symbol}, biểu đồ giá ${symbol}, phân tích kỹ thuật ${symbol}, đầu tư ${symbol}, thị trường chứng khoán Việt Nam`,
    openGraph: {
      title: `${symbol} - Thông tin chi tiết và biểu đồ giá | VNSM`,
      description: `Xem thông tin chi tiết, biểu đồ giá và phân tích kỹ thuật cổ phiếu ${symbol}. Dữ liệu lịch sử, tiềm năng đầu tư và so sánh trong ngành.`,
      type: 'website',
      locale: 'vi_VN',
      siteName: 'VNSM - Nền tảng phân tích chứng khoán',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${symbol} - Thông tin chi tiết và biểu đồ giá | VNSM`,
      description: `Xem thông tin chi tiết, biểu đồ giá và phân tích kỹ thuật cổ phiếu ${symbol}. Dữ liệu lịch sử, tiềm năng đầu tư và so sánh trong ngành.`,
    },
  };
}

export default function StockDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 