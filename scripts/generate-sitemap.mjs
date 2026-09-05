import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://velora-digital-archive.netlify.app';

function formatDate(dateStr) {
  try {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function generateSitemapXml() {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  let categories = [];
  let files = [];

  if (fs.existsSync(dbPath)) {
    try {
      const content = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      categories = Array.isArray(content.categories) ? content.categories : [];
      files = Array.isArray(content.files) ? content.files : [];
    } catch (e) {
      console.warn('[Sitemap Generator] Could not read db.json, using defaults:', e);
    }
  }

  const publishedFiles = files.filter(f => f.published !== false);
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `${SITE_URL}/library`, priority: '0.9', changefreq: 'daily', lastmod: today },
    { loc: `${SITE_URL}/categories`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${SITE_URL}/about`, priority: '0.6', changefreq: 'monthly', lastmod: today },
    { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: today },
    { loc: `${SITE_URL}/privacy`, priority: '0.3', changefreq: 'monthly', lastmod: today },
    { loc: `${SITE_URL}/terms`, priority: '0.3', changefreq: 'monthly', lastmod: today }
  ];

  const categoryPages = categories.map(cat => ({
    loc: `${SITE_URL}/category/${encodeURIComponent(cat.slug)}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: formatDate(cat.updatedAt || cat.createdAt)
  }));

  const filePages = publishedFiles.map(file => ({
    loc: `${SITE_URL}/file/${encodeURIComponent(file.slug)}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: formatDate(file.updatedAt || file.createdAt)
  }));

  const allUrls = [
    ...staticPages,
    ...categoryPages,
    ...filePages
  ];

  const xmlEntries = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
}

// Execute CLI generator
const xml = generateSitemapXml();
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
console.log(`[Sitemap Generator] Generated /public/sitemap.xml with ${xml.split('<url>').length - 1} URLs`);

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
  console.log('[Sitemap Generator] Also updated /dist/sitemap.xml');
}
