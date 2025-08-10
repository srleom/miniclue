import os
import json
import logging
from decimal import Decimal
from typing import Any, Dict, Optional
import asyncpg

# Load rate card for token costs
RATE_CARD_PATH = os.path.join(os.path.dirname(__file__), "llm_token_costs.json")
try:
    with open(RATE_CARD_PATH, "r", encoding="utf-8") as f:
        _RATE_CARD = json.load(f)
except Exception as e:
    logging.warning(
        f"Could not load LLM rate card from {RATE_CARD_PATH}, defaulting to empty rates. Error: {e}"
    )
    _RATE_CARD = {}


def compute_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    """
    Compute cost for a given model invocation based on token counts and rate card.
    """
    rates = _RATE_CARD.get(model, {})
    prompt_cost = Decimal(str(rates.get("prompt_cost", 0)))
    completion_cost = Decimal(str(rates.get("completion_cost", 0)))
    # prompt_cost and completion_cost are specified per million tokens; divide by 1e6
    total_cost = (
        prompt_cost * prompt_tokens + completion_cost * completion_tokens
    ) / Decimal("1000000")
    return total_cost


async def log_llm_call(
    conn: asyncpg.Connection,
    lecture_id: Any,
    slide_id: Optional[Any],
    call_type: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost: Decimal,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Insert a row into the llm_calls table to record an LLM invocation.
    """
    try:
        await conn.execute(
            """
            INSERT INTO llm_calls (
                lecture_id,
                slide_id,
                call_type,
                model,
                prompt_tokens,
                completion_tokens,
                total_tokens,
                cost,
                metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
            """,
            lecture_id,
            slide_id,
            call_type,
            model,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            cost,
            json.dumps({}),
        )
    except Exception as e:
        logging.error(
            f"Failed to log LLM call: lecture_id={lecture_id}, slide_id={slide_id}, error={e}"
        )
