import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VNSM - Nền tảng phân tích chứng khoán Việt Nam",
  description: "Nền tảng phân tích chứng khoán hàng đầu Việt Nam, cung cấp thông tin và công cụ phân tích đa chiều, giúp nhà đầu tư ra quyết định chính xác.",
  keywords: "chứng khoán, phân tích kỹ thuật, phân tích cơ bản, đầu tư, thị trường chứng khoán Việt Nam, cổ phiếu, VNINDEX",
  authors: [{ name: "VNSM Team" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://vsmi.vn/",
    title: "VNSM - Nền tảng phân tích chứng khoán Việt Nam",
    description: "Nền tảng phân tích chứng khoán hàng đầu Việt Nam, cung cấp thông tin và công cụ phân tích đa chiều, giúp nhà đầu tư ra quyết định chính xác.",
    siteName: "VNSM - Phân tích chứng khoán Việt Nam",
  },
  twitter: {
    card: "summary_large_image",
    title: "VNSM - Nền tảng phân tích chứng khoán Việt Nam",
    description: "Nền tảng phân tích chứng khoán hàng đầu Việt Nam, cung cấp thông tin và công cụ phân tích đa chiều, giúp nhà đầu tư ra quyết định chính xác.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
          <SonnerToaster richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
