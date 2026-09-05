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
}

export const storage = new LocalStorageProvider();
