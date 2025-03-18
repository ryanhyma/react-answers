import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

const JWT_SECRET = process.env.JWT_SECRET_KEY;

export const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyAuth = async (req, res) => {
  try {
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return false;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return false;
    }

    req.user = decoded;
    return true;
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
    return false;
  }
  
};

const verifyAdmin = (req, res) => {
  
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return false;
  }
  return true;
};

export const withProtection = (handler, ...middleware) => {
  return async (req, res) => {
    for (const mw of middleware) {
      const result = await mw(req, res);
      if (!result) return;
    }
    return handler(req, res);
  };
};

export const authMiddleware = verifyAuth;
export const adminMiddleware = verifyAdmin;