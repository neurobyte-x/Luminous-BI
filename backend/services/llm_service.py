import json
import logging

from openai import OpenAI

from config import settings
from utils.validator import (
    build_fallback_analysis,
    extract_first_json_object,
    validate_llm_payload,
)


logger = logging.getLogger(__name__)


def _parse_llm_json(text: str) -> dict:
    json_text = extract_first_json_object(text or "")
    if not json_text:
        raise ValueError("LLM did not return a JSON object.")
    parsed = json.loads(json_text)
    if not isinstance(parsed, dict):
        raise ValueError("LLM JSON payload is not an object.")
    return parsed


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
  "sql_query": "SQL query that approximates the natural language question",
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
6) sql_query must be valid SQL text and should reference a table named uploaded_data.
""".strip()


def _call_gemini(prompt: str) -> dict:
    import google.generativeai as genai

    if not settings.gemini_api_key:
        raise RuntimeError("Gemini API key is missing.")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)
    response = model.generate_content(prompt)
    response_text = getattr(response, "text", "") or ""
    return _parse_llm_json(response_text)


def _call_openrouter(prompt: str) -> dict:
    if not settings.openrouter_api_key:
        raise RuntimeError("OpenRouter API key is missing.")

    client = OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url.rstrip("/"),
    )

    extra_headers: dict[str, str] = {}
    if settings.openrouter_site_url.strip():
        extra_headers["HTTP-Referer"] = settings.openrouter_site_url.strip()
    if settings.openrouter_app_name.strip():
        extra_headers["X-Title"] = settings.openrouter_app_name.strip()

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        messages=[
            {
                "role": "system",
                "content": "Return strict JSON only. Do not include markdown code fences.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        extra_headers=extra_headers or None,
    )

    choice = response.choices[0] if response.choices else None
    content = ""
    if choice and getattr(choice, "message", None):
        content = getattr(choice.message, "content", "") or ""

    return _parse_llm_json(content)


def _provider_chain() -> list[str]:
    ordered = [settings.llm_primary_provider, settings.llm_fallback_provider]
    normalized: list[str] = []
    seen: set[str] = set()

    for provider in ordered:
        provider_name = (provider or "").strip().lower()
        if not provider_name or provider_name in seen:
            continue
        seen.add(provider_name)
        normalized.append(provider_name)

    return normalized or ["gemini"]


def generate_analysis(query: str, columns: list[str]) -> dict:
    prompt = _build_prompt(query=query, columns=columns)
    for provider in _provider_chain():
        try:
            if provider == "gemini":
                payload = _call_gemini(prompt)
            elif provider == "openrouter":
                payload = _call_openrouter(prompt)
            else:
                logger.warning("Unsupported LLM provider '%s'; skipping.", provider)
                continue

            return validate_llm_payload(payload=payload, columns=columns, query=query)
        except Exception:
            logger.exception("LLM provider '%s' failed. Trying next provider.", provider)

    logger.warning("All LLM providers failed, returning deterministic fallback analysis.")
    return build_fallback_analysis(query, columns)
