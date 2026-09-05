import { Category, FileResource, SiteStats, PublicConfigResponse } from '../types';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private token: string | null = null;
  private baseUrl: string = '';

  constructor() {
    this.token = localStorage.getItem('velora_token');
    const envUrl = (
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
      ''
    ).trim().replace(/\/+$/, '');
    this.baseUrl = envUrl;
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

    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const res = await fetch(url, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    let rawText = '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        // ignore parse failure
      }
    } else {
      try {
        rawText = await res.text();
      } catch {
        // ignore text read failure
      }
    }

    if (!res.ok) {
      let errorMsg = data?.error || data?.message;
      if (!errorMsg && rawText) {
        const clean = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (clean && clean.length < 250) {
          errorMsg = clean;
        }
      }
      if (!errorMsg) {
        errorMsg = `Request failed with status ${res.status}`;
      }
      throw new ApiError(errorMsg, res.status);
    }

    return data;
  }

  // --- PUBLIC METHODS ---
  public async getConfig(): Promise<PublicConfigResponse> {
    const res = await this.request<any>('/api/public/config');
    return res?.data ?? res;
  }

  public async getPublicStats(): Promise<{
    totalFiles: number;
    totalDownloads: number;
    totalCategories: number;
    recentlyUpdatedCount: number;
  }> {
    const res = await this.request<any>('/api/public/stats');
    return res?.data ?? res ?? { totalFiles: 0, totalDownloads: 0, totalCategories: 0, recentlyUpdatedCount: 0 };
  }

  public async getCategories(): Promise<Category[]> {
    const res = await this.request<any>('/api/public/categories');
    return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  }

  public async getFiles(params: {
    category?: string;
    categorySlug?: string;
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
    if (params.categorySlug) query.set('categorySlug', params.categorySlug);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.featured !== undefined) query.set('featured', String(params.featured));

    const res = await this.request<any>(`/api/public/files?${query.toString()}`);
    const files = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.files) ? res.files : []);
    const total = res?.pagination?.total ?? res?.total ?? files.length;
    const page = res?.pagination?.page ?? res?.page ?? 1;
    const totalPages = res?.pagination?.totalPages ?? res?.totalPages ?? Math.max(1, Math.ceil(total / (params.limit || 12)));

    return {
      files,
      total,
      page,
      totalPages
    };
  }

  public async getFileBySlug(slug: string): Promise<FileResource & { related: FileResource[] }> {
    const res = await this.request<any>(`/api/public/files/${encodeURIComponent(slug)}`);
    const data = res?.data ?? res;
    if (data) {
      if (!Array.isArray(data.related)) data.related = [];
      if (!Array.isArray(data.tags)) data.tags = [];
    }
    return data;
  }

  public getDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/api/public/files/${fileId}/download`;
  }

  public getPreviewUrl(fileId: string): string {
    return `${this.baseUrl}/api/public/files/${fileId}/preview`;
  }

  public async submitContact(data: { name: string; email: string; subject?: string; message: string }): Promise<string> {
    const res = await this.request<any>('/api/public/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.message || 'Inquiry transmitted.';
  }

  // --- AUTH METHODS ---
  public async login(email: string, password: string): Promise<{ token: string; admin: any }> {
    const res = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const token = res?.data?.token || res?.token;
    const admin = res?.data?.admin || res?.admin;
    this.setToken(token);
    return { token, admin };
  }

  public async checkAuth(): Promise<any> {
    try {
      const res = await this.request<any>('/api/auth/me');
      return res?.data ?? res?.admin ?? null;
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
    const res = await this.request<any>('/api/admin/stats');
    const raw = res?.data ?? res ?? {};
    return {
      totalFiles: raw.totalFiles ?? 0,
      totalDownloads: raw.totalDownloads ?? 0,
      totalCategories: raw.totalCategories ?? 0,
      totalStorageBytes: raw.totalStorageBytes ?? 0,
      recentlyUpdatedCount: raw.recentlyUpdatedCount ?? 0,
      popularFiles: Array.isArray(raw.popularFiles) ? raw.popularFiles : [],
      recentActivity: Array.isArray(raw.recentActivity) ? raw.recentActivity : [],
      categoryDistribution: Array.isArray(raw.categoryDistribution) ? raw.categoryDistribution : [],
      downloadsOverTime: Array.isArray(raw.downloadsOverTime) ? raw.downloadsOverTime : []
    };
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

    const res = await this.request<any>(`/api/admin/files?${query.toString()}`);
    const files = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.files) ? res.files : []);
    const total = res?.pagination?.total ?? res?.total ?? files.length;
    const page = res?.pagination?.page ?? res?.page ?? 1;
    const totalPages = res?.pagination?.totalPages ?? res?.totalPages ?? Math.max(1, Math.ceil(total / (params.limit || 50)));

    return {
      files,
      total,
      page,
      totalPages
    };
  }

  public async uploadFile(
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<FileResource> {
    const file = formData.get('file') as File | null;
    if (!file) {
      throw new ApiError('No primary archive or resource file specified.', 400);
    }

    const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB chunks (safely within Netlify 6MB gateway payload limit)

    // Direct single-request upload for small files (<= 3.5MB)
    if (file.size <= 3.5 * 1024 * 1024) {
      try {
        const res = await this.request<any>('/api/admin/files', {
          method: 'POST',
          body: formData
        });
        if (onProgress) onProgress(100);
        return res?.data ?? res;
      } catch (err: any) {
        console.warn('Direct upload failed or rejected, falling back to chunked transfer:', err);
      }
    }

    // Resilient chunked upload flow
    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', String(chunkIndex));
      chunkFormData.append('totalChunks', String(totalChunks));
      chunkFormData.append('chunk', chunkBlob, file.name);

      let chunkSuccess = false;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await this.request<any>('/api/admin/files/chunk', {
            method: 'POST',
            body: chunkFormData
          });
          chunkSuccess = true;
          break;
        } catch (err: any) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        }
      }

      if (!chunkSuccess) {
        throw new ApiError(
          `Failed to transfer chunk ${chunkIndex + 1} of ${totalChunks}: ${lastErr?.message || 'Network error'}`,
          lastErr?.status || 500
        );
      }

      if (onProgress) {
        onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 90));
      }
    }

    // Finalize chunked ingestion
    const finalizeFormData = new FormData();
    finalizeFormData.append('uploadId', uploadId);
    finalizeFormData.append('totalChunks', String(totalChunks));
    finalizeFormData.append('fileName', file.name);
    finalizeFormData.append('fileSize', String(file.size));
    finalizeFormData.append('mimeType', file.type || 'application/octet-stream');

    const fieldsToForward = [
      'title',
      'description',
      'categoryId',
      'tags',
      'version',
      'featured',
      'published',
      'customThumbnailUrl'
    ];
    for (const f of fieldsToForward) {
      const val = formData.get(f);
      if (val !== null && val !== undefined) {
        finalizeFormData.append(f, val as string);
      }
    }

    const thumb = formData.get('thumbnail');
    if (thumb instanceof File) {
      finalizeFormData.append('thumbnail', thumb);
    }

    const finalizeRes = await this.request<any>('/api/admin/files/finalize-chunk', {
      method: 'POST',
      body: finalizeFormData
    });

    if (onProgress) onProgress(100);
    return finalizeRes?.data ?? finalizeRes;
  }

  public async updateFile(id: string, updates: Partial<FileResource>): Promise<FileResource> {
    const res = await this.request<any>(`/api/admin/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res?.data ?? res;
  }

  public async replaceFileBinary(
    id: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<FileResource> {
    const CHUNK_SIZE = 3 * 1024 * 1024;
    if (file.size <= 3.5 * 1024 * 1024) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await this.request<any>(`/api/admin/files/${id}/replace`, {
          method: 'POST',
          body: formData
        });
        if (onProgress) onProgress(100);
        return res?.data ?? res;
      } catch (err: any) {
        console.warn('Direct binary replacement failed, attempting chunked fallback:', err);
      }
    }

    const uploadId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', String(chunkIndex));
      chunkFormData.append('totalChunks', String(totalChunks));
      chunkFormData.append('chunk', chunkBlob, file.name);

      await this.request<any>('/api/admin/files/chunk', {
        method: 'POST',
        body: chunkFormData
      });

      if (onProgress) {
        onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 90));
      }
    }

    const finalizeFormData = new FormData();
    finalizeFormData.append('uploadId', uploadId);
    finalizeFormData.append('totalChunks', String(totalChunks));
    finalizeFormData.append('fileName', file.name);
    finalizeFormData.append('fileSize', String(file.size));
    finalizeFormData.append('mimeType', file.type || 'application/octet-stream');

    const res = await this.request<any>(`/api/admin/files/${id}/finalize-replace-chunk`, {
      method: 'POST',
      body: finalizeFormData
    });

    if (onProgress) onProgress(100);
    return res?.data ?? res;
  }

  public async deleteFile(id: string): Promise<void> {
    await this.request(`/api/admin/files/${id}`, { method: 'DELETE' });
  }

  public async toggleFeatured(id: string): Promise<FileResource> {
    const res = await this.request<any>(`/api/admin/files/${id}/toggle-featured`, {
      method: 'PATCH'
    });
    return res?.data ?? res;
  }

  public async togglePublished(id: string): Promise<FileResource> {
    const res = await this.request<any>(`/api/admin/files/${id}/toggle-published`, {
      method: 'PATCH'
    });
    return res?.data ?? res;
  }

  public async getAdminCategories(): Promise<Category[]> {
    const res = await this.request<any>('/api/admin/categories');
    return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  }

  public async createCategory(data: { name: string; description: string; icon?: string; color?: string }): Promise<Category> {
    const res = await this.request<any>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data ?? res;
  }

  public async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await this.request<any>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res?.data ?? res;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.request(`/api/admin/categories/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();
