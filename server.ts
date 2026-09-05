import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { siteConfig } from './src/config/siteConfig';
import { db } from './src/server/db';
import { storage } from './src/server/storage';
import { requireAdminAuth, generateAdminToken, AuthenticatedRequest } from './src/server/auth';
import { FileResource } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Upload limits & validation
  const maxMb = Number(process.env.MAX_FILE_SIZE_MB) || siteConfig.maxFileSizeMB || 50;
  const maxSizeBytes = maxMb * 1024 * 1024;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSizeBytes
    },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.msi', '.pif', '.application', '.gadget'];
      
      if (dangerousExtensions.includes(ext)) {
        return cb(new Error(`Security policy violation: Executable and script file types (${ext}) are strictly blocked.`));
      }

      const isAllowed = siteConfig.allowedFileTypes.some(t => t.extension === ext);
      if (!isAllowed) {
        return cb(new Error(`Unsupported file type (${ext}). Please refer to allowed formats.`));
      }

      cb(null, true);
    }
  });

  // Handle Multer upload errors gracefully
  const handleUploadErrors = (fn: express.RequestHandler): express.RequestHandler => {
    return (req, res, next) => {
      fn(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: `File size exceeds maximum permitted limit of ${maxMb}MB.`
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

  // ==========================================
  // SEO ENDPOINTS: robots.txt & sitemap.xml
  // ==========================================
  app.get('/robots.txt', (req, res) => {
    const sitemapUrl = `${siteConfig.siteUrl}/sitemap.xml`;
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin/

Sitemap: ${sitemapUrl}
`;
    res.type('text/plain').send(robotsTxt);
  });

  app.get('/sitemap.xml', (req, res) => {
    const { files } = db.getFiles({ publishedOnly: true, limit: 1000 });
    const categories = db.getAllCategories(false);
    const baseUrl = siteConfig.siteUrl.replace(/\/$/, '');

    const staticPages = [
      '',
      '/library',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    staticPages.forEach(p => {
      xml += `  <url>
    <loc>${baseUrl}${p}</loc>
    <changefreq>daily</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>
`;
    });

    categories.forEach(c => {
      xml += `  <url>
    <loc>${baseUrl}/category/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    files.forEach(f => {
      xml += `  <url>
    <loc>${baseUrl}/file/${f.slug}</loc>
    <lastmod>${f.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });

    xml += `</urlset>`;
    res.type('application/xml').send(xml);
  });

  // ==========================================
  // PUBLIC API ENDPOINTS
  // ==========================================

  // Site Configuration & Branding
  app.get('/api/public/config', (req, res) => {
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

  // Public live statistics
  app.get('/api/public/stats', (req, res) => {
    const stats = db.getSiteStats();
    res.json({
      success: true,
      data: {
        totalFiles: stats.totalFiles,
        totalDownloads: stats.totalDownloads,
        totalCategories: stats.totalCategories,
        recentlyUpdatedCount: stats.recentlyUpdatedCount
      }
    });
  });

  // Categories list
  app.get('/api/public/categories', (req, res) => {
    const categories = db.getAllCategories(true);
    res.json({
      success: true,
      data: categories
    });
  });

  // Files browsing, search & filter
  app.get('/api/public/files', (req, res) => {
    const { category, search, sort, page, limit, featured } = req.query;

    const result = db.getFiles({
      publishedOnly: true,
      categorySlug: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      featured: featured === 'true' ? true : undefined,
      sort: sort ? String(sort) : 'latest',
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 12
    });

    res.json({
      success: true,
      ...result
    });
  });

  // Single file details by slug
  app.get('/api/public/files/:slug', (req, res) => {
    const { slug } = req.params;
    const file = db.getFileBySlug(slug, true);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Resource unavailable or has not been published.'
      });
    }

    // Fetch up to 4 related resources from the same category
    const { files: related } = db.getFiles({
      publishedOnly: true,
      categoryId: file.categoryId,
      limit: 5
    });

    const relatedFiltered = related.filter(r => r.id !== file.id).slice(0, 4);

    res.json({
      success: true,
      data: {
        ...file,
        related: relatedFiltered
      }
    });
  });

  // Verified File Download
  app.get('/api/public/files/:id/download', (req, res) => {
    const { id } = req.params;
    const file = db.getFileById(id);

    if (!file || !file.published) {
      return res.status(404).json({
        success: false,
        error: 'The requested resource could not be found or is not currently downloadable.'
      });
    }

    const fileStreamInfo = storage.getFileStream(file.storagePath);
    if (!fileStreamInfo) {
      return res.status(404).json({
        success: false,
        error: 'File binary payload missing from storage repository.'
      });
    }

    // Increment download counter and log telemetry
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    db.incrementDownload(file.id, clientIp, userAgent);

    // Set secure download headers
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileStreamInfo.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.fileName)}"`
    );
    res.setHeader('Cache-Control', 'no-cache');

    fileStreamInfo.stream.pipe(res);
  });

  // File Preview Stream (Inline)
  app.get('/api/public/files/:id/preview', (req, res) => {
    const { id } = req.params;
    const file = db.getFileById(id);

    if (!file || !file.published) {
      return res.status(404).send('Preview resource not found.');
    }

    const fileStreamInfo = storage.getFileStream(file.storagePath);
    if (!fileStreamInfo) {
      return res.status(404).send('File stream unavailable.');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    fileStreamInfo.stream.pipe(res);
  });

  // Raw file serving for assets
  app.get('/api/public/files/raw/*', (req, res) => {
    const relativeSubPath = (req.params as any)[0];
    if (!relativeSubPath) return res.status(404).send('Not found');

    const fileStreamInfo = storage.getFileStream(relativeSubPath);
    if (!fileStreamInfo) {
      return res.status(404).send('Asset not found');
    }

    res.setHeader('Content-Type', fileStreamInfo.mimeType);
    fileStreamInfo.stream.pipe(res);
  });

  // Contact form submission
  app.post('/api/public/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, valid email address, and message content.'
      });
    }

    // Log contact inquiry safely
    console.log(`[VELORA Contact Inquiry] From: ${name} <${email}> | Subject: ${subject || 'General Inquiry'}`);
    
    res.json({
      success: true,
      message: 'Your correspondence has been encrypted and routed to the VELORA executive administration.'
    });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // Admin login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please submit both administrator email and authentication credentials.'
      });
    }

    const verification = db.verifyAdminCredentials(email, password);
    if (!verification.success || !verification.admin) {
      return res.status(401).json({
        success: false,
        error: verification.error || 'Invalid administrator credentials.'
      });
    }

    const adminUser = verification.admin;
    const token = generateAdminToken(adminUser);
    db.updateAdminLastLogin(adminUser.id);

    // Set secure cookie
    res.cookie('velora_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token,
      admin: adminUser
    });
  });

  // Admin session check
  app.get('/api/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      admin: req.admin
    });
  });

  // Admin logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('velora_admin_token');
    res.json({
      success: true,
      message: 'Session successfully terminated.'
    });
  });

  // ==========================================
  // ADMIN DASHBOARD & MANAGEMENT (PROTECTED)
  // ==========================================

  // Admin dashboard metrics
  app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
    const stats = db.getSiteStats();
    res.json({
      success: true,
      data: stats
    });
  });

  // Admin files list (includes unpublished)
  app.get('/api/admin/files', requireAdminAuth, (req, res) => {
    const { category, search, sort, page, limit } = req.query;

    const result = db.getFiles({
      publishedOnly: false,
      categorySlug: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      sort: sort ? String(sort) : 'latest',
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20
    });

    res.json({
      success: true,
      ...result
    });
  });

  // Admin upload new resource
  app.post(
    '/api/admin/files',
    requireAdminAuth,
    handleUploadErrors(
      upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
      ])
    ),
    async (req: AuthenticatedRequest, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const uploadedFile = files?.['file']?.[0];

        if (!uploadedFile) {
          return res.status(400).json({
            success: false,
            error: 'No primary file was provided for ingestion.'
          });
        }

        const {
          title,
          description,
          categoryId,
          tags,
          version,
          featured,
          published,
          customThumbnailUrl
        } = req.body;

        if (!title || !title.trim()) {
          return res.status(400).json({ success: false, error: 'Resource title is mandatory.' });
        }

        if (!categoryId) {
          return res.status(400).json({ success: false, error: 'Category assignment is mandatory.' });
        }

        // Verify category exists
        const category = db.getCategoryById(categoryId);
        if (!category) {
          return res.status(400).json({ success: false, error: 'Designated category does not exist.' });
        }

        // Save physical file to storage
        const savedFile = await storage.saveFile(uploadedFile, 'files');

        // Handle thumbnail: either uploaded file or custom URL or fallback
        let finalThumbnailUrl = customThumbnailUrl || '';
        const uploadedThumb = files?.['thumbnail']?.[0];
        if (uploadedThumb) {
          const savedThumb = await storage.saveFile(uploadedThumb, 'thumbnails');
          finalThumbnailUrl = savedThumb.publicUrl;
        }

        // Parse tags
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

        res.status(201).json({
          success: true,
          data: newResource
        });
      } catch (err: any) {
        console.error('Upload handling error:', err);
        res.status(500).json({
          success: false,
          error: err.message || 'File processing failed during storage write.'
        });
      }
    }
  );

  // Admin edit resource metadata
  app.put('/api/admin/files/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      tags,
      version,
      featured,
      published,
      thumbnailUrl
    } = req.body;

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

    res.json({
      success: true,
      data: updated
    });
  });

  // Admin replace resource binary
  app.post(
    '/api/admin/files/:id/replace',
    requireAdminAuth,
    handleUploadErrors(upload.single('file')),
    async (req, res) => {
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
        // Delete old file from storage
        if (existing.storagePath) {
          await storage.deleteFile(existing.storagePath);
        }

        // Save new file
        const savedNew = await storage.saveFile(file, 'files');

        // Update file record
        const updated = db.updateFile(id, {
          fileUrl: savedNew.publicUrl,
          storagePath: savedNew.storagePath,
          fileName: savedNew.fileName,
          mimeType: savedNew.mimeType,
          fileSize: savedNew.fileSize
        });

        res.json({
          success: true,
          data: updated
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err.message || 'Error occurred during binary replacement.'
        });
      }
    }
  );

  // Admin delete resource
  app.delete('/api/admin/files/:id', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const success = await db.deleteFile(id);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Resource not found or already deleted.' });
    }

    res.json({
      success: true,
      message: 'Resource permanently purged from database and storage.'
    });
  });

  // Admin toggle featured
  app.patch('/api/admin/files/:id/toggle-featured', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const file = db.getFileById(id);
    if (!file) return res.status(404).json({ success: false, error: 'Resource not found.' });

    const updated = db.updateFile(id, { featured: !file.featured });
    res.json({ success: true, data: updated });
  });

  // Admin toggle published
  app.patch('/api/admin/files/:id/toggle-published', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const file = db.getFileById(id);
    if (!file) return res.status(404).json({ success: false, error: 'Resource not found.' });

    const updated = db.updateFile(id, { published: !file.published });
    res.json({ success: true, data: updated });
  });

  // Admin categories CRUD
  app.get('/api/admin/categories', requireAdminAuth, (req, res) => {
    const categories = db.getAllCategories(true);
    res.json({ success: true, data: categories });
  });

  app.post('/api/admin/categories', requireAdminAuth, (req, res) => {
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

  app.put('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
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

  app.delete('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const result = db.deleteCategory(id);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message || 'Cannot delete category.' });
    }

    res.json({ success: true, message: 'Category removed successfully.' });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE / PRODUCTION STATIC
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VELORA] Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[VELORA] Failed to start server:', err);
});
