import json

from .config import REQUIRED_EVALUATION_FIELDS
from .json_completion import request_json


def evaluate_candidate(resume: dict, job_description: str) -> dict:
    if not job_description or not job_description.strip():
        raise ValueError('La description du poste est vide.')

    prompt = f'''You are a candidate evaluation engine. Compare the structured resume data with the job description.

RESUME DATA (JSON):
{json.dumps(resume, ensure_ascii=False)}

JOB DESCRIPTION:
{job_description}

Return ONLY valid JSON with exactly this shape:
{{
  "score": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "weaknesses": [],
  "summary": "",
  "recommendation": "",
  "decision": true,
  "status": "Approved",
  "reasons": ["", "", ""]
}}

The score must be an integer from 0 to 100. Reasons must contain exactly 3 specific items.'''

    evaluation = request_json(prompt)
    missing_fields = [field for field in REQUIRED_EVALUATION_FIELDS if field not in evaluation]
    if missing_fields:
        raise ValueError(f'Champs évaluation manquants : {", ".join(missing_fields)}')
    if not isinstance(evaluation['reasons'], list) or len(evaluation['reasons']) != 3:
        raise ValueError('Le champ reasons doit contenir exactement 3 éléments.')

    score = int(max(0, min(100, float(evaluation['score']))))
    if score >= 80:
        decision, status, recommendation = True, 'Approved', 'Highly Recommended'
    elif score >= 60:
        decision, status, recommendation = True, 'Consider', 'Recommended'
    else:
        decision, status, recommendation = False, 'Rejected', 'Not Recommended'

    return {
        **evaluation,
        'score': score,
        'decision': decision,
        'status': status,
        'recommendation': recommendation,
    }
