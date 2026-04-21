from typing import Any

import pandas as pd


_ALLOWED_CHART_TYPES = {"line", "bar", "pie"}


def _fallback_chart(dataframe: pd.DataFrame) -> dict[str, str]:
    columns = list(dataframe.columns)
    numeric_columns = [
        column for column in columns if pd.api.types.is_numeric_dtype(dataframe[column])
    ]

    if not columns:
        return {"type": "bar", "x": "index", "y": "value"}

    x = columns[0]
    y = numeric_columns[0] if numeric_columns else (columns[1] if len(columns) > 1 else columns[0])
    return {"type": "bar", "x": x, "y": y}


def validate_charts(charts: list[dict[str, Any]], dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    columns = set(dataframe.columns.tolist())
    validated: list[dict[str, Any]] = []

    for chart in (charts or [])[:3]:
        if not isinstance(chart, dict):
            continue

        chart_type = str(chart.get("type", "")).lower().strip()
        x_axis = str(chart.get("x", "")).strip()
        y_axis = str(chart.get("y", "")).strip()
        group_by = chart.get("group_by")

        if chart_type not in _ALLOWED_CHART_TYPES:
            continue
        if x_axis not in columns or y_axis not in columns:
            continue
        if group_by is not None and str(group_by).strip() not in columns:
            group_by = None

        validated_chart = {"type": chart_type, "x": x_axis, "y": y_axis}
        if group_by:
            validated_chart["group_by"] = str(group_by).strip()

        validated.append(validated_chart)

    if not validated:
        return [_fallback_chart(dataframe)]

    return validated
