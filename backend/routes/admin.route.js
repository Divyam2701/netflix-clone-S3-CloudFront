import express from 'express';
import multer from 'multer';
import { adminLogin, adminCheck, adminLogout, adminUpload } from '../controllers/admin.controller.js';
import { adminProtectedRoute } from '../middlewares/adminProtectedRoute.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', adminLogin);
router.get('/check', adminProtectedRoute, adminCheck);
router.post('/logout', adminProtectedRoute, adminLogout);
router.post('/upload', adminProtectedRoute, upload.single('video'), adminUpload);

export default router;
