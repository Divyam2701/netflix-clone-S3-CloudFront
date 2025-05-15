import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../config/env.config.js';

export const adminProtectedRoute = (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated as admin' });
  try {
    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
    if (decoded.admin) return next();
    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};
