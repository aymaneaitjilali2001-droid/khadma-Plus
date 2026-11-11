import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function findOrCreateUser({ email, password, fullName, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       full_name = EXCLUDED.full_name
     RETURNING id, email, role, full_name`,
    [email, passwordHash, role, fullName]
  );
  return rows[0];
}

async function findOrCreateJob({ managerId, title, company, location, contract, description, status, tags }) {
  const existing = await pool.query(
    'SELECT id FROM jobs WHERE title = $1 AND company = $2 LIMIT 1',
    [title, company]
  );

  let jobId = existing.rows[0]?.id;
  if (!jobId) {
    const { rows } = await pool.query(
      `INSERT INTO jobs (title, company, location, contract, description, manager_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [title, company, location, contract, description, managerId, status]
    );
    jobId = rows[0].id;
  }

  for (const tag of tags) {
    const tagExists = await pool.query(
      'SELECT 1 FROM job_tags WHERE job_id = $1 AND tag = $2 LIMIT 1',
      [jobId, tag]
    );
    if (tagExists.rowCount === 0) {
      await pool.query('INSERT INTO job_tags (job_id, tag) VALUES ($1, $2)', [jobId, tag]);
    }
  }

  return jobId;
}

async function seed() {
  const manager = await findOrCreateUser({
    email: 'manager.demo@example.com',
    password: 'Manager123!',
    fullName: 'Manager Demo',
    role: 'manager',
  });

  const candidate = await findOrCreateUser({
    email: 'candidate.demo@example.com',
    password: 'Candidate123!',
    fullName: 'Candidat Demo',
    role: 'candidate',
  });

  const jobs = [
    {
      title: 'Développeur Fullstack React / Node.js',
      company: 'HirePulse Tech',
      location: 'Casablanca',
      contract: 'CDI',
      description: 'Nous recherchons un développeur fullstack pour construire des produits web modernes avec React, Node.js et PostgreSQL.',
      status: 'published',
      tags: ['React', 'Node.js', 'PostgreSQL'],
    },
    {
      title: 'Product Designer UI/UX',
      company: 'Atlas Digital',
      location: 'Rabat · Hybride',
      contract: 'CDI',
      description: 'Concevez des expériences simples et élégantes en collaboration avec les équipes produit et engineering.',
      status: 'published',
      tags: ['Figma', 'UX Research', 'Design System'],
    },
    {
      title: 'Stage Data Analyst',
      company: 'North Africa Labs',
      location: 'À distance',
      contract: 'Stage',
      description: 'Analysez les données produit et créez des tableaux de bord utiles aux équipes métier.',
      status: 'draft',
      tags: ['SQL', 'Python', 'Dashboard'],
    },
  ];

  const jobIds = [];
  for (const job of jobs) {
    jobIds.push(await findOrCreateJob({ ...job, managerId: manager.id }));
  }

  const applicationExists = await pool.query(
    'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2 LIMIT 1',
    [jobIds[0], candidate.id]
  );

  if (applicationExists.rowCount === 0) {
    await pool.query(
      `INSERT INTO applications
        (job_id, candidate_id, nom, prenom, email, telephone, whatsapp, linkedin, portfolio, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        jobIds[0],
        candidate.id,
        'Demo',
        'Candidat',
        candidate.email,
        '+212600000000',
        false,
        'https://www.linkedin.com',
        'https://github.com',
        'Candidature de démonstration créée par le seed.',
      ]
    );
  }

  console.log('Seed PostgreSQL terminé.');
  console.log('Manager : manager.demo@example.com / Manager123!');
  console.log('Candidat : candidate.demo@example.com / Candidate123!');
  console.log(`Offres disponibles : ${jobIds.length}`);
}

try {
  await seed();
} catch (error) {
  console.error('Erreur pendant le seed PostgreSQL :', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
