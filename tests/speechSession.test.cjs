const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSpeechSession } = require('../.test-build/services/speech/speechSession');

function setup(permission = async () => true) {
  let events; let starts = 0; let aborts = 0; let removals = 0; let language;
  const states = [];
  const service = createSpeechSession(async () => ({
    getPermission: permission,
    requestPermission: permission,
    listen(value) { events = value; return () => removals++; },
    start(value) { starts++; language = value; events.started(); },
    stop() {}, abort() { aborts++; },
  }), () => 'uk-UA');
  service.subscribe(state => states.push(state));
  return { service, states, get events() { return events; }, get starts() { return starts; }, get aborts() { return aborts; }, get removals() { return removals; }, get language() { return language; } };
}
test('start, stop, final transcript and cleanup', async () => {
  const f = setup(); await f.service.start();
  assert.equal(f.language, 'uk-UA'); assert.equal(f.states.at(-1).status, 'listening');
  const stopped = f.service.stop(); assert.equal(f.states.at(-1).status, 'processing');
  f.events.result(' Buy milk '); f.events.ended();
  assert.equal(await stopped, 'Buy milk'); assert.deepEqual(f.states.at(-1), { status: 'idle', transcript: 'Buy milk' });
  assert.equal(f.removals, 1);
});
test('language override and automatic end', async () => {
  const f = setup(); await f.service.start('en-US'); assert.equal(f.language, 'en-US');
  f.events.result('Hello'); f.events.ended(); assert.equal(f.states.at(-1).transcript, 'Hello');
});
test('permission denial never starts recording', async () => {
  const f = setup(async () => false); await f.service.start();
  assert.equal(f.starts, 0); assert.match(f.states.at(-1).message, /permission was denied/);
});
test('cancel during permission ignores late grant', async () => {
  let grant; const f = setup(() => new Promise(resolve => { grant = resolve; }));
  const pending = f.service.start(); await Promise.resolve(); await Promise.resolve();
  await f.service.cancel(); grant(true); await pending;
  assert.equal(f.starts, 0); assert.equal(f.states.at(-1).status, 'idle');
});
test('cancel rejects late result and preserves idle state', async () => {
  const f = setup(); await f.service.start(); const old = f.events;
  await f.service.cancel(); old.result('Do not save'); old.ended();
  assert.deepEqual(f.states.at(-1), { status: 'idle' }); assert.equal(f.aborts, 1);
});
test('no speech has useful error', async () => {
  const f = setup(); await f.service.start(); f.events.ended();
  assert.match(f.states.at(-1).message, /No speech detected/);
});
test('recognition failure settles stop promise', async () => {
  const f = setup(); await f.service.start(); const stopped = f.service.stop();
  f.events.error('network'); await assert.rejects(stopped, /connection/);
});
test('unsupported platform is recoverable', async () => {
  const states = []; const service = createSpeechSession(async () => { throw new Error('Unsupported platform'); }, () => 'en-US');
  service.subscribe(s => states.push(s)); await service.start(); assert.equal(states.at(-1).message, 'Unsupported platform');
  await service.cancel(); assert.equal(states.at(-1).status, 'idle');
});
test('duplicate start ignored and retry works after cancellation', async () => {
  const f = setup(); await f.service.start(); await f.service.start(); assert.equal(f.starts, 1);
  await f.service.cancel(); await f.service.start(); assert.equal(f.starts, 2); await f.service.cancel();
});
test('audio end shows processing, unsupported language explains next step', async () => {
  const f = setup(); await f.service.start(); f.events.processing(); assert.equal(f.states.at(-1).status, 'processing');
  f.events.error('language-not-supported'); assert.match(f.states.at(-1).message, /selected language/);
});
test('user cancellation settles in-flight stop with no transcript', async () => {
  const f = setup(); await f.service.start(); const stopped = f.service.stop(); await f.service.cancel();
  assert.equal(await stopped, ''); assert.equal(f.states.at(-1).transcript, undefined);
});
test('processing timeout recovers and releases microphone', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = setup(); await f.service.start(); const stopped = f.service.stop();
  t.mock.timers.tick(15001); await assert.rejects(stopped, /timed out/); assert.equal(f.aborts, 1);
});
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
test('permission activity background then grant waits for foreground and starts once', async () => {
  let granted = false; let grant; let events; let starts = 0; const states = [];
  const service = createSpeechSession(async () => ({
    getPermission: async () => granted,
    requestPermission: () => new Promise(ok => { grant = () => { granted = true; ok(true); }; }),
    listen(e) { events = e; return () => {}; },
    start() { starts++; events.started(); }, stop() {}, abort() {},
  }), () => 'uk-UA');
  service.subscribe(s => states.push(s));
  const pending = service.start(); await flush();
  assert.equal(states.at(-1).status, 'requesting-permission');
  service.setAppState('background'); grant(); await flush();
  assert.equal(states.at(-1).status, 'waiting-foreground'); assert.equal(starts, 0);
  await service.start(); service.setAppState('active'); await pending;
  assert.equal(starts, 1); assert.equal(states.at(-1).status, 'listening'); await service.cancel();
});
test('already granted permission does not show a permission request', async () => {
  const f = setup(); await f.service.start();
  assert.equal(f.states.some(s => s.status === 'requesting-permission'), false); await f.service.cancel();
});
test('unexpected abort and subsequent end stay visible until dismissal', async () => {
  const f = setup(); await f.service.start(); f.events.error('aborted', 'Recognizer disconnected'); f.events.ended();
  f.service.setAppState('background'); f.service.setAppState('active');
  assert.equal(f.states.at(-1).status, 'error'); assert.match(f.states.at(-1).message, /Recognizer disconnected/);
  await f.service.cancel(); assert.equal(f.states.at(-1).status, 'idle');
});
test('partial transcript is displayed but never delivered as a final capture', async () => {
  const f = setup(); await f.service.start(); f.events.result('partial', false);
  assert.equal(f.states.at(-1).partialTranscript, 'partial'); assert.equal(f.states.at(-1).transcript, undefined);
  f.events.ended(); assert.equal(f.states.at(-1).status, 'error');
});
for (const immediateError of [false, true]) test(immediateError ? 'immediate native error persists after end' : 'native start exception is visible', async () => {
  let events; const states = [];
  const service = createSpeechSession(async () => ({ getPermission: async () => true, requestPermission: async () => true,
    listen(e) { events = e; return () => {}; }, start() { if (immediateError) { events.error('audio-capture', 'Microphone unavailable'); events.ended(); } else throw new Error('Start failed'); }, stop() {}, abort() {},
  }), () => 'en-US');
  service.subscribe(s => states.push(s)); await service.start(); assert.equal(states.at(-1).status, 'error');
  assert.match(states.at(-1).message, immediateError ? /Microphone unavailable/ : /Start failed/);
});
test('duplicate stop calls issue only one native stop', async () => {
  let events; let stops = 0;
  const service = createSpeechSession(async () => ({ getPermission: async () => true, requestPermission: async () => true,
    listen(e) { events = e; return () => {}; }, start() { events.started(); }, stop() { stops++; }, abort() {},
  }), () => 'en-US');
  await service.start(); const first = service.stop(); const second = service.stop();
  events.result('Hello'); events.ended(); assert.deepEqual(await Promise.all([first, second]), ['Hello', 'Hello']); assert.equal(stops, 1);
});
test('background during actual listening produces a persistent interruption error', async () => {
  const f = setup(); await f.service.start(); f.service.setAppState('background');
  assert.equal(f.states.at(-1).status, 'error'); assert.equal(f.aborts, 1); f.service.setAppState('active');
  assert.equal(f.states.at(-1).status, 'error');
});
