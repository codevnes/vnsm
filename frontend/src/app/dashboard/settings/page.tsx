'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Setting } from '@/types/setting';
import { settingService } from '@/services/settingService';
import { DataTable } from '@/components/ui/data-table';
import { getSettingColumns } from '@/components/settings/setting-columns';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/error';
import { PlusCircle, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  settingKey: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  settingKey
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Nó sẽ xóa vĩnh viễn cài đặt
            &quot;<strong>{settingKey}</strong>&quot; và có thể ảnh hưởng đến dữ liệu liên quan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const SettingsPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsDeleteDialogOpen(false);
    setSettingToDelete(null);
    try {
      const data = await settingService.getAllSettings();
      setSettings(data);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to fetch settings';
      setError(errorMessage);
      toast.error('Error fetching settings', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchSettings();
    }
  }, [fetchSettings, authLoading]);

  const handleEdit = useCallback((key: string) => {
    router.push(`/dashboard/settings/${key}/edit`);
  }, [router]);

  const handleDeleteRequest = useCallback((setting: Setting) => {
    if (!isAuthenticated) {
      toast.error('Không thể xóa cài đặt', { 
        description: 'Bạn cần phải đăng nhập để thực hiện thao tác này.'
      });
      return;
    }
    setSettingToDelete(setting);
    setIsDeleteDialogOpen(true);
  }, [isAuthenticated]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!settingToDelete || !isAuthenticated) return;
    try {
      await settingService.deleteSetting(settingToDelete.key);
      toast.success(`Setting "${settingToDelete.key}" deleted.`);
      fetchSettings();
    } catch (error: unknown) {
      toast.error('Error deleting setting', {
        description: getErrorMessage(error) || 'Could not delete setting.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSettingToDelete(null);
    }
  }, [settingToDelete, fetchSettings, isAuthenticated]);

  const columns = useMemo(() => getSettingColumns({
    onEdit: handleEdit,
    onDeleteRequest: handleDeleteRequest
  }), [handleEdit, handleDeleteRequest]);

  // Filter settings based on the selected tab
  const filteredSettings = useMemo(() => {
    if (activeTab === "all") return settings;
    return settings.filter(setting => setting.type === activeTab);
  }, [settings, activeTab]);

  // Add auth loading condition
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Thiết lập hệ thống</h1>
          <p className="text-muted-foreground">Quản lý các cài đặt của hệ thống</p>
        </div>
        <Link href="/dashboard/settings/create" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm cài đặt mới
          </Button>
        </Link>
      </div>

      {error && !loading && <p className="text-red-500">Lỗi: {error}. Vui lòng thử lại.</p>}
      {!loading && !error && (
        <div className="space-y-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="text">Văn bản</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="image">Hình ảnh</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              <DataTable
                columns={columns}
                data={filteredSettings}
                filterColumnId="key"
                filterInputPlaceholder="Tìm kiếm theo key..."
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {settingToDelete && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          settingKey={settingToDelete.key}
        />
      )}
    </div>
  );
};

export default SettingsPage; 