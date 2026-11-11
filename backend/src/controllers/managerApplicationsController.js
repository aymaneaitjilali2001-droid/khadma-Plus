import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pool from '../config/db.js';
import { processResumeWithFlask } from '../utils/flaskAiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Retourne toutes les candidatures visibles par le manager. */
async function getApplicationsForManager(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, j.title AS job_title, j.company AS job_company
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.manager_id = ?
       ORDER BY a.applied_at DESC`
      , [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erreur getApplicationsForManager:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des candidatures' });
  }
}

/** Modifie le statut d'une candidature. */
async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['Pas encore traité', 'Accepté', 'Refusé'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const [rows] = await pool.query(
      `SELECT a.id
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = ? AND j.manager_id = ?`,
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Candidature introuvable' });
    }

    await pool.query(
      `UPDATE applications
       SET statut = ?
       WHERE id = ? AND job_id IN (SELECT id FROM jobs WHERE manager_id = ?)`,
      [statut, id, req.user.id]
    );
    res.json({ message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Erreur updateApplicationStatus:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
}

/** Évalue une candidature avec le pipeline d'analyse IA. */
async function evaluateApplication(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT a.id, a.resume_path, j.description
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = ? AND j.manager_id = ?`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Candidature introuvable' });
    }

    const application = rows[0];
    if (!application.resume_path) {
      return res.status(400).json({ error: 'Cette candidature ne contient pas de CV.' });
    }
    if (!application.resume_path.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        error: "L'analyse IA ne supporte que les CV au format PDF.",
      });
    }
    if (!application.description) {
      return res.status(400).json({
        error: "L'offre associée n'a pas de description à comparer.",
      });
    }

    const pdfPath = path.join(__dirname, '../../uploads', path.basename(application.resume_path));
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        error: 'Le fichier CV associé à cette candidature est introuvable. Le candidat doit envoyer son CV à nouveau.',
      });
    }
    const { evaluation } = await processResumeWithFlask(pdfPath, application.description);

    await pool.query(
      `UPDATE applications
       SET ai_score = ?, ai_decision = ?, ai_reasons = ?, ai_summary = ?, ai_evaluated_at = NOW()
       WHERE id = ?`,
      [evaluation.score, evaluation.decision, JSON.stringify(evaluation.reasons), evaluation.summary, id]
    );

    res.json({
      score: evaluation.score,
      accepted: evaluation.decision,
      reasons: evaluation.reasons,
      status: evaluation.status,
      summary: evaluation.summary,
    });
  } catch (error) {
    console.error('Erreur evaluateApplication:', error);
    res.status(500).json({ error: "Erreur lors de l'analyse IA de la candidature" });
  }
}

export {
  getApplicationsForManager,
  updateApplicationStatus,
  evaluateApplication,
};
