"""
Utility functions for CSV parsing and AI insight generation.
Uses Pandas for data analysis and OpenRouter API for LLM insights.
"""

import logging
import requests
import pandas as pd
from django.conf import settings

logger = logging.getLogger(__name__)


def _safe_float(val, default=0):
    """Safely convert a value to float, handling NaN/Inf."""
    try:
        f = float(val)
        if pd.isna(f) or f == float('inf') or f == float('-inf'):
            return default
        return f
    except (ValueError, TypeError):
        return default


def parse_csv(file) -> dict:
    """
    Parse an uploaded CSV file using Pandas.
    Returns a dict with columns, row_count, preview_data, and column_stats.

    Raises ValueError if the file cannot be parsed.
    """
    try:
        # Try reading with utf-8 first, fallback to latin-1
        try:
            df = pd.read_csv(file, encoding='utf-8', low_memory=False)
        except UnicodeDecodeError:
            file.seek(0)
            df = pd.read_csv(file, encoding='latin-1', low_memory=False)

        if df.empty:
            raise ValueError("The CSV file is empty or contains no valid data.")

        if len(df.columns) == 0:
            raise ValueError("The CSV file has no columns.")

        # Basic column statistics
        column_stats = {}
        for col in df.columns:
            try:
                stats = {
                    'dtype': str(df[col].dtype),
                    'non_null_count': int(df[col].count()),
                    'null_count': int(df[col].isnull().sum()),
                }

                if pd.api.types.is_numeric_dtype(df[col]):
                    desc = df[col].describe()
                    stats.update({
                        'mean': round(_safe_float(desc.get('mean', 0)), 2),
                        'std': round(_safe_float(desc.get('std', 0)), 2),
                        'min': _safe_float(desc.get('min', 0)),
                        'max': _safe_float(desc.get('max', 0)),
                        'median': round(_safe_float(df[col].median()), 2),
                    })
                elif pd.api.types.is_string_dtype(df[col]):
                    stats.update({
                        'unique_count': int(df[col].nunique()),
                        'top_values': {str(k): int(v) for k, v in df[col].value_counts().head(5).items()},
                    })

                column_stats[col] = stats
            except Exception as e:
                logger.warning(f"Could not compute stats for column '{col}': {e}")
                column_stats[col] = {
                    'dtype': str(df[col].dtype),
                    'non_null_count': int(df[col].count()),
                    'null_count': int(df[col].isnull().sum()),
                }

        # Preview data (first 100 rows)
        preview_df = df.head(100)
        preview_data = []
        for _, row in preview_df.iterrows():
            row_dict = {}
            for col in preview_df.columns:
                val = row[col]
                if pd.isna(val):
                    row_dict[col] = ''
                elif isinstance(val, (int, float)):
                    # Handle NaN/Inf in numeric values
                    if pd.isna(val) or val == float('inf') or val == float('-inf'):
                        row_dict[col] = ''
                    else:
                        row_dict[col] = val
                else:
                    row_dict[col] = str(val)
            preview_data.append(row_dict)

        return {
            'columns': list(df.columns),
            'row_count': len(df),
            'preview_data': preview_data,
            'column_stats': column_stats,
        }

    except pd.errors.EmptyDataError:
        raise ValueError("The file is empty.")
    except pd.errors.ParserError as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        logger.exception(f"Error processing CSV file")
        raise ValueError(f"Error processing file: {str(e)}")


def generate_insights(report) -> str:
    """
    Generate AI insights for a CSV report using OpenRouter API.
    Calls the StepFun Step-3.5-Flash model (free tier).

    Returns the generated insights as a string.
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your environment."

    # Build a concise data summary for the prompt
    data_summary = _build_data_summary(report)

    prompt = f"""You are a data analyst. Analyze this CSV dataset and provide a concise insights report.

**Dataset:** {report.original_filename}
**Rows:** {report.row_count}
**Columns:** {', '.join(report.columns)}

**Column Statistics:**
{data_summary}

Provide your analysis in this format:

## Data Overview
Brief summary of the dataset.

## Key Trends
- List 3-5 notable patterns or trends

## Outliers & Anomalies
- Any unusual values or patterns worth investigating

## What to Check Next
- 2-3 recommended follow-up analyses

## Quick Recommendations
- 2-3 actionable suggestions based on the data

Keep it concise and actionable. Use bullet points. Do not use any emojis."""

    try:
        response = requests.post(
            settings.OPENROUTER_BASE_URL,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://csv-insights.app',
                'X-Title': 'CSV Insights Dashboard',
            },
            json={
                'model': settings.OPENROUTER_MODEL,
                'messages': [
                    {'role': 'system', 'content': 'You are a helpful data analyst. Provide clear, actionable insights from CSV data.'},
                    {'role': 'user', 'content': prompt},
                ],
                'max_tokens': 1500,
                'temperature': 0.3,
            },
            timeout=60,
        )
        response.raise_for_status()
        result = response.json()

        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        else:
            logger.error(f"Unexpected API response: {result}")
            return "Failed to generate insights. Unexpected response from the AI model."

    except requests.exceptions.Timeout:
        logger.error("OpenRouter API timeout")
        return "The AI service timed out. Please try again."
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter API error: {e}")
        return f"Failed to connect to AI service: {str(e)}"


def generate_follow_up_answer(report, question: str) -> str:
    """
    Answer a follow-up question about the CSV data using OpenRouter API.
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return "OpenRouter API key not configured."

    data_summary = _build_data_summary(report)

    prompt = f"""You are a data analyst. A user uploaded a CSV file and has a follow-up question.

**Dataset:** {report.original_filename}
**Rows:** {report.row_count}
**Columns:** {', '.join(report.columns)}

**Column Statistics:**
{data_summary}

**Previous Insights:**
{report.insights[:500] if report.insights else 'Not yet generated.'}

**User Question:** {question}

Answer concisely and specifically based on the data available."""

    try:
        response = requests.post(
            settings.OPENROUTER_BASE_URL,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://csv-insights.app',
                'X-Title': 'CSV Insights Dashboard',
            },
            json={
                'model': settings.OPENROUTER_MODEL,
                'messages': [
                    {'role': 'system', 'content': 'You are a helpful data analyst. Answer questions about CSV data accurately and concisely.'},
                    {'role': 'user', 'content': prompt},
                ],
                'max_tokens': 800,
                'temperature': 0.3,
            },
            timeout=60,
        )
        response.raise_for_status()
        result = response.json()

        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        return "Failed to generate answer."

    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter API error: {e}")
        return f"AI service error: {str(e)}"


def check_llm_health() -> dict:
    """
    Check if the OpenRouter API is reachable and the API key is valid.
    Returns a dict with status and details.
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return {'status': 'error', 'detail': 'API key not configured'}

    try:
        response = requests.post(
            settings.OPENROUTER_BASE_URL,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': settings.OPENROUTER_MODEL,
                'messages': [{'role': 'user', 'content': 'ping'}],
                'max_tokens': 5,
            },
            timeout=15,
        )

        if response.status_code == 200:
            return {'status': 'healthy', 'detail': f'Model: {settings.OPENROUTER_MODEL}'}
        elif response.status_code == 401:
            return {'status': 'error', 'detail': 'Invalid API key'}
        else:
            return {'status': 'degraded', 'detail': f'HTTP {response.status_code}'}

    except requests.exceptions.Timeout:
        return {'status': 'degraded', 'detail': 'Connection timeout'}
    except requests.exceptions.RequestException as e:
        return {'status': 'error', 'detail': str(e)}


def _build_data_summary(report) -> str:
    """Build a concise text summary of column statistics for the LLM prompt."""
    lines = []
    for col, stats in report.column_stats.items():
        dtype = stats.get('dtype', 'unknown')
        non_null = stats.get('non_null_count', 0)
        null = stats.get('null_count', 0)
        line = f"- **{col}** ({dtype}): {non_null} values, {null} nulls"

        if 'mean' in stats:
            line += f" | mean={stats['mean']}, std={stats['std']}, min={stats['min']}, max={stats['max']}"
        elif 'unique_count' in stats:
            line += f" | {stats['unique_count']} unique values"
            top = stats.get('top_values', {})
            if top:
                top_str = ', '.join(f"{k}: {v}" for k, v in list(top.items())[:3])
                line += f" | top: {top_str}"

        lines.append(line)

    return '\n'.join(lines)
