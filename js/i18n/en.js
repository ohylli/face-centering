// English strings. To add a language, copy this file, translate it, and
// register it in ./index.js. Word order is up to each locale: `describe`
// receives the levels and returns the whole phrase.

const AMOUNT_XY = { 1: 'a little ', 2: '', 3: 'far ' };
const AMOUNT_D = { 1: 'a little ', 2: '' };

export default {
  lang: 'en',

  /**
   * @param {{x:number,y:number,d:number}|null} lv levels, null = no face
   */
  describe(lv) {
    if (!lv) return 'no face';
    const parts = [];
    if (lv.x) parts.push(AMOUNT_XY[Math.abs(lv.x)] + (lv.x < 0 ? 'left' : 'right'));
    if (lv.y) parts.push(AMOUNT_XY[Math.abs(lv.y)] + (lv.y < 0 ? 'down' : 'up'));
    if (lv.d) parts.push(AMOUNT_D[Math.abs(lv.d)] + (lv.d < 0 ? 'distant' : 'close'));
    return parts.length ? parts.join(', ') : 'centered';
  },

  status: {
    loading: 'Loading face detector',
    started: (camera) => `Started. ${camera}`,
    stopped: 'Stopped',
    camera: (label) => `Camera: ${label}`,
    cameraUnnamed: (n) => `Camera ${n}`,
    cameraDefault: 'Default camera',
    cameraNone: 'None, press Start',
    inUseNone: 'none',
    cameraGone: 'Camera disconnected',
    idealSet: 'Ideal distance set',
    idealReset: 'Ideal distance reset',
    idealNoFace: 'No face, ideal distance not set',
    notRunning: 'Not running',
    errPermission: 'Camera permission denied. Allow camera access in the address bar, then press Start.',
    errNoCamera: 'No camera found',
    errInUse: 'Camera is in use by another app or cannot be opened',
    errDetector: 'Face detector failed to load',
    errGeneric: (msg) => `Error: ${msg}`,
  },

  ui: {
    start: 'Start',
    stop: 'Stop',
  },
};
