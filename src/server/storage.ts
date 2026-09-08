import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { siteConfig } from '../config/siteConfig';

let netlifyBlobsModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  netlifyBlobsModule = require('@netlify/blobs');
} catch {
  // optional
}

function getNetlifyBlobStores(): any[] {
  if (!netlifyBlobsModule) return [];
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  const stores: any[] = [];
  const storeNames = ['velora-files', 'files', 'velora-storage', 'storage'];

  for (const name of storeNames) {
    try {
      if (siteID && token && typeof netlifyBlobsModule.getStore === 'function') {
        const s = netlifyBlobsModule.getStore({ name, siteID, token });
        if (s) stores.push(s);
      } else if (typeof netlifyBlobsModule.getStore === 'function') {
        const s = netlifyBlobsModule.getStore({ name });
        if (s) stores.push(s);
      }
    } catch {}
  }

  // Also try deploy store
  try {
    if (typeof netlifyBlobsModule.getDeployStore === 'function') {
      const deployStore = siteID && token 
        ? netlifyBlobsModule.getDeployStore({ siteID, token })
        : netlifyBlobsModule.getDeployStore();
      if (deployStore) stores.push(deployStore);
    }
  } catch {}

  return stores;
}

function getNetlifyBlobStore(storeName: string) {
  if (!netlifyBlobsModule || typeof netlifyBlobsModule.getStore !== 'function') return null;
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;
  try {
    if (siteID && token) {
      return netlifyBlobsModule.getStore({ name: storeName, siteID, token });
    }
    return netlifyBlobsModule.getStore({ name: storeName });
  } catch {
    try {
      return netlifyBlobsModule.getStore(storeName);
    } catch {
      return null;
    }
  }
}

export interface SavedFileInfo {
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
}

export interface ResolvedResource {
  stream?: Readable;
  buffer?: Buffer;
  size: number;
  mimeType: string;
  fullPath?: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File, subFolder?: string): Promise<SavedFileInfo>;
  getFileStream(storagePath: string): { stream: Readable; size: number; mimeType: string; fullPath?: string } | null;
  ensureFileOnDisk(storagePath: string): Promise<string | null>;
  resolveFileResource(storagePath: string): Promise<ResolvedResource | null>;
  deleteFile(storagePath: string): Promise<boolean>;
  fileExists(storagePath: string): boolean;
  saveBuffer(buffer: Buffer, fileName: string, mimeType: string, subFolder?: string): Promise<SavedFileInfo>;
  saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer): Promise<void>;
  getExistingChunks(uploadId: string): number[];
  assembleChunks(uploadId: string, totalChunks: number, originalName: string, mimeType: string, subFolder?: string): Promise<SavedFileInfo>;
  cleanChunks(uploadId: string): void;
  getFullPath(storagePath: string): string;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    const isServerless = Boolean(
      process.env.NETLIFY || 
      process.env.AWS_LAMBDA_FUNCTION_NAME || 
      process.env.LAMBDA_TASK_ROOT
    );
    if (customBaseDir) {
      this.baseDir = customBaseDir;
    } else if (isServerless) {
      this.baseDir = '/tmp/uploads';
    } else {
      this.baseDir = process.env.STORAGE_DIR || path.join(process.cwd(), 'data', 'uploads');
    }
    this.ensureDirectory(this.baseDir);
    this.ensureDirectory(path.join(this.baseDir, 'thumbnails'));
    this.ensureDirectory(path.join(this.baseDir, 'files'));
  }

  private ensureDirectory(dirPath: string) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (err) {
      console.warn('Notice: could not create storage directory:', err);
    }
  }

  public fileExists(storagePath: string): boolean {
    const fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
    if (fs.existsSync(fullPath)) return true;
    return (
      fs.existsSync(path.join(process.cwd(), 'data', 'uploads', storagePath)) ||
      fs.existsSync(path.join(process.cwd(), 'data', 'uploads', 'files', path.basename(storagePath))) ||
      (process.env.LAMBDA_TASK_ROOT ? fs.existsSync(path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', storagePath)) : false)
    );
  }

  public async saveFile(file: Express.Multer.File, subFolder: string = 'files'): Promise<SavedFileInfo> {
    const targetFolder = path.join(this.baseDir, subFolder);
    this.ensureDirectory(targetFolder);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    const targetPath = path.join(targetFolder, uniqueName);

    let fileBuffer: Buffer | null = null;

    // Write file to target path
    if (file.buffer) {
      fileBuffer = file.buffer;
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, targetPath);
      try {
        fileBuffer = fs.readFileSync(targetPath);
      } catch {}
      // Clean up multer tmp file if needed
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore
      }
    }

    const relativePath = path.join(subFolder, uniqueName);
    const normalizedRelative = relativePath.replace(/\\/g, '/');

    // Synchronize to Netlify Blobs if store is active
    if (fileBuffer) {
      try {
        const store = getNetlifyBlobStore('velora-files');
        if (store) {
          await store.set(normalizedRelative, fileBuffer);
        }
      } catch (err: any) {
        console.warn('Netlify Blobs sync notification:', err?.message || err);
      }
    }

    return {
      fileName: file.originalname,
      storagePath: relativePath,
      fileSize: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      publicUrl: `/api/public/files/raw/${normalizedRelative}`
    };
  }

  public async saveBuffer(buffer: Buffer, originalName: string, mimeType: string, subFolder: string = 'files'): Promise<SavedFileInfo> {
    const targetFolder = path.join(this.baseDir, subFolder);
    this.ensureDirectory(targetFolder);

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    const targetPath = path.join(targetFolder, uniqueName);

    fs.writeFileSync(targetPath, buffer);

    const relativePath = path.join(subFolder, uniqueName);
    const normalizedRelative = relativePath.replace(/\\/g, '/');

    try {
      const store = getNetlifyBlobStore('velora-files');
      if (store) {
        await store.set(normalizedRelative, buffer);
      }
    } catch (err: any) {
      console.warn('Netlify Blobs sync notification:', err?.message || err);
    }

    return {
      fileName: originalName,
      storagePath: relativePath,
      fileSize: buffer.length,
      mimeType,
      publicUrl: `/api/public/files/raw/${normalizedRelative}`
    };
  }

  public async ensureFileOnDisk(storagePath: string): Promise<string | null> {
    let fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
    if (fs.existsSync(fullPath)) return fullPath;

    const candidatePaths = [
      path.join(process.cwd(), 'data', 'uploads', storagePath),
      path.join(process.cwd(), 'data', 'uploads', 'files', path.basename(storagePath)),
      path.join(process.cwd(), 'data', 'uploads', 'thumbnails', path.basename(storagePath)),
      path.join(process.cwd(), 'storage', storagePath),
      path.join(process.cwd(), 'storage', 'files', path.basename(storagePath)),
      path.join(process.cwd(), 'storage', 'thumbnails', path.basename(storagePath)),
      path.join('/tmp', 'uploads', storagePath),
      path.join('/tmp', 'uploads', 'files', path.basename(storagePath)),
      path.join('/tmp', 'uploads', 'thumbnails', path.basename(storagePath))
    ];

    if (process.env.LAMBDA_TASK_ROOT) {
      candidatePaths.push(
        path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', storagePath),
        path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', 'files', path.basename(storagePath)),
        path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', 'thumbnails', path.basename(storagePath)),
        path.join(process.env.LAMBDA_TASK_ROOT, 'storage', storagePath),
        path.join(process.env.LAMBDA_TASK_ROOT, 'storage', 'files', path.basename(storagePath)),
        path.join(process.env.LAMBDA_TASK_ROOT, 'storage', 'thumbnails', path.basename(storagePath))
      );
    }

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    // Try to fetch from Netlify Blobs with multi-key fallbacks across stores
    try {
      const stores = getNetlifyBlobStores();
      const normalized = storagePath.replace(/\\/g, '/');
      const candidateKeys = Array.from(new Set([
        normalized,
        path.basename(normalized),
        `files/${path.basename(normalized)}`,
        `thumbnails/${path.basename(normalized)}`,
        normalized.replace(/^files\//, ''),
        normalized.replace(/^\/+/, ''),
        decodeURIComponent(normalized),
        decodeURIComponent(path.basename(normalized))
      ]));

      for (const store of stores) {
        for (const blobKey of candidateKeys) {
          try {
            const data = await store.get(blobKey, { type: 'arrayBuffer' });
            if (data && data.byteLength > 0) {
              const buffer = Buffer.from(data);
              const writeTargets = [
                path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath),
                path.join('/tmp', 'uploads', storagePath),
                path.join('/tmp', 'uploads', 'files', path.basename(storagePath)),
                path.join('/tmp', storagePath),
                path.join('/tmp', path.basename(storagePath)),
                path.join(process.cwd(), 'data', 'uploads', storagePath),
                path.join(process.cwd(), 'storage', storagePath)
              ];
              for (const target of writeTargets) {
                try {
                  this.ensureDirectory(path.dirname(target));
                  fs.writeFileSync(target, buffer);
                  return target;
                } catch {}
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Notice: Netlify Blobs restore fallback skipped:', err);
    }

    return null;
  }

  public async resolveFileResource(storagePath: string): Promise<ResolvedResource | null> {
    // 1. First attempt to resolve stream from local filesystem
    const diskStream = this.getFileStream(storagePath);
    if (diskStream) {
      return diskStream;
    }

    // 2. Attempt to restore from persistent Netlify Blob storage to disk
    const diskPath = await this.ensureFileOnDisk(storagePath);
    if (diskPath && fs.existsSync(diskPath)) {
      const rechecked = this.getFileStream(diskPath) || this.getFileStream(storagePath);
      if (rechecked) {
        return rechecked;
      }
    }

    // 3. Fallback: stream directly from Netlify Blobs arrayBuffer in-memory (e.g. read-only serverless container)
    try {
      const stores = getNetlifyBlobStores();
      const normalized = storagePath.replace(/\\/g, '/');
      const candidateKeys = Array.from(new Set([
        normalized,
        path.basename(normalized),
        `files/${path.basename(normalized)}`,
        `thumbnails/${path.basename(normalized)}`,
        normalized.replace(/^files\//, ''),
        normalized.replace(/^\/+/, ''),
        decodeURIComponent(normalized),
        decodeURIComponent(path.basename(normalized))
      ]));

      for (const store of stores) {
        for (const blobKey of candidateKeys) {
          try {
            const data = await store.get(blobKey, { type: 'arrayBuffer' });
            if (data && data.byteLength > 0) {
              const buffer = Buffer.from(data);
              const ext = path.extname(storagePath).toLowerCase();
              let mimeType = 'application/octet-stream';
              if (ext === '.mp4') mimeType = 'video/mp4';
              else if (ext === '.webm') mimeType = 'video/webm';
              else if (ext === '.mov') mimeType = 'video/quicktime';
              else if (ext === '.mp3') mimeType = 'audio/mpeg';
              else if (ext === '.wav') mimeType = 'audio/wav';
              else if (ext === '.pdf') mimeType = 'application/pdf';
              else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
              else if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.webp') mimeType = 'image/webp';

              return {
                buffer,
                size: buffer.length,
                mimeType
              };
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Notice: direct Netlify Blobs resolution skipped:', err);
    }

    return null;
  }

  public getFileStream(storagePath: string): { stream: Readable; size: number; mimeType: string; fullPath?: string } | null {
    let fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
    if (!fs.existsSync(fullPath)) {
      const candidatePaths = [
        path.join(process.cwd(), 'data', 'uploads', storagePath),
        path.join(process.cwd(), 'data', 'uploads', 'files', path.basename(storagePath)),
        path.join(process.cwd(), 'data', 'uploads', 'thumbnails', path.basename(storagePath)),
        path.join(process.cwd(), 'storage', storagePath),
        path.join(process.cwd(), 'storage', 'files', path.basename(storagePath)),
        path.join(process.cwd(), 'storage', 'thumbnails', path.basename(storagePath)),
        path.join('/tmp', 'uploads', storagePath),
        path.join('/tmp', 'uploads', 'files', path.basename(storagePath)),
        path.join('/tmp', 'uploads', 'thumbnails', path.basename(storagePath))
      ];

      if (process.env.LAMBDA_TASK_ROOT) {
        candidatePaths.push(
          path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', storagePath),
          path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', 'files', path.basename(storagePath)),
          path.join(process.env.LAMBDA_TASK_ROOT, 'data', 'uploads', 'thumbnails', path.basename(storagePath)),
          path.join(process.env.LAMBDA_TASK_ROOT, 'storage', storagePath),
          path.join(process.env.LAMBDA_TASK_ROOT, 'storage', 'files', path.basename(storagePath)),
          path.join(process.env.LAMBDA_TASK_ROOT, 'storage', 'thumbnails', path.basename(storagePath))
        );
      }

      let found = false;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          fullPath = p;
          found = true;
          break;
        }
      }

      if (!found) {
        return null;
      }
    }

    const stat = fs.statSync(fullPath);
    const stream = fs.createReadStream(fullPath);
    
    // Guess mime-type by extension if needed
    const ext = path.extname(fullPath).toLowerCase();
    const matched = siteConfig.allowedFileTypes.find(t => t.extension === ext);
    let mimeType = matched?.mime || 'application/octet-stream';
    if (ext === '.mp4') mimeType = 'video/mp4';
    if (ext === '.webm') mimeType = 'video/webm';
    if (ext === '.mov') mimeType = 'video/quicktime';
    if (ext === '.mp3') mimeType = 'audio/mpeg';
    if (ext === '.wav') mimeType = 'audio/wav';
    if (ext === '.pdf') mimeType = 'application/pdf';
    if (ext === '.png') mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    if (ext === '.webp') mimeType = 'image/webp';

    return { stream, size: stat.size, mimeType, fullPath };
  }

  public async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      try {
        const store = getNetlifyBlobStore('velora-files');
        if (store) {
          await store.delete(storagePath.replace(/\\/g, '/'));
        }
      } catch {}
      return true;
    } catch (err) {
      console.error(`Failed to delete file at ${storagePath}`, err);
      return false;
    }
  }

  public getFullPath(storagePath: string): string {
    const candidate = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
    if (fs.existsSync(candidate)) return candidate;
    const alt1 = path.join(process.cwd(), 'data', 'uploads', storagePath);
    if (fs.existsSync(alt1)) return alt1;
    const alt2 = path.join(process.cwd(), 'data', 'uploads', 'files', path.basename(storagePath));
    if (fs.existsSync(alt2)) return alt2;
    const alt3 = path.join(process.cwd(), 'data', 'uploads', 'thumbnails', path.basename(storagePath));
    if (fs.existsSync(alt3)) return alt3;
    const alt4 = path.join(process.cwd(), 'storage', storagePath);
    if (fs.existsSync(alt4)) return alt4;
    const alt5 = path.join(process.cwd(), 'storage', 'files', path.basename(storagePath));
    if (fs.existsSync(alt5)) return alt5;
    const alt6 = path.join(process.cwd(), 'storage', 'thumbnails', path.basename(storagePath));
    if (fs.existsSync(alt6)) return alt6;
    return candidate;
  }

  public async saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer): Promise<void> {
    const sanitizedId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.join(this.baseDir, '_chunks', sanitizedId);
    this.ensureDirectory(chunkDir);
    const chunkFile = path.join(chunkDir, `part_${chunkIndex}`);
    fs.writeFileSync(chunkFile, buffer);

    try {
      const store = getNetlifyBlobStore('velora-files');
      if (store) {
        await store.set(`_chunks/${sanitizedId}/part_${chunkIndex}`, buffer);
      }
    } catch {}
  }

  public getExistingChunks(uploadId: string): number[] {
    const sanitizedId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.join(this.baseDir, '_chunks', sanitizedId);
    if (!fs.existsSync(chunkDir)) return [];
    try {
      const files = fs.readdirSync(chunkDir);
      return files
        .filter(f => f.startsWith('part_'))
        .map(f => parseInt(f.replace('part_', ''), 10))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
    } catch {
      return [];
    }
  }

  public async assembleChunks(
    uploadId: string,
    totalChunks: number,
    originalName: string,
    mimeType: string,
    subFolder: string = 'files'
  ): Promise<SavedFileInfo> {
    const sanitizedId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.join(this.baseDir, '_chunks', sanitizedId);
    const targetFolder = path.join(this.baseDir, subFolder);
    this.ensureDirectory(targetFolder);

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    const targetPath = path.join(targetFolder, uniqueName);

    if (fs.existsSync(targetPath)) {
      try { fs.unlinkSync(targetPath); } catch {}
    }

    // Sequentially append each chunk buffer to guarantee atomic assembly without stream buffering race conditions
    for (let i = 0; i < totalChunks; i++) {
      let partPath = path.join(chunkDir, `part_${i}`);
      if (!fs.existsSync(partPath)) {
        try {
          const store = getNetlifyBlobStore('velora-files');
          if (store) {
            const chunkBuf = await store.get(`_chunks/${sanitizedId}/part_${i}`, { type: 'arrayBuffer' });
            if (chunkBuf) {
              this.ensureDirectory(chunkDir);
              fs.writeFileSync(partPath, Buffer.from(chunkBuf));
            }
          }
        } catch {}
      }
      if (!fs.existsSync(partPath)) {
        try { if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath); } catch {}
        throw new Error(`Upload payload chunk ${i} of ${totalChunks} was not found on storage.`);
      }
      const partBuf = fs.readFileSync(partPath);
      fs.appendFileSync(targetPath, partBuf);
    }

    const stat = fs.statSync(targetPath);
    const relativePath = path.join(subFolder, uniqueName);
    const normalizedRelative = relativePath.replace(/\\/g, '/');

    // Clean up temporary chunk pieces
    try {
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('Notice: could not clean chunk directory:', e);
    }

    // Sync to Netlify Blobs if store is active
    try {
      const store = getNetlifyBlobStore('velora-files');
      if (store) {
        const fullBuf = fs.readFileSync(targetPath);
        await store.set(normalizedRelative, fullBuf);
      }
    } catch (err: any) {
      console.warn('Netlify Blobs sync notification for assembled file:', err?.message || err);
    }

    return {
      fileName: originalName,
      storagePath: relativePath,
      fileSize: stat.size,
      mimeType: mimeType || 'application/octet-stream',
      publicUrl: `/api/public/files/raw/${normalizedRelative}`
    };
  }

  public cleanChunks(uploadId: string): void {
    const sanitizedId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.join(this.baseDir, '_chunks', sanitizedId);
    try {
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

export const storage = new LocalStorageProvider();
