# Face Centering

A web page that tells you, by speech and sound, whether your face is centered in your webcam. It's built for blind and low-vision users who want to check their framing before a video call.

Everything runs in your browser. No video or images leave your computer.

**Use it here: https://ohylli.github.io/face-centering/**

## Using it

1. Open the page and press **Start**. Allow camera access when Chrome asks.
2. Listen:
   - **Speech** goes through your screen reader via an ARIA live region. It is terse: left or right first, then up or down, then distance. Examples: "a little left, far up", "down, close", "centered", "no face". Each direction has the levels "a little", plain and "far". Distance has "a little" and plain.
   - **Sounds** are repeating blips. Stereo pan follows left and right. Pitch goes higher when your face is high in the picture and lower when it is low. When you are centered the blips stop and a rising chime plays. A falling tone means the face was lost.
3. Directions are from your own point of view: "left" means you are too far to your left.
4. Distance: sit where you want to be and press **Set current distance as ideal**.

The page also shows the video for sighted helpers, mirrored like a selfie view. It has a crosshair, the centered zone as a dashed box, and the detected face as a box: green when centered, yellow when only the distance is off, orange otherwise.

### Settings

All settings are remembered in this browser.

- **Feedback:** speech and sounds, speech only, or sounds only.
- **Centered zone:** small, medium or large.
- **Distance feedback:** on or off, plus setting and resetting the ideal distance.
- **Delay before speaking:** how long a position must hold before it is spoken. This avoids chatter while you move.
- **New position:** whether a new position interrupts speech (`aria-live="assertive"`) or waits for it to finish (`polite`).
- **Volume** and **blip speed**, plus an optional soft tick while centered.
- **Camera:** choose the camera. The camera in use is shown and announced.
- **Swap left and right:** only needed for cameras that already mirror their image.

### Shortcuts

- **Alt+Shift+W:** where am I (repeats the current position).
- **Alt+Shift+S:** start or stop.

## Hosting on GitHub Pages

The site is static files with no build step. GitHub Pages serves the `main` branch root, so every push to `main` updates https://ohylli.github.io/face-centering/.

Camera access needs HTTPS or localhost. GitHub Pages provides HTTPS.

## Development

The project uses plain HTML, CSS and JavaScript ES modules. There is no framework and no bundler. Face detection uses MediaPipe's BlazeFace short-range model, vendored under `vendor/` (see `vendor/README.md`).

- `js/position.js`: face box to per-axis levels, with hysteresis (pure, unit tested).
- `js/settle.js`: reports a state only after it holds steady (pure, unit tested).
- `js/i18n/`: all user-facing text. To add a language, copy `en.js`, translate it, and register the copy in `index.js`. The `describe()` function owns word order.
- `js/audio.js`: Web Audio blips, chime and lost tone.
- `js/camera.js`, `js/detector.js`, `js/main.js`: camera, MediaPipe and UI wiring.

Commands:

```bash
npm test
```

```bash
python -m http.server 8080
```

### Browser tests

`test/fake-camera.js` replaces the webcam with a canvas showing a face photo that tests can move around. `test/e2e-scenario.js` is a Playwright scenario that drives the page with it and records every live region update. Run it through the Playwright MCP `browser_run_code_unsafe` tool, passing the file as `filename`.

The test photo is not committed. Download it once:

```bash
curl -L --create-dirs -o test/fixtures/portrait.jpg https://storage.googleapis.com/mediapipe-assets/portrait.jpg
```
