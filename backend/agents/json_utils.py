import json
import re

_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def safe_json_parse(raw: str, default: dict) -> dict:
    """Parse a JSON object out of an LLM response, tolerating markdown code fences
    and surrounding prose. Falls back to `default` if no valid object is found."""
    text = (raw or "").strip()

    fenced = _FENCE_RE.search(text)
    if fenced:
        text = fenced.group(1).strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass

    # Last resort: grab the first {...} block in case of leading/trailing prose.
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            parsed = json.loads(brace_match.group(0))
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass

    return default
