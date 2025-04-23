'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingForm } from '@/components/settings/setting-form';
import { SettingFormValues } from '@/lib/schemas/settingSchema';
import { settingService } from '@/services/settingService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CreateSettingPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle form submission
  const onSubmit = async (values: SettingFormValues) => {
    
    setIsSubmitting(true);
    try {
      // Ensure empty strings for optional fields become null
      const dataToSend = {
        ...values,
        description: values.description || null,
      };

      await settingService.createSetting(dataToSend);
      toast.success('Đã tạo cài đặt mới thành công!');
      router.push('/dashboard/settings'); // Redirect to list page on success
    } catch (error: unknown) {
      toast.error('Không thể tạo cài đặt mới', {
        description: getErrorMessage(error) || 'Đã xảy ra lỗi không xác định.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/settings" passHref>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Thêm cài đặt mới</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cài đặt</CardTitle>
          <CardDescription>
            Nhập thông tin chi tiết cho cài đặt mới. Đảm bảo key là duy nhất và tuân theo định dạng snake_case.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingForm
            onSubmit={onSubmit}
            isLoading={isSubmitting}
            submitButtonText="Tạo cài đặt"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSettingPage; 