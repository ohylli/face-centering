// Audio cues with the Web Audio API.
// Repeating blips: stereo pan = left/right, pitch = up/down.
// A chime when centered, a low tone when the face is lost.

const BASE_FREQ = 440; // pitch at vertical center
const OCTAVES = 1; // pitch range each way
const CURVE = 0.6; // < 1 exaggerates small offsets near the center

/** Map an offset in [-1, 1] through a curve that makes small offsets audible. */
export function shape(v) {
  const c = Math.max(-1, Math.min(1, v));
  return Math.sign(c) * Math.pow(Math.abs(c), CURVE);
}

export function panFor(x) {
  return shape(x);
}

export function freqFor(y) {
  return BASE_FREQ * Math.pow(2, shape(y) * OCTAVES);
}

export function createAudio() {
  /** @type {AudioContext|null} */
  let ctx = null;
  let master = null;
  let timer = null;
  let enabled = true;
  let volume = 0.5;
  let interval = 300;
  let centeredTick = false;

  // Latest continuous position and the settled state.
  let pos = { x: 0, y: 0 };
  let state = 'none'; // 'none' | 'centered' | 'off'

  function ensure() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone({ freq, pan = 0, type = 'triangle', at = 0, dur = 0.08, peak = 0.6, endFreq }) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    panner.pan.setValueAtTime(pan, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(panner).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function blip() {
    tone({ freq: freqFor(pos.y), pan: panFor(pos.x), type: 'triangle', dur: 0.07, peak: 0.5 });
  }

  function chime() {
    // Two bell-like sine notes, rising: clearly different from the blips.
    tone({ freq: 1046.5, type: 'sine', dur: 0.35, peak: 0.45 });
    tone({ freq: 1568, type: 'sine', at: 0.11, dur: 0.5, peak: 0.4 });
  }

  function tick() {
    tone({ freq: 2093, type: 'sine', dur: 0.03, peak: 0.12 });
  }

  function lost() {
    tone({ freq: 196, endFreq: 98, type: 'sawtooth', dur: 0.35, peak: 0.25 });
  }

  let lastTick = 0;
  function loop() {
    timer = setTimeout(loop, interval);
    if (!enabled || !ctx) return;
    if (state === 'off') blip();
    else if (state === 'centered' && centeredTick) {
      const now = performance.now();
      if (now - lastTick >= 1500) {
        lastTick = now;
        tick();
      }
    }
  }

  return {
    /** Must be called from a user gesture (e.g. the Start button). */
    start() {
      ensure();
      if (!timer) loop();
    },
    stop() {
      clearTimeout(timer);
      timer = null;
      state = 'none';
    },
    /** Continuous position for pan and pitch. */
    setPosition(x, y) {
      pos = { x, y };
    },
    /**
     * Settled state change.
     * @param {'none'|'centered'|'off'} next
     */
    setState(next) {
      const prev = state;
      state = next;
      if (!enabled || !ctx || prev === next) return;
      if (next === 'centered') {
        chime();
        lastTick = performance.now();
      } else if (next === 'none' && prev !== 'none') lost();
    },
    /** Play a short sample so the user can hear the cues. */
    preview(kind) {
      ensure();
      if (kind === 'centered') chime();
      else if (kind === 'none') lost();
      else blip();
    },
    configure(opts) {
      if (opts.enabled !== undefined) enabled = opts.enabled;
      if (opts.volume !== undefined) {
        volume = opts.volume;
        if (master) master.gain.value = volume;
      }
      if (opts.interval !== undefined) interval = opts.interval;
      if (opts.centeredTick !== undefined) centeredTick = opts.centeredTick;
    },
  };
}
