// User settings, remembered in this browser only.

const KEY = 'face-centering-settings-v1';

export const DEFAULTS = {
  output: 'both', // 'both' | 'speech' | 'sound'
  tolerance: 'normal', // 'tight' | 'normal' | 'loose'
  distance: true,
  idealSize: 0.4, // face height as a fraction of frame height
  speechDelay: 400, // ms a position must hold before it is spoken
  liveMode: 'assertive', // 'assertive' | 'polite'
  volume: 0.5,
  blipInterval: 300, // ms between blips
  centeredTick: false,
  swapLeftRight: false,
  cameraId: '',
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // Storage unavailable or corrupt: fall back to defaults.
  }
  return { ...DEFAULTS };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Not fatal: settings just won't persist.
  }
}
