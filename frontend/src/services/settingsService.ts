import { api } from '@/lib/api';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export const settingsService = {
  async getSettingByKey(key: string): Promise<Setting> {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  }
}; 