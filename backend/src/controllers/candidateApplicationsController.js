import pool from '../config/db.js';

/**
 * Reçoit et enregistre une candidature envoyée par un candidat.
 *
 * Le candidat doit être authentifié et posséder le rôle `candidate`.
 * Le CV est déjà enregistré par Multer avant l'exécution de cette fonction.
 */
async function createApplication(req, res) {
  try {
    const {
      job_id,
      nom,
      prenom,
      email,
      telephone,
      whatsapp,
      linkedin,
      portfolio,
      message,
    } = req.body;

    if (!job_id || !nom || !prenom || !email || !telephone) {
      return res.status(400).json({
        error: 'job_id, nom, prenom, email et telephone sont requis',
      });
    }

    const [jobs] = await pool.query('SELECT id FROM jobs WHERE id = ?', [job_id]);
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Offre introuvable' });
    }

    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;
    const candidateId = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO applications
        (job_id, candidate_id, nom, prenom, email, telephone, whatsapp, linkedin, portfolio, message, resume_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        job_id,
        candidateId,
        nom,
        prenom,
        email,
        telephone,
        whatsapp === 'true' || whatsapp === true,
        linkedin || null,
        portfolio || null,
        message || null,
        resumePath,
      ]
    );

    res.status(201).json({
      message: 'Candidature envoyée',
      applicationId: result.insertId,
    });
  } catch (error) {
    console.error('Erreur createApplication:', error);
    res.status(500).json({ error: "Impossible d'envoyer la candidature" });
  }
}

export { createApplication };
