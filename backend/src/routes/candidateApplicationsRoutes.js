import express from 'express';
import { createApplication } from '../controllers/candidateApplicationsController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Un candidat doit être connecté pour envoyer une candidature.
router.post('/', requireAuth, requireRole('candidate'), upload.single('cv'), createApplication);

export default router;
