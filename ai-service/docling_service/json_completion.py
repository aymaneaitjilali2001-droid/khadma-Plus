import json

from .config import get_openai_client, get_openai_model


def _parse_json_object(content: str) -> dict:
    """Extract the first valid JSON object, including from a fenced response."""
    decoder = json.JSONDecoder()

    for index, character in enumerate(content):
        if character != '{':
            continue
        try:
            value, _ = decoder.raw_decode(content[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value

    raise ValueError("Le modèle d'IA n'a pas retourné un objet JSON valide.")


def _is_groq_json_validation_error(exception: Exception) -> bool:
    body = getattr(exception, 'body', None)
    error = body.get('error', body) if isinstance(body, dict) else {}
    error_code = error.get('code') if isinstance(error, dict) else None
    return getattr(exception, 'status_code', None) == 400 and error_code == 'json_validate_failed'


def request_json(prompt: str) -> dict:
    """Request JSON mode first, then retry in text mode for Groq JSON failures."""
    client = get_openai_client()
    messages = [
        {
            'role': 'system',
            'content': (
                'Return one valid JSON object only. Do not use Markdown, code fences, '
                'comments, or text before or after the JSON object.'
            ),
        },
        {'role': 'user', 'content': prompt},
    ]

    try:
        response = client.chat.completions.create(
            model=get_openai_model(),
            messages=messages,
            temperature=0,
            response_format={'type': 'json_object'},
        )
        content = response.choices[0].message.content if response.choices else None
        if content:
            return _parse_json_object(content)
    except Exception as exception:
        if not _is_groq_json_validation_error(exception):
            raise

    # Some Groq models fail server-side JSON validation intermittently. The
    # fallback is returned as text and then strictly validated on our side.
    response = client.chat.completions.create(
        model=get_openai_model(),
        messages=[
            *messages,
            {
                'role': 'user',
                'content': 'Generate the requested JSON now. Output exactly one JSON object.',
            },
        ],
        temperature=0,
    )
    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise ValueError("Le modèle d'IA n'a retourné aucune donnée.")

    return _parse_json_object(content)
