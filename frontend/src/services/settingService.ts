import { Setting, SettingFormValues } from '@/types/setting';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AUTH_COOKIE_NAME = 'authToken';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    console.error('API Error:', response.status, errorData);
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) { // No Content
    return null as T; // Or handle appropriately
  }
  return response.json();
}

// Helper function to get auth token from multiple sources
function getAuthToken(): string | null {
  try {
    // Try localStorage first
    const localToken = localStorage.getItem('authToken');
    if (localToken) return localToken;

    // Then try cookies
    const cookieToken = Cookies.get(AUTH_COOKIE_NAME);
    if (cookieToken) return cookieToken;

    return null;
  } catch (error) {
    console.error("Error accessing token:", error);
    return null;
  }
}

// Get all settings
async function getAllSettings(): Promise<Setting[]> {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return handleResponse<Setting[]>(response);
}

// Get setting by key
async function getSettingByKey(key: string): Promise<Setting> {
  const response = await fetch(`${API_URL}/settings/${key}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return handleResponse<Setting>(response);
}

// Get settings by type
async function getSettingsByType(type: string): Promise<Setting[]> {
  const response = await fetch(`${API_URL}/settings/type/${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return handleResponse<Setting[]>(response);
}

// Create a new setting
async function createSetting(data: SettingFormValues): Promise<Setting> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Setting>(response);
}

// Update a setting
async function updateSetting(key: string, data: Partial<SettingFormValues>): Promise<Setting> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  console.log('Using token for update:', token ? 'Token found' : 'No token');

  const response = await fetch(`${API_URL}/settings/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Setting>(response);
}

// Delete a setting
async function deleteSetting(key: string): Promise<void> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/settings/${key}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  await handleResponse<null>(response);
}

export const settingService = {
  getAllSettings,
  getSettingByKey,
  getSettingsByType,
  createSetting,
  updateSetting,
  deleteSetting,
}; 