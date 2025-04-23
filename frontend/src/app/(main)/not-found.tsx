"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
// Note: metadata is imported here for reference but won't be used in client component
// The actual metadata is in not-found-metadata.tsx

export default function NotFound() {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsAnimating(true);
    
    const timer = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16 bg-background text-foreground">
      <div className="w-full max-w-3xl mx-auto text-center">
        {/* Animated stock chart icons */}
        <div className="relative flex justify-center mb-8 h-32">
          <div className={`absolute transition-all duration-1000 ease-in-out ${isAnimating ? 'opacity-100 scale-110' : 'opacity-30 scale-90'}`}>
            <TrendingUp size={48} className="text-green-500" />
          </div>
          <div className={`absolute transition-all duration-1000 ease-in-out delay-300 ${isAnimating ? 'opacity-30 scale-90' : 'opacity-100 scale-110'}`}>
            <TrendingDown size={48} className="text-red-500" />
          </div>
          <div className="absolute animate-pulse">
            <BarChart2 size={64} className="text-primary" />
          </div>
        </div>

        {/* Error code with stock ticker animation */}
        <div className="mb-4 inline-block">
          <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-primary to-green-500 animate-gradient">
            404
          </h1>
        </div>

        {/* Error messages */}
        <h2 className="text-3xl font-bold mb-4">Không tìm thấy trang</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Giống như một mã chứng khoán đã hủy niêm yết, trang này không còn tồn tại hoặc đã được di chuyển.
        </p>

        {/* Stock ticker style animation */}
        <div className="overflow-hidden mb-8 py-2 bg-muted/30 rounded-md">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-green-500 mx-2">VNM ▲ 2.5%</span>
            <span className="text-red-500 mx-2">VIC ▼ 1.8%</span>
            <span className="text-green-500 mx-2">VHM ▲ 3.1%</span>
            <span className="text-red-500 mx-2">FPT ▼ 0.7%</span>
            <span className="text-green-500 mx-2">MWG ▲ 1.2%</span>
            <span className="text-green-500 mx-2">HPG ▲ 2.3%</span>
            <span className="text-red-500 mx-2">MSN ▼ 1.5%</span>
            <span className="text-green-500 mx-2">VCB ▲ 0.9%</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link href="/" passHref>
          <Button className="group relative overflow-hidden rounded-full px-8 py-6 transition-all duration-300 ease-out hover:bg-primary/90">
            <span className="relative z-10 flex items-center gap-2">
              <ArrowLeft size={20} />
              Trở về trang chủ
            </span>
            <span className="absolute inset-0 z-0 bg-gradient-to-r from-primary to-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
          </Button>
        </Link>

        {/* Helpful links */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/ma-chung-khoan" className="hover:text-primary transition-colors">
            Danh sách mã chứng khoán
          </Link>
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Bảng điều khiển
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors">
            Đăng nhập
          </Link>
          <Link href="/register" className="hover:text-primary transition-colors">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
}