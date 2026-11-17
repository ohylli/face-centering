// MediaPipe face detector, loaded from files vendored in this repo so the
// app works without third-party CDNs and no image data leaves the device.

const VISION_URL = new URL('../vendor/mediapipe/vision_bundle.js', import.meta.url).href;
const WASM_URL = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL_URL = new URL('../vendor/models/blaze_face_short_range.tflite', import.meta.url).href;

export async function createDetector() {
  const { FaceDetector, FilesetResolver } = await import(VISION_URL);
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const detector = await FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.5,
  });

  let lastTs = 0;
  return {
    /** @param {HTMLVideoElement} video */
    detect(video) {
      // Timestamps must strictly increase.
      const ts = Math.max(performance.now(), lastTs + 1);
      lastTs = ts;
      return detector.detectForVideo(video, ts).detections;
    },
    close() {
      detector.close();
    },
  };
}
