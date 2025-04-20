import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { getUserById } from '../services/userService';

// Extended request interface to include decoded user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. No token provided.' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        role: string;
      };
      
      // Attach the decoded user to the request object
      req.user = decoded;
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    return;
  }
  
  next();
};

/**
 * Middleware to check if user has editor role or higher
 */
export const requireEditor = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    res.status(403).json({ message: 'Access denied. Editor privileges required.' });
    return;
  }
  
  next();
}; 