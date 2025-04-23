'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

interface EditSettingPageProps {
  params: {
    key: string;
  };
}

const EditSettingPage = ({ params }: EditSettingPageProps) => {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params as unknown as Promise<EditSettingPageProps['params']>);
  const { key } = unwrappedParams;
  
  const [setting, setSetting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch setting data
  useEffect(() => {
    const fetchSetting = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await settingService.getSettingByKey(key);
        setSetting(data);
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err) || 'Failed to fetch setting';
        setError(errorMessage);
        toast.error('Error fetching setting', {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (key && !authLoading) {
      fetchSetting();
    }
  }, [key, authLoading]);

  // Handle form submission
  const onSubmit = async (values: SettingFormValues) => {
    if (!isAuthenticated) {
      toast.error('Không thể cập nhật cài đặt', { 
        description: 'Bạn cần phải đăng nhập để thực hiện thao tác này.'
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Ensure empty strings for optional fields become null
      const dataToSend = {
        ...values,
        description: values.description || null,
      };

      await settingService.updateSetting(key, dataToSend);
      toast.success('Cài đặt đã được cập nhật thành công!');
      router.push('/dashboard/settings'); // Redirect to list page on success
    } catch (error: unknown) {
      toast.error('Không thể cập nhật cài đặt', {
        description: getErrorMessage(error) || 'Đã xảy ra lỗi không xác định.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải dữ liệu cài đặt...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
          <h1 className="text-xl font-bold mb-2">Lỗi xác thực</h1>
          <p>Bạn cần phải đăng nhập để xem và chỉnh sửa cài đặt.</p>
          <div className="mt-4">
            <Link href="/dang-nhap" passHref>
              <Button variant="default">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard/settings" passHref>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
          </Link>
        </div>
        <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
          <h1 className="text-xl font-bold mb-2">Lỗi</h1>
          <p>{error}</p>
          <p className="mt-4">Vui lòng thử lại hoặc liên hệ quản trị viên nếu vấn đề vẫn tiếp tục.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/settings" passHref>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Sửa cài đặt: {key}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cài đặt</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin cài đặt. Key không thể thay đổi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {setting && (
            <SettingForm
              onSubmit={onSubmit}
              isLoading={isSubmitting}
              initialValues={setting}
              submitButtonText="Cập nhật cài đặt"
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSettingPage; 