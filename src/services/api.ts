import { Category, FileResource, SiteStats, PublicConfigResponse } from '../types';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('velora_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('velora_token', token);
    } else {
      localStorage.removeItem('velora_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('velora_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  }

  // --- PUBLIC METHODS ---
  public async getConfig(): Promise<PublicConfigResponse> {
    const res = await this.request<{ success: boolean; data: PublicConfigResponse }>('/api/public/config');
    return res.data;
  }

  public async getPublicStats(): Promise<{
    totalFiles: number;
    totalDownloads: number;
    totalCategories: number;
    recentlyUpdatedCount: number;
  }> {
    const res = await this.request<{ success: boolean; data: any }>('/api/public/stats');
    return res.data;
  }

  public async getCategories(): Promise<Category[]> {
    const res = await this.request<{ success: boolean; data: Category[] }>('/api/public/categories');
    return res.data;
  }

  public async getFiles(params: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
  } = {}): Promise<{
    files: FileResource[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.featured !== undefined) query.set('featured', String(params.featured));

    return await this.request(`/api/public/files?${query.toString()}`);
  }

  public async getFileBySlug(slug: string): Promise<FileResource & { related: FileResource[] }> {
    const res = await this.request<{ success: boolean; data: FileResource & { related: FileResource[] } }>(
      `/api/public/files/${encodeURIComponent(slug)}`
    );
    return res.data;
  }

  public getDownloadUrl(fileId: string): string {
    return `/api/public/files/${fileId}/download`;
  }

  public getPreviewUrl(fileId: string): string {
    return `/api/public/files/${fileId}/preview`;
  }

  public async submitContact(data: { name: string; email: string; subject?: string; message: string }): Promise<string> {
    const res = await this.request<{ success: boolean; message: string }>('/api/public/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.message;
  }

  // --- AUTH METHODS ---
  public async login(email: string, password: string): Promise<{ token: string; admin: any }> {
    const res = await this.request<{ success: boolean; token: string; admin: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async checkAuth(): Promise<any> {
    try {
      const res = await this.request<{ success: boolean; admin: any }>('/api/auth/me');
      return res.admin;
    } catch {
      this.setToken(null);
      return null;
    }
  }

  public async getMe(): Promise<any> {
    return this.checkAuth();
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // --- ADMIN METHODS ---
  public async getAdminStats(): Promise<SiteStats> {
    const res = await this.request<{ success: boolean; data: SiteStats }>('/api/admin/stats');
    return res.data;
  }

  public async getAdminFiles(params: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    files: FileResource[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    return await this.request(`/api/admin/files?${query.toString()}`);
  }

  public async uploadFile(formData: FormData): Promise<FileResource> {
    const res = await this.request<{ success: boolean; data: FileResource }>('/api/admin/files', {
      method: 'POST',
      body: formData
    });
    return res.data;
  }

  public async updateFile(id: string, updates: Partial<FileResource>): Promise<FileResource> {
    const res = await this.request<{ success: boolean; data: FileResource }>(`/api/admin/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  }

  public async replaceFileBinary(id: string, file: File): Promise<FileResource> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.request<{ success: boolean; data: FileResource }>(`/api/admin/files/${id}/replace`, {
      method: 'POST',
      body: formData
    });
    return res.data;
  }

  public async deleteFile(id: string): Promise<void> {
    await this.request(`/api/admin/files/${id}`, { method: 'DELETE' });
  }

  public async toggleFeatured(id: string): Promise<FileResource> {
    const res = await this.request<{ success: boolean; data: FileResource }>(`/api/admin/files/${id}/toggle-featured`, {
      method: 'PATCH'
    });
    return res.data;
  }

  public async togglePublished(id: string): Promise<FileResource> {
    const res = await this.request<{ success: boolean; data: FileResource }>(`/api/admin/files/${id}/toggle-published`, {
      method: 'PATCH'
    });
    return res.data;
  }

  public async getAdminCategories(): Promise<Category[]> {
    const res = await this.request<{ success: boolean; data: Category[] }>('/api/admin/categories');
    return res.data;
  }

  public async createCategory(data: { name: string; description: string; icon?: string; color?: string }): Promise<Category> {
    const res = await this.request<{ success: boolean; data: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await this.request<{ success: boolean; data: Category }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.request(`/api/admin/categories/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();
