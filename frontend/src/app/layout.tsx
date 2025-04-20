import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import MainLayout from "@/components/layout/MainLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VNSM - Nền tảng phân tích chứng khoán Việt Nam",
  description: "Nền tảng phân tích chứng khoán hàng đầu Việt Nam, cung cấp thông tin và công cụ phân tích đa chiều, giúp nhà đầu tư ra quyết định chính xác.",
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
          <MainLayout>{children}</MainLayout>
          <SonnerToaster richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
