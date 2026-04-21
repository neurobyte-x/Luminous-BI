import json
import logging
from typing import Any

import pandas as pd

from config import settings
from utils.validator import validate_pandas_prompt


logger = logging.getLogger(__name__)
_AVAILABLE_GEMINI_MODELS: set[str] | None = None


def _load_available_gemini_models() -> set[str]:
    global _AVAILABLE_GEMINI_MODELS

    if _AVAILABLE_GEMINI_MODELS is not None:
        return _AVAILABLE_GEMINI_MODELS

    if not settings.gemini_api_key:
        _AVAILABLE_GEMINI_MODELS = set()
        return _AVAILABLE_GEMINI_MODELS

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        _AVAILABLE_GEMINI_MODELS = {
            model.name
            for model in genai.list_models()
            if "generateContent" in getattr(model, "supported_generation_methods", [])
        }
    except Exception:
        _AVAILABLE_GEMINI_MODELS = set()

    return _AVAILABLE_GEMINI_MODELS


def _gemini_model_candidates() -> list[str]:
    configured = (settings.gemini_model or "").strip()
    fallback_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    raw_candidates = [configured, *fallback_models]

    candidates: list[str] = []
    seen: set[str] = set()
    for model_name in raw_candidates:
        if not model_name:
            continue

        variants = [model_name]
        if model_name.startswith("models/"):
            variants.append(model_name.replace("models/", "", 1))
        else:
            variants.append(f"models/{model_name}")

        for variant in variants:
            if variant not in seen:
                seen.add(variant)
                candidates.append(variant)

    available_models = _load_available_gemini_models()
    if available_models:
        filtered = [candidate for candidate in candidates if candidate in available_models]
        if filtered:
            return filtered

    return candidates


def _build_google_gemini_llm() -> Any:
    try:
        from pandasai.llm.google_gemini import GoogleGemini
    except Exception:
        return None

    for model_name in _gemini_model_candidates():
        original_model = getattr(GoogleGemini, "model", "models/gemini-pro")

        # GoogleGemini configures GenerativeModel before kwargs are applied.
        GoogleGemini.model = model_name
        try:
            llm = GoogleGemini(api_key=settings.gemini_api_key)
            return llm
        except Exception:
            continue
        finally:
            GoogleGemini.model = original_model

    return None


def _get_smart_dataframe(dataframe: pd.DataFrame) -> Any:
    try:
        from pandasai import SmartDataframe
    except ModuleNotFoundError:
        logger.warning("pandasai is not installed in the active interpreter. Falling back to pandas.")
        return None

    if settings.gemini_api_key:
        llm = _build_google_gemini_llm()
        if llm is not None:
            return SmartDataframe(dataframe.copy(), config={"llm": llm, "enable_cache": False})

        logger.warning(
            "PandasAI Gemini connector unavailable for configured models. Falling back to pandas output."
        )
        return None

    return SmartDataframe(dataframe.copy())


def execute_pandas_prompt(dataframe: pd.DataFrame, pandas_prompt: str) -> pd.DataFrame:
    if not validate_pandas_prompt(pandas_prompt):
        return dataframe.head(200).copy()

    try:
        smart_df = _get_smart_dataframe(dataframe)
        if smart_df is None:
            return dataframe.head(200).copy()

        result = smart_df.chat(pandas_prompt)

        if isinstance(result, pd.DataFrame):
            return result.head(500).copy()
        if isinstance(result, pd.Series):
            return result.to_frame().head(500).copy()
        if isinstance(result, list):
            return pd.DataFrame(result).head(500).copy()
        if isinstance(result, dict):
            return pd.DataFrame([result]).head(500).copy()
        if isinstance(result, (str, int, float, bool)):
            return pd.DataFrame([{"result": result}])
    except Exception as exc:
        logger.warning("PandasAI execution failed: %s. Returning head of source dataframe.", exc)

    return dataframe.head(200).copy()


def dataframe_to_records(dataframe: pd.DataFrame, max_rows: int = 200) -> list[dict[str, Any]]:
    limited = dataframe.head(max_rows).copy()
    serializable = limited.where(pd.notna(limited), None)
    return json.loads(serializable.to_json(orient="records", date_format="iso"))
