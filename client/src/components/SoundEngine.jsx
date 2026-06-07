import React, { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SOUND ENGINE — Web Audio API Synthesized Ambient Sound System
   Zero audio file dependencies — everything is procedurally generated.
   ═══════════════════════════════════════════════════════════════════════════ */

// Singleton audio context
let audioCtx = null;
let masterGain = null;
let droneNodes = null;
let initialized = false;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);
  }
  return { ctx: audioCtx, master: masterGain };
}

/* ── Create ambient drone ──────────────────────────────────────────────── */
function createDrone() {
  const { ctx, master } = getAudioCtx();

  // Low frequency oscillator — eerie base tone
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 55; // Low A
  const gain1 = ctx.createGain();
  gain1.gain.value = 0.06;

  // Sub-bass rumble
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 36;
  const gain2 = ctx.createGain();
  gain2.gain.value = 0.04;

  // Detuned eerie oscillator
  const osc3 = ctx.createOscillator();
  osc3.type = "sawtooth";
  osc3.frequency.value = 110.5; // Slightly detuned
  const gain3 = ctx.createGain();
  gain3.gain.value = 0.012;
  const filter3 = ctx.createBiquadFilter();
  filter3.type = "lowpass";
  filter3.frequency.value = 200;
  filter3.Q.value = 2;

  // Filtered noise — wind/static
  const bufferSize = ctx.sampleRate * 4;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.015;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 0.5;

  // Slow LFO to modulate the filter — breathing effect
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.08; // Very slow
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 80;
  lfo.connect(lfoGain);
  lfoGain.connect(noiseFilter.frequency);

  // Connect all
  osc1.connect(gain1).connect(master);
  osc2.connect(gain2).connect(master);
  osc3.connect(filter3).connect(gain3).connect(master);
  noiseNode.connect(noiseFilter).connect(noiseGain).connect(master);

  // Start all
  osc1.start(); osc2.start(); osc3.start(); noiseNode.start(); lfo.start();

  return { osc1, osc2, osc3, noiseNode, lfo, gains: [gain1, gain2, gain3, noiseGain] };
}

/* ── UI Click Sound ────────────────────────────────────────────────────── */
function playClickSound() {
  if (!audioCtx || !masterGain || masterGain.gain.value === 0) return;
  const { ctx, master } = getAudioCtx();

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 880;
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.06);

  const gain = ctx.createGain();
  gain.gain.value = 0.04;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain).connect(master);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/* ── Glitch Burst Sound ────────────────────────────────────────────────── */
function playGlitchSound() {
  if (!audioCtx || !masterGain || masterGain.gain.value === 0) return;
  const { ctx, master } = getAudioCtx();

  const bufLen = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.3));
  }

  const source = ctx.createBufferSource();
  source.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = 0.06;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  source.connect(gain).connect(master);
  source.start();
}

/* ── Expose sound functions globally ───────────────────────────────────── */
if (typeof window !== "undefined") {
  window.__soundEngine = { playClickSound, playGlitchSound };
}

/* ── Sound Engine React Component ──────────────────────────────────────── */
export default function SoundEngine() {
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sound_muted") !== "false";
  });
  const droneRef = useRef(null);

  const initAudio = useCallback(() => {
    if (initialized) return;
    const { ctx, master } = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    droneRef.current = createDrone();
    initialized = true;
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      if (!muted && masterGain) {
        masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.5);
      }
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
    window.addEventListener("click", handleInteraction, { once: false });
    window.addEventListener("keydown", handleInteraction, { once: false });
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [muted]);

  // Toggle mute/unmute
  useEffect(() => {
    if (!masterGain || !audioCtx) return;
    if (muted) {
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    } else {
      if (audioCtx.state === "suspended") audioCtx.resume();
      masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.5);
    }
    localStorage.setItem("sound_muted", muted ? "true" : "false");
  }, [muted]);

  // Add click sounds to all buttons
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest("button") || e.target.closest("a") || e.target.closest(".pointer")) {
        playClickSound();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <button
      className="sound-toggle"
      onClick={(e) => {
        e.stopPropagation();
        initAudio();
        setMuted(m => !m);
      }}
      title={muted ? "Enable Sound" : "Mute Sound"}
      aria-label={muted ? "Enable Sound" : "Mute Sound"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

export { playClickSound, playGlitchSound };
