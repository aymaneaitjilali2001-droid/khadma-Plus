import express from 'express';
const router = express.Router();

import * as offersController from '../controllers/offersController.js';
import * as authMiddleware from '../middleware/authMiddleware.js';

// ============================
// PUBLIC ROUTES
// ============================

// Recherche (doit être avant "/:id")
router.get("/search", offersController.searchOffers);

// Liste des offres
router.get("/", offersController.getAllOffers);
router.get("/mine", authMiddleware.requireAuth, authMiddleware.requireRole('manager'), offersController.getManagerOffers);

// Détail d'une offre
router.get("/:id", offersController.getOfferById);

// ============================
// MANAGER ROUTES
// ============================

// Créer une offre
router.post("/", authMiddleware.requireAuth, authMiddleware.requireRole('manager'), offersController.createOffer);

// Modifier une offre
router.put("/:id", authMiddleware.requireAuth, authMiddleware.requireRole('manager'), offersController.updateOffer);

// Supprimer une offre
router.delete("/:id", authMiddleware.requireAuth, authMiddleware.requireRole('manager'), offersController.deleteOffer);

export default router;
