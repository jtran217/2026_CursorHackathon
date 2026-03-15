"""
LLM service for intervention grounding/refocus via OpenRouter API.
Falls back to static responses when API key is missing or on error.
"""
import json
import os
import re
import urllib.request
from typing import Any

# Emotion keys must match frontend EmotionKey in interventionAI.ts
VALID_EMOTIONS = frozenset(
    {"anxious", "distracted", "overwhelmed", "frustrated", "exhausted", "other"}
)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-3.5-turbo"


def _get_api_key() -> str | None:
    """API key from environment (e.g. from backend/.env via python-dotenv)."""
    return os.environ.get("OPENROUTER_API_KEY")


def _get_model_id() -> str:
    return os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)


def _fallback_grounding(emotion: str) -> dict[str, Any]:
    """Static fallback for grounding phase; matches frontend GROUNDING_MAP."""
    fallbacks: dict[str, dict[str, Any]] = {
        "anxious": {
            "message": "Anxiety often lives in the body before the mind catches up. Let's bring you back to the present.",
            "suggestions": [
                "Press your feet flat on the floor and notice the pressure.",
                "Name 5 things you can see from where you're sitting.",
                "Place one hand on your chest — feel it rise and fall for 3 breaths.",
                "Take a slow sip of water and focus only on the sensation.",
            ],
        },
        "distracted": {
            "message": "Your attention is scattered — that's normal. Let's collect it gently.",
            "suggestions": [
                "Close all non-essential tabs and windows.",
                "Write the single most important thing you need to do on a sticky note.",
                "Set your phone face-down out of reach for the next 25 minutes.",
                "Take 3 slow breaths while looking at one fixed point.",
            ],
        },
        "overwhelmed": {
            "message": "Too much at once — let's shrink the world down to just this moment.",
            "suggestions": [
                "Write out everything on your mind in bullet points, then close the list.",
                "Pick just ONE thing from that list. Everything else waits.",
                "Stand up, roll your shoulders back, and take two deep breaths.",
                "Remind yourself: you only have to do the next small step.",
            ],
        },
        "frustrated": {
            "message": "Frustration is energy — let's redirect it instead of suppressing it.",
            "suggestions": [
                "Step away from the screen for 2 minutes — even just to stretch.",
                "Write down what's frustrating you in one sentence. Externalizing helps.",
                "Splash cold water on your face or wrists.",
                "Remind yourself of the last time you solved a hard problem.",
            ],
        },
        "exhausted": {
            "message": "Your tank is low. Let's do the minimum to restore a little fuel.",
            "suggestions": [
                "Rest your eyes — close them for 60 seconds.",
                "Drink a full glass of water right now.",
                "Do 10 gentle neck rolls, 5 each direction.",
                "Consider whether a 10-minute break would make the next hour better.",
            ],
        },
        "other": {
            "message": "Whatever you're feeling, it's valid. Let's find a moment of stillness.",
            "suggestions": [
                "Sit quietly for 60 seconds without doing anything.",
                "Take 3 deep, slow breaths.",
                "Notice one thing that's going well today, however small.",
                "Put a name to what you're feeling — even just to yourself.",
            ],
        },
    }
    return fallbacks.get(emotion, fallbacks["other"])


def _fallback_refocus(emotion: str) -> dict[str, Any]:
    """Static fallback for refocus phase; matches frontend REFOCUS_MAP."""
    fallbacks: dict[str, dict[str, Any]] = {
        "anxious": {
            "message": "You've taken a breath. Now let's ease back in — no rushing.",
            "tips": [
                "Start with the smallest, most concrete task on your list.",
                "Keep your workspace visible — one window, one task.",
                "Give yourself permission to work for just 10 minutes, then reassess.",
            ],
        },
        "distracted": {
            "message": "Fresh start. One task, one window, one you.",
            "tips": [
                'Write your focus intention at the top of a blank doc: "Right now I am working on ___."',
                "Use a timer — even 15 minutes of protected focus is a win.",
                'If a new thought appears, park it in a "later" list and keep going.',
            ],
        },
        "overwhelmed": {
            "message": "You don't have to do everything. You just have to do the next thing.",
            "tips": [
                "Open only the file or tool you need for the single task you chose.",
                "Set a 20-minute timer — you're only committing to that.",
                "If you get stuck, note where you are and move to an easier sub-task.",
            ],
        },
        "frustrated": {
            "message": "Channel it. Frustration often means you care — use that.",
            "tips": [
                "Restate the problem in plain words before diving back in.",
                "Try a different approach than the one that frustrated you.",
                "Celebrate the next small progress, no matter how minor.",
            ],
        },
        "exhausted": {
            "message": "Gentle re-entry. Low stakes, low pressure.",
            "tips": [
                "Choose the easiest item on your list to rebuild momentum.",
                "Work for 15 minutes then check in with yourself honestly.",
                "Consider whether this work could wait until after a proper break.",
            ],
        },
        "other": {
            "message": "You showed up. That counts. Let's take it one step at a time.",
            "tips": [
                "Pick one task and commit to it for the next 20 minutes.",
                "Keep your environment calm — minimize noise and visual clutter.",
                "Be kind to yourself if the first few minutes feel slow.",
            ],
        },
    }
    return fallbacks.get(emotion, fallbacks["other"])


def _call_openrouter(system: str, user: str, max_tokens: int = 200, label: str = "openrouter") -> str | None:
    """Call OpenRouter chat completions; return content or None on error."""
    api_key = _get_api_key()
    if not api_key or not api_key.strip():
        return None
    body = {
        "model": _get_model_id(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    # Log request (redact key)
    print(f"[OpenRouter] --- REQUEST ({label}) ---")
    print(f"[OpenRouter] model: {body['model']}, max_tokens: {body['max_tokens']}")
    print(f"[OpenRouter] system: {system[:200]}{'...' if len(system) > 200 else ''}")
    print(f"[OpenRouter] user: {user[:500]}{'...' if len(user) > 500 else ''}")
    print(f"[OpenRouter] ------------------------")
    try:
        req = urllib.request.Request(
            OPENROUTER_URL,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key.strip()}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content")
        # Log response
        print(f"[OpenRouter] --- RESPONSE ({label}) ---")
        print(f"[OpenRouter] raw content: {repr(content)[:500]}{'...' if content and len(repr(content)) > 500 else ''}")
        if data.get("usage"):
            print(f"[OpenRouter] usage: {data['usage']}")
        print(f"[OpenRouter] -------------------------")
        return content.strip() if isinstance(content, str) and content else None
    except Exception as e:
        print(f"[OpenRouter] --- ERROR ({label}) ---")
        print(f"[OpenRouter] {type(e).__name__}: {e}")
        print(f"[OpenRouter] -------------------------")
        return None


# Reject model output that echoes the prompt instruction
_INSTRUCTION_ECHO_PATTERNS = re.compile(
    r"reply\s+with\s+\d*\s*key\s+points|"
    r"bullet\s+points\s+starting|"
    r"ease\s+back\s+into\s+focus|"
    r"on\s+new\s+lines\s+\d",
    re.IGNORECASE,
)


def _is_instruction_echo(text: str) -> bool:
    if not text or len(text) < 20:
        return False
    return bool(_INSTRUCTION_ECHO_PATTERNS.search(text))


def _parse_message_and_bullets(text: str, list_key: str) -> dict[str, Any] | None:
    """Parse first line as message, rest as bullet items. Returns None on failure."""
    if not text or not text.strip():
        return None
    lines = [ln.strip() for ln in text.strip().split("\n") if ln.strip()]
    if not lines:
        return None
    message = lines[0]
    if _is_instruction_echo(message):
        return None
    bullet_re = re.compile(r"^[\-\*•]\s*")
    items = []
    for ln in lines[1:]:
        item = bullet_re.sub("", ln).strip()
        if item and len(item) < 500 and not _is_instruction_echo(item):
            items.append(item)
    if len(items) < 1:
        return None
    return {"message": message[:500], list_key: items[:6]}


def get_grounding_suggestions(emotion: str, free_text: str | None) -> dict[str, Any]:
    """
    Return grounding phase: { "message": str, "suggestions": list[str] }.
    Uses OpenRouter when OPENROUTER_API_KEY is set; else static fallback.
    """
    if emotion not in VALID_EMOTIONS:
        emotion = "other"
    free_trimmed = (free_text or "").strip()
    if free_trimmed:
        user = (
            f"The user feels {emotion}. They shared in their own words: \"{free_trimmed[:400]}\"\n\n"
            "Your FIRST sentence must directly acknowledge what they said — reflect their words or situation back so they feel heard and validated. Do not give generic comfort; reference their specific concern. Then on the next lines give exactly 3 bullet points starting with - for grounding activities tailored to their situation. Be calm and supportive. Output format: one short empathetic sentence, then 3 lines each starting with -"
        )
    else:
        user = (
            f"The user feels {emotion}.\n\n"
            "Reply with one short empathetic sentence that acknowledges this specific emotional state, then on new lines 3 bullet points starting with - for grounding activities to try right now. Be calm and supportive."
        )
    system = "You are a calm, supportive wellness coach. Reply only with the requested content: one opening sentence that makes the user feel heard, then exactly 3 bullet points starting with -. No preamble, no meta-commentary."
    content = _call_openrouter(system, user, max_tokens=200, label="grounding")
    if content:
        parsed = _parse_message_and_bullets(content, "suggestions")
        if parsed:
            return parsed
    return _fallback_grounding(emotion)


def get_refocus_suggestions(emotion: str, free_text: str | None) -> dict[str, Any]:
    """
    Return refocus phase: { "message": str, "tips": list[str] }.
    Uses OpenRouter when OPENROUTER_API_KEY is set; else static fallback.
    """
    if emotion not in VALID_EMOTIONS:
        emotion = "other"
    free_trimmed = (free_text or "").strip()
    if free_trimmed:
        user = (
            f"The user feels {emotion} and is ready to return to work. They shared: \"{free_trimmed[:400]}\"\n\n"
            "Your FIRST sentence must reference what they shared — show you remember their concern as you encourage them back. Then on the next lines give exactly 3 bullet points starting with - for actionable tips to ease back into focus, tailored to their situation. Output format: one short motivating sentence, then 3 lines each starting with -"
        )
    else:
        user = (
            f"The user feels {emotion} and is ready to return to work.\n\n"
            "Reply with one short motivating sentence, then on new lines 3 bullet points starting with - for actionable tips to ease back into focus."
        )
    system = "You are a calm, supportive wellness coach. Reply only with the requested content: one opening sentence that references the user's situation, then exactly 3 bullet points starting with -. No preamble, no meta-commentary."
    content = _call_openrouter(system, user, max_tokens=200, label="refocus")
    if content:
        parsed = _parse_message_and_bullets(content, "tips")
        if parsed:
            return parsed
    return _fallback_refocus(emotion)
