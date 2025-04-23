export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingFormValues {
  key: string;
  value: string;
  description?: string | null;
  type: string;
}

export interface SettingFilters {
  type?: string;
} 