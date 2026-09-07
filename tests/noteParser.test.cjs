const { test } = require('node:test');
const assert = require('node:assert/strict');
const { localNoteParser: parser } = require('../.test-build/services/noteParser/localNoteParser');
const { isNote } = require('../.test-build/types/note');
const now = new Date(2026, 8, 7, 12);
const parse = text => parser.parse(text, { now });

test('normal prose is a note', async () => {
  const result = await parse('I enjoyed the walk by the river.');
  assert.equal(result.type, 'note'); assert.ok(result.confidence >= 0.65);
});
test('explicit idea is a note even with temporal words', async () => {
  assert.equal((await parse('Idea: add a mode where the notebook asks follow-up questions')).type, 'note');
  assert.equal((await parse('Idea: think about tomorrow')).date, undefined);
});
test('imperative task', async () => { assert.equal((await parse('Call Andrii')).type, 'task'); });
test('reminder with tomorrow', async () => {
  const result = await parse('Call Andrii tomorrow');
  assert.equal(result.type, 'reminder'); assert.equal(result.date, '2026-09-08');
});
test('time-only reminder normalizes HH:mm without inventing date', async () => {
  const result = await parse('Call Andrii at 9:05');
  assert.equal(result.type, 'reminder'); assert.equal(result.time, '09:05'); assert.equal(result.date, undefined);
});
test('dated purchase is a reminder with shopping items', async () => {
  const result = await parse('Tomorrow at 18:00 buy food for Boni');
  assert.equal(result.type, 'reminder'); assert.equal(result.date, '2026-09-08');
  assert.equal(result.time, '18:00'); assert.deepEqual(result.items, ['food for Boni']);
});
test('shopping list splits commas and and', async () => {
  const result = await parse('Buy milk, bread and cheese');
  assert.equal(result.type, 'shopping'); assert.deepEqual(result.items, ['milk', 'bread', 'cheese']);
});
test('today is local calendar date', async () => { assert.equal((await parse('Pay today')).date, '2026-09-07'); });
test('tomorrow crosses year boundary', async () => {
  assert.equal((await parser.parse('Call tomorrow', { now: new Date(2026, 11, 31, 23, 59) })).date, '2027-01-01');
});
test('ambiguous input has low confidence and remains intact', async () => {
  const result = await parse('Maybe something for Boni');
  assert.equal(result.type, 'note'); assert.ok(result.confidence < 0.65); assert.equal(result.text, 'Maybe something for Boni');
});
test('conflicting dates need review', async () => { assert.ok((await parse('Call today or tomorrow')).confidence < 0.65); });
test('invalid times are not scheduled', async () => {
  const result = await parse('Call at 25:90'); assert.equal(result.time, undefined); assert.ok(result.confidence < 0.65);
});
test('empty input rejects', async () => { await assert.rejects(parse('   ')); });
test('word boundaries avoid accidental relative dates', async () => { assert.equal((await parse('tomorrowland')).date, undefined); });
test('original text preserved apart from outer whitespace', async () => {
  assert.equal((await parse('  Buy milk, bread and cheese  ')).text, 'Buy milk, bread and cheese');
});
const legacy = { id: 'old', text: 'Existing note', type: 'note', completed: false, createdAt: now.toISOString(), updatedAt: now.toISOString() };
test('legacy stored notes remain valid', () => { assert.equal(isNote(legacy), true); });
test('structured metadata survives JSON round trip', () => {
  const note = { ...legacy, scheduledDate: '2026-09-08', scheduledTime: '18:00', items: ['milk'], confidence: 0.9 };
  assert.equal(isNote(JSON.parse(JSON.stringify(note))), true);
});
test('malformed optional metadata is rejected', () => {
  assert.equal(isNote({ ...legacy, confidence: 2 }), false);
  assert.equal(isNote({ ...legacy, items: [1] }), false);
  assert.equal(isNote({ ...legacy, scheduledTime: '25:99' }), false);
});
