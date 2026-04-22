import { clearAuthSession, getAuthToken, type AuthUser } from './auth-storage';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

export type ChartSpec = {
  type: 'line' | 'bar' | 'pie' | string;
  x: string;
  y: string;
  group_by?: string;
};

export type UploadResponse = {
  dataset_id: string;
  filename: string;
  columns: string[];
  rows: number;
};

export type AnalyzeResponse = {
  summary: string;
  insights: string[];
  charts: ChartSpec[];
  data: Array<Record<string, unknown>>;
  sql_query: string;
};

export type HistoryItem = {
  id: string;
  query: string;
  dataset_id: string;
  summary: string;
  created_at: string;
};

export type DashboardItem = {
  id: string;
  name: string;
  query: string;
  dataset_id: string;
  charts: ChartSpec[];
  summary: string;
  insights: string[];
  data: Array<Record<string, unknown>>;
  sql_query: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

type RequestOptions = RequestInit & {
  suppressJson?: boolean;
  withAuth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const shouldAttachAuth = options.withAuth ?? true;
  const token = shouldAttachAuth ? getAuthToken() : null;
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (options.suppressJson) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    const detail =
      typeof payload === 'object' && payload !== null && 'detail' in payload
        ? String((payload as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as T;
}

export async function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return request<UploadResponse>('/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function signup(payload: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    withAuth: false,
  });
}

export async function signin(payload: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    withAuth: false,
  });
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    withAuth: false,
  });
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', {
    method: 'POST',
    suppressJson: true,
  });
}

export async function signout(): Promise<void> {
  await request<void>('/auth/signout', {
    method: 'POST',
    suppressJson: true,
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me');
}

export async function analyzeDataset(payload: {
  query: string;
  dataset_id: string;
}): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>('/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  return request<HistoryItem[]>('/history');
}

export async function listDashboards(): Promise<DashboardItem[]> {
  return request<DashboardItem[]>('/dashboard');
}

export async function getDashboard(dashboardId: string): Promise<DashboardItem> {
  return request<DashboardItem>(`/dashboard/${dashboardId}`);
}

export async function createDashboard(payload: {
  name: string;
  query: string;
  dataset_id: string;
  charts: ChartSpec[];
  summary: string;
  insights: string[];
  data: Array<Record<string, unknown>>;
  sql_query: string;
}): Promise<DashboardItem> {
  return request<DashboardItem>('/dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteDashboard(dashboardId: string): Promise<void> {
  await request<void>(`/dashboard/${dashboardId}`, {
    method: 'DELETE',
    suppressJson: true,
  });
}
