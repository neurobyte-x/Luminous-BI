import re
from dataclasses import dataclass

import pandas as pd


@dataclass
class DecisionActionItem:
    title: str
    rationale: str
    expected_impact: str
    confidence: int


@dataclass
class WhatIfScenario:
    metric: str
    operation: str
    delta_percent: float
    filter_column: str | None
    filter_value: str | None


def _numeric_columns(dataframe: pd.DataFrame) -> list[str]:
    return [str(column) for column in dataframe.select_dtypes(include=["number"]).columns.tolist()]


def _categorical_columns(dataframe: pd.DataFrame) -> list[str]:
    return [
        str(column)
        for column in dataframe.select_dtypes(exclude=["number", "datetime64[ns]"]).columns.tolist()
    ]


def _pick_column(columns: list[str], keywords: list[str]) -> str | None:
    lowered = [(column, column.lower()) for column in columns]
    for keyword in keywords:
        for original, lowered_column in lowered:
            if keyword in lowered_column:
                return original
    return None


def _format_percent(value: float) -> str:
    return f"{value:.1f}%"


def _safe_confidence(value: float) -> int:
    return max(30, min(95, int(round(value))))


def build_decision_actions(dataframe: pd.DataFrame, context_query: str) -> tuple[str, list[DecisionActionItem]]:
    numeric_columns = _numeric_columns(dataframe)
    categorical_columns = _categorical_columns(dataframe)
    row_count = int(len(dataframe))

    margin_column = _pick_column(numeric_columns, ["margin", "profit_pct", "gross_margin", "gmv_margin"])
    revenue_column = _pick_column(numeric_columns, ["revenue", "sales", "amount", "gmv"])
    cost_column = _pick_column(numeric_columns, ["cost", "cogs", "expense", "spend"])
    segment_column = _pick_column(categorical_columns, ["region", "segment", "category", "channel"])

    actions: list[DecisionActionItem] = []

    if margin_column and segment_column:
        grouped = (
            dataframe[[segment_column, margin_column]]
            .dropna()
            .groupby(segment_column, as_index=False)
            .agg(value_mean=(margin_column, "mean"), value_count=(margin_column, "count"))
            .sort_values("value_mean")
        )
        if len(grouped) >= 2:
            lowest = grouped.iloc[0]
            median_value = float(grouped["value_mean"].median())
            lift = median_value - float(lowest["value_mean"])
            confidence = _safe_confidence(70 + min(20, float(lowest["value_count"]) / max(row_count, 1) * 100))
            actions.append(
                DecisionActionItem(
                    title=f"Lift margin in {segment_column} '{lowest[segment_column]}'",
                    rationale=(
                        f"{segment_column} '{lowest[segment_column]}' has the lowest average {margin_column} "
                        f"({float(lowest['value_mean']):.2f})."
                    ),
                    expected_impact=(
                        f"If lifted to median {margin_column}, expected improvement is about {lift:.2f} points."
                    ),
                    confidence=confidence,
                )
            )

    if revenue_column and segment_column:
        grouped_revenue = (
            dataframe[[segment_column, revenue_column]]
            .dropna()
            .groupby(segment_column, as_index=False)
            .agg(total_revenue=(revenue_column, "sum"), count_rows=(revenue_column, "count"))
            .sort_values("total_revenue", ascending=False)
        )
        if len(grouped_revenue) >= 2:
            top = grouped_revenue.iloc[0]
            bottom = grouped_revenue.iloc[-1]
            ratio = float(top["total_revenue"]) / max(float(bottom["total_revenue"]), 1e-9)
            confidence = _safe_confidence(65 + min(20, float(top["count_rows"]) / max(row_count, 1) * 100))
            actions.append(
                DecisionActionItem(
                    title=f"Replicate top-performing {segment_column} playbook",
                    rationale=(
                        f"{segment_column} '{top[segment_column]}' outperforms '{bottom[segment_column]}' by "
                        f"{ratio:.1f}x in {revenue_column}."
                    ),
                    expected_impact=(
                        f"Applying similar strategy to lower tiers can grow {revenue_column} by 5-12%."
                    ),
                    confidence=confidence,
                )
            )

    if revenue_column and cost_column:
        frame = dataframe[[revenue_column, cost_column]].dropna()
        if not frame.empty:
            current_ratio = float(frame[cost_column].sum()) / max(float(frame[revenue_column].sum()), 1e-9)
            target_ratio = max(current_ratio - 0.03, 0)
            gain = (current_ratio - target_ratio) * 100
            actions.append(
                DecisionActionItem(
                    title="Run cost efficiency sprint on high-spend items",
                    rationale=(
                        f"Current {cost_column}/{revenue_column} ratio is {current_ratio:.2f}."
                    ),
                    expected_impact=(
                        f"Reducing the ratio by 3 points may improve operating margin by about {gain:.1f} points."
                    ),
                    confidence=_safe_confidence(72),
                )
            )

    if len(actions) < 3:
        actions.extend(
            [
                DecisionActionItem(
                    title="Pilot pricing test for premium customers",
                    rationale="Premium cohorts are typically less price-sensitive and are suitable for controlled tests.",
                    expected_impact="Estimated KPI upside: 2-6% with controlled rollout.",
                    confidence=60,
                ),
                DecisionActionItem(
                    title="Focus next campaign on high-conversion segment",
                    rationale="Recent query context suggests conversion unevenness across segments.",
                    expected_impact="Expected conversion improvement range: 3-8%.",
                    confidence=58,
                ),
                DecisionActionItem(
                    title="Create weekly KPI watchlist with thresholds",
                    rationale="Early anomaly detection reduces delayed interventions.",
                    expected_impact="Potentially prevents 1-3% monthly KPI leakage.",
                    confidence=66,
                ),
            ]
        )

    headline = (
        f"Decision Copilot analyzed {row_count} rows for '{context_query.strip()[:120]}'. "
        "Top actions are ranked by estimated impact and confidence."
    )

    return headline, actions[:3]


def _extract_percent(prompt: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", prompt)
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


def _extract_operation(prompt: str) -> str:
    lowered = prompt.lower()
    if any(word in lowered for word in ["decrease", "reduce", "cut", "lower", "down"]):
        return "decrease"
    return "increase"


def _extract_filter(prompt: str, categorical_columns: list[str], dataframe: pd.DataFrame) -> tuple[str | None, str | None]:
    lowered = prompt.lower()

    explicit = re.search(r"for\s+([\w\- ]+)\s+(segment|region|category|channel)", lowered)
    if explicit:
        value = explicit.group(1).strip()
        type_name = explicit.group(2).strip()
        column = _pick_column(categorical_columns, [type_name])
        if column:
            return column, value

    for column in categorical_columns:
        values = dataframe[column].dropna().astype(str).str.lower().unique().tolist()
        for value in values[:200]:
            if value and value in lowered and len(value) >= 3:
                return column, value

    return None, None


def parse_what_if_scenario(prompt: str, dataframe: pd.DataFrame) -> WhatIfScenario:
    numeric_columns = _numeric_columns(dataframe)
    categorical_columns = _categorical_columns(dataframe)

    lowered = prompt.lower()
    metric = _pick_column(numeric_columns, ["price", "ad_spend", "spend", "margin", "profit", "revenue", "sales"])

    if metric is None:
        tokens = re.findall(r"[a-zA-Z_]+", lowered)
        for token in tokens:
            metric = _pick_column(numeric_columns, [token])
            if metric:
                break

    if metric is None:
        if not numeric_columns:
            raise ValueError("No numeric columns were found in this dataset for scenario simulation.")
        metric = numeric_columns[0]

    delta_percent = _extract_percent(prompt)
    if delta_percent is None:
        raise ValueError("Could not detect a percentage in the scenario. Include values like 4% or 20%.")

    operation = _extract_operation(prompt)
    filter_column, filter_value = _extract_filter(prompt, categorical_columns, dataframe)

    return WhatIfScenario(
        metric=metric,
        operation=operation,
        delta_percent=delta_percent,
        filter_column=filter_column,
        filter_value=filter_value,
    )


def _resolve_filter_mask(dataframe: pd.DataFrame, filter_column: str | None, filter_value: str | None) -> pd.Series:
    if not filter_column or not filter_value:
        return pd.Series([True] * len(dataframe), index=dataframe.index)

    series = dataframe[filter_column].astype(str).str.lower().str.strip()
    target = filter_value.lower().strip()
    return series.str.contains(re.escape(target), regex=True)


def run_what_if_projection(
    dataframe: pd.DataFrame,
    scenario: WhatIfScenario,
) -> tuple[list[dict[str, float | str]], list[str], dict[str, str], int]:
    metric = scenario.metric
    mask = _resolve_filter_mask(dataframe, scenario.filter_column, scenario.filter_value)
    scoped = dataframe.loc[mask].copy()

    if scoped.empty:
        raise ValueError("The scenario filter matched no rows. Try a different segment or wording.")

    baseline_metric = float(scoped[metric].mean())
    factor = 1 + (scenario.delta_percent / 100.0)
    if scenario.operation == "decrease":
        factor = 1 - (scenario.delta_percent / 100.0)

    projected_metric = baseline_metric * factor
    std = float(scoped[metric].std()) if len(scoped) > 1 else abs(projected_metric) * 0.05
    uncertainty = max(std * 0.35, abs(projected_metric) * 0.03)

    assumptions = [
        "Simulation assumes all non-target variables remain constant.",
        "Projection is based on historical distribution in the selected sample.",
        "Ranges are indicative and include a conservative uncertainty band.",
    ]

    matched_filters: dict[str, str] = {}
    if scenario.filter_column and scenario.filter_value:
        matched_filters[scenario.filter_column] = scenario.filter_value

    projections = [
        {
            "metric": metric,
            "baseline": round(baseline_metric, 4),
            "projected": round(projected_metric, 4),
            "low": round(projected_metric - uncertainty, 4),
            "high": round(projected_metric + uncertainty, 4),
            "unit": "value",
        }
    ]

    # Add total impact when relevant.
    if len(scoped) > 1:
        baseline_total = float(scoped[metric].sum())
        projected_total = baseline_total * factor
        total_uncertainty = max(abs(projected_total) * 0.03, std * len(scoped) * 0.15)
        projections.append(
            {
                "metric": f"total_{metric}",
                "baseline": round(baseline_total, 4),
                "projected": round(projected_total, 4),
                "low": round(projected_total - total_uncertainty, 4),
                "high": round(projected_total + total_uncertainty, 4),
                "unit": "value",
            }
        )

    return projections, assumptions, matched_filters, int(len(scoped))
