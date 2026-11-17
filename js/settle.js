// Reports a state only after it has stayed the same for a while, and only
// when it differs from the last reported one. Pure and clock-agnostic.

/**
 * @param {{settleMs:number, noFaceSettleMs?:number}} opts
 */
export function createSettler(opts) {
  let candidate = null;
  let candidateSince = 0;
  let reported = null;

  return {
    /**
     * @param {string} key current state key ('none' = no face)
     * @param {number} now milliseconds
     * @returns {string|null} key to report, or null when nothing new
     */
    update(key, now) {
      if (key !== candidate) {
        candidate = key;
        candidateSince = now;
      }
      if (candidate === reported) return null;
      const wait = candidate === 'none' ? (opts.noFaceSettleMs ?? opts.settleMs) : opts.settleMs;
      if (now - candidateSince >= wait) {
        reported = candidate;
        return reported;
      }
      return null;
    },
    get reported() {
      return reported;
    },
    setSettleMs(ms) {
      opts.settleMs = ms;
    },
    reset() {
      candidate = null;
      reported = null;
    },
  };
}
