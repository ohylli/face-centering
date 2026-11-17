// Copies MediaPipe runtime files from node_modules into vendor/ and
// downloads the face detection model.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const src = 'node_modules/@mediapipe/tasks-vision';
await mkdir('vendor/mediapipe/wasm', { recursive: true });
await mkdir('vendor/models', { recursive: true });

const bundle = await readFile(`${src}/vision_bundle.mjs`, 'utf8');
await writeFile('vendor/mediapipe/vision_bundle.js', bundle.replace(/\/\/# sourceMappingURL=.*$/m, ''));
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  await copyFile(`${src}/wasm/${f}`, `vendor/mediapipe/wasm/${f}`);
}

const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const res = await fetch(MODEL);
if (!res.ok) throw new Error(`Model download failed: ${res.status}`);
await writeFile('vendor/models/blaze_face_short_range.tflite', Buffer.from(await res.arrayBuffer()));
console.log('Vendored MediaPipe files and model.');
