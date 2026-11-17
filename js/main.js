import { offsets, levels, stateKey, smoothBox, largestBox, TOLERANCES } from './position.js';
import { createSettler } from './settle.js';
import { createAudio } from './audio.js';
import { createCamera } from './camera.js';
import { createDetector } from './detector.js';
import { loadSettings, saveSettings, DEFAULTS } from './settings.js';
import { getLocale } from './i18n/index.js';

const t = getLocale(document.documentElement.lang);
const settings = loadSettings();
const $ = (id) => document.getElementById(id);

const els = {
  start: $('start'),
  where: $('where'),
  announcer: $('announcer'),
  camera: $('camera'),
  cameraLabel: $('camera-label'),
  preview: $('preview'),
  video: $('video'),
  overlay: $('overlay'),
};

const camera = createCamera(els.video);
const audio = createAudio();
let detector = null;

let running = false;
let starting = false;
let loopTimer = null;
let box = null; // smoothed face box in video pixels
let lastLevels = null; // kept across short dropouts for hysteresis
let current = null; // levels for this frame, or null if no face
let quietUntil = 0; // hold position speech so status messages are heard

const speechSettler = createSettler({ settleMs: settings.speechDelay, noFaceSettleMs: 800 });
const audioSettler = createSettler({ settleMs: 120, noFaceSettleMs: 500 });

// ---------- Announcements ----------

let flip = false;
/** Write to the live region. A toggled trailing no-break space makes repeats re-read. */
function announce(text) {
  flip = !flip;
  els.announcer.textContent = text + (flip ? ' ' : '');
}

function status(text) {
  announce(text);
  quietUntil = performance.now() + 1500;
}

const speechOn = () => settings.output !== 'sound';
const soundOn = () => settings.output !== 'speech';

// ---------- Main loop ----------

function frame() {
  loopTimer = setTimeout(frame, 50);
  const v = els.video;
  if (!running || !detector || v.readyState < 2 || !v.videoWidth) return;

  const now = performance.now();
  const raw = largestBox(detector.detect(v));
  let off = null;
  if (raw) {
    box = smoothBox(box, raw, 0.5);
    off = offsets(box, v.videoWidth, v.videoHeight, settings);
    lastLevels = levels(off, lastLevels, settings);
    current = lastLevels;
    audio.setPosition(off.x, off.y);
  } else {
    box = null;
    current = null;
  }

  const key = stateKey(current);

  const aKey = audioSettler.update(key, now);
  if (aKey) audio.setState(aKey === 'none' ? 'none' : aKey === '0,0,0' ? 'centered' : 'off');

  if (now >= quietUntil) {
    const sKey = speechSettler.update(key, now);
    if (sKey && speechOn()) announce(t.describe(current));
  }

  draw(v.videoWidth, v.videoHeight);
}

function draw(w, h) {
  const c = els.overlay;
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
    els.preview.style.aspectRatio = `${w} / ${h}`;
  }
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  const lw = Math.max(2, Math.round(w / 300));

  // Centered zone and crosshair.
  const tol = TOLERANCES[settings.tolerance] ?? TOLERANCES.normal;
  g.setLineDash([lw * 4, lw * 3]);
  g.lineWidth = lw;
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.strokeRect(w / 2 - (tol * w) / 2, h / 2 - (tol * h) / 2, tol * w, tol * h);
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(w / 2, 0);
  g.lineTo(w / 2, h);
  g.moveTo(0, h / 2);
  g.lineTo(w, h / 2);
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.stroke();

  if (box && current) {
    const ok = current.x === 0 && current.y === 0;
    g.lineWidth = lw * 2;
    g.strokeStyle = ok ? (current.d === 0 ? '#2ecc40' : '#ffdc00') : '#ff851b';
    g.strokeRect(box.x, box.y, box.width, box.height);
    // Face center dot.
    g.fillStyle = g.strokeStyle;
    g.beginPath();
    g.arc(box.x + box.width / 2, box.y + box.height / 2, lw * 3, 0, Math.PI * 2);
    g.fill();
  }
}

// ---------- Start / stop ----------

function errorText(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return t.status.errPermission;
    case 'NotFoundError':
    case 'OverconstrainedError':
      return t.status.errNoCamera;
    case 'NotReadableError':
    case 'AbortError':
      return t.status.errInUse;
    case 'DetectorError':
      return t.status.errDetector;
    default:
      return t.status.errGeneric(err?.message ?? String(err));
  }
}

async function loadDetector() {
  if (detector) return;
  try {
    detector = await createDetector();
  } catch (err) {
    console.error(err);
    const e = new Error(err?.message ?? 'detector');
    e.name = 'DetectorError';
    throw e;
  }
}

function resetTracking() {
  box = null;
  lastLevels = null;
  current = null;
  speechSettler.reset();
  audioSettler.reset();
  audio.setState('none');
}

function onTrackEnded() {
  if (!running) return;
  stop(t.status.cameraGone);
}

async function openCamera(deviceId) {
  const cam = await camera.open(deviceId);
  camera.track?.addEventListener('ended', onTrackEnded);
  settings.cameraId = cam.deviceId;
  saveSettings(settings);
  await populateCameras();
  const label = cameraName(cam.label);
  els.cameraLabel.textContent = label;
  return label;
}

async function start() {
  if (running || starting) return;
  starting = true;
  audio.start(); // needs the click gesture
  try {
    const needLoad = !detector;
    if (needLoad) status(t.status.loading);
    const [label] = await Promise.all([openCamera(settings.cameraId), loadDetector()]);
    resetTracking();
    running = true;
    els.start.textContent = t.ui.stop;
    status(t.status.started(t.status.camera(label)));
    clearTimeout(loopTimer);
    frame();
  } catch (err) {
    console.error(err);
    camera.close();
    status(errorText(err));
  } finally {
    starting = false;
  }
}

function stop(message = t.status.stopped) {
  running = false;
  clearTimeout(loopTimer);
  loopTimer = null;
  audio.stop();
  camera.close();
  resetTracking();
  els.start.textContent = t.ui.start;
  els.cameraLabel.textContent = t.status.inUseNone;
  draw(els.overlay.width, els.overlay.height);
  status(message);
}

function toggle() {
  if (running) stop();
  else start();
}

function where() {
  if (!running) announce(t.status.notRunning);
  else announce(t.describe(current));
}

// ---------- Camera list ----------

function cameraName(label, index = 0) {
  return label || t.status.cameraUnnamed(index + 1);
}

async function populateCameras() {
  let cams = [];
  try {
    cams = await camera.list();
  } catch {
    return;
  }
  const sel = els.camera;
  sel.replaceChildren();
  if (!cams.length || cams.every((c) => !c.deviceId)) {
    // Not yet permitted: device ids and labels are hidden.
    sel.append(new Option(running ? t.status.cameraDefault : t.status.cameraNone, ''));
    return;
  }
  cams.forEach((c, i) => sel.append(new Option(cameraName(c.label, i), c.deviceId)));
  sel.value = settings.cameraId;
  if (sel.selectedIndex < 0) sel.selectedIndex = 0;
}

els.camera.addEventListener('change', async () => {
  settings.cameraId = els.camera.value;
  saveSettings(settings);
  if (!running) return;
  try {
    const label = await openCamera(settings.cameraId);
    resetTracking();
    status(t.status.camera(label));
  } catch (err) {
    console.error(err);
    stop(errorText(err));
  }
});

navigator.mediaDevices?.addEventListener('devicechange', () => {
  populateCameras();
});

// ---------- Settings UI ----------

function applySettings() {
  audio.configure({
    enabled: soundOn(),
    volume: settings.volume,
    interval: settings.blipInterval,
    centeredTick: settings.centeredTick,
  });
  speechSettler.setSettleMs(settings.speechDelay);
  els.announcer.setAttribute('aria-live', settings.liveMode);
  els.preview.classList.toggle('mirrored', !settings.swapLeftRight);
}

function bind() {
  for (const r of document.querySelectorAll('input[name="output"]')) {
    r.checked = r.value === settings.output;
    r.addEventListener('change', () => {
      if (r.checked) update({ output: r.value });
    });
  }
  const selects = { tolerance: String, speechDelay: Number, liveMode: String, blipInterval: Number };
  for (const [id, conv] of Object.entries(selects)) {
    const el = $(id);
    el.value = String(settings[id]);
    el.addEventListener('change', () => update({ [id]: conv(el.value) }));
  }
  for (const id of ['distance', 'centeredTick', 'swapLeftRight']) {
    const el = $(id);
    el.checked = !!settings[id];
    el.addEventListener('change', () => update({ [id]: el.checked }));
  }
  const vol = $('volume');
  vol.value = String(Math.round(settings.volume * 100));
  vol.addEventListener('input', () => update({ volume: Number(vol.value) / 100 }));

  $('set-ideal').addEventListener('click', () => {
    const v = els.video;
    if (!running || !box || !v.videoHeight) {
      announce(running ? t.status.idealNoFace : t.status.notRunning);
      return;
    }
    update({ idealSize: box.height / v.videoHeight });
    lastLevels = null;
    announce(t.status.idealSet);
  });
  $('reset-ideal').addEventListener('click', () => {
    update({ idealSize: DEFAULTS.idealSize });
    lastLevels = null;
    announce(t.status.idealReset);
  });
  for (const b of document.querySelectorAll('[data-preview]')) {
    b.addEventListener('click', () => audio.preview(b.dataset.preview));
  }

  els.start.addEventListener('click', toggle);
  els.where.addEventListener('click', where);

  document.addEventListener('keydown', (e) => {
    if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (e.code === 'KeyW') {
      e.preventDefault();
      where();
    } else if (e.code === 'KeyS') {
      e.preventDefault();
      toggle();
    }
  });
}

function update(patch) {
  Object.assign(settings, patch);
  saveSettings(settings);
  applySettings();
}

bind();
applySettings();
populateCameras();

// Hook for automated tests; harmless otherwise.
window.__faceCentering = {
  get state() {
    return { running, current, box, settings: { ...settings } };
  },
};
