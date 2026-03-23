// ═══════════════════════════════════════════════════════════════
// GeoCheckr — Web Game Engine v3
// Complete rewrite: Full game flow, Leaflet maps, dark design
// Street View: UNVERÄNDERT (fullscreen, wie Vorlage 2)
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = [
  // EUROPA — Leicht
  {id:1,city:'Paris',country:'Frankreich',lat:48.8584,lng:2.2945,difficulty:'leicht',region:'EU'},
  {id:2,city:'London',country:'UK',lat:51.5007,lng:-0.1246,difficulty:'leicht',region:'EU'},
  {id:3,city:'Rom',country:'Italien',lat:41.8902,lng:12.4922,difficulty:'leicht',region:'EU'},
  {id:4,city:'Barcelona',country:'Spanien',lat:41.4036,lng:2.1744,difficulty:'leicht',region:'EU'},
  {id:5,city:'Amsterdam',country:'Niederlande',lat:52.3676,lng:4.9041,difficulty:'leicht',region:'EU'},
  {id:6,city:'Venedig',country:'Italien',lat:45.4408,lng:12.3155,difficulty:'leicht',region:'EU'},
  {id:7,city:'Wien',country:'Österreich',lat:48.2082,lng:16.3738,difficulty:'leicht',region:'EU'},
  {id:8,city:'Prag',country:'Tschechien',lat:50.0875,lng:14.4213,difficulty:'leicht',region:'EU'},
  {id:9,city:'München',country:'Deutschland',lat:48.1351,lng:11.5820,difficulty:'leicht',region:'EU'},
  {id:10,city:'Mailand',country:'Italien',lat:45.4642,lng:9.1900,difficulty:'leicht',region:'EU'},
  {id:11,city:'Berlin',country:'Deutschland',lat:52.5163,lng:13.3777,difficulty:'mittel',region:'EU'},
  {id:12,city:'Madrid',country:'Spanien',lat:40.4168,lng:-3.7038,difficulty:'mittel',region:'EU'},
  {id:13,city:'Stockholm',country:'Schweden',lat:59.3293,lng:18.0686,difficulty:'mittel',region:'EU'},
  {id:14,city:'Oslo',country:'Norwegen',lat:59.9139,lng:10.7522,difficulty:'mittel',region:'EU'},
  {id:15,city:'Kopenhagen',country:'Dänemark',lat:55.6761,lng:12.5683,difficulty:'mittel',region:'EU'},
  {id:16,city:'Helsinki',country:'Finnland',lat:60.1699,lng:24.9384,difficulty:'mittel',region:'EU'},
  {id:17,city:'Dublin',country:'Irland',lat:53.3498,lng:-6.2603,difficulty:'mittel',region:'EU'},
  {id:18,city:'Lissabon',country:'Portugal',lat:38.7223,lng:-9.1393,difficulty:'mittel',region:'EU'},
  {id:19,city:'Brüssel',country:'Belgien',lat:50.8503,lng:4.3517,difficulty:'mittel',region:'EU'},
  {id:20,city:'Hamburg',country:'Deutschland',lat:53.5511,lng:9.9937,difficulty:'mittel',region:'EU'},
  {id:21,city:'Budapest',country:'Ungarn',lat:47.4979,lng:19.0402,difficulty:'mittel',region:'EU'},
  {id:22,city:'Warschau',country:'Polen',lat:52.2297,lng:21.0122,difficulty:'mittel',region:'EU'},
  {id:23,city:'Athen',country:'Griechenland',lat:37.9838,lng:23.7275,difficulty:'mittel',region:'EU'},
  {id:24,city:'Istanbul',country:'Türkei',lat:41.0082,lng:28.9784,difficulty:'mittel',region:'EU'},
  {id:25,city:'Zürich',country:'Schweiz',lat:47.3769,lng:8.5417,difficulty:'mittel',region:'EU'},
  {id:26,city:'Edinburgh',country:'UK',lat:55.9533,lng:-3.1883,difficulty:'mittel',region:'EU'},
  {id:27,city:'Florenz',country:'Italien',lat:43.7696,lng:11.2558,difficulty:'mittel',region:'EU'},
  {id:28,city:'Neapel',country:'Italien',lat:40.8518,lng:14.2681,difficulty:'mittel',region:'EU'},
  {id:29,city:'Lyon',country:'Frankreich',lat:45.7640,lng:4.8357,difficulty:'mittel',region:'EU'},
  {id:30,city:'Marseille',country:'Frankreich',lat:43.2965,lng:5.3698,difficulty:'mittel',region:'EU'},
  {id:31,city:'Tallinn',country:'Estland',lat:59.4370,lng:24.7536,difficulty:'schwer',region:'EU'},
  {id:32,city:'Riga',country:'Lettland',lat:56.9496,lng:24.1052,difficulty:'schwer',region:'EU'},
  {id:33,city:'Reykjavik',country:'Island',lat:64.1466,lng:-21.9426,difficulty:'schwer',region:'EU'},
  {id:34,city:'Tokyo',country:'Japan',lat:35.6762,lng:139.6503,difficulty:'mittel',region:'Asien'},
  {id:35,city:'Seoul',country:'Südkorea',lat:37.5665,lng:126.9780,difficulty:'mittel',region:'Asien'},
  {id:36,city:'Bangkok',country:'Thailand',lat:13.7563,lng:100.5018,difficulty:'mittel',region:'Asien'},
  {id:37,city:'Dubai',country:'VAE',lat:25.1972,lng:55.2744,difficulty:'mittel',region:'Asien'},
  {id:38,city:'Kairo',country:'Ägypten',lat:30.0444,lng:31.2357,difficulty:'mittel',region:'Afrika'},
  {id:39,city:'Marrakesch',country:'Marokko',lat:31.6295,lng:-7.9811,difficulty:'mittel',region:'Afrika'},
  {id:40,city:'Kapstadt',country:'Südafrika',lat:-33.9249,lng:18.4241,difficulty:'mittel',region:'Afrika'},
  {id:41,city:'New York',country:'USA',lat:40.7580,lng:-73.9855,difficulty:'leicht',region:'Amerika'},
  {id:42,city:'San Francisco',country:'USA',lat:37.8083,lng:-122.4194,difficulty:'mittel',region:'Amerika'},
  {id:43,city:'Rio de Janeiro',country:'Brasilien',lat:-22.9519,lng:-43.2105,difficulty:'mittel',region:'Amerika'},
  {id:44,city:'Buenos Aires',country:'Argentinien',lat:-34.6037,lng:-58.3816,difficulty:'mittel',region:'Amerika'},
  {id:45,city:'Sydney',country:'Australien',lat:-33.8568,lng:151.2153,difficulty:'leicht',region:'Ozeanien'},
  {id:46,city:'Melbourne',country:'Australien',lat:-37.8136,lng:144.9631,difficulty:'mittel',region:'Ozeanien'},
  {id:47,city:'Singapur',country:'Singapur',lat:1.3521,lng:103.8198,difficulty:'mittel',region:'Asien'},
  {id:48,city:'Hongkong',country:'China',lat:22.3193,lng:114.1694,difficulty:'mittel',region:'Asien'},
  {id:49,city:'Mumbai',country:'Indien',lat:19.0760,lng:72.8777,difficulty:'mittel',region:'Asien'},
  {id:50,city:'Toronto',country:'Kanada',lat:43.6532,lng:-79.3832,difficulty:'mittel',region:'Amerika'},
];

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
    .replace(/[^a-z]/g,'');
}

function findCity(input) {
  if (!input || !input.trim()) return null;
  const n = normalizeName(input);
  return LOCATIONS.find(l => normalizeName(l.city) === n)
    || LOCATIONS.find(l => normalizeName(l.city).includes(n) || n.includes(normalizeName(l.city)));
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
  
  el.innerHTML = `
    <div class="screen screen-game">
      <div class="answer-phase">
        <div class="answer-icon">📍</div>
        <h2>${name}, wo bist du?</h2>
        <div class="answer-input-wrap">
          <input type="text" id="answer-input" class="input input-answer" 
                 placeholder="Stadtname..." autofocus
                 onkeydown="if(event.key==='Enter')submitAnswer()">
        </div>
        <div class="answer-buttons">
          <button class="btn btn-primary" onclick="submitAnswer()">✓ Antworten</button>
          <button class="btn btn-skip" onclick="submitAnswer(true)">Überspringen →</button>
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
  const emoji = p >= 3 ? '🎯' : p >= 2 ? '👍' : p >= 1 ? '😐' : '😅';
  const label = p >= 3 ? 'Perfekt!' : p >= 2 ? 'Gut!' : p >= 1 ? 'Nicht schlecht!' : 'Daneben!';
  const color = p > 0 ? 'var(--success)' : 'var(--danger)';
  const cp = state.currentPlayer;
  const nextCp = (cp + 1) % state.players.length;
  const isLastTurn = (state.round >= state.maxRounds) && (nextCp === 0);
  
  el.innerHTML = `
    <div class="screen screen-result">
      <div class="result-header">
        <span class="result-emoji">${emoji}</span>
        <h2 class="result-title" style="color:${color}">${label}</h2>
      </div>
      
      <div id="result-map" class="result-map"></div>
      
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
  
  // Render Leaflet map (NO Google Maps!)
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
