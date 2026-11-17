// Camera access and selection.

export function createCamera(video) {
  /** @type {MediaStream|null} */
  let stream = null;

  return {
    /**
     * Open a camera. Falls back to any camera if the given one is gone.
     * @param {string} [deviceId]
     * @returns {Promise<{deviceId:string,label:string}>}
     */
    async open(deviceId) {
      this.close();
      const video16x9 = { width: { ideal: 1280 }, height: { ideal: 720 } };
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId ? { ...video16x9, deviceId: { exact: deviceId } } : video16x9,
        });
      } catch (err) {
        if (deviceId && (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')) {
          return this.open('');
        }
        throw err;
      }
      video.srcObject = stream;
      await video.play();
      const track = stream.getVideoTracks()[0];
      return { deviceId: track.getSettings().deviceId ?? '', label: track.label };
    },

    close() {
      if (stream) for (const t of stream.getTracks()) t.stop();
      stream = null;
      video.srcObject = null;
    },

    /** Current track, if any (for detecting a disconnect). */
    get track() {
      return stream?.getVideoTracks()[0] ?? null;
    },

    async list() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    },
  };
}
