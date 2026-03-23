// ═══════════════════════════════════════════════════════════════
// GeoCheckr — Web Game Engine v3
// Complete rewrite: Full game flow, Leaflet maps, dark design
// Street View: UNVERÄNDERT (fullscreen, wie Vorlage 2)
// ═══════════════════════════════════════════════════════════════

// Use full database from locations_db.js (207 cities)
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
};

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
  // Exact match first
  let match = LOCATIONS.find(l => normalizeName(l.city) === n);
  if (match) return match;
  // Partial match (input contains city or city contains input)
  match = LOCATIONS.find(l => {
    const cn = normalizeName(l.city);
    return cn.includes(n) || n.includes(cn);
  });
  if (match) return match;
  // Fuzzy: check if first 4 chars match
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
// STREET VIEW — UNVERÄNDERT (Vorlage 2)
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
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;font-family:sans-serif;"><div style="text-align:center;"><div style="font-size:24px;">⏳</div><div style="margin-top:10px;">Lade Maps API...</div></div></div>';
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
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;color:#888;font-family:sans-serif;"><div style="text-align:center;"><div style="font-size:48px;">🌍</div><div style="margin-top:10px;">Street View nicht verfügbar</div></div></div>';
    state.streetViewLoaded = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// LEAFLET MAP (for result + answer) — KEIN Google Maps!
// ═══════════════════════════════════════════════════════════════
function renderLeafletMap(containerId, realLat, realLng, guessLat, guessLng, realCity, guessCity) {
  const el = document.getElementById(containerId);
  if (!el) return;
  
  // Clear previous
  el.innerHTML = '';
  
  const hasGuess = guessLat != null && guessLng != null;
  const center = hasGuess ? [(realLat+guessLat)/2, (realLng+guessLng)/2] : [realLat, realLng];
  
  const map = L.map(el, { attributionControl: false }).setView(center, hasGuess ? 3 : 10);
  L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
  
  // Real location (green)
  L.circleMarker([realLat, realLng], { radius: 10, fillColor: '#4CAF50', fillOpacity: 1, color: '#fff', weight: 2 })
    .addTo(map).bindPopup('📍 ' + realCity);
  
  if (hasGuess) {
    // Guess (red)
    L.circleMarker([guessLat, guessLng], { radius: 8, fillColor: '#e94560', fillOpacity: 1, color: '#fff', weight: 2 })
      .addTo(map).bindPopup('🎯 ' + guessCity);
    
    // Line
    L.polyline([[guessLat, guessLng], [realLat, realLng]], { color: '#FFD700', weight: 3, opacity: 0.8 }).addTo(map);
    
    // Fit bounds
    map.fitBounds([[realLat, realLng], [guessLat, guessLng]], { padding: [30, 30] });
  }
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════
function navigate(screen) {
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
    case 'game': renderGame(app); break;
    case 'summary': renderSummary(app); break;
  }
}

// ===== HOME =====
function renderHome(el) {
  el.innerHTML = `
    <div class="screen screen-home">
      <div class="logo-container">
        <div class="logo-icon">🌍</div>
        <h1 class="logo-title">GeoCheckr</h1>
        <p class="logo-subtitle">Finde den Ort. Gewinne das Spiel.</p>
      </div>
      <div class="menu-buttons">
        <button class="btn btn-primary" onclick="startGame()">🎮 Spielen</button>
        <button class="btn btn-secondary" onclick="navigate('tutorial')">📖 Tutorial</button>
      </div>
    </div>
  `;
}

// ===== TUTORIEL =====
function renderTutorial(el) {
  const steps = [
    { icon: '🌍', title: 'Willkommen bei GeoCheckr!', text: 'Du wirst an einen zufälligen Ort auf der Welt gebracht. Deine Aufgabe: Finde heraus wo du bist!' },
    { icon: '👆', title: 'Navigiere', text: 'Bewege dich durch Street View. Klicke auf die Pfeile um dich fortzubewegen. Schau dich um!' },
    { icon: '📍', title: 'Rate den Ort', text: 'Wenn du weißt wo du bist, gib den Stadtnamen ein oder überspringe. Punkte gibt\'s für Nähe!' },
    { icon: '⭐', title: 'Punkte', text: '≤50km = 5⭐ | ≤200km = 4⭐ | ≤750km = 3⭐ | ≤2500km = 2⭐ | ≤7500km = 1⭐' },
  ];
  const s = steps[state.tutorialStep] || steps[0];
  el.innerHTML = `
    <div class="screen screen-tutorial">
      <div class="tutorial-content">
        <div class="tutorial-icon">${s.icon}</div>
        <h2>${s.title}</h2>
        <p>${s.text}</p>
      </div>
      <div class="tutorial-dots">${steps.map((_,i) => `<div class="dot ${i===state.tutorialStep?'active':''}"></div>`).join('')}</div>
      <div class="tutorial-buttons">
        ${state.tutorialStep > 0 ? '<button class="btn btn-ghost" onclick="state.tutorialStep--;render()">← Zurück</button>' : '<div></div>'}
        ${state.tutorialStep < steps.length-1
          ? '<button class="btn btn-primary" onclick="state.tutorialStep++;render()">Weiter →</button>'
          : '<button class="btn btn-success" onclick="state.tutorialStep=0;navigate(\'home\')">Verstanden! 🚀</button>'}
      </div>
    </div>
  `;
}

// ===== SETUP =====
function startGame() {
  state.players = [{ name: 'Spieler 1' }, { name: 'Spieler 2' }];
  state.scores = [0, 0];
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  state.history = [];
  navigate('setup');
}

function renderSetup(el) {
  el.innerHTML = `
    <div class="screen screen-setup">
      <h2>Spieler einrichten</h2>
      ${state.players.map((p,i) => `
        <div class="player-setup">
          <label>Spieler ${i+1}</label>
          <input type="text" class="input" value="${p.name}" 
                 onchange="state.players[${i}].name=this.value||'Spieler ${i+1}'"
                 placeholder="Name..." maxlength="20">
        </div>
      `).join('')}
      
      <div class="diff-section">
        <label>Schwierigkeit</label>
        <div class="diff-row">
          ${['leicht','mittel','schwer'].map(d => `
            <button class="diff-btn ${state.difficulty===d?'active':''}" 
                    onclick="setDiff('${d}')">
              <span>${d==='leicht'?'😊':d==='mittel'?'🤔':'🔥'}</span>
              ${d.charAt(0).toUpperCase()+d.slice(1)}
            </button>
          `).join('')}
        </div>
      </div>
      
      <div class="rounds-section">
        <label>Runden</label>
        <div class="diff-row">
          ${[5,10,15].map(r => `
            <button class="diff-btn ${state.maxRounds===r?'active':''}" 
                    onclick="state.maxRounds=${r};render()">
              ${r}
            </button>
          `).join('')}
        </div>
      </div>
      
      <button class="btn btn-primary btn-lg" onclick="startPlaying()">Starten 🚀</button>
    </div>
  `;
}

function setDiff(d) {
  state.difficulty = d;
  render();
}

function startPlaying() {
  playClick();
  startRound();
  navigate('game');
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
  const p1 = state.players[0];
  const p2 = state.players[1];
  const cp = state.currentPlayer;
  
  el.innerHTML = `
    <div class="screen screen-game fullscreen-view">
      <div id="streetview-container" class="streetview-box"></div>
      
      <!-- Top Bar: Players -->
      <div class="game-topbar">
        <div class="player-badge ${cp===0?'active':''}">
          <span class="pb-name">${p1.name}</span>
          <span class="pb-score">${state.scores[0]}⭐</span>
        </div>
        <div class="game-center-info">
          <span class="round-badge">Runde ${state.round}/${state.maxRounds}</span>
        </div>
        <div class="player-badge ${cp===1?'active':''}">
          <span class="pb-name">${p2.name}</span>
          <span class="pb-score">${state.scores[1]}⭐</span>
        </div>
      </div>
      
      <!-- Timer -->
      <div class="timer-overlay">
        <span class="timer-value ${state.timer<=5?'timer-danger':state.timer<=10?'timer-warn':''}">${state.timer}</span>
      </div>
      
      <!-- Skip -->
      <button class="btn-skip-timer" onclick="skipTimer()">
        Ich weiß es! →
      </button>
    </div>
  `;
  
  // Load panorama
  setTimeout(() => {
    if (state.currentLocation) {
      loadPanorama(state.currentLocation.lat, state.currentLocation.lng);
    }
  }, 100);
  
  // Start timer
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
    <div class="screen screen-game">
      <div class="answer-phase">
        <div class="answer-title">${name}, wo bist du?</div>
        
        <!-- Voice Input Button -->
        ${hasVoice ? `
        <button class="voice-btn" id="voice-btn" onclick="startVoiceInput()">
          <div class="voice-ring" id="voice-ring"></div>
          <span class="voice-icon">🎤</span>
        </button>
        <div class="voice-status" id="voice-status">Tippe zum Sprechen</div>
        <div class="voice-result" id="voice-result"></div>
        ` : ''}
        
        <!-- Text Input Fallback -->
        <div class="answer-divider"><span>oder</span></div>
        <div class="answer-input-wrap">
          <input type="text" id="answer-input" class="input input-answer" 
                 placeholder="Stadtname eingeben..." autofocus
                 onkeydown="if(event.key==='Enter')submitAnswer()">
        </div>
        <div class="answer-buttons">
          <button class="btn btn-primary" onclick="submitAnswer()">✓ Antworten</button>
          <button class="btn btn-skip" onclick="submitAnswer(true)">Überspringen</button>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => {
    const inp = document.getElementById('answer-input');
    if (inp) inp.focus();
  }, 100);
}

// Voice Input
let voiceRecognition = null;
function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  
  if (voiceRecognition) { voiceRecognition.stop(); voiceRecognition = null; }
  
  voiceRecognition = new SR();
  voiceRecognition.lang = 'de-DE';
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  
  const btn = document.getElementById('voice-btn');
  const ring = document.getElementById('voice-ring');
  const status = document.getElementById('voice-status');
  const result = document.getElementById('voice-result');
  
  btn.classList.add('recording');
  ring.classList.add('blinking');
  status.textContent = '🔴 Höre zu...';
  result.textContent = '';
  
  voiceRecognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    btn.classList.remove('recording');
    ring.classList.remove('blinking');
    status.textContent = '';
    result.textContent = transcript;
    result.classList.add('show');
    
    // Auto-fill input and submit
    const inp = document.getElementById('answer-input');
    if (inp) inp.value = transcript;
    setTimeout(() => submitAnswer(), 1500);
  };
  
  voiceRecognition.onerror = (e) => {
    btn.classList.remove('recording');
    ring.classList.remove('blinking');
    status.textContent = '❌ Nicht verstanden — tippe!';
  };
  
  voiceRecognition.onend = () => {
    btn.classList.remove('recording');
    ring.classList.remove('blinking');
  };
  
  voiceRecognition.start();
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
  const emoji = p >= 3 ? '🎯' : p >= 2 ? '👍' : p >= 1 ? '😐' : '😅';
  const label = p >= 3 ? 'Perfekt!' : p >= 2 ? 'Gut!' : p >= 1 ? 'Nicht schlecht!' : 'Daneben!';
  const color = p > 0 ? '#4CAF50' : '#ff4444';
  const cp = state.currentPlayer;
  const nextCp = (cp + 1) % state.players.length;
  const isLastTurn = (state.round >= state.maxRounds) && (nextCp === 0);
  
  el.innerHTML = `
    <div class="screen screen-result">
      <div class="result-header">
        <span class="result-emoji">${emoji}</span>
        <h2 class="result-title" style="color:${color}">${label}</h2>
      </div>
      
      <!-- Big city name overlay on map -->
      <div class="result-map-wrap">
        <div id="result-map" class="result-map"></div>
        <div class="city-overlay">
          <span class="city-big-name">${loc.city}</span>
          <span class="city-country">${loc.country}</span>
        </div>
      </div>
      
      <div class="result-info-bar">
        <div class="result-info-item">
          <span class="ri-label">Tipp</span>
          <span class="ri-value">${state.guessCity || '?'}</span>
        </div>
        <div class="result-arrow">→</div>
        <div class="result-info-item">
          <span class="ri-label">Richtig</span>
          <span class="ri-value">${loc.city}</span>
        </div>
      </div>
      
      <div class="result-distance">
        <span class="rd-number">${state.distance.toLocaleString('de-DE')}</span>
        <span class="rd-unit">km</span>
      </div>
      
      <div class="result-points">+${p} ⭐</div>
      
      <button class="btn btn-primary btn-continue" onclick="${isLastTurn ? 'navigate(\"summary\")' : 'nextTurn()'}">
        ${isLastTurn ? '🏆 Ergebnis' : state.players[nextCp].name + ' ist dran →'}
      </button>
    </div>
  `;
  
  // Render Leaflet map
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
      <h2>🏆 Spiel beendet!</h2>
      <p class="summary-sub">Nach ${state.maxRounds} Runden</p>
      
      <div class="leaderboard">
        ${sorted.map((p,i) => `
          <div class="lb-item ${i===0?'lb-first':''}">
            <span class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
            <span class="lb-name">${p.name}</span>
            <span class="lb-score">${p.score} ⭐</span>
          </div>
        `).join('')}
      </div>
      
      <h3 class="history-title">📊 Runden</h3>
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
        <button class="btn btn-primary" onclick="startGame()">🔄 Nochmal</button>
        <button class="btn btn-secondary" onclick="navigate('home')">🏠 Menü</button>
      </div>
    </div>
  `;
}

// Init
render();
