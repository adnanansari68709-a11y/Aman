export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // lucide icon identifier
  color?: string;
  fileCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: string;
  categorySlug?: string;
  categoryName?: string;
  fileUrl: string;
  storageUrl?: string;
  storagePath: string;
  thumbnailUrl: string;
  thumbnail?: string;
  fileName: string;
  mimeType: string;
  type?: string;
  format?: string;
  fileSize: number; // in bytes
  version?: string;
  tags: string[];
  downloadCount: number;
  featured: boolean;
  published: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadLog {
  id: string;
  fileId: string;
  fileTitle: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  lastLogin?: string;
}

export interface SiteStats {
  totalFiles: number;
  totalDownloads: number;
  totalCategories: number;
  totalStorageBytes: number;
  recentlyUpdatedCount: number;
  downloadsOverTime: { date: string; count: number }[];
  popularFiles: FileResource[];
  categoryDistribution: { name: string; slug: string; count: number }[];
  recentActivity: {
    type: 'upload' | 'download' | 'update';
    fileTitle: string;
    fileSlug: string;
    timestamp: string;
  }[];
}

export interface PublicConfigResponse {
  siteName: string;
  tagline: string;
  description: string;
  contactEmail: string;
  maxFileSizeMB: number;
  allowedExtensions: string[];
  brand: {
    accentColor: string;
    logoText: string;
  };
}

export interface FileFilterParams {
  category?: string;
  search?: string;
  sort?: 'latest' | 'downloads' | 'name_asc' | 'name_desc';
  page?: number;
  limit?: number;
}
