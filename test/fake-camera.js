// Test helper: replaces the webcam with a canvas showing a face photo that
// tests can move around. Inject before the app loads (e.g. Playwright
// addInitScript). Control it with window.__fakeCam.set(u, v, size), where
// u, v are the face center in [0,1] image coordinates and size is the photo
// height as a fraction of the frame height. set(null) hides the face.
(() => {
  const W = 1280;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  const img = new Image();
  img.src = '/test/fixtures/portrait.jpg';
  let pos = { u: 0.5, v: 0.5, size: 1 };

  function paint() {
    g.fillStyle = '#6b7b8c';
    g.fillRect(0, 0, W, H);
    if (pos && img.complete && img.naturalWidth) {
      const h = pos.size * H;
      const w = (h * img.naturalWidth) / img.naturalHeight;
      g.drawImage(img, pos.u * W - w / 2, pos.v * H - h / 2, w, h);
    }
    requestAnimationFrame(paint);
  }
  paint();

  const fakeDevices = [
    { deviceId: 'fake-front', groupId: 'g1', kind: 'videoinput', label: 'Fake Front Camera' },
    { deviceId: 'fake-usb', groupId: 'g2', kind: 'videoinput', label: 'Fake USB Camera' },
  ];
  let current = null;

  navigator.mediaDevices.getUserMedia = async (constraints) => {
    const want = constraints?.video?.deviceId?.exact;
    current = fakeDevices.find((d) => d.deviceId === want) ?? fakeDevices[0];
    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    Object.defineProperty(track, 'label', { value: current.label });
    const orig = track.getSettings.bind(track);
    track.getSettings = () => ({ ...orig(), deviceId: current.deviceId });
    return stream;
  };
  navigator.mediaDevices.enumerateDevices = async () => (current ? fakeDevices : fakeDevices.map((d) => ({ ...d, deviceId: '', label: '' })));

  window.__fakeCam = {
    set(u, v, size = 1) {
      pos = u === null ? null : { u, v, size };
    },
  };
})();
