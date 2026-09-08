const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSpeechSession } = require('../.test-build/services/speech/speechSession');

function setup(permission = async () => true) {
  let events; let starts = 0; let aborts = 0; let removals = 0; let language;
  const states = [];
  const service = createSpeechSession(async () => ({
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
