import type { NoteParser, ParsedNote } from './types';

function calendarDate(now: Date, tomorrow: boolean) {
  const date = new Date(now);
  date.setDate(date.getDate() + (tomorrow ? 1 : 0));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** English-only heuristics. Confidence is a review hint, not a probability. */
export const localNoteParser: NoteParser = {
  async parse(input, { now = new Date() } = {}) {
    const text = input.trim();
    if (!text) throw new Error('Enter a thought before reviewing it.');
    if (!Number.isFinite(now.getTime())) throw new Error('Invalid reference date.');
    const result: ParsedNote = { type: 'note', text, confidence: 0.4 };
    // Explicit ideas/notes win over incidental temporal words in prose.
    if (/^(?:idea|note|thought)\s*:/i.test(text)) return { ...result, confidence: 0.95 };
    const days = [...text.matchAll(/\b(today|tomorrow)\b/gi)];
    const clocks = [...text.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)];
    if (days.length) result.date = calendarDate(now, days[0][1].toLowerCase() === 'tomorrow');
    if (clocks.length) result.time = `${clocks[0][1].padStart(2, '0')}:${clocks[0][2]}`;
    const shopping = /\b(?:buy|purchase|shopping list\s*:)\s+(.+)/i.exec(text);
    if (shopping) {
      const items = shopping[1].replace(/\b(?:today|tomorrow)\b/gi, '')
        .replace(/\b(?:at\s+)?(?:[01]?\d|2[0-3]):[0-5]\d\b/g, '')
        .split(/,|;|\band\b/gi).map(item => item.trim().replace(/[.!]+$/, '').trim()).filter(Boolean);
      if (items.length) result.items = items;
    }
    if (result.date || result.time || /^remind me\b/i.test(text)) {
      result.type = 'reminder'; result.confidence = 0.9;
    } else if (shopping && result.items?.length) {
      result.type = 'shopping'; result.confidence = 0.9;
    } else if (/^(?:please\s+)?(?:call|email|send|finish|complete|book|schedule|clean|write|review|pay|visit|walk|prepare|check)\b/i.test(text) || /^(?:task|todo|to-do)\s*:/i.test(text)) {
      result.type = 'task'; result.confidence = 0.8;
    } else if (/^(?:i|we|the|my|it|this)\b/i.test(text) && text.split(/\s+/).length >= 4) {
      result.confidence = 0.75;
    }
    // Conflicting dates/times, invalid clock syntax, or tentative wording need review.
    if (days.length > 1 || clocks.length > 1 || /\b(?:maybe|perhaps|sometime)\b/i.test(text) ||
      ( /\b\d{1,2}:\d{2}\b/.test(text) && !clocks.length)) result.confidence = 0.4;
    return result;
  },
};
