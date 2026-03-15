// ─────────────────────────────────────────────────────────────────────────────
// interventionAI.ts
//
// LLM layer for the Intervention screen's grounding & refocus phases.
// Calls backend OpenRouter-backed /api/llm/ground and /api/llm/refocus;
// falls back to static maps only on network or server error.
// ─────────────────────────────────────────────────────────────────────────────

import { postLlmGround, postLlmRefocus } from './api';

/** Emotion keys surfaced by the ground_question phase chip selector. */
export type EmotionKey =
  | 'anxious'
  | 'distracted'
  | 'overwhelmed'
  | 'frustrated'
  | 'exhausted'
  | 'other';

/** The grounding phase response shape — will be returned by an LLM verbatim. */
export interface GroundingResponse {
  /** A short empathetic message acknowledging the user's state. */
  message: string;
  /** 2–4 concrete grounding activities to try right now. */
  suggestions: string[];
}

/** The refocus phase response shape — will be returned by an LLM verbatim. */
export interface RefocusResponse {
  /** A short motivating message to ease back into work. */
  message: string;
  /** 2–4 actionable tips for re-entering focus given their emotional state. */
  tips: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Static response tables (replace with LLM call when ready)
// ─────────────────────────────────────────────────────────────────────────────

const GROUNDING_MAP: Record<EmotionKey, GroundingResponse> = {
  anxious: {
    message: "Anxiety often lives in the body before the mind catches up. Let's bring you back to the present.",
    suggestions: [
      'Press your feet flat on the floor and notice the pressure.',
      'Name 5 things you can see from where you\'re sitting.',
      'Place one hand on your chest — feel it rise and fall for 3 breaths.',
      'Take a slow sip of water and focus only on the sensation.',
    ],
  },
  distracted: {
    message: "Your attention is scattered — that's normal. Let's collect it gently.",
    suggestions: [
      'Close all non-essential tabs and windows.',
      'Write the single most important thing you need to do on a sticky note.',
      'Set your phone face-down out of reach for the next 25 minutes.',
      'Take 3 slow breaths while looking at one fixed point.',
    ],
  },
  overwhelmed: {
    message: "Too much at once — let's shrink the world down to just this moment.",
    suggestions: [
      'Write out everything on your mind in bullet points, then close the list.',
      'Pick just ONE thing from that list. Everything else waits.',
      'Stand up, roll your shoulders back, and take two deep breaths.',
      'Remind yourself: you only have to do the next small step.',
    ],
  },
  frustrated: {
    message: "Frustration is energy — let's redirect it instead of suppressing it.",
    suggestions: [
      'Step away from the screen for 2 minutes — even just to stretch.',
      'Write down what\'s frustrating you in one sentence. Externalizing helps.',
      'Splash cold water on your face or wrists.',
      'Remind yourself of the last time you solved a hard problem.',
    ],
  },
  exhausted: {
    message: "Your tank is low. Let's do the minimum to restore a little fuel.",
    suggestions: [
      'Rest your eyes — close them for 60 seconds.',
      'Drink a full glass of water right now.',
      'Do 10 gentle neck rolls, 5 each direction.',
      'Consider whether a 10-minute break would make the next hour better.',
    ],
  },
  other: {
    message: "Whatever you're feeling, it's valid. Let's find a moment of stillness.",
    suggestions: [
      'Sit quietly for 60 seconds without doing anything.',
      'Take 3 deep, slow breaths.',
      'Notice one thing that\'s going well today, however small.',
      'Put a name to what you\'re feeling — even just to yourself.',
    ],
  },
};

const REFOCUS_MAP: Record<EmotionKey, RefocusResponse> = {
  anxious: {
    message: "You've taken a breath. Now let's ease back in — no rushing.",
    tips: [
      'Start with the smallest, most concrete task on your list.',
      'Keep your workspace visible — one window, one task.',
      'Give yourself permission to work for just 10 minutes, then reassess.',
    ],
  },
  distracted: {
    message: "Fresh start. One task, one window, one you.",
    tips: [
      'Write your focus intention at the top of a blank doc: "Right now I am working on ___."',
      'Use a timer — even 15 minutes of protected focus is a win.',
      'If a new thought appears, park it in a "later" list and keep going.',
    ],
  },
  overwhelmed: {
    message: "You don't have to do everything. You just have to do the next thing.",
    tips: [
      'Open only the file or tool you need for the single task you chose.',
      'Set a 20-minute timer — you\'re only committing to that.',
      'If you get stuck, note where you are and move to an easier sub-task.',
    ],
  },
  frustrated: {
    message: "Channel it. Frustration often means you care — use that.",
    tips: [
      'Restate the problem in plain words before diving back in.',
      'Try a different approach than the one that frustrated you.',
      'Celebrate the next small progress, no matter how minor.',
    ],
  },
  exhausted: {
    message: "Gentle re-entry. Low stakes, low pressure.",
    tips: [
      'Choose the easiest item on your list to rebuild momentum.',
      'Work for 15 minutes then check in with yourself honestly.',
      'Consider whether this work could wait until after a proper break.',
    ],
  },
  other: {
    message: "You showed up. That counts. Let's take it one step at a time.",
    tips: [
      'Pick one task and commit to it for the next 20 minutes.',
      'Keep your environment calm — minimize noise and visual clutter.',
      'Be kind to yourself if the first few minutes feel slow.',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API — calls backend LLM; falls back to static maps on failure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns grounding suggestions tailored to the user's emotional state.
 * Hits backend OpenRouter endpoint; fallback to static only on failure.
 *
 * @param emotionKey  - The emotion chip the user selected.
 * @param freeText    - Optional free-text the user typed (passed to OpenRouter).
 */
export async function getGroundingSuggestions(
  emotionKey: EmotionKey,
  freeText?: string
): Promise<GroundingResponse> {
  const payload = { emotion: emotionKey, detail: freeText?.trim() ?? null };
  const data = await postLlmGround(payload);
  if (data?.message && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
    return data;
  }
  return GROUNDING_MAP[emotionKey] ?? GROUNDING_MAP.other;
}

/**
 * Returns refocus tips tailored to the user's emotional state.
 * Hits backend OpenRouter endpoint; fallback to static only on failure.
 *
 * @param emotionKey  - The emotion chip the user selected (same as grounding call).
 * @param freeText    - Optional free-text the user typed (passed to OpenRouter).
 */
export async function getRefocusSuggestions(
  emotionKey: EmotionKey,
  freeText?: string
): Promise<RefocusResponse> {
  const payload = { emotion: emotionKey, detail: freeText?.trim() ?? null };
  const data = await postLlmRefocus(payload);
  if (data?.message && Array.isArray(data.tips) && data.tips.length > 0) {
    return data;
  }
  return REFOCUS_MAP[emotionKey] ?? REFOCUS_MAP.other;
}
