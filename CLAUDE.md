# Face Centering

Static web app that tells a blind user, by screen reader speech and audio cues, whether their face is centered in the webcam. Used to check framing before a video call. Live at https://ohylli.github.io/face-centering/.

The owner is blind and uses NVDA with Chrome. NVDA + Chrome is the primary target for every accessibility decision.

## Commands

```bash
npm test                          # unit tests (node --test, no dependencies)
python -m http.server 8080        # local server; .claude/launch.json "static" does the same
npm run vendor                    # refresh vendor/ after bumping @mediapipe/tasks-vision
```

## Deployment

- GitHub Pages serves the root of `main`. Every push to `main` goes live, so only push working code.
- The remote uses SSH: `git@github.com:ohylli/face-centering.git`.

## Architecture

There is no build step and no framework: plain HTML, CSS and JavaScript ES modules. Keep it that way so the repo stays directly deployable.

- `js/position.js`: pure logic. It turns a face box into signed per-axis levels `{x, y, d}`, with hysteresis.
- `js/settle.js`: pure logic. It reports a state only after it has held steady and differs from the last report.
- `js/i18n/`: all user-facing strings. `describe(levels)` builds the spoken phrase and owns word order per locale.
- `js/audio.js`: Web Audio. Blips (pan = x, pitch = y), a chime when centered, a falling tone when the face is lost.
- `js/camera.js`, `js/detector.js`, `js/main.js`: getUserMedia, MediaPipe, and UI wiring plus the frame loop (setTimeout, about 20 fps).
- `vendor/`: MediaPipe runtime and the BlazeFace short-range model, committed on purpose so there is no CDN at runtime. The bundle is renamed from `.mjs` to `.js` because some servers send `.mjs` as `text/plain`. See `vendor/README.md`.

### Level conventions

- **x:** negative is left, positive is right, from the user's own (mirrored) perspective. The camera image is not mirrored, so image right is the user's left. The `swapLeftRight` setting handles cameras that already mirror.
- **y:** positive is up.
- **d:** positive is close, negative is distant. It is `log2(faceHeight / frameHeight / idealSize)`.
- **Magnitudes:** 0 is centered. For x and y, 1, 2 and 3 are "a little", plain and "far". For d, 1 and 2 are "a little" and plain.

## Speech wording rules (agreed with the owner)

- **Terse:** never add filler like "your face is". Order is horizontal, vertical, then distance. Parts are joined with ", ". Examples: "a little left, far up", "down, close", "centered", "no face".
- **Describe position, not instructions:** say "left", not "move right".
- **Distance words:** "close" and "distant". "far" is reserved for being near an edge.
- **Announce only on change**, after the settle delay. Status messages (start, camera, errors) briefly hold position speech (`quietUntil`) so they are heard.
- **One live region:** `#announcer`, `aria-live` assertive by default (setting). A toggled trailing no-break space makes identical repeats re-read.

## Accessibility conventions

- Use native controls with real labels: button, select, radio, checkbox and fieldset/legend. Navigate by headings. Don't use `role="application"`.
- Shortcuts are Alt+Shift+W ("Where am I") and Alt+Shift+S (start/stop), matched with `e.code` so they work on any keyboard layout. Single-key shortcuts would clash with NVDA browse mode.
- The video preview is for sighted helpers. It is mirrored (selfie view) and `aria-hidden`.

## Localization

English only for now. Every user-facing string goes in `js/i18n/en.js`; never hard-code text in `main.js` or `index.html` logic. To add a language, add a file and register it in `js/i18n/index.js`.

## Testing

- **Unit tests:** `test/position.test.js` covers the levels, wording, settling and the audio mapping. Keep the pure modules free of browser APIs.
- **Browser tests:** use the Playwright MCP. `test/fake-camera.js` (injected with `addInitScript`) replaces getUserMedia and enumerateDevices with a canvas showing a face photo, which you move with `window.__fakeCam.set(u, v, size)`. It also provides two fake cameras. To run the scenario, pass `test/e2e-scenario.js` as `filename` to `browser_run_code_unsafe`. It needs the local server on port 8080.
- **Test photo:** `test/fixtures/portrait.jpg` is gitignored. Download it with the command in the README.
- **Inspecting state:** `window.__faceCentering.state` exposes `running`, `current` levels, the face box and the settings.
- **Console noise:** MediaPipe prints an INFO line through console.error ("Created TensorFlow Lite XNNPACK delegate"). It is harmless.
- **Agreed decisions:** check with the owner before changing the wording, the audio mapping, or the default thresholds.
