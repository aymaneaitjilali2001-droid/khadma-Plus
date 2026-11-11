import pool from '../config/db.js';

/**
 * Ajoute les tags associés à chaque offre.
 *
 * La table `jobs` contient les informations principales de l'offre,
 * tandis que la table `job_tags` contient une ligne par tag. Cette
 * fonction regroupe donc les tags par `job_id`, puis les ajoute dans
 * une propriété `tags` de chaque objet offre.
 *
 * @param {Array<Object>} offers Liste des offres récupérées depuis MySQL.
 * @returns {Promise<Array<Object>>} Les mêmes offres avec leur tableau `tags`.
 */
async function attachTags(offers) {
    // Aucune requête supplémentaire n'est nécessaire s'il n'y a pas d'offre.
    if (offers.length === 0) return offers;

    // Récupère les identifiants des offres pour filtrer les tags correspondants.
    const ids = offers.map((offer) => offer.id);
    const [tagRows] = await pool.query(
        `SELECT job_id, tag FROM job_tags WHERE job_id IN (${ids.map(() => '?').join(',')})`,
        ids
    );

    // Construit une structure de regroupement : { jobId: [tag1, tag2, ...] }.
    const tagsByJobId = {};
    for (const row of tagRows) {
        if (!tagsByJobId[row.job_id]) tagsByJobId[row.job_id] = [];
        tagsByJobId[row.job_id].push(row.tag);
    }

    // Retourne chaque offre avec ses tags, ou un tableau vide si elle n'en possède pas.
    return offers.map((offer) => ({ ...offer, tags: tagsByJobId[offer.id] || [] }));
}

// ===============================
// GET ALL OFFERS
// GET /api/offers
// ===============================
async function getAllOffers(req, res) {
    try {

        const { status } = req.query;
        const [offers] = status
            ? await pool.query('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC', [status])
            : await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
        const offersWithTags = await attachTags(offers);

        res.status(200).json(offersWithTags);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur lors de la récupération des offres."
        });

    }
};

async function getManagerOffers(req, res) {
    try {
        const [offers] = await pool.query(
            'SELECT * FROM jobs WHERE manager_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json(await attachTags(offers));
    } catch (error) {
        console.error('Erreur getManagerOffers:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de vos offres.' });
    }
}


// ===============================
// GET OFFER BY ID
// GET /api/offers/:id
// ===============================
async function getOfferById(req, res) {

    try {
        const id = req.params.id;

        const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!rows || rows.length === 0) {

            return res.status(404).json({
                message: "Offre introuvable."
            });

        }

        const [withTags] = await attachTags(rows);
        res.status(200).json(withTags);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur."
        });

    }

};


// ===============================
// CREATE OFFER
// POST /api/offers
// ===============================
async function createOffer(req, res) {

    try {

        const { title, company, location, contract, description, status, tags } = req.body;

        const [result] = await pool.query(
            'INSERT INTO jobs (title, company, location, contract, description, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, company, location, contract, description, req.user.id, status || 'draft']
        );

        if (Array.isArray(tags) && tags.length > 0) {
            await pool.query(
                `INSERT INTO job_tags (job_id, tag) VALUES ${tags.map(() => '(?, ?)').join(', ')}`,
                tags.flatMap((tag) => [result.insertId, tag])
            );
        }

        const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [result.insertId]);
        const [withTags] = await attachTags(rows);

        res.status(201).json({
            message: "Offre créée avec succès.",
            offer: withTags
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Impossible de créer l'offre."
        });

    }

};


// ===============================
// UPDATE OFFER
// PUT /api/offers/:id
// ===============================
async function updateOffer(req, res) {

    try {

        const id = req.params.id;

        const [existing] = await pool.query(
            'SELECT * FROM jobs WHERE id = ? AND manager_id = ?',
            [id, req.user.id]
        );

        if (!existing || existing.length === 0) {

            return res.status(404).json({
                message: "Offre introuvable."
            });

        }

        const { title, company, location, contract, description, status, tags } = req.body;

        await pool.query(
            'UPDATE jobs SET title = ?, company = ?, location = ?, contract = ?, description = ?, status = ? WHERE id = ? AND manager_id = ?',
            [title, company, location, contract, description, status, id, req.user.id]
        );

        if (Array.isArray(tags)) {
            await pool.query('DELETE FROM job_tags WHERE job_id = ?', [id]);
            if (tags.length > 0) {
                await pool.query(
                    `INSERT INTO job_tags (job_id, tag) VALUES ${tags.map(() => '(?, ?)').join(', ')}`,
                    tags.flatMap((tag) => [id, tag])
                );
            }
        }

        const [rows] = await pool.query(
            'SELECT * FROM jobs WHERE id = ? AND manager_id = ?',
            [id, req.user.id]
        );
        const [withTags] = await attachTags(rows);

        res.status(200).json({
            message: "Offre mise à jour.",
            offer: withTags
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur lors de la mise à jour."
        });

    }

};


// ===============================
// DELETE OFFER
// DELETE /api/offers/:id
// ===============================
async function deleteOffer(req, res) {

    try {

        const id = req.params.id;

        const [existing] = await pool.query(
            'SELECT * FROM jobs WHERE id = ? AND manager_id = ?',
            [id, req.user.id]
        );

        if (!existing || existing.length === 0) {

            return res.status(404).json({
                message: "Offre introuvable."
            });

        }

        await pool.query('DELETE FROM jobs WHERE id = ? AND manager_id = ?', [id, req.user.id]);

        res.status(200).json({
            message: "Offre supprimée."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur lors de la suppression."
        });

    }

};


// ===============================
// SEARCH OFFERS
// GET /api/offers/search?q=react
// ===============================
async function searchOffers(req, res) {

    try {

        const keyword = `%${req.query.q || ""}%`;

        const [rows] = await pool.query(
            'SELECT * FROM jobs WHERE title LIKE ? OR location LIKE ? OR company LIKE ?',
            [keyword, keyword, keyword]
        );

        res.json(await attachTags(rows));

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur de recherche."
        });

    }

}

export {
    getAllOffers,
    getManagerOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
    searchOffers,
};
