import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { AdminUser } from '../types';

// JWT_SECRET is used exclusively on the server for token signing and verification
const fallbackSecret = crypto.randomBytes(32).toString('hex');
const JWT_SECRET = process.env.JWT_SECRET || fallbackSecret;

export interface AuthenticatedRequest extends Request {
  admin?: AdminUser;
}

export function generateAdminToken(admin: AdminUser): string {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
  } catch (err) {
    return null;
  }
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookie
  if (!token && (req as any).cookies) {
    token = (req as any).cookies.velora_admin_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access. Administrative authentication required.'
    });
  }

  const adminPayload = verifyAdminToken(token);
  if (!adminPayload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.'
    });
  }

  // Ensure admin actually exists in system
  const verifiedAdmin = db.getAdminById(adminPayload.id);
  if (!verifiedAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Administrator record does not exist or has been revoked.'
    });
  }

  req.admin = verifiedAdmin;
  next();
}
