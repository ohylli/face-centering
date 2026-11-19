// English strings. To add a language, copy this file, translate it, and
// register it in ./index.js. Word order is up to each locale: `describe`
// receives the levels and returns the whole phrase.
//
// `ui` keys match the data-i18n attributes in index.html. The English text
// is also written in index.html as a fallback; test/i18n.test.js keeps the
// two in sync.

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
    title: 'Face Centering',
    description: 'Tells you by speech and sound whether your face is centered in your webcam.',
    start: 'Start',
    stop: 'Stop',
    where: 'Where am I',

    cameraHeading: 'Camera',
    camera: 'Camera',
    inUse: 'In use:',
    swapLeftRight: 'Swap left and right (only if left and right come out reversed)',

    settingsHeading: 'Settings',
    language: 'Language',
    feedback: 'Feedback',
    outputBoth: 'Speech and sounds',
    outputSpeech: 'Speech only',
    outputSound: 'Sounds only',

    position: 'Position',
    tolerance: 'Centered zone',
    toleranceTight: 'Small',
    toleranceNormal: 'Medium',
    toleranceLoose: 'Large',
    distance: 'Distance feedback (close, distant)',
    setIdeal: 'Set current distance as ideal',
    resetIdeal: 'Reset ideal distance',

    speech: 'Speech',
    speechDelay: 'Delay before speaking',
    delayShort: 'Short',
    delayMedium: 'Medium',
    delayLong: 'Long',
    liveMode: 'New position',
    liveAssertive: 'Interrupts speech',
    livePolite: 'Waits for speech to finish',

    sounds: 'Sounds',
    volume: 'Volume',
    blipInterval: 'Blip speed',
    blipSlow: 'Slow',
    blipMedium: 'Medium',
    blipFast: 'Fast',
    centeredTick: 'Soft tick while centered',
    previewOff: 'Play blip',
    previewCentered: 'Play centered sound',
    previewNone: 'Play face lost sound',

    helpHeading: 'Help',
    helpIntro: 'Press Start and allow camera access. Directions are from your own point of view.',
    helpSpeech: 'Speech: left or right first, then up or down, then distance. Each can be "a little", plain, or "far". "Centered" means all good.',
    helpSounds: 'Sounds: blips pan left or right with your face, and go higher when your face is high, lower when it is low. Blips stop and a rising chime plays when you are centered. A falling tone means the face was lost.',
    helpDistance: 'Distance: if blips keep playing in the middle while you are centered, you are too close or too distant. Sit where you want to be and press "Set current distance as ideal".',
    helpShortcuts: 'Shortcuts: Alt+Shift+W says where you are. Alt+Shift+S starts or stops.',
    helpPrivacy: 'Privacy: everything runs in your browser. Video never leaves your computer.',
    helpSource: 'Source code and instructions on GitHub',
  },
};
