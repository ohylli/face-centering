import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offsets, axisLevel, levels, stateKey, largestBox } from '../js/position.js';
import { createSettler } from '../js/settle.js';
import { panFor, freqFor } from '../js/audio.js';
import en from '../js/i18n/en.js';

const W = 1280;
const H = 720;
/** Face box of height `size`*H centered at normalized image coords (u, v) in [0,1]. */
const face = (u, v, size = 0.4) => {
  const h = size * H;
  return { x: u * W - h / 2, y: v * H - h / 2, width: h, height: h };
};

test('offsets are from the user perspective (image right = user left)', () => {
  const o = offsets(face(0.75, 0.5), W, H);
  assert.ok(o.x < 0, 'face on image right should be user left');
  assert.equal(offsets(face(0.75, 0.5), W, H, { swapLeftRight: true }).x > 0, true);
  assert.ok(offsets(face(0.5, 0.1), W, H).y > 0, 'top of image is up');
  assert.ok(Math.abs(offsets(face(0.5, 0.5), W, H).d) < 1e-9, 'ideal size gives d = 0');
  assert.ok(offsets(face(0.5, 0.5, 0.7), W, H).d > 0, 'bigger face is closer');
});

test('axisLevel bands and direction', () => {
  const b = [0.1, 0.35, 0.65];
  assert.equal(axisLevel(0.05, b, 0, 0), 0);
  assert.equal(axisLevel(-0.2, b, 0, 0), -1);
  assert.equal(axisLevel(0.5, b, 0, 0), 2);
  assert.equal(axisLevel(-0.9, b, 0, 0), -3);
});

test('axisLevel hysteresis holds the level near a boundary', () => {
  const b = [0.1, 0.35, 0.65];
  const m = 0.03;
  // Just past the center boundary is not enough to leave the center.
  assert.equal(axisLevel(0.11, b, 0, m), 0);
  assert.equal(axisLevel(0.14, b, 0, m), 1);
  // Once at level 1, dropping just below the boundary keeps level 1.
  assert.equal(axisLevel(0.09, b, 1, m), 1);
  assert.equal(axisLevel(0.06, b, 1, m), 0);
  // Jumping across zero passes through center rules.
  assert.equal(axisLevel(-0.2, b, 2, m), -1);
});

test('levels respects distance toggle and tolerance', () => {
  const off = { x: 0.12, y: 0, d: 1 };
  assert.deepEqual(levels(off, null, { tolerance: 'normal' }), { x: 0, y: 0, d: 2 });
  assert.deepEqual(levels(off, null, { tolerance: 'tight', distance: false }), { x: 1, y: 0, d: 0 });
});

test('english phrases are terse', () => {
  assert.equal(en.describe(null), 'no face');
  assert.equal(en.describe({ x: 0, y: 0, d: 0 }), 'centered');
  assert.equal(en.describe({ x: -1, y: 3, d: 0 }), 'a little left, far up');
  assert.equal(en.describe({ x: 2, y: 0, d: 0 }), 'right');
  assert.equal(en.describe({ x: 0, y: -2, d: 1 }), 'down, a little close');
  assert.equal(en.describe({ x: 0, y: 0, d: -2 }), 'distant');
});

test('full pipeline: face position to phrase', () => {
  const say = (u, v, size) => en.describe(levels(offsets(face(u, v, size), W, H), null, {}));
  assert.equal(say(0.5, 0.5, 0.4), 'centered');
  // Image right, i.e. user left, slightly; very near the top.
  assert.equal(say(0.6, 0.12, 0.4), 'a little left, far up');
  assert.equal(say(0.5, 0.5, 0.15), 'distant');
});

test('settler waits for a stable state and reports changes only', () => {
  const s = createSettler({ settleMs: 300, noFaceSettleMs: 800 });
  assert.equal(s.update('a', 0), null);
  assert.equal(s.update('a', 299), null);
  assert.equal(s.update('a', 300), 'a');
  assert.equal(s.update('a', 400), null, 'no repeat');
  assert.equal(s.update('b', 500), null);
  assert.equal(s.update('a', 600), null, 'flapping back resets nothing new');
  assert.equal(s.update('a', 2000), null, 'still a, already reported');
  assert.equal(s.update('none', 2100), null);
  assert.equal(s.update('none', 2600), null, 'no face waits longer');
  assert.equal(s.update('none', 2900), 'none');
});

test('stateKey and largestBox', () => {
  assert.equal(stateKey(null), 'none');
  assert.equal(stateKey({ x: 1, y: -2, d: 0 }), '1,-2,0');
  const box = largestBox([
    { boundingBox: { originX: 0, originY: 0, width: 10, height: 10 } },
    { boundingBox: { originX: 5, originY: 5, width: 50, height: 40 } },
  ]);
  assert.deepEqual(box, { x: 5, y: 5, width: 50, height: 40 });
  assert.equal(largestBox([]), null);
});

test('audio mapping: pan follows x, pitch rises with y', () => {
  assert.equal(panFor(0), 0);
  assert.ok(panFor(-0.1) < -0.2, 'small offsets are exaggerated');
  assert.equal(panFor(-5), -1);
  assert.equal(freqFor(0), 440);
  assert.ok(freqFor(1) > freqFor(0.2) && freqFor(0.2) > 440 && freqFor(-0.2) < 440);
});
