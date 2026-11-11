import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_FLASK_URL = 'http://127.0.0.1:8000/process';

class FlaskAiClientError extends Error {
  constructor(message, code = 'FLASK_AI_SERVICE_ERROR') {
    super(message);
    this.name = 'FlaskAiClientError';
    this.code = code;
  }
}

/** Envoie un CV au microservice Flask qui contient toute la logique IA. */
async function processResumeWithFlask(pdfPath, jobDescription) {
  const absolutePdfPath = path.resolve(pdfPath);

  let fileInfo;
  try {
    fileInfo = await fs.stat(absolutePdfPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new FlaskAiClientError(
        `Le fichier PDF est introuvable : ${absolutePdfPath}`,
        'PDF_NOT_FOUND'
      );
    }
    throw new FlaskAiClientError(
      `Impossible de vérifier le fichier PDF : ${error.message}`,
      'PDF_ACCESS_ERROR'
    );
  }

  if (!fileInfo.isFile()) {
    throw new FlaskAiClientError(
      `Le chemin indiqué n'est pas un fichier : ${absolutePdfPath}`,
      'PDF_NOT_A_FILE'
    );
  }

  if (fileInfo.size === 0) {
    throw new FlaskAiClientError(
      'Le fichier PDF est vide.',
      'PDF_EMPTY'
    );
  }

  if (path.extname(absolutePdfPath).toLowerCase() !== '.pdf') {
    throw new FlaskAiClientError(
      'Le fichier doit être au format PDF.',
      'INVALID_PDF_EXTENSION'
    );
  }

  const fileBuffer = await fs.readFile(absolutePdfPath);
  const formData = new FormData();

  formData.append(
    'file',
    new Blob([fileBuffer], { type: 'application/pdf' }),
    path.basename(absolutePdfPath)
  );
  formData.append('job_description', jobDescription || '');

  let response;
  try {
    response = await fetch(process.env.FLASK_AI_URL || DEFAULT_FLASK_URL, {
      method: 'POST',
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
      },
      body: formData,
    });
  } catch (error) {
    throw new FlaskAiClientError(
      `Impossible de joindre le service Flask IA : ${error.message}`,
      'FLASK_SERVICE_UNAVAILABLE'
    );
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new FlaskAiClientError(
      result?.error || `Service Flask HTTP ${response.status}`,
      'FLASK_PROCESSING_FAILED'
    );
  }

  if (!result?.resume || !result?.evaluation) {
    throw new FlaskAiClientError(
      'Réponse Flask IA incomplète.',
      'FLASK_INVALID_OUTPUT'
    );
  }

  return { resume: result.resume, evaluation: result.evaluation };
}

export { processResumeWithFlask, FlaskAiClientError };
