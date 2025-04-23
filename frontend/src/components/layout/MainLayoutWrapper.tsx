'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

const MainLayoutWrapper: React.FC<MainLayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  // Nếu là trang dashboard, không áp dụng MainLayout
  if (isDashboard) {
    return <>{children}</>;
  }

  // Nếu không phải trang dashboard, áp dụng MainLayout
  return <MainLayout>{children}</MainLayout>;
};

export default MainLayoutWrapper;