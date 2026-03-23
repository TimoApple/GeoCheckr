// ═══════════════════════════════════════════════════════════════
// GeoCheckr — Game Engine v4 (QR-Code + Voice + New Design)
// Street View: UNVERÄNDERT (Vorlage 2 — 6 Tage Arbeit!)
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = ALL_LOCATIONS.map((l, i) => ({...l, id: i+1}));

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  screen: 'home',
  phase: '',
  players: [],
  currentPlayer: 0,
  round: 1,
  maxRounds: 5,
  difficulty: 'leicht',
  scores: [],
  usedLocations: [],
  currentLocation: null,
  timer: 30,
  timerInterval: null,
  streetViewLoaded: false,
  guessCity: '',
  guessLat: null,
  guessLng: null,
  distance: 0,
  points: 0,
  history: [],
  tutorialStep: 0,
  gameMode: 'classic', // 'classic' or 'qr'
  playerCount: 2,
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

function calcPoints(dist) {
  if (dist <= 50) return 5;
  if (dist <= 200) return 4;
  if (dist <= 750) return 3;
  if (dist <= 2500) return 2;
  if (dist <= 7500) return 1;
  return 0;
}

function normalizeName(s) {
  return s.toLowerCase().trim()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[àáâãå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
    .replace(/[òóôõ]/g,'o').replace(/[ùúû]/g,'u').replace(/[ýÿ]/g,'y')
    .replace(/[ñ]/g,'n').replace(/[ç]/g,'c').replace(/[š]/g,'s').replace(/[ž]/g,'z')
    .replace(/[^a-z]/g,'');
}

function findCity(input) {
  if (!input || !input.trim()) return null;
  const n = normalizeName(input);
  if (n.length < 2) return null;
  let match = LOCATIONS.find(l => normalizeName(l.city) === n);
  if (match) return match;
  match = LOCATIONS.find(l => {
    const cn = normalizeName(l.city);
    return cn.includes(n) || n.includes(cn);
  });
  if (match) return match;
  if (n.length >= 4) {
    match = LOCATIONS.find(l => normalizeName(l.city).startsWith(n.substring(0,4)));
  }
  return match || null;
}

function getTimerForDiff(d) {
  return d === 'schwer' ? 20 : 30;
}

function getUnusedLocation() {
  const avail = LOCATIONS.filter(l => !state.usedLocations.includes(l.id));
  const pool = avail.length > 0 ? avail : (state.usedLocations = [], LOCATIONS);
  const loc = pool[Math.floor(Math.random() * pool.length)];
  state.usedLocations.push(loc.id);
  return loc;
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
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#8E8E93;font-family:Space Grotesk,sans-serif;"><div style="text-align:center;"><div style="font-size:48px;">🌍</div><div style="margin-top:10px;">Street View nicht verfügbar</div></div></div>';
    state.streetViewLoaded = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// LEAFLET MAP (UNVERÄNDERT)
// ═══════════════════════════════════════════════════════════════
function renderLeafletMap(containerId, realLat, realLng, guessLat, guessLng, realCity, guessCity) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  const hasGuess = guessLat != null && guessLng != null;
  const center = hasGuess ? [(realLat+guessLat)/2, (realLng+guessLng)/2] : [realLat, realLng];
  const map = L.map(el, { attributionControl: false }).setView(center, hasGuess ? 3 : 10);
  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
  L.circleMarker([realLat, realLng], { radius: 10, fillColor: '#34C759', fillOpacity: 1, color: '#fff', weight: 2 })
    .addTo(map).bindPopup('📍 ' + realCity);
  if (hasGuess) {
    L.circleMarker([guessLat, guessLng], { radius: 8, fillColor: '#FF3B30', fillOpacity: 1, color: '#fff', weight: 2 })
      .addTo(map).bindPopup('🎯 ' + guessCity);
    L.polyline([[guessLat, guessLng], [realLat, realLng]], { color: '#AF52DE', weight: 3, opacity: 0.8 }).addTo(map);
    map.fitBounds([[realLat, realLng], [guessLat, guessLng]], { padding: [30, 30] });
  }
}

// ═══════════════════════════════════════════════════════════════
// QR CODE — NEU
// ═══════════════════════════════════════════════════════════════
let qrScanner = null;

function getLocationByQR(code) {
  // QR format: "GEOC-123" where 123 is location ID
  const id = parseInt(code.replace(/[^0-9]/g, ''));
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
        state.timer = getTimerForDiff(state.difficulty);
        state.phase = 'view';
        state.streetViewLoaded = false;
        render();
      } else {
        const status = document.getElementById('qr-status');
        if (status) status.textContent = '❌ Unbekannter QR-Code';
      }
    },
    (errorMessage) => { /* ignore scan errors */ }
  ).catch(err => {
    container.innerHTML = '<div style="text-align:center;padding:40px;"><p style="color:#FF3B30;">Kamera nicht verfügbar</p><p style="color:#8E8E93;font-size:13px;margin-top:8px;">Bitte Kamera-Berechtigung erlauben oder Classic Mode nutzen.</p></div>';
  });
}

function stopQRScanner() {
  if (qrScanner) {
    try { qrScanner.stop(); } catch(e) {}
    qrScanner = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// VOICE INPUT (NEU — Animated Mic)
// ═══════════════════════════════════════════════════════════════
let voiceRecognition = null;

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  if (voiceRecognition) { try { voiceRecognition.stop(); } catch(e) {} }
  
  voiceRecognition = new SR();
  voiceRecognition.lang = 'de-DE';
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  
  const btn = document.getElementById('voice-btn');
  const bars = document.getElementById('voice-bars');
  const status = document.getElementById('voice-status');
  const result = document.getElementById('voice-result');
  
  btn.classList.add('listening');
  bars.classList.add('active');
  status.textContent = 'Listening...';
  result.textContent = '';
  result.classList.remove('show');
  
  voiceRecognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    btn.classList.remove('listening');
    bars.classList.remove('active');
    status.textContent = '';
    result.textContent = transcript;
    result.classList.add('show');
    
    const inp = document.getElementById('answer-input');
    if (inp) inp.value = transcript;
    setTimeout(() => submitAnswer(), 1500);
  };
  
  voiceRecognition.onerror = () => {
    btn.classList.remove('listening');
    bars.classList.remove('active');
    status.textContent = 'Not recognized — type instead';
  };
  
  voiceRecognition.onend = () => {
    btn.classList.remove('listening');
    bars.classList.remove('active');
  };
  
  voiceRecognition.start();
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════
function navigate(screen) {
  stopQRScanner();
  state.screen = screen;
  render();
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'home': renderHome(app); break;
    case 'tutorial': renderTutorial(app); break;
    case 'setup': renderSetup(app); break;
    case 'scan': renderScan(app); break;
    case 'game': renderGame(app); break;
    case 'summary': renderSummary(app); break;
  }
}

// ===== HOME =====
function renderHome(el) {
  el.innerHTML = `
    <div class="screen screen-home">
      <div class="logo-container">
        <div class="logo-icon purple">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h1 class="logo-title">GeoCheckr</h1>
        <p class="logo-subtitle">Find the place. Win the game.</p>
      </div>
      <div class="menu-buttons">
        <button class="btn btn-primary btn-lg" onclick="chooseMode()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Play
        </button>
        <button class="btn btn-secondary btn-lg" onclick="navigate('tutorial')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          How to Play
        </button>
      </div>
    </div>
  `;
}

// ===== MODE SELECT =====
function chooseMode() {
  playClick();
  state.players = [];
  state.scores = [];
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  state.history = [];
  navigate('setup');
}

// ===== TUTORIAL =====
function renderTutorial(el) {
  const steps = [
    { icon: 'pin', color: 'green', title: 'Welcome to GeoCheckr!', text: 'You\'ll be dropped into a random place on Google Street View. Your job: figure out where you are!' },
    { icon: 'eye', color: 'blue', title: 'Look Around', text: 'Move through the streets. Click arrows to walk. Look at signs, buildings, nature — anything that helps!' },
    { icon: 'mic', color: 'purple', title: 'Make a Guess', text: 'When you know where you are, tap "Make a Guess" and say the city name. Or type it!' },
    { icon: 'star', color: 'orange', title: 'Score Points', text: '≤50km = 5pts · ≤200km = 4pts · ≤750km = 3pts · ≤2500km = 2pts · ≤7500km = 1pt' },
    { icon: 'qr', color: 'cyan', title: 'QR Code Mode', text: 'Print location cards with QR codes. Scan them with your camera to start each round. Perfect for parties!' },
  ];
  const s = steps[state.tutorialStep] || steps[0];
  const icons = {
    pin: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>',
    eye: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    mic: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    star: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    qr: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="20" y1="14" x2="20" y2="20"/><line x1="14" y1="20" x2="20" y2="20"/></svg>',
  };
  el.innerHTML = `
    <div class="screen screen-tutorial">
      <div class="tutorial-card">
        <div class="tutorial-icon ${s.color}">${icons[s.icon]}</div>
        <div class="tutorial-content">
          <h2>${s.title}</h2>
          <p>${s.text}</p>
        </div>
      </div>
      <div class="tutorial-dots">${steps.map((_,i) => `<div class="dot ${i===state.tutorialStep?'active':''}"></div>`).join('')}</div>
      <div class="tutorial-buttons">
        ${state.tutorialStep > 0 ? '<button class="btn btn-ghost" onclick="state.tutorialStep--;render()">← Back</button>' : '<div></div>'}
        ${state.tutorialStep < steps.length-1
          ? '<button class="btn btn-primary" onclick="state.tutorialStep++;render()">Next →</button>'
          : '<button class="btn btn-success" onclick="state.tutorialStep=0;navigate(\'home\')">Got it!</button>'}
      </div>
    </div>
  `;
}

// ===== SETUP =====
function renderSetup(el) {
  if (state.players.length === 0) {
    state.players = [{ name: '' }, { name: '' }];
    state.scores = [0, 0];
    state.playerCount = 2;
  }
  
  el.innerHTML = `
    <div class="screen screen-setup">
      <h2>Players</h2>
      <div class="setup-card">
        ${state.players.map((p,i) => `
          <div class="player-setup">
            <label>
              <span class="player-dot ${i%2===0?'green':'blue'}"></span>
              Player ${i+1}
            </label>
            <input type="text" class="input" value="${p.name}" 
                   onchange="state.players[${i}].name=this.value"
                   placeholder="Enter name..." maxlength="20">
          </div>
        `).join('')}
        
        <div style="display:flex;gap:8px;">
          ${state.players.length < 5 ? `<button class="btn btn-ghost" style="flex:1;font-size:13px;" onclick="addPlayer()">+ Add Player</button>` : ''}
          ${state.players.length > 2 ? `<button class="btn btn-ghost" style="flex:1;font-size:13px;color:#FF3B30;" onclick="removePlayer()">− Remove</button>` : ''}
        </div>
        
        <div class="diff-section">
          <label>Difficulty</label>
          <div class="diff-row">
            ${['leicht','mittel','schwer'].map(d => `
              <button class="diff-btn ${state.difficulty===d?'active':''}" onclick="setDiff('${d}')">
                <span class="ico">${d==='leicht'?'😊':d==='mittel'?'🤔':'🔥'}</span>
                ${d==='leicht'?'Easy':d==='mittel'?'Medium':'Hard'}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="rounds-section">
          <label>Rounds</label>
          <div class="diff-row">
            ${[5,10,15].map(r => `
              <button class="diff-btn ${state.maxRounds===r?'active':''}" onclick="state.maxRounds=${r};render()">${r}</button>
            `).join('')}
          </div>
        </div>
      </div>
      
      <button class="btn btn-primary btn-lg" onclick="startPlaying()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start Game
      </button>
    </div>
  `;
}

function addPlayer() {
  playClick();
  const num = state.players.length + 1;
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

function setDiff(d) { state.difficulty = d; render(); }

function startPlaying() {
  playClick();
  // Fill default names
  state.players.forEach((p, i) => {
    if (!p.name.trim()) p.name = 'Player ' + (i+1);
  });
  startRound();
  navigate('game');
}

// ===== SCAN (QR) =====
function renderScan(el) {
  el.innerHTML = `
    <div class="screen screen-answer">
      <div class="answer-card">
        <div class="answer-title">Scan a <span>QR Card</span></div>
        <div id="qr-reader" style="width:100%;border-radius:12px;overflow:hidden;"></div>
        <div id="qr-status" class="voice-status" style="margin-top:12px;">Point camera at QR code</div>
        <div class="answer-divider"><span>or</span></div>
        <button class="btn btn-secondary" onclick="skipToRandom()">Skip — Random Location</button>
      </div>
    </div>
  `;
  setTimeout(startQRScanner, 300);
}

function skipToRandom() {
  playClick();
  stopQRScanner();
  state.currentLocation = getUnusedLocation();
  state.timer = getTimerForDiff(state.difficulty);
  state.phase = 'view';
  state.streetViewLoaded = false;
  render();
}

// ===== GAME =====
function startRound() {
  state.currentLocation = getUnusedLocation();
  state.timer = getTimerForDiff(state.difficulty);
  state.phase = 'view';
  state.streetViewLoaded = false;
  state.guessCity = '';
  state.guessLat = null;
  state.guessLng = null;
}

function renderGame(el) {
  if (state.phase === 'view') renderView(el);
  else if (state.phase === 'answer') renderAnswer(el);
  else if (state.phase === 'result') renderResult(el);
}

function renderView(el) {
  const cp = state.currentPlayer;
  
  el.innerHTML = `
    <div class="screen screen-game fullscreen-view">
      <div id="streetview-container" class="streetview-box"></div>
      
      <div class="game-topbar">
        ${state.players.map((p,i) => `
          <div class="player-badge ${i===cp?'active':''}">
            <span class="pb-dot ${i%2===0?'green':'blue'}"></span>
            <span class="pb-name">${p.name}</span>
            <span class="pb-score">${state.scores[i]} pts</span>
          </div>
        `).join('')}
        <div class="game-center-info">
          <span class="round-badge">Round ${state.round}/${state.maxRounds}</span>
        </div>
      </div>
      
      <div class="timer-overlay">
        <span class="timer-value ${state.timer<=5?'timer-danger':state.timer<=10?'timer-warn':''}">${state.timer}</span>
      </div>
      
      <div class="guess-btn-wrap">
        <button class="btn-guess" onclick="skipTimer()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          Make a Guess
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
      const te = document.querySelector('.timer-value');
      if (te) {
        te.textContent = state.timer;
        te.className = 'timer-value ' + (state.timer<=5?'timer-danger':state.timer<=10?'timer-warn':'');
      }
      if (state.timer <= 5 && state.timer > 0) playTick();
      if (state.timer === 0) {
        playWarning();
        clearInterval(state.timerInterval);
        state.phase = 'answer';
        render();
      }
    }
  }, 1000);
}

function skipTimer() {
  playClick();
  clearInterval(state.timerInterval);
  state.phase = 'answer';
  render();
}

function renderAnswer(el) {
  const cp = state.currentPlayer;
  const name = state.players[cp].name;
  const hasVoice = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  el.innerHTML = `
    <div class="screen screen-answer">
      <div class="answer-card">
        <div class="answer-title"><span>${name}</span>, where are you?</div>
        
        ${hasVoice ? `
        <button class="voice-btn" id="voice-btn" onclick="startVoiceInput()">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
        
        <div class="voice-bars" id="voice-bars">
          <div class="voice-bar"></div>
          <div class="voice-bar"></div>
          <div class="voice-bar"></div>
          <div class="voice-bar"></div>
          <div class="voice-bar"></div>
        </div>
        
        <div class="voice-status" id="voice-status">Tap the mic to speak</div>
        <div class="voice-result" id="voice-result"></div>
        ` : ''}
        
        <div class="answer-divider"><span>or</span></div>
        <div class="answer-input-wrap">
          <input type="text" id="answer-input" class="input input-answer" 
                 placeholder="Type city name..." autofocus
                 onkeydown="if(event.key==='Enter')submitAnswer()">
        </div>
        <div class="answer-buttons">
          <button class="btn btn-primary" onclick="submitAnswer()">✓ Answer</button>
          <button class="btn btn-skip" onclick="submitAnswer(true)">Skip</button>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => {
    const inp = document.getElementById('answer-input');
    if (inp) inp.focus();
  }, 100);
}

function submitAnswer(skip) {
  const input = skip ? '' : (document.getElementById('answer-input')?.value || '');
  const loc = state.currentLocation;
  
  let dist = 20000;
  state.guessCity = '';
  state.guessLat = null;
  state.guessLng = null;
  
  if (input.trim()) {
    const match = findCity(input);
    if (match) {
      dist = calcDistance(loc.lat, loc.lng, match.lat, match.lng);
      state.guessCity = match.city;
      state.guessLat = match.lat;
      state.guessLng = match.lng;
    } else {
      state.guessCity = input;
    }
  }
  
  const pts = calcPoints(dist);
  state.distance = Math.round(dist);
  state.points = pts;
  state.scores[state.currentPlayer] += pts;
  
  state.history.push({
    round: state.round,
    playerIdx: state.currentPlayer,
    city: loc.city,
    distance: state.distance,
    points: pts,
  });
  
  if (pts >= 3) playPerfect();
  else if (pts > 0) playSuccess();
  else playError();
  
  state.phase = 'result';
  render();
}

function renderResult(el) {
  const loc = state.currentLocation;
  const p = state.points;
  const label = p >= 3 ? 'Perfect!' : p >= 2 ? 'Good!' : p >= 1 ? 'Not bad!' : 'Miss!';
  const color = p >= 3 ? 'var(--green)' : p > 0 ? 'var(--orange)' : 'var(--red)';
  const cp = state.currentPlayer;
  const nextCp = (cp + 1) % state.players.length;
  const isLastTurn = (state.round >= state.maxRounds) && (nextCp === 0);
  
  el.innerHTML = `
    <div class="screen screen-result">
      <div class="result-card">
        <div class="result-header">
          <div class="result-emoji">${p>=3?'🎯':p>=2?'👍':p>=1?'😐':'😅'}</div>
          <h2 class="result-title" style="color:${color}">${label}</h2>
        </div>
        
        <div class="result-map-wrap">
          <div id="result-map" class="result-map"></div>
          <div class="city-overlay">
            <span class="city-big-name">${loc.city}</span>
            <span class="city-country">${loc.country}</span>
          </div>
        </div>
        
        <div class="result-info-bar">
          <div class="result-info-item">
            <span class="ri-label">Guess</span>
            <span class="ri-value">${state.guessCity || '?'}</span>
          </div>
          <div class="result-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div class="result-info-item">
            <span class="ri-label">Actual</span>
            <span class="ri-value">${loc.city}</span>
          </div>
        </div>
        
        <div class="result-distance">
          <span class="rd-number">${state.distance.toLocaleString('de-DE')}</span>
          <span class="rd-unit">km</span>
        </div>
        
        <div class="result-points">+${p} pts</div>
        
        <button class="btn btn-primary btn-continue" onclick="${isLastTurn ? 'navigate(\"summary\")' : 'nextTurn()'}">
          ${isLastTurn ? '🏆 Results' : state.players[nextCp].name + ' is next →'}
        </button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    renderLeafletMap('result-map', loc.lat, loc.lng, state.guessLat, state.guessLng, loc.city, state.guessCity);
  }, 200);
}

function nextTurn() {
  playClick();
  const nextCp = (state.currentPlayer + 1) % state.players.length;
  if (nextCp === 0) state.round++;
  state.currentPlayer = nextCp;
  startRound();
  navigate('game');
}

// ===== SUMMARY =====
function renderSummary(el) {
  const sorted = [...state.players].map((p,i) => ({...p, idx:i, score:state.scores[i]||0}))
    .sort((a,b) => b.score - a.score);
  
  el.innerHTML = `
    <div class="screen screen-summary">
      <div class="summary-card">
        <h2>🏆 Game Over!</h2>
        <p class="summary-sub">${state.maxRounds} rounds played</p>
        
        <div class="leaderboard">
          ${sorted.map((p,i) => `
            <div class="lb-item ${i===0?'lb-first':''}">
              <span class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
              <span class="lb-name">${p.name}</span>
              <span class="lb-score">${p.score} pts</span>
            </div>
          `).join('')}
        </div>
        
        <h3 class="history-title">📊 Rounds</h3>
        <div class="history-list">
          ${state.history.map(h => `
            <div class="history-row">
              <span class="h-round">R${h.round}</span>
              <span class="h-player">${state.players[h.playerIdx]?.name||'?'}</span>
              <span class="h-location">${h.city}</span>
              <span class="h-points">+${h.points}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="summary-buttons">
          <button class="btn btn-primary" onclick="startGame()">🔄 Play Again</button>
          <button class="btn btn-secondary" onclick="navigate('home')">🏠 Menu</button>
        </div>
      </div>
    </div>
  `;
}

function startGame() {
  state.players = [];
  state.scores = [];
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  state.history = [];
  navigate('setup');
}

// Init
render();
