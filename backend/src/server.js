import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { processResumeWithFlask } from './utils/flaskAiClient.js';

import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import offersRoutes from './routes/offersRoutes.js';
import candidateApplicationsRoutes from './routes/candidateApplicationsRoutes.js';
import managerApplicationsRoutes from './routes/managerApplicationsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use("/api/offers", offersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/candidate/applications', candidateApplicationsRoutes);
app.use('/api/manager/applications', managerApplicationsRoutes);

app.get('/api/pdf-extract', async (req, res) => {
  try {
    const jobDescriptionFromMySQL = `Sports Program & Events Coordinator

We are seeking a Sports Program and Events Coordinator to manage athletic programs and oversee large-scale sporting events for our organization.

Responsibilities:
- Coordinate and supervise sporting events from planning through execution
- Manage relationships with referees, coaches, and athletic staff
- Track and analyze player/team performance data
- Lead volunteer and staff teams during marathons and tournaments
- Develop digital tools and dashboards to modernize event operations
- Manage budgets and vendor contracts for sports facilities
- Oversee certified officiating staff across multiple sporting disciplines
- Design and deliver athlete training and performance programs

Requirements:
- Bachelor's degree in Sports Science, Physical Education, or related field
- 3+ years managing large-scale sporting or community events
- Experience with performance analysis tools and player tracking software
- Certified referee/official credentials in at least one sport
- Strong budgeting and vendor negotiation skills
- Experience with CRM or event management software (e.g., Cvent, Eventbrite)
- Bilingual (French/Arabic/English) communication skills
- Bonus: experience in international multi-sport event logistics (Olympics, continental championships)`;

    // Replace with actual job description fetched from MySQL
    const result = await processResumeWithFlask('uploads/CV_ZAIDAHMEDYASSINE.pdf', jobDescriptionFromMySQL);
    res.json({ status: 'ok', result });
  } catch (error) {
    console.error('Error extracting PDF:', error);
    res.status(500).json({ error: 'Failed to extract PDF' });
  }
});

const PORT = process.env.PORT || 5000;

pool.query('SELECT 1')
  .then(() => {
    console.log('Connexion PostgreSQL OK');
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Impossible de se connecter à MySQL:', err.message);
    process.exit(1);
  });
