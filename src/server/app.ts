import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { siteConfig } from '../config/siteConfig';
import { db } from './db';
import { storage } from './storage';
import { requireAdminAuth, generateAdminToken, AuthenticatedRequest } from './auth';
import { FileResource } from '../types';

export function createApiApp() {
  const app = express();

  // 1. CORS headers - allow cross-origin requests from preview/Netlify domains
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 2. Request body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 3. File upload configuration (in-memory for maximum portability across Node and serverless)
  const maxMb = Number(process.env.MAX_FILE_SIZE_MB) || 50;
  const maxBytes = maxMb * 1024 * 1024;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes
    }
  });

  const handleUploadErrors = (middleware: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      middleware(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              success: false,
              error: `File payload exceeds maximum allowed size (${maxMb} MB).`
            });
          }
          return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ success: false, error: err.message || 'File upload rejected.' });
        }
        next();
      });
    };
  };

  // 4. Create unified API Router
  const router = express.Router();

  // Health check
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Velora Digital Archive API',
      timestamp: new Date().toISOString()
    });
  });

  // SEO endpoints
  router.get('/robots.txt', (req: Request, res: Response) => {
    const sitemapUrl = `${siteConfig.siteUrl.replace(/\/$/, '')}/sitemap.xml`;
    const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/\nDisallow: /.netlify/\n\nSitemap: ${sitemapUrl}\n`;
    res.type('text/plain').send(robotsTxt);
  });

  router.get('/sitemap.xml', (req: Request, res: Response) => {
    const { files } = db.getFiles({ publishedOnly: true, limit: 1000 });
    const categories = db.getAllCategories(false);
    const baseUrl = siteConfig.siteUrl.replace(/\/$/, '');
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/library', changefreq: 'daily', priority: '0.9' },
      { path: '/categories', changefreq: 'weekly', priority: '0.8' },
      { path: '/about', changefreq: 'monthly', priority: '0.6' },
      { path: '/contact', changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
      { path: '/terms', changefreq: 'monthly', priority: '0.3' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });

    categories.forEach(c => {
      const lastmod = c.updatedAt ? c.updatedAt.split('T')[0] : (c.createdAt ? c.createdAt.split('T')[0] : today);
      xml += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(c.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    files.forEach(f => {
      const lastmod = f.updatedAt ? f.updatedAt.split('T')[0] : (f.createdAt ? f.createdAt.split('T')[0] : today);
      xml += `  <url>\n    <loc>${baseUrl}/file/${encodeURIComponent(f.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += `</urlset>\n`;
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  // ==========================================
  // PUBLIC API ENDPOINTS
  // ==========================================

  router.get('/public/config', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        siteName: siteConfig.siteName,
        tagline: siteConfig.tagline,
        description: siteConfig.description,
        contactEmail: siteConfig.contactEmail,
        maxFileSizeMB: maxMb,
        allowedExtensions: siteConfig.allowedFileTypes.map(t => t.extension),
        allowedTypes: siteConfig.allowedFileTypes,
        brand: siteConfig.brand
      }
    });
  });

  router.get('/public/stats', (req: Request, res: Response) => {
    const stats = db.getSiteStats();
    res.json({
      success: true,
      data: {
        totalFiles: stats.totalFiles,
        totalDownloads: stats.totalDownloads,
        totalCategories: stats.totalCategories,
        totalStorageBytes: stats.totalStorageBytes
      }
    });
  });

  router.get('/public/categories', (req: Request, res: Response) => {
    const categories = db.getAllCategories(false);
    res.json({ success: true, data: categories });
  });

  router.get('/public/files', (req: Request, res: Response) => {
    const { category, categorySlug, search, sort, page, limit, featured } = req.query;
    const result = db.getFiles({
      publishedOnly: true,
      categoryId: category as string,
      categorySlug: categorySlug as string,
      search: search as string,
      sort: sort as string,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 12
    });
    res.json({ success: true, data: result.files, pagination: { total: result.total, page: result.page, totalPages: result.totalPages } });
  });

  router.get('/public/files/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    let file = db.getFileBySlug(slug);
    if (!file) {
      file = db.getFileById(slug);
    }
    if (!file || !file.published) {
      return res.status(404).json({ success: false, error: 'Resource not found or restricted.' });
    }
    const category = db.getCategoryById(file.categoryId);
    const related = db.getFiles({ publishedOnly: true, categoryId: file.categoryId, limit: 5 }).files
      .filter(f => f.id !== file.id)
      .slice(0, 4);
    res.json({
      success: true,
      data: {
        ...file,
        categoryName: category?.name || 'General',
        categorySlug: category?.slug || 'general',
        categoryColor: category?.color || '#d4af37',
        related
      }
    });
  });

  router.get('/public/files/:id/download', (req: Request, res: Response) => {
    const { id } = req.params;
    let file = db.getFileById(id);
    if (!file) {
      file = db.getFileBySlug(id);
    }
    if (!file || !file.published) {
      return res.status(404).json({ success: false, error: 'File resource not found.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    db.incrementDownload(file.id, clientIp, userAgent);

    if (file.storagePath) {
      const fileStream = storage.getFileStream(file.storagePath);
      if (fileStream) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Length', fileStream.size);
        return fileStream.stream.pipe(res);
      }
    }

    if (file.fileUrl && file.fileUrl.startsWith('http')) {
      return res.redirect(file.fileUrl);
    }

    res.status(404).json({ success: false, error: 'Physical archive resource unavailable on storage node.' });
  });

  router.get('/public/files/:id/preview', (req: Request, res: Response) => {
    const { id } = req.params;
    let file = db.getFileById(id);
    if (!file) {
      file = db.getFileBySlug(id);
    }
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    if (file.storagePath) {
      const fileStream = storage.getFileStream(file.storagePath);
      if (fileStream) {
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
        return fileStream.stream.pipe(res);
      }
    }

    if (file.fileUrl && file.fileUrl.startsWith('http')) {
      return res.redirect(file.fileUrl);
    }

    res.status(404).json({ success: false, error: 'Preview content unavailable.' });
  });

  router.get('/public/files/raw/*', (req: Request, res: Response) => {
    const rawPath = req.params[0];
    if (!rawPath) {
      return res.status(400).json({ success: false, error: 'Invalid file path.' });
    }

    const fileStream = storage.getFileStream(rawPath);
    if (!fileStream) {
      return res.status(404).json({ success: false, error: 'Raw resource not located in storage system.' });
    }

    res.setHeader('Content-Type', fileStream.mimeType);
    res.setHeader('Content-Length', fileStream.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fileStream.stream.pipe(res);
  });

  router.post('/public/contact', (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required fields.' });
    }

    res.json({
      success: true,
      message: 'Your inquiry has been received. Our preservation curator will respond promptly.'
    });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  router.post('/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both administrator email and password must be provided.'
      });
    }

    const verification = db.verifyAdminCredentials(email, password);

    if (!verification.success || !verification.admin) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid administrator credentials.'
      });
    }

    const token = generateAdminToken(verification.admin);

    res.cookie('velora_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: verification.admin.id,
          email: verification.admin.email,
          name: verification.admin.name
        }
      }
    });
  });

  router.get('/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: req.admin
    });
  });

  router.post('/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('velora_admin_token');
    res.json({
      success: true,
      message: 'Administrative session terminated.'
    });
  });

  // ==========================================
  // ADMIN DASHBOARD & MANAGEMENT ENDPOINTS
  // ==========================================

  router.get('/admin/stats', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const stats = db.getSiteStats();
    res.json({ success: true, data: stats });
  });

  router.get('/admin/files', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { category, search, sort, page, limit } = req.query;
    const result = db.getFiles({
      publishedOnly: false,
      categoryId: category as string,
      search: search as string,
      sort: sort as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50
    });
    res.json({
      success: true,
      data: result.files,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  });

  router.post(
    '/admin/files',
    requireAdminAuth,
    handleUploadErrors(
      upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
      ])
    ),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const { title, description, categoryId, tags, version, featured, published, customThumbnailUrl } = req.body;

        if (!title || !title.trim()) {
          return res.status(400).json({ success: false, error: 'Resource title is mandatory.' });
        }
        if (!categoryId) {
          return res.status(400).json({ success: false, error: 'Category assignment is required.' });
        }

        const uploadedFile = files?.['file']?.[0];
        if (!uploadedFile) {
          return res.status(400).json({ success: false, error: 'Archive binary or resource file is required.' });
        }

        const category = db.getCategoryById(categoryId);
        if (!category) {
          return res.status(400).json({ success: false, error: 'Designated category does not exist.' });
        }

        const savedFile = await storage.saveFile(uploadedFile, 'files');

        let finalThumbnailUrl = customThumbnailUrl || '';
        const uploadedThumb = files?.['thumbnail']?.[0];
        if (uploadedThumb) {
          const savedThumb = await storage.saveFile(uploadedThumb, 'thumbnails');
          finalThumbnailUrl = savedThumb.publicUrl;
        }

        let parsedTags: string[] = [];
        if (typeof tags === 'string') {
          parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }

        const newResource = db.createFile({
          title: title.trim(),
          description: description ? description.trim() : '',
          categoryId,
          fileUrl: savedFile.publicUrl,
          storagePath: savedFile.storagePath,
          thumbnailUrl: finalThumbnailUrl,
          fileName: savedFile.fileName,
          mimeType: savedFile.mimeType,
          fileSize: savedFile.fileSize,
          version: version ? version.trim() : '1.0.0',
          tags: parsedTags,
          featured: featured === 'true' || featured === true,
          published: published === 'true' || published === true
        });

        res.status(201).json({ success: true, data: newResource });
      } catch (err: any) {
        console.error('Upload handling error:', err);
        res.status(500).json({ success: false, error: err.message || 'File processing failed.' });
      }
    }
  );

  router.put('/admin/files/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, categoryId, tags, version, featured, published, thumbnailUrl } = req.body;

    const existing = db.getFileById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Resource not found.' });
    }

    if (categoryId) {
      const cat = db.getCategoryById(categoryId);
      if (!cat) {
        return res.status(400).json({ success: false, error: 'Invalid category specified.' });
      }
    }

    let parsedTags = existing.tags;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const updated = db.updateFile(id, {
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      categoryId: categoryId || existing.categoryId,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
      version: version !== undefined ? version.trim() : existing.version,
      tags: parsedTags,
      featured: featured !== undefined ? Boolean(featured) : existing.featured,
      published: published !== undefined ? Boolean(published) : existing.published
    });

    res.json({ success: true, data: updated });
  });

  router.post(
    '/admin/files/:id/replace',
    requireAdminAuth,
    handleUploadErrors(upload.single('file')),
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: 'Replacement file required.' });
      }

      const existing = db.getFileById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Resource to replace not found.' });
      }

      try {
        if (existing.storagePath) {
          await storage.deleteFile(existing.storagePath);
        }

        const savedNew = await storage.saveFile(file, 'files');

        const updated = db.updateFile(id, {
          fileUrl: savedNew.publicUrl,
          storagePath: savedNew.storagePath,
          fileName: savedNew.fileName,
          mimeType: savedNew.mimeType,
          fileSize: savedNew.fileSize
        });

        res.json({ success: true, data: updated });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message || 'Error during file replacement.' });
      }
    }
  );

  router.delete('/admin/files/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = await db.deleteFile(id);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Resource not found or already deleted.' });
    }

    res.json({ success: true, message: 'Resource permanently purged from database and storage.' });
  });

  router.patch('/admin/files/:id/toggle-featured', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const file = db.getFileById(id);
    if (!file) return res.status(404).json({ success: false, error: 'Resource not found.' });

    const updated = db.updateFile(id, { featured: !file.featured });
    res.json({ success: true, data: updated });
  });

  router.patch('/admin/files/:id/toggle-published', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const file = db.getFileById(id);
    if (!file) return res.status(404).json({ success: false, error: 'Resource not found.' });

    const updated = db.updateFile(id, { published: !file.published });
    res.json({ success: true, data: updated });
  });

  router.get('/admin/categories', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const categories = db.getAllCategories(true);
    res.json({ success: true, data: categories });
  });

  router.post('/admin/categories', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { name, description, icon, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const created = db.createCategory({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon || 'Folder',
      color: color || '#d4af37'
    });

    res.status(201).json({ success: true, data: created });
  });

  router.put('/admin/categories/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const updated = db.updateCategory(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(icon ? { icon } : {}),
      ...(color ? { color } : {})
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    res.json({ success: true, data: updated });
  });

  router.delete('/admin/categories/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = db.deleteCategory(id);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message || 'Cannot delete category.' });
    }

    res.json({ success: true, message: 'Category removed successfully.' });
  });

  router.get('/admin/telemetry', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const stats = db.getSiteStats();
    res.json({
      success: true,
      data: {
        recentActivity: stats.recentActivity,
        downloadsOverTime: stats.downloadsOverTime,
        categoryDistribution: stats.categoryDistribution,
        storageBytes: stats.totalStorageBytes
      }
    });
  });

  router.get('/admin/settings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: {
        siteConfig,
        adminEmail: process.env.ADMIN_EMAIL || 'Configured in Environment',
        maxUploadMB: maxMb
      }
    });
  });

  // 5. Mount the router across all potential path configurations:
  // - /api/* (standard front-end relative calls)
  // - /.netlify/functions/api/* (Netlify function rewrites)
  // - /* (direct function root calls)
  app.use('/api', router);
  app.use('/.netlify/functions/api', router);
  app.use('/', router);

  return app;
}
