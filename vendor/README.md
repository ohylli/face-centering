# Vendored files

Served as-is so the app needs no third-party CDN at runtime.

- `mediapipe/` — from npm `@mediapipe/tasks-vision@1.2.3` (Apache-2.0):
  `vision_bundle.mjs` renamed to `vision_bundle.js` (some servers send `.mjs`
  with the wrong MIME type), plus `wasm/vision_wasm_internal.{js,wasm}`.
- `models/blaze_face_short_range.tflite` — MediaPipe BlazeFace short-range
  face detector (Apache-2.0), from
  https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite

To update, run `npm install` with the new version and `npm run vendor`.
