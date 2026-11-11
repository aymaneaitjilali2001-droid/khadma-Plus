import express from 'express';
import {
  getApplicationsForManager,
  updateApplicationStatus,
  evaluateApplication,
} from '../controllers/managerApplicationsController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes suivantes sont réservées aux managers authentifiés.
router.use(requireAuth, requireRole('manager'));

router.get('/', getApplicationsForManager);
router.patch('/:id/statut', updateApplicationStatus);
router.post('/:id/evaluate', evaluateApplication);

export default router;
