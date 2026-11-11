import hmac
from functools import wraps

from flask import Blueprint, jsonify, request

from .candidate_evaluator import evaluate_candidate
from .config import get_internal_service_token
from .resume_extractor import convert_pdf, validate_pdf_filename


api = Blueprint('docling_api', __name__)


def require_internal_token(handler):
    @wraps(handler)
    def secured_handler(*args, **kwargs):
        expected_token = get_internal_service_token()
        received_token = request.headers.get('X-Internal-Token', '')

        if not expected_token or not hmac.compare_digest(received_token, expected_token):
            return jsonify({'error': 'Token interne invalide ou manquant.'}), 401

        return handler(*args, **kwargs)

    return secured_handler


@api.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'docling'})


def get_uploaded_pdf():
    uploaded_file = request.files.get('file')
    if uploaded_file is None or not validate_pdf_filename(uploaded_file.filename):
        return None, (jsonify({'error': 'Un fichier PDF est requis.'}), 400)
    return uploaded_file, None


@api.post('/extract')
@require_internal_token
def extract_pdf():
    uploaded_file, error = get_uploaded_pdf()
    if error:
        return error

    try:
        return jsonify(convert_pdf(uploaded_file))
    except Exception as exception:
        return jsonify({'error': str(exception)}), 500


@api.post('/process')
@require_internal_token
def process_pdf():
    uploaded_file, error = get_uploaded_pdf()
    job_description = request.form.get('job_description', '')

    if error:
        return error
    if not job_description.strip():
        return jsonify({'error': 'La description du poste est requise.'}), 400

    try:
        result = convert_pdf(uploaded_file)
        evaluation = evaluate_candidate(result['resume'], job_description)
        return jsonify({**result, 'evaluation': evaluation})
    except Exception as exception:
        return jsonify({'error': str(exception)}), 500
