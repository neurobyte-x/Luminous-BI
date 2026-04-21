import re
from typing import Any


_ALLOWED_CHART_TYPES = {"line", "bar", "pie"}
_UNSAFE_PROMPT_PATTERN = re.compile(
    r"(__|import\s+os|import\s+sys|subprocess|system\(|exec\(|eval\(|open\(|write\(|read\(|drop\s+table|delete\s+from)",
    re.IGNORECASE,
)


def validate_pandas_prompt(prompt: str) -> bool:
    if not prompt or not prompt.strip():
        return False

    if len(prompt) > 1000:
        return False

    if _UNSAFE_PROMPT_PATTERN.search(prompt):
        return False

    return True


def extract_first_json_object(text: str) -> str:
    if not text:
        return ""

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    start = cleaned.find("{")
    if start == -1:
        return ""

    depth = 0
    for index in range(start, len(cleaned)):
        char = cleaned[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return cleaned[start : index + 1]

    return ""


def _safe_default_chart(columns: list[str]) -> dict[str, str]:
    if not columns:
        return {"type": "bar", "x": "index", "y": "value"}

    x = columns[0]
    y = columns[1] if len(columns) > 1 else columns[0]
    return {"type": "bar", "x": x, "y": y}


def validate_llm_payload(
    payload: dict[str, Any],
    columns: list[str],
    query: str,
) -> dict[str, Any]:
    summary = str(payload.get("summary", "")).strip() or "No summary generated."

    raw_insights = payload.get("insights", [])
    insights = [str(item).strip() for item in raw_insights if str(item).strip()][:5]
    if not insights:
        insights = ["No major insights were returned by the model."]

    chart_candidates = payload.get("charts", [])
    validated_charts: list[dict[str, str]] = []
    for chart in chart_candidates[:3]:
        if not isinstance(chart, dict):
            continue

        chart_type = str(chart.get("type", "")).strip().lower()
        x_col = str(chart.get("x", "")).strip()
        y_col = str(chart.get("y", "")).strip()
        group_by = str(chart.get("group_by", "")).strip() or None

        if chart_type not in _ALLOWED_CHART_TYPES:
            continue
        if x_col not in columns or y_col not in columns:
            continue
        if group_by is not None and group_by not in columns:
            group_by = None

        validated_chart = {"type": chart_type, "x": x_col, "y": y_col}
        if group_by:
            validated_chart["group_by"] = group_by
        validated_charts.append(validated_chart)

    if not validated_charts:
        validated_charts = [_safe_default_chart(columns)]

    pandas_prompt = str(payload.get("pandas_prompt", "")).strip()
    if not validate_pandas_prompt(pandas_prompt):
        pandas_prompt = f"Return a compact table (max 200 rows) to answer this query: {query}"

    return {
        "summary": summary,
        "insights": insights,
        "charts": validated_charts,
        "pandas_prompt": pandas_prompt,
    }


def build_fallback_analysis(query: str, columns: list[str]) -> dict[str, Any]:
    return {
        "summary": "Model response unavailable. Returning a safe fallback analysis.",
        "insights": [
            "Using deterministic fallback because the LLM response failed validation.",
            "You can retry the same query after confirming your Gemini API key.",
        ],
        "charts": [_safe_default_chart(columns)],
        "pandas_prompt": f"Return a compact table (max 200 rows) to answer this query: {query}",
    }
