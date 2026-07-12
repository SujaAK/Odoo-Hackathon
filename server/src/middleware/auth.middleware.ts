import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../lib/firebase-admin';
import prisma from '../lib/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Try standard JWT first
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
    return;
  } catch (error) {
    // If standard JWT fails, check if it's a Firebase ID token
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      
      if (!decodedFirebase.email) {
        res.status(401).json({ error: 'Invalid Firebase token: email missing.' });
        return;
      }

      // Look up user in local DB by email
      const user = await prisma.user.findUnique({
        where: { email: decodedFirebase.email }
      });
      
      if (!user) {
        res.status(401).json({ error: 'Firebase user not registered in local database.' });
        return;
      }
      
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      next();
      return;
    } catch (fbError) {
      res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }
};
