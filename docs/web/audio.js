// ═══════════════════════════════════════════════════════════════
// GeoCheckr Web — Audio Engine
// All sounds via Web Audio API (no external files)
// ═══════════════════════════════════════════════════════════════

let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function beep(freq, dur, vol=0.3, type='sine') {
  try {
    const c = getAudio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.value = vol;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  } catch(e) {}
}

// UI Sounds
function playClick() { beep(660, 0.05, 0.15); }
function playTap() { beep(800, 0.04, 0.12); }

// Game Sounds
function playSuccess() {
  beep(523,0.1,0.3);
  setTimeout(()=>beep(659,0.1,0.3),120);
  setTimeout(()=>beep(784,0.15,0.3),240);
}
function playPerfect() {
  beep(523,0.1,0.3);
  setTimeout(()=>beep(659,0.1,0.3),100);
  setTimeout(()=>beep(784,0.1,0.3),200);
  setTimeout(()=>beep(1047,0.2,0.35),300);
}
function playError() { beep(220, 0.4, 0.3); }

// Timer Sounds
function playTick() { beep(880, 0.08, 0.2); }
function playWarning() {
  beep(440,0.3,0.4);
  setTimeout(()=>beep(440,0.3,0.4),350);
}
function playTimeUp() {
  beep(330, 0.2, 0.35);
  setTimeout(()=>beep(262, 0.3, 0.35),200);
  setTimeout(()=>beep(196, 0.4, 0.3),400);
}

// Scan / Connection Sounds
function playScan() {
  beep(1200, 0.08, 0.2);
  setTimeout(()=>beep(1600, 0.12, 0.25),100);
}
function playConnect() {
  beep(523, 0.08, 0.2);
  setTimeout(()=>beep(784, 0.1, 0.25),100);
}
function playDisconnect() {
  beep(440, 0.1, 0.2);
  setTimeout(()=>beep(330, 0.15, 0.2),120);
}

// Round Sounds
function playRoundStart() {
  beep(660, 0.08, 0.25);
  setTimeout(()=>beep(880, 0.08, 0.25),100);
  setTimeout(()=>beep(1100, 0.12, 0.3),200);
}
function playGameOver() {
  const notes = [523, 659, 784, 1047, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => beep(n, 0.15, 0.3), i * 120));
}

// Swipe / Navigation
function playSwipe() { beep(500, 0.06, 0.1); }
function playWhoosh() {
  beep(800, 0.05, 0.08);
  setTimeout(()=>beep(400, 0.08, 0.06),50);
}
