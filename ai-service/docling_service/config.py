import os

from openai import OpenAI


REQUIRED_RESUME_FIELDS = [
    'candidateName', 'email', 'phone', 'technicalSkills',
    'softSkills', 'experience', 'education', 'projects', 'certifications',
]

REQUIRED_EVALUATION_FIELDS = [
    'score', 'matchedSkills', 'missingSkills', 'strengths',
    'weaknesses', 'summary', 'recommendation', 'decision', 'status', 'reasons',
]


def get_openai_client():
    options = {
        'api_key': os.getenv('OPENAI_API_KEY'),
        'timeout': float(os.getenv('OPENAI_REQUEST_TIMEOUT_MS', '60000')) / 1000,
        'max_retries': int(os.getenv('OPENAI_MAX_RETRIES', '2')),
    }
    if os.getenv('OPENAI_BASE_URL'):
        options['base_url'] = os.getenv('OPENAI_BASE_URL')
    return OpenAI(**options)


def get_openai_model():
    return os.getenv('OPENAI_MODEL', 'gpt-4o-mini')


def get_internal_service_token():
    return os.getenv('INTERNAL_SERVICE_TOKEN', '')
