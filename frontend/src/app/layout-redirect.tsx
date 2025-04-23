'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Chuyển hướng đến trang tương ứng trong thư mục (main)
    router.replace('/');
  }, [router]);

  // Trả về null vì chúng ta sẽ chuyển hướng ngay lập tức
  return null;
}