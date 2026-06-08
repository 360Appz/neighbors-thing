/* Tiny Web Audio sound engine — playful synthesized blips, no audio files needed. */
window.SFX = (function () {
  let ctx = null;
  let enabled = JSON.parse(localStorage.getItem("intel_sound") ?? "true");

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, dur = 0.12, type = "sine", gain = 0.05, slideTo = null, delay = 0 }) {
    if (!enabled) return;
    try {
      const c = getCtx();
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* ignore */ }
  }

  return {
    isEnabled: () => enabled,
    toggle() {
      enabled = !enabled;
      localStorage.setItem("intel_sound", JSON.stringify(enabled));
      if (enabled) this.click();
      return enabled;
    },
    click() { tone({ freq: 720, dur: 0.07, type: "triangle", gain: 0.045, slideTo: 920 }); },
    hover() { tone({ freq: 540, dur: 0.05, type: "sine", gain: 0.018, slideTo: 600 }); },
    open() {
      tone({ freq: 360, dur: 0.16, type: "sine", gain: 0.05, slideTo: 540 });
      tone({ freq: 720, dur: 0.18, type: "triangle", gain: 0.03, delay: 0.05, slideTo: 880 });
    },
    close() { tone({ freq: 480, dur: 0.12, type: "sine", gain: 0.04, slideTo: 280 }); },
    correct() {
      tone({ freq: 523, dur: 0.12, type: "triangle", gain: 0.05 });
      tone({ freq: 659, dur: 0.12, type: "triangle", gain: 0.05, delay: 0.09 });
      tone({ freq: 880, dur: 0.18, type: "triangle", gain: 0.06, delay: 0.18 });
    },
    wrong() {
      tone({ freq: 320, dur: 0.18, type: "sawtooth", gain: 0.04, slideTo: 180 });
    },
    swoosh() { tone({ freq: 200, dur: 0.3, type: "sine", gain: 0.04, slideTo: 700 }); },
    shuffle() {
      [600, 760, 920].forEach((f, idx) => tone({ freq: f, dur: 0.08, type: "square", gain: 0.025, delay: idx * 0.05 }));
    },
    win() {
      [523, 659, 784, 1047].forEach((f, idx) => tone({ freq: f, dur: 0.22, type: "triangle", gain: 0.06, delay: idx * 0.1 }));
    }
  };
})();
