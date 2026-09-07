import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Category, FileResource, DownloadLog, AdminUser, SiteStats } from '../types';
import { storage } from './storage';

interface DatabaseSchema {
  admins: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
    lastLogin?: string;
  }[];
  categories: Category[];
  files: FileResource[];
  downloads: DownloadLog[];
  settings: Record<string, any>;
}

let netlifyBlobsModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  netlifyBlobsModule = require('@netlify/blobs');
} catch {
  // optional
}

function getNetlifyDbStore() {
  if (!netlifyBlobsModule || typeof netlifyBlobsModule.getStore !== 'function') return null;
  try {
    return netlifyBlobsModule.getStore('velora-db');
  } catch {
    return null;
  }
}

export class JsonDatabase {
  private dbPath: string;
  private data: DatabaseSchema;
  private lastMtime: number = 0;

  constructor(customPath?: string) {
    const isServerless = Boolean(
      process.env.NETLIFY || 
      process.env.AWS_LAMBDA_FUNCTION_NAME || 
      process.env.LAMBDA_TASK_ROOT
    );
    if (customPath) {
      this.dbPath = customPath;
    } else if (isServerless) {
      this.dbPath = path.join('/tmp', 'db.json');
    } else {
      this.dbPath = path.join(process.cwd(), 'data', 'db.json');
    }
    this.ensureDataDir();
    this.data = this.loadDatabase();
    this.initializeDefaults();
    this.syncFromNetlifyBlobs();
  }

  private async syncFromNetlifyBlobs() {
    try {
      const store = getNetlifyDbStore();
      if (store) {
        const remoteData = await store.get('db.json', { type: 'json' });
        if (remoteData && Array.isArray(remoteData.files) && remoteData.files.length > 0) {
          // Merge remote data into local instance
          this.data = remoteData;
          this.saveDatabase();
        }
      }
    } catch {
      // ignore in environments without Blobs configuration
    }
  }

  private ensureDataDir() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.warn('Notice: could not ensure data directory:', err);
    }
  }

  public refreshIfStale() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const stat = fs.statSync(this.dbPath);
        if (stat.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(this.dbPath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.files)) {
            this.data = parsed;
            this.lastMtime = stat.mtimeMs;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(this.dbPath)) {
      try {
        const stat = fs.statSync(this.dbPath);
        this.lastMtime = stat.mtimeMs;
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, starting fresh backup:', err);
      }
    }

    // Check project data/db.json as seed fallback
    const seedPaths = [
      path.join(process.cwd(), 'data', 'db.json'),
      path.join(__dirname, '..', '..', 'data', 'db.json'),
      path.join(__dirname, 'data', 'db.json')
    ];

    if (process.env.LAMBDA_TASK_ROOT) {
      seedPaths.unshift(path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'db.json'));
    }

    for (const p of seedPaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          // In serverless, populate /tmp/db.json
          try {
            if (this.dbPath !== p) {
              fs.writeFileSync(this.dbPath, raw, 'utf-8');
              const stat = fs.statSync(this.dbPath);
              this.lastMtime = stat.mtimeMs;
            }
          } catch (writeErr) {
            // ignore
          }
          return parsed;
        } catch (err) {
          console.error('Failed to parse seed db:', err);
        }
      }
    }

    return {
      admins: [],
      categories: [],
      files: [],
      downloads: [],
      settings: {}
    };
  }

  private saveDatabase() {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(tempPath, serialized, 'utf-8');
      fs.renameSync(tempPath, this.dbPath);
      try {
        const stat = fs.statSync(this.dbPath);
        this.lastMtime = stat.mtimeMs;
      } catch {}

      // Asynchronously synchronize to Netlify Blobs if store is active
      try {
        const store = getNetlifyDbStore();
        if (store) {
          store.setJSON('db.json', this.data).catch((err: any) => {
            console.warn('Netlify Blobs sync notification for db:', err?.message || err);
          });
        }
      } catch {}
    } catch (err) {
      console.warn('Notice: database save skipped (read-only filesystem):', err);
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  private async initializeDefaults() {
    let changed = false;

    // 1. Initialize and Synchronize Single-Owner Admin from Environment
    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim();
    if (this.data.admins.length === 0) {
      this.data.admins.push({
        id: 'admin_primary_01',
        email: envAdminEmail,
        name: 'Velora Master Admin',
        passwordHash: '',
        createdAt: new Date().toISOString()
      });
      changed = true;
    } else {
      // Enforce single-owner admin model and synchronize configured email
      if (envAdminEmail && this.data.admins[0].email.toLowerCase() !== envAdminEmail.toLowerCase()) {
        this.data.admins[0].email = envAdminEmail;
        changed = true;
      }
      if (this.data.admins.length > 1) {
        this.data.admins = [this.data.admins[0]];
        changed = true;
      }
    }

    // 2. Initialize Standard Categories if empty
    if (this.data.categories.length === 0) {
      const now = new Date().toISOString();
      const defaultCategories: Omit<Category, 'fileCount'>[] = [
        {
          id: 'cat_docs',
          name: 'Documents',
          slug: 'documents',
          description: 'Whitepapers, architectural specifications, research data, and guides.',
          icon: 'FileText',
          color: '#d4af37',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_software',
          name: 'Software',
          slug: 'software',
          description: 'Engineered utilities, developer toolkits, scripts, and runtime binaries.',
          icon: 'Code',
          color: '#38bdf8',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_templates',
          name: 'Templates',
          slug: 'templates',
          description: 'High-end design systems, code boilerplates, and configuration schemas.',
          icon: 'Layout',
          color: '#a855f7',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_images',
          name: 'Images',
          slug: 'images',
          description: 'Ultra-resolution graphics, vector collections, and futuristic renders.',
          icon: 'Image',
          color: '#f43f5e',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_archives',
          name: 'Archives',
          slug: 'archives',
          description: 'Bundled asset packages, full application source distributions, and zip sets.',
          icon: 'Archive',
          color: '#eab308',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_education',
          name: 'Education',
          slug: 'education',
          description: 'Curriculum briefs, interactive tutorials, and technical deep-dives.',
          icon: 'GraduationCap',
          color: '#10b981',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_audio',
          name: 'Audio',
          slug: 'audio',
          description: 'Lossless ambient soundscapes, spatial audio cues, and master recordings.',
          icon: 'Volume2',
          color: '#ec4899',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_videos',
          name: 'Videos',
          slug: 'videos',
          description: 'Cinematic motion loops, video backgrounds, and demonstrations.',
          icon: 'Video',
          color: '#6366f1',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_apps',
          name: 'Apps',
          slug: 'apps',
          description: 'Applications, responsive web utilities, and cross-platform client binaries.',
          icon: 'AppWindow',
          color: '#38bdf8',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_photos',
          name: 'Photos',
          slug: 'photos',
          description: 'Curated photography collections, ultra-resolution assets, and graphic renders.',
          icon: 'Image',
          color: '#f43f5e',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_music',
          name: 'Music',
          slug: 'music',
          description: 'Lossless soundtracks, ambient audio compositions, and production stems.',
          icon: 'Music',
          color: '#ec4899',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'cat_games',
          name: 'Games',
          slug: 'games',
          description: 'Interactive gaming packages, engines, and entertainment builds.',
          icon: 'Gamepad2',
          color: '#10b981',
          createdAt: now,
          updatedAt: now
        }
      ];
      this.data.categories = defaultCategories;
      changed = true;
    }

    // 3. Initialize Seed Resources with real files in storage if empty
    if (this.data.files.length === 0) {
      await this.seedInitialFiles();
      changed = true;
    }

    if (changed) {
      this.saveDatabase();
    }
  }

  private async seedInitialFiles() {
    const now = new Date();
    const formatDate = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return d.toISOString();
    };

    // Helper to write a starter file to storage
    const createSeedFile = async (
      fileName: string,
      content: Buffer | string,
      mimeType: string
    ) => {
      const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
      return await storage.saveBuffer(buffer, fileName, mimeType, 'files');
    };

    // 1. PDF / Document
    const pdfDummyContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 104 >>
stream
BT
/F1 24 Tf
100 700 Td
(VELORA Digital Architecture Specification 2026) Tj
/F1 12 Tf
100 660 Td
(Verified Enterprise Resource - Integrity Hash: 0x99A4B2F7E) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000018 00000 n 
0000000077 00000 n 
0000000136 00000 n 
0000000257 00000 n 
0000000412 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
492
%%EOF`;

    const seedDoc = await createSeedFile(
      'VELORA_Enterprise_Architecture_Blueprint_2026.pdf',
      pdfDummyContent,
      'application/pdf'
    );

    // 2. High-Tech SVG Iconography Pack
    const svgIconPack = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf4d8"/>
      <stop offset="50%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a7620"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#08080a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0a0a0d"/>
  <circle cx="400" cy="300" r="280" fill="url(#glow)"/>
  <path d="M400 120 L580 460 L220 460 Z" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <circle cx="400" cy="300" r="80" fill="none" stroke="#d4af37" stroke-width="2" stroke-dasharray="6,6"/>
  <circle cx="400" cy="300" r="8" fill="#d4af37"/>
  <text x="400" y="520" text-anchor="middle" fill="#d4af37" font-family="sans-serif" font-size="22" letter-spacing="6">VELORA QUANTUM VECTOR ASSETS</text>
</svg>`;

    const seedSvg = await createSeedFile(
      'Quantum_UI_Vector_Asset_Suite.svg',
      svgIconPack,
      'image/svg+xml'
    );

    // 3. Technical Markdown Specification
    const markdownContent = `# VELORA High-Performance File Distribution Protocol

## Overview
This architectural briefing outlines the zero-latency, cryptographically verified asset distribution pipeline engineered for the VELORA platform.

### Core Guarantees
1. **Zero-Byte Loss Streaming**: Chunked pipeline responses with range-request capability.
2. **Server-Side MIME Verification**: Rigorous magic-byte validation coupled with strict extension whitelisting.
3. **Owner-Only Authentication**: SHA-256 salted password derivation with signed JWT tokens.

\`\`\`json
{
  "system": "VELORA-V2",
  "status": "OPERATIONAL",
  "encryption": "TLS_AES_256_GCM_SHA384",
  "cluster": "AP-SOUTHEAST-1"
}
\`\`\`
`;

    const seedMd = await createSeedFile(
      'VELORA_Distribution_Protocol_Whitepaper.md',
      markdownContent,
      'text/markdown'
    );

    // 4. Financial & Telemetry CSV
    const csvContent = `Timestamp,Resource_ID,Category,Latency_MS,Throughput_MBPS,Status
2026-09-01T08:00:00Z,RES-9901,Documents,14.2,128.4,200_OK
2026-09-01T12:00:00Z,RES-9902,Software,18.5,245.1,200_OK
2026-09-02T04:30:00Z,RES-9903,Templates,9.8,98.6,200_OK
2026-09-03T16:45:00Z,RES-9904,Images,22.1,310.8,200_OK
2026-09-04T22:15:00Z,RES-9905,Archives,34.0,512.0,200_OK`;

    const seedCsv = await createSeedFile(
      'Platform_Telemetry_Benchmark_Data.csv',
      csvContent,
      'text/csv'
    );

    // 5. Software Configuration Preset / JSON
    const jsonPreset = JSON.stringify(
      {
        profile: 'VELORA_ULTRA_PRESET',
        version: '4.2.0',
        environment: 'production',
        rendering: {
          antialiasing: 'MSAA_8X',
          colorSpace: 'Display-P3',
          ambientOcclusion: true,
          bloomIntensity: 0.15
        },
        caching: {
          strategy: 'STALE_WHILE_REVALIDATE',
          ttlSeconds: 86400,
          compression: 'ZSTD_LEVEL_19'
        }
      },
      null,
      2
    );

    const seedJson = await createSeedFile(
      'System_Optimized_Runtime_Config.json',
      jsonPreset,
      'application/json'
    );

    // Add initial file records
    this.data.files = [
      {
        id: 'file_blueprint_01',
        title: 'VELORA Enterprise Architecture Blueprint 2026',
        slug: 'velora-enterprise-architecture-blueprint-2026',
        description: 'Comprehensive 42-page technical architectural whitepaper detailing distributed high-security file storage, cryptographic verification, and modern edge streaming pipelines.',
        categoryId: 'cat_docs',
        fileUrl: seedDoc.publicUrl,
        storagePath: seedDoc.storagePath,
        thumbnailUrl: 'https://images.unsplash.com/photo-1507842229451-7f01be7fe7ab?q=80&w=800&auto=format&fit=crop',
        fileName: seedDoc.fileName,
        mimeType: seedDoc.mimeType,
        fileSize: seedDoc.fileSize,
        version: 'v2.4.1',
        tags: ['Architecture', 'Security', 'Enterprise', 'Cloud'],
        downloadCount: 1482,
        featured: true,
        published: true,
        createdAt: formatDate(12),
        updatedAt: formatDate(2)
      },
      {
        id: 'file_quantum_vector_02',
        title: 'Quantum UI Vector Asset Suite',
        slug: 'quantum-ui-vector-asset-suite',
        description: 'Master collection of resolution-independent SVG vector graphics, golden metallic geometric insignia, and luxury futuristic badges ready for production interfaces.',
        categoryId: 'cat_images',
        fileUrl: seedSvg.publicUrl,
        storagePath: seedSvg.storagePath,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        fileName: seedSvg.fileName,
        mimeType: seedSvg.mimeType,
        fileSize: seedSvg.fileSize,
        version: 'v3.0',
        tags: ['Design', 'Vector', 'SVG', 'Luxury', 'Insignia'],
        downloadCount: 940,
        featured: true,
        published: true,
        createdAt: formatDate(9),
        updatedAt: formatDate(3)
      },
      {
        id: 'file_protocol_spec_03',
        title: 'High-Throughput File Distribution Protocol Specification',
        slug: 'high-throughput-file-distribution-protocol-specification',
        description: 'In-depth protocol documentation in Markdown format defining chunked byte-range transmissions, cryptographic signatures, and fallback heuristics for zero-drop file distribution.',
        categoryId: 'cat_docs',
        fileUrl: seedMd.publicUrl,
        storagePath: seedMd.storagePath,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
        fileName: seedMd.fileName,
        mimeType: seedMd.mimeType,
        fileSize: seedMd.fileSize,
        version: 'v1.8',
        tags: ['Protocol', 'Networking', 'Documentation', 'Markdown'],
        downloadCount: 620,
        featured: false,
        published: true,
        createdAt: formatDate(6),
        updatedAt: formatDate(1)
      },
      {
        id: 'file_telemetry_dataset_04',
        title: 'Global Platform Telemetry & Performance Benchmark Dataset',
        slug: 'global-platform-telemetry-performance-benchmark-dataset',
        description: 'Empirical multi-region performance telemetry records across edge nodes, capturing latency percentiles, throughput densities, and availability metrics in structured CSV format.',
        categoryId: 'cat_education',
        fileUrl: seedCsv.publicUrl,
        storagePath: seedCsv.storagePath,
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
        fileName: seedCsv.fileName,
        mimeType: seedCsv.mimeType,
        fileSize: seedCsv.fileSize,
        version: '2026.Q3',
        tags: ['Data', 'Telemetry', 'CSV', 'Benchmarks', 'Analytics'],
        downloadCount: 415,
        featured: false,
        published: true,
        createdAt: formatDate(4),
        updatedAt: formatDate(1)
      },
      {
        id: 'file_runtime_preset_05',
        title: 'Titanium High-Performance Engine Config Schema',
        slug: 'titanium-high-performance-engine-config-schema',
        description: 'Production-tested JSON schema configuration preset for distributed runtime caching, hardware-accelerated rasterization pipelines, and memory optimization.',
        categoryId: 'cat_templates',
        fileUrl: seedJson.publicUrl,
        storagePath: seedJson.storagePath,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
        fileName: seedJson.fileName,
        mimeType: seedJson.mimeType,
        fileSize: seedJson.fileSize,
        version: 'v4.2.0',
        tags: ['Configuration', 'JSON', 'Optimization', 'Templates'],
        downloadCount: 885,
        featured: true,
        published: true,
        createdAt: formatDate(2),
        updatedAt: formatDate(0)
      }
    ];

    // Seed realistic download historical logs for the download chart
    const logs: DownloadLog[] = [];
    const filesToLog = this.data.files;
    for (let i = 14; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const count = Math.floor(25 + Math.random() * 45);
      for (let j = 0; j < count; j++) {
        const targetFile = filesToLog[Math.floor(Math.random() * filesToLog.length)];
        logs.push({
          id: `dl_${i}_${j}_${Math.random().toString(36).substr(2, 5)}`,
          fileId: targetFile.id,
          fileTitle: targetFile.title,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(dayDate.getTime() + Math.random() * 86400000).toISOString()
        });
      }
    }
    this.data.downloads = logs;
  }

  // --- ADMIN OPERATIONS ---
  public verifyAdminCredentials(
    submittedEmail: string,
    submittedPass: string
  ): { success: boolean; error?: string; admin?: AdminUser } {
    const configuredEmail = (process.env.ADMIN_EMAIL || '').trim();
    const configuredPassword = process.env.ADMIN_PASSWORD || '';
    const storedAdmin = this.data.admins[0];

    const targetEmail = configuredEmail || storedAdmin?.email || '';

    if (!targetEmail) {
      return {
        success: false,
        error: 'Administrator email is not configured in the server environment.'
      };
    }

    if (!configuredPassword && !storedAdmin?.passwordHash) {
      return {
        success: false,
        error: 'Administrator credentials are not configured in the server environment.'
      };
    }

    const cleanSubmittedEmail = (submittedEmail || '').trim().toLowerCase();
    const cleanTargetEmail = targetEmail.toLowerCase();

    // Constant-time comparison for email
    const bufEmailA = Buffer.from(cleanSubmittedEmail, 'utf8');
    const bufEmailB = Buffer.from(cleanTargetEmail, 'utf8');
    let emailValid = false;
    if (bufEmailA.length === bufEmailB.length) {
      emailValid = crypto.timingSafeEqual(bufEmailA, bufEmailB);
    } else {
      crypto.timingSafeEqual(bufEmailA, bufEmailA);
      emailValid = false;
    }

    // Secure password comparison
    let passwordValid = false;
    if (configuredPassword) {
      if (
        configuredPassword.startsWith('$2a$') ||
        configuredPassword.startsWith('$2b$') ||
        configuredPassword.startsWith('$2y$')
      ) {
        try {
          passwordValid = bcrypt.compareSync(submittedPass, configuredPassword);
        } catch {
          passwordValid = false;
        }
      } else {
        const bufPassA = Buffer.from(String(submittedPass), 'utf8');
        const bufPassB = Buffer.from(String(configuredPassword), 'utf8');
        if (bufPassA.length === bufPassB.length) {
          passwordValid = crypto.timingSafeEqual(bufPassA, bufPassB);
        } else {
          crypto.timingSafeEqual(bufPassA, bufPassA);
          passwordValid = false;
        }
      }
    } else if (storedAdmin?.passwordHash) {
      try {
        passwordValid = bcrypt.compareSync(submittedPass, storedAdmin.passwordHash);
      } catch {
        passwordValid = false;
      }
    }

    if (!emailValid || !passwordValid) {
      return {
        success: false,
        error: 'Invalid administrator credentials.'
      };
    }

    // Synchronize single-owner admin record in database
    const adminRecord = this.ensureAdminInSync(targetEmail);

    return {
      success: true,
      admin: {
        id: adminRecord.id,
        email: adminRecord.email,
        name: adminRecord.name,
        lastLogin: adminRecord.lastLogin
      }
    };
  }

  public ensureAdminInSync(email?: string): { id: string; email: string; name: string; lastLogin?: string } {
    const targetEmail = (email || process.env.ADMIN_EMAIL || '').trim();
    let admin = this.data.admins[0];
    let changed = false;

    if (!admin) {
      admin = {
        id: 'admin_primary_01',
        email: targetEmail,
        name: 'Velora Master Admin',
        passwordHash: '',
        createdAt: new Date().toISOString()
      };
      this.data.admins = [admin];
      changed = true;
    } else {
      if (targetEmail && admin.email.toLowerCase() !== targetEmail.toLowerCase()) {
        admin.email = targetEmail;
        changed = true;
      }
      if (this.data.admins.length > 1) {
        this.data.admins = [admin];
        changed = true;
      }
    }

    if (changed) {
      this.saveDatabase();
    }

    return admin;
  }

  public getAdminByEmail(email: string): AdminUser | null {
    const configuredEmail = (process.env.ADMIN_EMAIL || '').trim();
    if (!configuredEmail) return null;

    if (email.trim().toLowerCase() !== configuredEmail.toLowerCase()) {
      return null;
    }

    const admin = this.ensureAdminInSync(configuredEmail);
    return {
      id: admin.id,
      email: configuredEmail,
      name: admin.name,
      lastLogin: admin.lastLogin
    };
  }

  public getAdminById(id: string): AdminUser | null {
    const configuredEmail = (process.env.ADMIN_EMAIL || '').trim();
    const admin = this.data.admins.find(a => a.id === id) || (id === 'admin_primary_01' ? this.data.admins[0] : null);
    if (!admin) return null;

    return {
      id: admin.id,
      email: configuredEmail || admin.email,
      name: admin.name,
      lastLogin: admin.lastLogin
    };
  }

  public updateAdminLastLogin(id: string) {
    const admin = this.data.admins.find(a => a.id === id) || this.data.admins[0];
    if (admin) {
      admin.lastLogin = new Date().toISOString();
      this.saveDatabase();
    }
  }

  // --- CATEGORIES OPERATIONS ---
  public getAllCategories(includeFileCount: boolean = true): Category[] {
    this.refreshIfStale();
    return this.data.categories.map(c => {
      const fileCount = includeFileCount 
        ? this.data.files.filter(f => f.categoryId === c.id && (f.published || (f as any).status === 'published')).length
        : undefined;
      return { ...c, fileCount };
    });
  }

  public getCategoryById(id: string): Category | null {
    this.refreshIfStale();
    return this.data.categories.find(c => c.id === id) || null;
  }

  public getCategoryBySlug(slug: string): Category | null {
    this.refreshIfStale();
    return this.data.categories.find(c => c.slug === slug) || null;
  }

  public createCategory(data: { name: string; description: string; icon?: string; color?: string }): Category {
    const slug = this.slugify(data.name);
    // Ensure slug unique
    let finalSlug = slug;
    let counter = 1;
    while (this.data.categories.some(c => c.slug === finalSlug)) {
      finalSlug = `${slug}-${counter++}`;
    }

    const now = new Date().toISOString();
    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: data.name.trim(),
      slug: finalSlug,
      description: data.description.trim(),
      icon: data.icon || 'Folder',
      color: data.color || '#d4af37',
      fileCount: 0,
      createdAt: now,
      updatedAt: now
    };

    this.data.categories.push(newCat);
    this.saveDatabase();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'description' | 'icon' | 'color'>>): Category | null {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    const current = this.data.categories[index];
    let newSlug = current.slug;
    if (updates.name && updates.name.trim() !== current.name) {
      newSlug = this.slugify(updates.name);
    }

    const updated: Category = {
      ...current,
      ...updates,
      slug: newSlug,
      updatedAt: new Date().toISOString()
    };

    this.data.categories[index] = updated;
    this.saveDatabase();
    return updated;
  }

  public deleteCategory(id: string): { success: boolean; message?: string } {
    // Check if any files belong to this category
    const filesCount = this.data.files.filter(f => f.categoryId === id).length;
    if (filesCount > 0) {
      return {
        success: false,
        message: `Cannot delete category: ${filesCount} file(s) are currently assigned to it. Please reassign or delete the files first.`
      };
    }

    const initialLength = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    if (this.data.categories.length === initialLength) {
      return { success: false, message: 'Category not found.' };
    }

    this.saveDatabase();
    return { success: true };
  }

  // --- FILES OPERATIONS ---
  private enrichFile(file: FileResource): FileResource {
    const cat = this.data.categories.find(c => c.id === file.categoryId);
    const published = typeof file.published === 'boolean' ? file.published : (file as any).status === 'published';
    const isVideo = (file.mimeType && file.mimeType.startsWith('video/')) || 
      (file.fileName && /\.(mp4|webm|mov|mkv)$/i.test(file.fileName));
    
    let thumb = file.thumbnailUrl || (file as any).thumbnail || '';
    if (!thumb && isVideo) {
      thumb = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop';
    }

    return {
      ...file,
      categoryName: cat?.name || 'General',
      categorySlug: cat?.slug || 'general',
      category: file.categoryId,
      thumbnailUrl: thumb,
      thumbnail: thumb,
      fileUrl: file.fileUrl,
      storageUrl: file.fileUrl,
      mimeType: file.mimeType || 'application/octet-stream',
      type: file.mimeType || 'application/octet-stream',
      published,
      status: published ? 'published' : 'draft',
      downloadCount: typeof file.downloadCount === 'number' ? file.downloadCount : 0,
      tags: Array.isArray(file.tags) ? file.tags : [],
      featured: Boolean(file.featured)
    };
  }

  public getFiles(params: {
    publishedOnly?: boolean;
    categoryId?: string;
    categorySlug?: string;
    search?: string;
    featured?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }): { files: FileResource[]; total: number; page: number; totalPages: number } {
    this.refreshIfStale();
    let result = [...this.data.files];

    if (params.publishedOnly) {
      result = result.filter(f => f.published === true || (f as any).status === 'published');
    }

    if (params.featured !== undefined) {
      result = result.filter(f => f.featured === params.featured);
    }

    if (params.categoryId) {
      result = result.filter(f => f.categoryId === params.categoryId);
    }

    if (params.categorySlug) {
      const slug = params.categorySlug.toLowerCase().trim();
      const targetSlugs = [slug];
      if (slug === 'photos') targetSlugs.push('images');
      if (slug === 'images') targetSlugs.push('photos');
      if (slug === 'music') targetSlugs.push('audio');
      if (slug === 'audio') targetSlugs.push('music');
      if (slug === 'apps') targetSlugs.push('software');

      const matchedCats = this.data.categories.filter(c => targetSlugs.includes(c.slug.toLowerCase()));
      const matchedCatIds = matchedCats.map(c => c.id);
      if (matchedCatIds.length > 0) {
        result = result.filter(f => matchedCatIds.includes(f.categoryId));
      } else {
        result = [];
      }
    }

    if (params.search && params.search.trim()) {
      const query = params.search.toLowerCase().trim();
      result = result.filter(f => {
        const matchTitle = f.title.toLowerCase().includes(query);
        const matchDesc = f.description.toLowerCase().includes(query);
        const matchTags = f.tags.some(t => t.toLowerCase().includes(query));
        const matchName = f.fileName.toLowerCase().includes(query);
        const cat = this.data.categories.find(c => c.id === f.categoryId);
        const matchCat = cat?.name.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchTags || matchName || matchCat;
      });
    }

    // Attach category names and compatibility field aliases
    result = result.map(f => this.enrichFile(f));

    // Sorting
    switch (params.sort) {
      case 'downloads':
        result.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case 'name_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name_desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    const total = result.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 12);
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      files: paginated,
      total,
      page,
      totalPages
    };
  }

  public getFileById(id: string): FileResource | null {
    this.refreshIfStale();
    const file = this.data.files.find(f => f.id === id);
    if (!file) return null;
    return this.enrichFile(file);
  }

  public getFileBySlug(slug: string, publishedOnly: boolean = true): FileResource | null {
    this.refreshIfStale();
    const file = this.data.files.find(f => f.slug === slug && (!publishedOnly || f.published || (f as any).status === 'published'));
    if (!file) return null;
    return this.enrichFile(file);
  }

  public createFile(fileData: Omit<FileResource, 'id' | 'slug' | 'downloadCount' | 'createdAt' | 'updatedAt'>): FileResource {
    const slugBase = this.slugify(fileData.title);
    let finalSlug = slugBase;
    let counter = 1;
    while (this.data.files.some(f => f.slug === finalSlug)) {
      finalSlug = `${slugBase}-${counter++}`;
    }

    const isVideo = (fileData.mimeType && fileData.mimeType.startsWith('video/')) || 
      (fileData.fileName && /\.(mp4|webm|mov|mkv)$/i.test(fileData.fileName));
    
    let finalThumbnailUrl = fileData.thumbnailUrl || (fileData as any).thumbnail || '';
    if (!finalThumbnailUrl && isVideo) {
      finalThumbnailUrl = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop';
    }

    const isPublished = typeof fileData.published === 'boolean' 
      ? fileData.published 
      : ((fileData as any).status === 'published' || true);

    const now = new Date().toISOString();
    const newFile: FileResource = {
      ...fileData,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      slug: finalSlug,
      thumbnailUrl: finalThumbnailUrl,
      published: isPublished,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now
    };

    this.data.files.unshift(newFile);
    this.saveDatabase();
    return this.enrichFile(newFile);
  }

  public updateFile(id: string, updates: Partial<FileResource>): FileResource | null {
    const index = this.data.files.findIndex(f => f.id === id);
    if (index === -1) return null;

    const current = this.data.files[index];
    let newSlug = current.slug;
    if (updates.title && updates.title !== current.title) {
      const slugBase = this.slugify(updates.title);
      newSlug = slugBase;
      let counter = 1;
      while (this.data.files.some(f => f.slug === newSlug && f.id !== id)) {
        newSlug = `${slugBase}-${counter++}`;
      }
    }

    const updated: FileResource = {
      ...current,
      ...updates,
      slug: newSlug,
      updatedAt: new Date().toISOString()
    };

    this.data.files[index] = updated;
    this.saveDatabase();
    return this.enrichFile(updated);
  }

  public async deleteFile(id: string): Promise<boolean> {
    const index = this.data.files.findIndex(f => f.id === id);
    if (index === -1) return false;

    const file = this.data.files[index];
    // Delete physical file from storage
    if (file.storagePath) {
      await storage.deleteFile(file.storagePath);
    }

    this.data.files.splice(index, 1);
    this.saveDatabase();
    return true;
  }

  public incrementDownload(fileId: string, clientIp: string, userAgent: string): number {
    const file = this.data.files.find(f => f.id === fileId);
    if (!file) return 0;

    file.downloadCount += 1;

    // Log the download event
    this.data.downloads.push({
      id: `dl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fileId,
      fileTitle: file.title,
      ip: clientIp || '127.0.0.1',
      userAgent: userAgent || 'Unknown',
      timestamp: new Date().toISOString()
    });

    this.saveDatabase();
    return file.downloadCount;
  }

  // --- STATS ---
  public getSiteStats(): SiteStats {
    this.refreshIfStale();
    const totalFiles = this.data.files.filter(f => f.published || (f as any).status === 'published').length;
    const totalDownloads = this.data.files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
    const totalCategories = this.data.categories.length;
    const totalStorageBytes = this.data.files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyUpdatedCount = this.data.files.filter(f => new Date(f.updatedAt) >= sevenDaysAgo).length;

    // Group downloads over the past 14 days
    const dailyDownloadsMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      dailyDownloadsMap[dateKey] = 0;
    }

    this.data.downloads.forEach(dl => {
      const day = dl.timestamp.split('T')[0];
      if (dailyDownloadsMap[day] !== undefined) {
        dailyDownloadsMap[day] += 1;
      }
    });

    const downloadsOverTime = Object.keys(dailyDownloadsMap).map(date => ({
      date,
      count: dailyDownloadsMap[date]
    }));

    // Top 5 popular files
    const popularFiles = [...this.data.files]
      .filter(f => f.published)
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 5)
      .map(f => {
        const cat = this.data.categories.find(c => c.id === f.categoryId);
        return {
          ...f,
          categoryName: cat?.name || 'General'
        };
      });

    // Category distribution
    const categoryDistribution = this.data.categories.map(c => ({
      name: c.name,
      slug: c.slug,
      count: this.data.files.filter(f => f.categoryId === c.id && f.published).length
    }));

    // Recent activity
    const recentActivity = this.data.downloads
      .slice(-10)
      .reverse()
      .map(dl => {
        const file = this.data.files.find(f => f.id === dl.fileId);
        return {
          type: 'download' as const,
          fileTitle: dl.fileTitle || file?.title || 'Unknown Resource',
          fileSlug: file?.slug || '',
          timestamp: dl.timestamp
        };
      });

    return {
      totalFiles,
      totalDownloads,
      totalCategories,
      totalStorageBytes,
      recentlyUpdatedCount,
      downloadsOverTime,
      popularFiles,
      categoryDistribution,
      recentActivity
    };
  }
}

export const db = new JsonDatabase();
