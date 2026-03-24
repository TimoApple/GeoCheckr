// ═══════════════════════════════════════════════════════════════
// GeoCheckr V1 — QR Card Game Engine
// Design: Timo's Palette — Space Grotesk + 4 Farben
// Street View: UNVERÄNDERT (Vorlage 2 — 6 Tage!)
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = ALL_LOCATIONS.map((l, i) => ({...l, id: i+1}));

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  screen: 'setup',
  players: [],
  scores: [],
  currentPlayer: 0,
  round: 1,
  currentLocation: null,
  timer: 60,
  timerSeconds: 60,
  timerInterval: null,
  streetViewLoaded: false,
  usedLocations: [],
};

// Player colors — Timo's palette
const PLAYER_COLORS = ['#bdc2ff', '#a6d700', '#88da7d', '#FF9500', '#ffb4ab'];

// ═══════════════════════════════════════════════════════════════
// AUDIO (UNVERÄNDERT)
// ═══════════════════════════════════════════════════════════════
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function beep(freq, dur, vol=0.3) {
  try {
    const c = getAudio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = freq; o.type = 'sine';
    g.gain.value = vol;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  } catch(e) {}
}
function playClick() { beep(660, 0.05, 0.15); }
function playSuccess() { beep(523,0.1,0.3); setTimeout(()=>beep(659,0.1,0.3),120); setTimeout(()=>beep(784,0.15,0.3),240); }
function playPerfect() { beep(523,0.1,0.3); setTimeout(()=>beep(659,0.1,0.3),100); setTimeout(()=>beep(784,0.1,0.3),200); setTimeout(()=>beep(1047,0.2,0.35),300); }
function playError() { beep(220, 0.4, 0.3); }
function playTick() { beep(880, 0.08, 0.2); }
function playWarning() { beep(440,0.3,0.4); setTimeout(()=>beep(440,0.3,0.4),350); }
function playScan() { beep(1200, 0.08, 0.2); setTimeout(()=>beep(1600, 0.12, 0.25),100); }

// ═══════════════════════════════════════════════════════════════
// UTILS (UNVERÄNDERT)
// ═══════════════════════════════════════════════════════════════
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══════════════════════════════════════════════════════════════
// STREET VIEW — UNVERÄNDERT (Vorlage 2 — 6 Tage!)
// ═══════════════════════════════════════════════════════════════
let panorama = null;
let svService = null;

function ensureMapReady() {
  if (typeof google !== 'undefined' && google.maps && google.maps.StreetViewService) {
    if (!svService) svService = new google.maps.StreetViewService();
    return true;
  }
  return false;
}

function loadPanorama(lat, lng) {
  const container = document.getElementById('streetview-container');
  if (!container) return;
  if (!ensureMapReady()) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--outline);font-family:Space Grotesk,sans-serif;"><div style="text-align:center;"><div style="font-size:24px;">⏳</div><div style="margin-top:10px;">Lade Maps API...</div></div></div>';
    setTimeout(() => loadPanorama(lat, lng), 1000);
    return;
  }
  try {
    panorama = new google.maps.StreetViewPanorama(container, {
      position: { lat, lng },
      pov: { heading: Math.random() * 360, pitch: 0 },
      zoom: 0,
      addressControl: false, linksControl: true, panControl: true,
      zoomControl: true, fullscreenControl: false,
      motionTracking: false, motionTrackingControl: false,
      enableCloseButton: false, clickToGo: true, scrollwheel: true,
    });
    state.streetViewLoaded = true;
  } catch(e) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--outline);font-family:Space Grotesk,sans-serif;"><div style="text-align:center;">Street View not available</div></div>';
    state.streetViewLoaded = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// QR CODE (UNVERÄNDERT)
// ═══════════════════════════════════════════════════════════════
let qrScanner = null;

function getLocationByQR(code) {
  let id;
  if (code.includes('loc=')) id = parseInt(new URL(code).searchParams.get('loc'));
  else id = parseInt(code.replace(/[^0-9]/g, ''));
  return LOCATIONS.find(l => l.id === id) || null;
}

function startQRScanner() {
  const container = document.getElementById('qr-reader');
  if (!container) return;
  if (typeof Html5Qrcode === 'undefined') {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--outline);">QR-Scanner wird geladen...</div>';
    setTimeout(startQRScanner, 1000);
    return;
  }
  if (qrScanner) { try { qrScanner.stop(); } catch(e) {} }
  qrScanner = new Html5Qrcode("qr-reader");
  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      playScan();
      const loc = getLocationByQR(decodedText);
      if (loc) {
        try { qrScanner.stop(); } catch(e) {}
        state.currentLocation = loc;
        state.usedLocations.push(loc.id);
        state.timer = state.timerSeconds;
        state.streetViewLoaded = false;
        state.screen = 'view';
        render();
      } else {
        const s = document.getElementById('qr-status');
        if (s) s.textContent = '❌ Unbekannter QR-Code';
      }
    },
    () => {}
  ).catch(() => {
    container.innerHTML = '<div style="text-align:center;padding:40px;"><p style="color:var(--error);">Kamera nicht verfügbar</p><p style="color:var(--outline);font-size:13px;margin-top:8px;">Bitte Kamera-Berechtigung erlauben.</p></div>';
  });
}

function stopQRScanner() {
  if (qrScanner) { try { qrScanner.stop(); } catch(e) {}; qrScanner = null; }
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════
function goTo(screen) {
  stopQRScanner();
  clearInterval(state.timerInterval);
  state.screen = screen;
  render();
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'setup': renderSetup(app); break;
    case 'scan': renderScan(app); break;
    case 'view': renderView(app); break;
    case 'answer': renderAnswer(app); break;
    case 'score': renderScore(app); break;
  }
}

// ═══════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════
function renderSetup(el) {
  if (state.players.length === 0) {
    state.players = [{ name: '' }, { name: '' }, { name: '' }, { name: '' }];
    state.scores = [0, 0, 0, 0];
  }
  
  el.innerHTML = `
    <div class="screen animate-in" style="padding:var(--sp-8) var(--sp-6);max-width:440px;margin:0 auto;">
      
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:var(--sp-8);">
        <div style="width:56px;height:56px;border-radius:16px;background:var(--surface);display:flex;align-items:center;justify-content:center;margin:0 auto var(--sp-4);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h1 style="font-size:32px;font-weight:700;color:var(--text);line-height:1.1;">GeoCheckr</h1>
        <p class="label_sm" style="margin-top:var(--sp-2);">QR Card Game</p>
      </div>
      
      <!-- Spieler -->
      <div style="margin-bottom:var(--sp-8);">
        <p class="label_sm" style="margin-bottom:var(--sp-3);">Spieler</p>
        ${state.players.map((p, i) => `
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-2);">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--surface-max);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${PLAYER_COLORS[i]};flex-shrink:0;">${i+1}</div>
            <input type="text" class="input" value="${p.name}" 
                   onchange="state.players[${i}].name=this.value"
                   placeholder="Spieler ${i+1}" maxlength="20"
                   style="flex:1;">
          </div>
        `).join('')}
        <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3);">
          ${state.players.length < 5 ? `<button class="btn btn-ghost btn-sm" style="flex:1;" onclick="addPlayer()">+ Spieler</button>` : ''}
          ${state.players.length > 2 ? `<button class="btn btn-ghost btn-sm" style="flex:1;color:var(--error);" onclick="removePlayer()">− Entfernen</button>` : ''}
        </div>
      </div>
      
      <!-- Timer -->
      <div style="margin-bottom:var(--sp-8);">
        <p class="label_sm" style="margin-bottom:var(--sp-3);">Timer</p>
        <div style="display:flex;gap:var(--sp-2);">
          ${[30, 60, 90, 120].map(t => `
            <button class="diff-btn ${state.timerSeconds===t?'active':''}" onclick="state.timerSeconds=${t};render()" style="flex:1;">${t}s</button>
          `).join('')}
        </div>
      </div>
      
      <!-- Start -->
      <button class="btn btn-primary btn-lg" onclick="startGame()" style="width:100%;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start
      </button>
      
      <p style="text-align:center;margin-top:var(--sp-4);color:var(--outline);font-size:13px;">
        Karten drucken: <a href="cards.html" style="color:var(--accent);text-decoration:none;">cards.html</a>
      </p>
    </div>
  `;
}

function addPlayer() { playClick(); state.players.push({ name: '' }); state.scores.push(0); render(); }
function removePlayer() { playClick(); if (state.players.length > 2) { state.players.pop(); state.scores.pop(); render(); } }

function startGame() {
  playClick();
  state.players.forEach((p, i) => { if (!p.name.trim()) p.name = 'Spieler ' + (i+1); });
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  goTo('scan');
}

// ═══════════════════════════════════════════════════════════════
// SCAN
// ═══════════════════════════════════════════════════════════════
function renderScan(el) {
  const cp = state.currentPlayer;
  el.innerHTML = `
    <div class="screen animate-in" style="display:flex;flex-direction:column;padding:var(--sp-6);height:100vh;height:100dvh;">
      
      <!-- Header HUD -->
      <div class="glass" style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);border-radius:9999px;margin-bottom:var(--sp-6);width:fit-content;">
        <span class="label_sm" style="color:var(--green);margin:0;">Runde ${state.round}</span>
        <span style="width:1px;height:16px;background:var(--outline-soft);"></span>
        <span style="font-size:14px;font-weight:600;color:var(--text);">${state.players[cp].name}</span>
      </div>
      
      <!-- Scanner Area -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="text-align:center;margin-bottom:var(--sp-6);">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;margin:0 auto var(--sp-4);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="20" y1="14" x2="20" y2="20"/><line x1="14" y1="20" x2="20" y2="20"/></svg>
          </div>
          <p style="color:var(--text-muted);font-size:15px;">QR-Code scannen</p>
          <p class="label_sm" style="margin-top:var(--sp-1);">Kamera auf den Code richten</p>
        </div>
        
        <div id="qr-reader" style="width:100%;max-width:300px;border-radius:16px;overflow:hidden;"></div>
        <div id="qr-status" style="color:var(--outline);font-size:13px;margin-top:var(--sp-3);text-align:center;"></div>
      </div>
      
      <!-- Score Button -->
      <div style="padding-top:var(--sp-4);">
        <button class="btn btn-ghost" onclick="viewScore()" style="width:100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          Score
        </button>
      </div>
    </div>
  `;
  setTimeout(startQRScanner, 300);
}

// ═══════════════════════════════════════════════════════════════
// VIEW — Street View + Timer (STREET VIEW CODE UNVERÄNDERT)
// ═══════════════════════════════════════════════════════════════
function renderView(el) {
  el.innerHTML = `
    <div class="screen" style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;">
      
      <!-- Street View Container -->
      <div id="streetview-container" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;"></div>
      
      <!-- Timer — Glass HUD -->
      <div class="glass" style="position:absolute;top:40px;right:var(--sp-4);z-index:10;border-radius:9999px;padding:var(--sp-2) var(--sp-5);display:flex;align-items:center;gap:var(--sp-2);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span id="timer-display" class="timer-display">${state.timer}</span>
      </div>
      
      <!-- Round + Player — Glass HUD -->
      <div class="glass" style="position:absolute;top:40px;left:var(--sp-4);z-index:10;border-radius:12px;padding:var(--sp-2) var(--sp-4);display:flex;align-items:center;gap:var(--sp-3);">
        <span class="label_sm" style="color:var(--green);margin:0;">R${state.round}</span>
        <span style="width:1px;height:14px;background:var(--outline-soft);"></span>
        <span style="font-size:13px;font-weight:600;color:var(--text);">${state.players[state.currentPlayer].name}</span>
      </div>
      
      <!-- Player Badges — Floating -->
      <div class="glass" style="position:absolute;bottom:90px;left:var(--sp-4);right:var(--sp-4);z-index:10;border-radius:16px;padding:var(--sp-3) var(--sp-4);display:flex;gap:var(--sp-2);overflow-x:auto;">
        ${state.players.map((p, i) => `
          <div class="player-badge ${i===state.currentPlayer?'active':''}" style="white-space:nowrap;">
            <div class="dot" style="background:${PLAYER_COLORS[i]};"></div>
            ${p.name}
            <span style="font-weight:700;margin-left:2px;">${state.scores[i]}</span>
          </div>
        `).join('')}
      </div>
      
      <!-- Skip Button -->
      <div style="position:absolute;bottom:28px;left:50%;transform:translateX(-50%);z-index:10;">
        <button onclick="skipTimer()" class="btn btn-primary" style="padding:var(--sp-3) var(--sp-8);">
          Fertig
        </button>
      </div>
    </div>
  `;
  
  // Street View laden
  setTimeout(() => {
    if (state.currentLocation) loadPanorama(state.currentLocation.lat, state.currentLocation.lng);
  }, 100);
  
  // Timer starten
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.timer > 0) {
      state.timer--;
      const te = document.getElementById('timer-display');
      if (te) {
        te.textContent = state.timer;
        te.className = 'timer-display' + (state.timer <= 10 ? ' warn' : '');
      }
      if (state.timer <= 5 && state.timer > 0) playTick();
      if (state.timer === 0) {
        playWarning();
        clearInterval(state.timerInterval);
        state.screen = 'answer';
        render();
      }
    }
  }, 1000);
}

function skipTimer() {
  playClick();
  clearInterval(state.timerInterval);
  state.screen = 'answer';
  render();
}

// ═══════════════════════════════════════════════════════════════
// ANSWER — Stadt + Land
// ═══════════════════════════════════════════════════════════════
function renderAnswer(el) {
  const loc = state.currentLocation;
  const cp = state.currentPlayer;
  
  el.innerHTML = `
    <div class="screen animate-scale" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--sp-8);min-height:100vh;min-height:100dvh;">
      
      <!-- Answer Reveal -->
      <div style="text-align:center;margin-bottom:var(--sp-8);">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(166,215,0,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto var(--sp-4);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h2 style="font-size:32px;font-weight:700;color:var(--green);line-height:1.1;">${loc.city}</h2>
        <p style="font-size:18px;color:var(--text-muted);margin-top:var(--sp-1);">${loc.country}</p>
      </div>
      
      <!-- Question -->
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:var(--sp-5);text-align:center;">
        Wer hat den richtigen Ort?
      </p>
      
      <!-- Player Buttons -->
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);width:100%;max-width:340px;">
        ${state.players.map((p, i) => `
          <button onclick="givePoint(${i})" class="card-high" style="
            display:flex;align-items:center;gap:var(--sp-3);
            padding:var(--sp-4) var(--sp-5);
            cursor:pointer;border:none;text-align:left;
            transition:all 0.2s;
          ">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${PLAYER_COLORS[i]};flex-shrink:0;border:1px solid ${PLAYER_COLORS[i]}33;">${i+1}</div>
            <span style="flex:1;font-size:15px;font-weight:600;color:var(--text);">${p.name}</span>
            ${i === cp ? '<span class="label_sm" style="color:var(--green);margin:0;">DRAN</span>' : ''}
            <span class="score-sm" style="font-size:14px;color:var(--text-muted);">${state.scores[i]}</span>
          </button>
        `).join('')}
      </div>
      
      <!-- No Point -->
      <div style="margin-top:var(--sp-6);width:100%;max-width:340px;">
        <button onclick="noPoint()" class="btn btn-ghost" style="width:100%;">
          Niemand
        </button>
      </div>
    </div>
  `;
}

function givePoint(playerIdx) {
  playPerfect();
  state.scores[playerIdx]++;
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  if (state.currentPlayer === 0) state.round++;
  goTo('score');
}

function noPoint() {
  playClick();
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  if (state.currentPlayer === 0) state.round++;
  goTo('score');
}

// ═══════════════════════════════════════════════════════════════
// SCORE
// ═══════════════════════════════════════════════════════════════
function renderScore(el) {
  const sorted = state.players.map((p, i) => ({ ...p, idx: i, score: state.scores[i] }))
    .sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...state.scores, 1);
  const medals = ['🥇', '🥈', '🥉'];
  
  el.innerHTML = `
    <div class="screen animate-in" style="display:flex;flex-direction:column;align-items:center;padding:var(--sp-8) var(--sp-6);min-height:100vh;min-height:100dvh;">
      
      <!-- Header -->
      <div style="text-align:center;margin-bottom:var(--sp-8);">
        <h2 style="font-size:24px;font-weight:700;color:var(--text);">Scoreboard</h2>
        <p class="label_sm" style="margin-top:var(--sp-1);">Runde ${state.round}</p>
      </div>
      
      <!-- Scoreboard -->
      <div style="width:100%;max-width:380px;">
        ${sorted.map((p, i) => `
          <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-4) 0;">
            <span style="font-size:${i===0?'20':'16'}px;width:28px;text-align:center;">
              ${i < 3 ? medals[i] : '<span style="color:var(--outline);font-size:13px;">#'+(i+1)+'</span>'}
            </span>
            <span style="flex:1;font-size:15px;font-weight:600;color:var(--text);">${p.name}</span>
            <span class="score-sm">${p.score}</span>
          </div>
          <div class="progress-bar" style="margin-bottom:var(--sp-3);">
            <div class="fill" style="width:${(p.score/maxScore)*100}%;"></div>
          </div>
        `).join('')}
      </div>
      
      <!-- Next Round -->
      <div style="margin-top:auto;width:100%;max-width:380px;padding-top:var(--sp-6);">
        <button onclick="nextRound()" class="btn btn-primary btn-lg" style="width:100%;">
          Nächste Runde → Runde ${state.round}
        </button>
      </div>
    </div>
  `;
}

function nextRound() { playClick(); goTo('scan'); }
function viewScore() { playClick(); goTo('score'); }

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
(function init() {
  const params = new URLSearchParams(window.location.search);
  const locParam = params.get('loc');
  const locId = locParam ? parseInt(locParam) : NaN;
  if (!isNaN(locId) && locId > 0) {
    const loc = LOCATIONS.find(l => l.id === locId);
    if (loc) {
      state.players = [{ name: 'Player 1' }];
      state.scores = [0];
      state.currentLocation = loc;
      state.usedLocations = [loc.id];
      state.timer = state.timerSeconds;
      state.screen = 'view';
      render();
      return;
    }
  }
  render();
})();
