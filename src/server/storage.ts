import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { siteConfig } from '../config/siteConfig';

export interface SavedFileInfo {
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File, subFolder?: string): Promise<SavedFileInfo>;
  getFileStream(storagePath: string): { stream: Readable; size: number; mimeType: string } | null;
  deleteFile(storagePath: string): Promise<boolean>;
  fileExists(storagePath: string): boolean;
  saveBuffer(buffer: Buffer, fileName: string, mimeType: string, subFolder?: string): Promise<SavedFileInfo>;
  saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer): Promise<void>;
  getExistingChunks(uploadId: string): number[];
  assembleChunks(uploadId: string, totalChunks: number, originalName: string, mimeType: string, subFolder?: string): Promise<SavedFileInfo>;
  cleanChunks(uploadId: string): void;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    const isServerless = Boolean(
      process.env.NETLIFY || 
      process.env.AWS_LAMBDA_FUNCTION_NAME || 
      process.env.LAMBDA_TASK_ROOT
    );
    this.baseDir = customBaseDir || process.env.STORAGE_DIR || (isServerless ? '/tmp/uploads' : path.join(process.cwd(), 'data', 'uploads'));
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
      fs.existsSync(path.join(process.cwd(), 'data', 'uploads', 'files', path.basename(storagePath)))
    );
  }

  public async saveFile(file: Express.Multer.File, subFolder: string = 'files'): Promise<SavedFileInfo> {
    const targetFolder = path.join(this.baseDir, subFolder);
    this.ensureDirectory(targetFolder);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    const targetPath = path.join(targetFolder, uniqueName);

    // Write file to target path
    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, targetPath);
      // Clean up multer tmp file if needed
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore
      }
    }

    const relativePath = path.join(subFolder, uniqueName);
    return {
      fileName: file.originalname,
      storagePath: relativePath,
      fileSize: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      publicUrl: `/api/public/files/raw/${relativePath.replace(/\\/g, '/')}`
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
    return {
      fileName: originalName,
      storagePath: relativePath,
      fileSize: buffer.length,
      mimeType,
      publicUrl: `/api/public/files/raw/${relativePath.replace(/\\/g, '/')}`
    };
  }

  public getFileStream(storagePath: string): { stream: Readable; size: number; mimeType: string } | null {
    let fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
    if (!fs.existsSync(fullPath)) {
      const alt1 = path.join(process.cwd(), 'data', 'uploads', storagePath);
      const alt2 = path.join(process.cwd(), 'data', 'uploads', 'files', path.basename(storagePath));
      const alt3 = path.join(process.cwd(), 'data', 'uploads', 'thumbnails', path.basename(storagePath));
      if (fs.existsSync(alt1)) {
        fullPath = alt1;
      } else if (fs.existsSync(alt2)) {
        fullPath = alt2;
      } else if (fs.existsSync(alt3)) {
        fullPath = alt3;
      } else {
        return null;
      }
    }

    const stat = fs.statSync(fullPath);
    const stream = fs.createReadStream(fullPath);
    
    // Guess mime-type by extension if needed
    const ext = path.extname(fullPath).toLowerCase();
    const matched = siteConfig.allowedFileTypes.find(t => t.extension === ext);
    const mimeType = matched?.mime || 'application/octet-stream';

    return { stream, size: stat.size, mimeType };
  }

  public async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Failed to delete file at ${storagePath}`, err);
      return false;
    }
  }

  public getFullPath(storagePath: string): string {
    return path.isAbsolute(storagePath) ? storagePath : path.join(this.baseDir, storagePath);
  }

  public async saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer): Promise<void> {
    const sanitizedId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.join(this.baseDir, '_chunks', sanitizedId);
    this.ensureDirectory(chunkDir);
    const chunkFile = path.join(chunkDir, `part_${chunkIndex}`);
    fs.writeFileSync(chunkFile, buffer);
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

    const writeStream = fs.createWriteStream(targetPath);
    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join(chunkDir, `part_${i}`);
      if (!fs.existsSync(partPath)) {
        writeStream.close();
        try { if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath); } catch {}
        throw new Error(`Upload payload chunk ${i} of ${totalChunks} was not found on storage.`);
      }
      const partBuf = fs.readFileSync(partPath);
      writeStream.write(partBuf);
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end((err?: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const stat = fs.statSync(targetPath);

    // Clean up temporary chunk pieces
    try {
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('Notice: could not clean chunk directory:', e);
    }

    const relativePath = path.join(subFolder, uniqueName);
    return {
      fileName: originalName,
      storagePath: relativePath,
      fileSize: stat.size,
      mimeType: mimeType || 'application/octet-stream',
      publicUrl: `/api/public/files/raw/${relativePath.replace(/\\/g, '/')}`
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
