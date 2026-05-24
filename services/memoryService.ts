import { Message, MessageRole } from '../types';
import { updateChatMemorySummary } from '../src/services/dbService';

// ─── Config ──────────────────────────────────────────────────────────────────
const SUMMARIZE_EVERY_N_TURNS = 4;   // 1 turn = 1 user msg + 1 AI msg
const FORCE_SUMMARIZE_AFTER   = 16;  // message count threshold
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Debounce: prevent parallel summarization for same chat
const inProgress = new Set<string>();

/**
 * Decides whether to run the background memory summarizer, then
 * calls the server, persists the result, and notifies the caller
 * via the optional onUpdated callback so the UI state can be refreshed.
 */
export const maybeUpdateMemory = async (
  messages:        Message[],
  existingSummary: string | null,
  chatId:          string,
  userId:          string,
  onUpdated:       (chatId: string, newSummary: string) => void
): Promise<void> => {
  if (!chatId || !userId) return;
  if (inProgress.has(chatId)) return;

  const userTurns = messages.filter(m => m.role === MessageRole.USER).length;
  const total     = messages.length;

  // Trigger conditions
  const shouldSummarize =
    (userTurns > 0 && userTurns % SUMMARIZE_EVERY_N_TURNS === 0) ||
    total >= FORCE_SUMMARIZE_AFTER;

  if (!shouldSummarize) return;

  inProgress.add(chatId);
  console.log(`[Memory] Summarizing chat ${chatId} (${userTurns} user turns, ${total} messages)`);

  try {
    // Build a lean transcript (text only, no images, capped at last 30 messages)
    const transcript = messages
      .slice(-30)
      .map(m => `${m.role === MessageRole.USER ? 'User' : 'MeteoSran'}: ${m.text.slice(0, 400)}`)
      .join('\n');

    const response = await fetch(`${API_BASE_URL}/ai/memory`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ transcript, existingSummary }),
    });

    if (!response.ok) {
      console.warn('[Memory] Summarization request failed:', response.status);
      return;
    }

    const data = await response.json();
    const newSummary: string = data.summary?.trim();

    if (!newSummary) return;

    // Persist to Postgres
    await updateChatMemorySummary(userId, chatId, newSummary);

    // Notify App.tsx to update local state instantly (no reload needed)
    onUpdated(chatId, newSummary);

    console.log(`[Memory] ✅ Updated summary for chat ${chatId}`);
  } catch (err) {
    console.error('[Memory] Error during summarization:', err);
  } finally {
    inProgress.delete(chatId);
  }
};
