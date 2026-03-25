// ═══════════════════════════════════════════════════════════════
// GeoCheckr — Argon Material Version
// Font: EXCLUSIVELY Space Grotesk
// Colors: #bdc2ff, #a6d700, #3340ca, #111225
// Style: Argon Design System (rounded, shadows, cards)
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

// Player colors — Timo's 4 master + accent
const PLAYER_COLORS = ['#bdc2ff', '#a6d700', '#3340ca', '#88da7d', '#ffb4ab'];

// ═══════════════════════════════════════════════════════════════
// AUDIO
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
// UTILS
// ═══════════════════════════════════════════════════════════════
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══════════════════════════════════════════════════════════════
// STREET VIEW — UNVERÄNDERT
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
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#8f8fa0;font-family:Space Grotesk,sans-serif;"><div style="text-align:center;"><div style="font-size:24px;">⏳</div><div style="margin-top:10px;">Lade Maps API...</div></div></div>';
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
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111225;color:#8f8fa0;font-family:Space Grotesk,sans-serif;"><div style="text-align:center;">Street View not available</div></div>';
    state.streetViewLoaded = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// QR CODE
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
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#8f8fa0;">QR-Scanner wird geladen...</div>';
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
    container.innerHTML = '<div style="text-align:center;padding:40px;"><p style="color:#ff6b6b;">Kamera nicht verfügbar</p><p style="color:#8f8fa0;font-size:13px;margin-top:8px;">Bitte Kamera-Berechtigung erlauben.</p></div>';
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
// SETUP — Argon Style (Card-heavy, shadows, badges)
// ═══════════════════════════════════════════════════════════════
function renderSetup(el) {
  if (state.players.length === 0) {
    state.players = [{ name: '' }, { name: '' }, { name: '' }, { name: '' }];
    state.scores = [0, 0, 0, 0];
  }
  
  el.innerHTML = `
    <div class="screen anim-up" style="padding:48px 24px;max-width:440px;margin:0 auto;">
      
      <!-- Logo — Argon Card -->
      <div class="card" style="text-align:center;margin-bottom:32px;padding:32px 24px;">
        <div style="width:64px;height:64px;border-radius:18px;background:rgba(51,64,202,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 4px 20px rgba(51,64,202,0.15);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bdc2ff" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h1 style="font-size:34px;font-weight:700;color:#e5e2e1;line-height:1.1;letter-spacing:-0.5px;">GeoCheckr</h1>
        <span class="badge badge-accent" style="margin-top:12px;">QR Card Game</span>
      </div>
      
      <!-- Spieler Card -->
      <div class="card" style="margin-bottom:24px;">
        <p class="label_sm" style="margin-bottom:16px;">Spieler</p>
        ${state.players.map((p, i) => `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div class="avatar" style="background:${PLAYER_COLORS[i]}18;color:${PLAYER_COLORS[i]};border:1.5px solid ${PLAYER_COLORS[i]}33;">
              ${i+1}
            </div>
            <input type="text" class="input" value="${p.name}" 
                   onchange="state.players[${i}].name=this.value"
                   placeholder="Spieler ${i+1}" maxlength="20"
                   style="flex:1;">
          </div>
        `).join('')}
        <div style="display:flex;gap:8px;margin-top:16px;">
          ${state.players.length < 5 ? `<button class="btn btn-ghost btn-sm" style="flex:1;" onclick="addPlayer()">+ Spieler</button>` : ''}
          ${state.players.length > 2 ? `<button class="btn btn-ghost btn-sm" style="flex:1;color:#ff6b6b;" onclick="removePlayer()">− Entfernen</button>` : ''}
        </div>
      </div>
      
      <!-- Timer Card -->
      <div class="card" style="margin-bottom:32px;">
        <p class="label_sm" style="margin-bottom:16px;">Timer</p>
        <div style="display:flex;gap:8px;">
          ${[30, 60, 90, 120].map(t => `
            <button class="diff-btn ${state.timerSeconds===t?'active':''}" onclick="state.timerSeconds=${t};render()" style="flex:1;">${t}s</button>
          `).join('')}
        </div>
      </div>
      
      <!-- Start Button -->
      <button class="btn btn-green btn-lg" onclick="startGame()" style="width:100%;box-shadow:0 6px 20px rgba(166,215,0,0.25);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start
      </button>
      
      <p style="text-align:center;margin-top:16px;color:#5a5a70;font-size:13px;">
        Karten drucken: <a href="cards.html" style="color:#bdc2ff;text-decoration:none;">cards.html</a>
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
// SCAN — Argon Style (Glass card for scanner)
// ═══════════════════════════════════════════════════════════════
function renderScan(el) {
  const cp = state.currentPlayer;
  el.innerHTML = `
    <div class="screen anim-up" style="display:flex;flex-direction:column;padding:24px;height:100vh;height:100dvh;">
      
      <!-- Header — Argon Badge -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <span class="badge badge-green">Runde ${state.round}</span>
        <span class="badge badge-blue">${state.players[cp].name}</span>
      </div>
      
      <!-- Scanner Area -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div class="card" style="text-align:center;padding:40px 24px;margin-bottom:24px;max-width:340px;width:100%;">
          <div style="width:72px;height:72px;border-radius:20px;background:rgba(51,64,202,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 4px 16px rgba(51,64,202,0.1);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bdc2ff" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="20" y1="14" x2="20" y2="20"/><line x1="14" y1="20" x2="20" y2="20"/></svg>
          </div>
          <p style="color:#e5e2e1;font-size:16px;font-weight:600;">QR-Code scannen</p>
          <p style="color:#5a5a70;font-size:13px;margin-top:6px;">Kamera auf den Code richten</p>
        </div>
        
        <div id="qr-reader" style="width:100%;max-width:300px;border-radius:20px;overflow:hidden;box-shadow:var(--shadow-lg);"></div>
        <div id="qr-status" style="color:#8f8fa0;font-size:13px;margin-top:12px;text-align:center;"></div>
      </div>
      
      <!-- Score Button -->
      <div style="padding-top:16px;">
        <button class="btn btn-outline" onclick="viewScore()" style="width:100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          Scoreboard
        </button>
      </div>
    </div>
  `;
  setTimeout(startQRScanner, 300);
}

// ═══════════════════════════════════════════════════════════════
// VIEW — Argon Style (Floating glass cards, stronger shadows)
// ═══════════════════════════════════════════════════════════════
function renderView(el) {
  el.innerHTML = `
    <div class="screen" style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;">
      
      <!-- Street View Container -->
      <div id="streetview-container" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;"></div>
      
      <!-- Timer — Argon Glass -->
      <div class="card-glass" style="position:absolute;top:44px;right:16px;z-index:10;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.4);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8f8fa0" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span id="timer-display" class="timer-display">${state.timer}</span>
      </div>
      
      <!-- Round + Player — Argon Glass -->
      <div class="card-glass" style="position:absolute;top:44px;left:16px;z-index:10;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.4);">
        <span class="badge badge-green" style="padding:4px 10px;font-size:11px;">R${state.round}</span>
        <span style="font-size:13px;font-weight:600;color:#e5e2e1;">${state.players[state.currentPlayer].name}</span>
      </div>
      
      <!-- Player Badges — Argon Cards -->
      <div class="card-glass" style="position:absolute;bottom:100px;left:16px;right:16px;z-index:10;display:flex;gap:8px;overflow-x:auto;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
        ${state.players.map((p, i) => `
          <div class="player-badge ${i===state.currentPlayer?'active':''}" style="white-space:nowrap;">
            <div class="dot" style="background:${PLAYER_COLORS[i]};"></div>
            ${p.name}
            <span style="font-weight:700;margin-left:4px;">${state.scores[i]}</span>
          </div>
        `).join('')}
      </div>
      
      <!-- Skip Button — Argon Green -->
      <div style="position:absolute;bottom:32px;left:50%;transform:translateX(-50%);z-index:10;">
        <button onclick="skipTimer()" class="btn btn-green" style="padding:14px 36px;box-shadow:0 6px 20px rgba(166,215,0,0.25);">
          Fertig
        </button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    if (state.currentLocation) loadPanorama(state.currentLocation.lat, state.currentLocation.lng);
  }, 100);
  
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
// ANSWER — Argon Style (Card-based player selection)
// ═══════════════════════════════════════════════════════════════
function renderAnswer(el) {
  const loc = state.currentLocation;
  const cp = state.currentPlayer;
  
  el.innerHTML = `
    <div class="screen anim-scale" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;min-height:100vh;min-height:100dvh;">
      
      <!-- Answer Reveal Card -->
      <div class="card" style="text-align:center;margin-bottom:32px;padding:32px;box-shadow:0 8px 32px rgba(166,215,0,0.1);">
        <div style="width:64px;height:64px;border-radius:18px;background:rgba(166,215,0,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 4px 16px rgba(166,215,0,0.1);">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a6d700" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h2 style="font-size:34px;font-weight:700;color:#a6d700;line-height:1.1;letter-spacing:-0.5px;">${loc.city}</h2>
        <p style="font-size:18px;color:#8f8fa0;margin-top:6px;">${loc.country}</p>
      </div>
      
      <!-- Question -->
      <p style="color:#8f8fa0;font-size:14px;margin-bottom:20px;text-align:center;">
        Wer hat den richtigen Ort?
      </p>
      
      <!-- Player Cards — Argon style with hover shadow -->
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:360px;">
        ${state.players.map((p, i) => `
          <button onclick="givePoint(${i})" class="card-raised" style="
            display:flex;align-items:center;gap:12px;
            padding:16px 20px;
            cursor:pointer;border:none;text-align:left;
            transition:all 0.25s;
          " onmouseover="this.style.boxShadow='0 6px 24px rgba(0,0,0,0.4)'" onmouseout="this.style.boxShadow=''">
            <div class="avatar" style="background:${PLAYER_COLORS[i]}18;color:${PLAYER_COLORS[i]};border:1.5px solid ${PLAYER_COLORS[i]}33;">
              ${i+1}
            </div>
            <span style="flex:1;font-size:15px;font-weight:600;color:#e5e2e1;">${p.name}</span>
            ${i === cp ? '<span class="badge badge-green" style="padding:4px 10px;font-size:10px;">DRAN</span>' : ''}
            <span class="score-sm" style="font-size:14px;color:#8f8fa0;">${state.scores[i]}</span>
          </button>
        `).join('')}
      </div>
      
      <!-- No Point -->
      <div style="margin-top:24px;width:100%;max-width:360px;">
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
// SCORE — Argon Style (Card leaderboard with gradient bars)
// ═══════════════════════════════════════════════════════════════
function renderScore(el) {
  const sorted = state.players.map((p, i) => ({ ...p, idx: i, score: state.scores[i] }))
    .sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...state.scores, 1);
  const medals = ['🥇', '🥈', '🥉'];
  
  el.innerHTML = `
    <div class="screen anim-up" style="display:flex;flex-direction:column;align-items:center;padding:48px 24px;min-height:100vh;min-height:100dvh;">
      
      <!-- Header Card -->
      <div class="card" style="text-align:center;margin-bottom:32px;width:100%;max-width:400px;">
        <h2 style="font-size:26px;font-weight:700;color:#e5e2e1;">Scoreboard</h2>
        <span class="badge badge-accent" style="margin-top:8px;">Runde ${state.round}</span>
      </div>
      
      <!-- Scoreboard — Argon Cards -->
      <div style="width:100%;max-width:400px;">
        ${sorted.map((p, i) => `
          <div class="card" style="display:flex;align-items:center;gap:12px;padding:16px 20px;margin-bottom:10px;">
            <span style="font-size:${i===0?'22':'16'}px;width:32px;text-align:center;">
              ${i < 3 ? medals[i] : '<span style="color:#5a5a70;font-size:13px;">#'+(i+1)+'</span>'}
            </span>
            <span style="flex:1;font-size:15px;font-weight:600;color:#e5e2e1;">${p.name}</span>
            <span class="score-sm">${p.score}</span>
          </div>
          <div class="progress-track" style="margin-bottom:12px;margin-top:-2px;">
            <div class="progress-fill" style="width:${(p.score/maxScore)*100}%;"></div>
          </div>
        `).join('')}
      </div>
      
      <!-- Next Round -->
      <div style="margin-top:auto;width:100%;max-width:400px;padding-top:24px;">
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
