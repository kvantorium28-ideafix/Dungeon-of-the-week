// звуки делаем прямо в браузере, файлов нет. сначала выключены

const KEY = 'danzh-sound';
let ctx = null;
let enabled = false;

try { enabled = localStorage.getItem(KEY) === 'on'; } catch { enabled = false; }

export function isSoundOn() { return enabled; }

export function setSound(on) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ничего страшного */ }
  if (on) play('click');
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(a, { freq, to = null, dur = 0.1, type = 'square', vol = 0.12, at = 0 }) {
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(a, { dur = 0.08, vol = 0.15, at = 0, cutoff = 1800 }) {
  const t = a.currentTime + at;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = a.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
}

const NOTES = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5, G6: 1568, A4: 440, F5: 698.46 };

const SOUNDS = {
  hit(a) {
    noise(a, { dur: 0.09, vol: 0.2 });
    tone(a, { freq: 260, to: 90, dur: 0.12, vol: 0.1 });
  },
  victory(a) {
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(a, { freq: NOTES[n], dur: 0.12, at: i * 0.09, vol: 0.1 }));
    tone(a, { freq: NOTES.E6, dur: 0.35, at: 0.38, type: 'triangle', vol: 0.12 });
  },
  levelup(a) {
    ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(a, { freq: NOTES[n], dur: 0.1, at: i * 0.07, vol: 0.09 }));
    tone(a, { freq: NOTES.C6, dur: 0.5, at: 0.45, type: 'triangle', vol: 0.12 });
  },
  step(a) {
    noise(a, { dur: 0.03, vol: 0.06, cutoff: 600 });
  },
  add(a) {
    tone(a, { freq: NOTES.A4, dur: 0.08, vol: 0.08 });
    tone(a, { freq: NOTES.E5, dur: 0.14, at: 0.08, vol: 0.08 });
  },
  undo(a) {
    tone(a, { freq: NOTES.E5, dur: 0.08, vol: 0.07 });
    tone(a, { freq: NOTES.A4, dur: 0.12, at: 0.08, vol: 0.07 });
  },
  click(a) {
    tone(a, { freq: 880, dur: 0.04, vol: 0.05, type: 'triangle' });
  },
  rest(a) {
    tone(a, { freq: NOTES.F5, dur: 0.2, type: 'triangle', vol: 0.08 });
    tone(a, { freq: NOTES.C5, dur: 0.3, at: 0.12, type: 'triangle', vol: 0.07 });
  },
};

export function play(name) {
  if (!enabled || !SOUNDS[name]) return;
  const a = audio();
  if (a) SOUNDS[name](a);
}
