import json
import logging

import google.generativeai as genai

from config import settings
from utils.validator import (
    build_fallback_analysis,
    extract_first_json_object,
    validate_llm_payload,
)


logger = logging.getLogger(__name__)


def _build_prompt(query: str, columns: list[str]) -> str:
    column_list = ", ".join(columns)
    return f"""
You are an analytics assistant for a conversational BI dashboard.

Dataset columns:
[{column_list}]

User query:
{query}

Return STRICT JSON only with this exact schema:
{{
  "summary": "short answer",
  "insights": ["insight 1", "insight 2"],
  "charts": [
    {{
      "type": "line | bar | pie",
      "x": "column_name",
      "y": "column_name",
      "group_by": "optional_column"
    }}
  ],
  "pandas_prompt": "clear and safe pandas instruction"
}}

Rules:
1) No markdown.
2) No text outside JSON.
3) Use dataset column names exactly.
4) Max 3 charts.
5) pandas_prompt must not include OS/system calls.
""".strip()


def generate_analysis(query: str, columns: list[str]) -> dict:
    if not settings.gemini_api_key:
        return build_fallback_analysis(query, columns)

    prompt = _build_prompt(query=query, columns=columns)

    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content(prompt)

        response_text = getattr(response, "text", "") or ""
        json_text = extract_first_json_object(response_text)
        payload = json.loads(json_text)

        return validate_llm_payload(payload=payload, columns=columns, query=query)
    except Exception:
        logger.exception("Gemini analysis failed, returning fallback response.")
        return build_fallback_analysis(query, columns)
