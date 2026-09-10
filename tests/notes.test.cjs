const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let saved;
Module._load = function (id, ...args) {
  if (id === '@react-native-async-storage/async-storage') return { __esModule: true, default: { getItem: async () => null, setItem: async (_key, value) => { saved = value; } } };
  return original.call(this, id, ...args);
};
const { useNotesStore: store } = require('../.test-build/store/notes');
Module._load = original;
test('saving exposes new note first and a transient Home receipt; editing promotes the note', async () => {
  await store.getState().hydrate();
  const first = store.getState().addNote('First thought');
  const second = store.getState().addNote('Buy milk', 'shopping', { items: ['milk'] });
  assert.equal(store.getState().notes[0].id, second); assert.equal(store.getState().savedId, second);
  store.getState().acknowledgeSave(); assert.equal(store.getState().savedId, null);
  store.getState().updateNote(first, 'Updated thought', 'task');
  assert.equal(store.getState().notes[0].id, first); assert.equal(store.getState().savedId, first);
  for (let i = 0; i < 12; i++) await Promise.resolve();
  assert.equal(JSON.parse(saved).notes[0].text, 'Updated thought'); assert.equal(JSON.parse(saved).savedId, undefined);
});

