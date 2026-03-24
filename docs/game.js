// ═══════════════════════════════════════════════════════════════
// GeoCheckr V1 — QR Card Game Engine
// Street View: UNVERÄNDERT (Vorlage 2 — 6 Tage Arbeit!)
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = ALL_LOCATIONS.map((l, i) => ({...l, id: i+1}));

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  screen: 'setup',        // setup | scan | view | answer | score
  players: [],            // [{name: 'Anna'}, ...]
  scores: [],             // [3, 1, 0, 2]
  currentPlayer: 0,       // index of active player
  round: 1,
  currentLocation: null,  // {city, country, lat, lng, ...}
  timer: 60,
  timerSeconds: 60,       // user-selected timer duration
  timerInterval: null,
  streetViewLoaded: false,
  usedLocations: [],
};

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

function normalizeName(s) {
  return s.toLowerCase().trim()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[àáâãå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
    .replace(/[òóôõ]/g,'o').replace(/[ùúû]/g,'u').replace(/[ýÿ]/g,'y')
    .replace(/[ñ]/g,'n').replace(/[ç]/g,'c').replace(/[š]/g,'s').replace(/[ž]/g,'z')
    .replace(/[^a-z]/g,'');
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
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#8E8E93;font-family:Space Grotesk,sans-serif;"><div style="text-align:center;"><div style="font-size:24px;">⏳</div><div style="margin-top:10px;">Lade Maps API...</div></div></div>';
    setTimeout(() => loadPanorama(lat, lng), 1000);
    return;
  }

  try {
    panorama = new google.maps.StreetViewPanorama(container, {
      position: { lat, lng },
      pov: { heading: Math.random() * 360, pitch: 0 },
      zoom: 0,
      addressControl: false,
      linksControl: true,
      panControl: true,
      zoomControl: true,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
      clickToGo: true,
      scrollwheel: true,
    });
    state.streetViewLoaded = true;
  } catch(e) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#8E8E93;font-family:Space Grotesk,sans-serif;"><div style="text-align:center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><div style="margin-top:10px;">Street View not available</div></div></div>';
    state.streetViewLoaded = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// QR CODE (UNVERÄNDERT)
// ═══════════════════════════════════════════════════════════════
let qrScanner = null;

function getLocationByQR(code) {
  let id;
  if (code.includes('loc=')) {
    id = parseInt(new URL(code).searchParams.get('loc'));
  } else {
    id = parseInt(code.replace(/[^0-9]/g, ''));
  }
  return LOCATIONS.find(l => l.id === id) || null;
}

function startQRScanner() {
  const container = document.getElementById('qr-reader');
  if (!container) return;
  
  if (typeof Html5Qrcode === 'undefined') {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#8E8E93;"><p>QR-Scanner wird geladen...</p></div>';
    setTimeout(startQRScanner, 1000);
    return;
  }

  if (qrScanner) {
    try { qrScanner.stop(); } catch(e) {}
  }

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
        const status = document.getElementById('qr-status');
        if (status) status.textContent = '❌ Unbekannter QR-Code';
      }
    },
    () => {}
  ).catch(() => {
    container.innerHTML = '<div style="text-align:center;padding:40px;"><p style="color:#FF3B30;">Kamera nicht verfügbar</p><p style="color:#8E8E93;font-size:13px;margin-top:8px;">Bitte Kamera-Berechtigung erlauben.</p></div>';
  });
}

function stopQRScanner() {
  if (qrScanner) {
    try { qrScanner.stop(); } catch(e) {}
    qrScanner = null;
  }
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
// SETUP — Spieler-Namen eingeben
// ═══════════════════════════════════════════════════════════════
function renderSetup(el) {
  if (state.players.length === 0) {
    state.players = [{ name: '' }, { name: '' }, { name: '' }, { name: '' }];
    state.scores = [0, 0, 0, 0];
  }
  
  el.innerHTML = `
    <div class="screen screen-setup" style="padding:24px;max-width:420px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:32px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a6d700" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        <h1 style="font-size:28px;font-weight:700;margin-top:12px;">GeoCheckr</h1>
        <p style="color:#8E8E93;font-size:14px;margin-top:4px;">QR Card Game</p>
      </div>
      
      <div style="margin-bottom:24px;">
        <label style="display:block;color:#8E8E93;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Spieler</label>
        ${state.players.map((p, i) => `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${['#34C759','#007AFF','#AF52DE','#FF9500'][i]};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0;">${i+1}</div>
            <input type="text" class="input" value="${p.name}" 
                   onchange="state.players[${i}].name=this.value"
                   placeholder="Spieler ${i+1}" maxlength="20"
                   style="flex:1;">
          </div>
        `).join('')}
        <div style="display:flex;gap:8px;margin-top:8px;">
          ${state.players.length < 5 ? `<button class="btn btn-ghost" style="flex:1;font-size:13px;" onclick="addPlayer()">+ Spieler</button>` : ''}
          ${state.players.length > 2 ? `<button class="btn btn-ghost" style="flex:1;font-size:13px;color:#FF3B30;" onclick="removePlayer()">− Entfernen</button>` : ''}
        </div>
      </div>
      
      <div style="margin-bottom:24px;">
        <label style="display:block;color:#8E8E93;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Timer (Sekunden)</label>
        <div style="display:flex;gap:8px;">
          ${[30, 60, 90, 120].map(t => `
            <button class="diff-btn ${state.timerSeconds===t?'active':''}" onclick="state.timerSeconds=${t};render()" style="flex:1;">${t}s</button>
          `).join('')}
        </div>
      </div>
      
      <button class="btn btn-primary btn-lg" onclick="startGame()" style="width:100%;margin-top:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start
      </button>
    </div>
  `;
}

function addPlayer() {
  playClick();
  state.players.push({ name: '' });
  state.scores.push(0);
  render();
}

function removePlayer() {
  playClick();
  if (state.players.length > 2) {
    state.players.pop();
    state.scores.pop();
    render();
  }
}

function startGame() {
  playClick();
  state.players.forEach((p, i) => {
    if (!p.name.trim()) p.name = 'Spieler ' + (i+1);
  });
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  goTo('scan');
}

// ═══════════════════════════════════════════════════════════════
// SCAN — QR-Code scannen
// ═══════════════════════════════════════════════════════════════
function renderScan(el) {
  const cp = state.currentPlayer;
  el.innerHTML = `
    <div class="screen" style="display:flex;flex-direction:column;align-items:center;padding:20px;height:100%;">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px;width:100%;">
        <span style="color:#a6d700;font-size:14px;font-weight:600;">Runde ${state.round}</span>
        <span style="color:#8E8E93;font-size:13px;">·</span>
        <span style="color:#fff;font-size:14px;font-weight:600;">${state.players[cp].name} ist dran</span>
      </div>
      
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;margin-bottom:8px;">📷</div>
        <p style="color:#8E8E93;font-size:14px;">QR-Code scannen</p>
      </div>
      
      <div id="qr-reader" style="width:100%;max-width:320px;border-radius:12px;overflow:hidden;"></div>
      <div id="qr-status" style="color:#8E8E93;font-size:13px;margin-top:12px;text-align:center;">Kamera auf QR-Code richten</div>
      
      <div style="margin-top:auto;width:100%;">
        <button class="btn btn-ghost" onclick="viewScore()" style="width:100%;font-size:13px;">
          📊 Score anzeigen
        </button>
      </div>
    </div>
  `;
  setTimeout(startQRScanner, 300);
}

// ═══════════════════════════════════════════════════════════════
// VIEW — Street View + Timer (UNVERÄNDERTER STREET VIEW CODE)
// ═══════════════════════════════════════════════════════════════
function renderView(el) {
  el.innerHTML = `
    <div class="screen" style="position:absolute;top:0;left:0;right:0;bottom:0;">
      <div id="streetview-container" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;"></div>
      
      <!-- Timer -->
      <div style="position:absolute;top:40px;right:16px;z-index:10;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);border-radius:20px;padding:8px 18px;">
        <span id="timer-display" style="font-size:22px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;">${state.timer}</span>
      </div>
      
      <!-- Round + Player -->
      <div style="position:absolute;top:40px;left:16px;z-index:10;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);border-radius:12px;padding:8px 14px;">
        <span style="font-size:12px;color:#a6d700;font-weight:600;">Runde ${state.round}</span>
        <span style="font-size:12px;color:#8E8E93;margin:0 6px;">·</span>
        <span style="font-size:12px;color:#fff;font-weight:600;">${state.players[state.currentPlayer].name}</span>
      </div>
      
      <!-- Skip Button -->
      <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);z-index:10;">
        <button onclick="skipTimer()" style="background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);border:2px solid #a6d700;border-radius:24px;padding:12px 28px;color:#a6d700;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;">
          ⏭ Fertig
        </button>
      </div>
    </div>
  `;
  
  // Street View laden
  setTimeout(() => {
    if (state.currentLocation) {
      loadPanorama(state.currentLocation.lat, state.currentLocation.lng);
    }
  }, 100);
  
  // Timer starten
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.timer > 0) {
      state.timer--;
      const te = document.getElementById('timer-display');
      if (te) {
        te.textContent = state.timer;
        te.style.color = state.timer <= 10 ? '#FF3B30' : state.timer <= 20 ? '#FF9500' : '#fff';
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
// ANSWER — Stadt + Land zeigen, Punkt zuweisen
// ═══════════════════════════════════════════════════════════════
function renderAnswer(el) {
  const loc = state.currentLocation;
  const cp = state.currentPlayer;
  
  el.innerHTML = `
    <div class="screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;height:100%;background:#1a1a2e;">
      
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:12px;">📍</div>
        <h2 style="font-size:28px;font-weight:700;color:#a6d700;margin-bottom:4px;">${loc.city}</h2>
        <p style="font-size:18px;color:#8E8E93;">${loc.country}</p>
      </div>
      
      <p style="color:#8E8E93;font-size:14px;margin-bottom:16px;text-align:center;">
        Wer hat richtig geraten?
      </p>
      
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px;">
        ${state.players.map((p, i) => `
          <button onclick="givePoint(${i})" style="
            display:flex;align-items:center;gap:12px;
            background:${i === cp ? 'rgba(166,215,0,0.15)' : 'rgba(255,255,255,0.06)'};
            border:2px solid ${i === cp ? '#a6d700' : 'rgba(255,255,255,0.1)'};
            border-radius:14px;padding:14px 18px;
            color:#fff;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;
          ">
            <span style="width:28px;height:28px;border-radius:50%;background:${['#34C759','#007AFF','#AF52DE','#FF9500','#FF3B30'][i]};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;">${i+1}</span>
            <span style="flex:1;text-align:left;">${p.name}</span>
            ${i === cp ? '<span style="font-size:11px;color:#a6d700;font-weight:600;">DRAN</span>' : ''}
            <span style="font-size:13px;color:#8E8E93;">${state.scores[i]} Pkt</span>
          </button>
        `).join('')}
      </div>
      
      <div style="margin-top:24px;display:flex;gap:10px;width:100%;max-width:320px;">
        <button onclick="noPoint()" class="btn btn-ghost" style="flex:1;font-size:14px;">
          ❌ Niemand
        </button>
      </div>
    </div>
  `;
}

function givePoint(playerIdx) {
  playPerfect();
  state.scores[playerIdx]++;
  
  // Nächster Spieler dran
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
// SCORE — Zwischenstand + nächste Runde
// ═══════════════════════════════════════════════════════════════
function renderScore(el) {
  const sorted = state.players.map((p, i) => ({ ...p, idx: i, score: state.scores[i] }))
    .sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...state.scores, 1);
  
  el.innerHTML = `
    <div class="screen" style="display:flex;flex-direction:column;align-items:center;padding:24px;height:100%;background:#1a1a2e;">
      
      <h2 style="font-size:24px;font-weight:700;margin-bottom:4px;">Scoreboard</h2>
      <p style="color:#8E8E93;font-size:13px;margin-bottom:24px;">Runde ${state.round}</p>
      
      <div style="width:100%;max-width:360px;">
        ${sorted.map((p, i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:${i < sorted.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none'};">
            <span style="font-size:${i===0?'22':'16'}px;${i===0?'color:#FFD700;':''}${i===1?'color:#C0C0C0;':''}${i===2?'color:#CD7F32;':''}width:28px;text-align:center;font-weight:700;">
              ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1)}
            </span>
            <span style="flex:1;font-size:16px;font-weight:600;color:#fff;">${p.name}</span>
            <span style="font-size:20px;font-weight:700;color:#a6d700;font-variant-numeric:tabular-nums;">${p.score}</span>
          </div>
          <div style="height:4px;background:rgba(255,255,255,0.04);border-radius:2px;margin-bottom:12px;overflow:hidden;">
            <div style="height:100%;width:${(p.score/maxScore)*100}%;background:${i===0?'#a6d700':'rgba(255,255,255,0.15)'};border-radius:2px;transition:width 0.5s;"></div>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top:auto;width:100%;max-width:360px;">
        <button onclick="nextRound()" class="btn btn-primary btn-lg" style="width:100%;">
          Nächste Runde → Runde ${state.round}
        </button>
      </div>
    </div>
  `;
}

function nextRound() {
  playClick();
  goTo('scan');
}

function viewScore() {
  playClick();
  goTo('score');
}

// ═══════════════════════════════════════════════════════════════
// INIT — Check for deep link
// ═══════════════════════════════════════════════════════════════
(function init() {
  const params = new URLSearchParams(window.location.search);
  const locParam = params.get('loc');
  const locId = locParam ? parseInt(locParam) : NaN;
  
  if (!isNaN(locId) && locId > 0) {
    const loc = LOCATIONS.find(l => l.id === locId);
    if (loc) {
      // Deep Link: sofort Street View anzeigen
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
