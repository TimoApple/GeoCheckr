// ═══════════════════════════════════════════════════════════════
// GeoCheckr — Web Game Engine v2
// 68 Locations | Haversine Distance | Multi-Player | 3 Difficulty Levels
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
  // EUROPA — Mittel
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
  // EUROPA — Schwer
  {id:31,city:'Tallinn',country:'Estland',lat:59.4370,lng:24.7536,difficulty:'schwer',region:'EU'},
  {id:32,city:'Riga',country:'Lettland',lat:56.9496,lng:24.1052,difficulty:'schwer',region:'EU'},
  {id:33,city:'Reykjavik',country:'Island',lat:64.1466,lng:-21.9426,difficulty:'schwer',region:'EU'},
  {id:34,city:'Tromsø',country:'Norwegen',lat:69.6496,lng:18.9560,difficulty:'schwer',region:'EU'},
  {id:35,city:'Cáceres',country:'Spanien',lat:39.4752,lng:-6.3724,difficulty:'schwer',region:'EU'},
  {id:36,city:'Białystok',country:'Polen',lat:53.1325,lng:23.1688,difficulty:'schwer',region:'EU'},
  {id:37,city:'Brest',country:'Belarus',lat:52.0976,lng:23.7341,difficulty:'schwer',region:'EU'},
  {id:38,city:'Nordfjordeid',country:'Norwegen',lat:61.9123,lng:5.9911,difficulty:'schwer',region:'EU'},
  {id:39,city:'Lemvig',country:'Dänemark',lat:56.5466,lng:8.3103,difficulty:'schwer',region:'EU'},
  {id:40,city:'Agrigent',country:'Italien',lat:37.3110,lng:13.5765,difficulty:'schwer',region:'EU'},
  // ASIEN
  {id:41,city:'Tokyo',country:'Japan',lat:35.6762,lng:139.6503,difficulty:'mittel',region:'Asien'},
  {id:42,city:'Seoul',country:'Südkorea',lat:37.5665,lng:126.9780,difficulty:'mittel',region:'Asien'},
  {id:43,city:'Bangkok',country:'Thailand',lat:13.7563,lng:100.5018,difficulty:'mittel',region:'Asien'},
  {id:44,city:'Singapur',country:'Singapur',lat:1.3521,lng:103.8198,difficulty:'mittel',region:'Asien'},
  {id:45,city:'Dubai',country:'VAE',lat:25.1972,lng:55.2744,difficulty:'mittel',region:'Asien'},
  {id:46,city:'Mumbai',country:'Indien',lat:19.0760,lng:72.8777,difficulty:'mittel',region:'Asien'},
  {id:47,city:'Taipei',country:'Taiwan',lat:25.0330,lng:121.5654,difficulty:'mittel',region:'Asien'},
  {id:48,city:'Hongkong',country:'China',lat:22.3193,lng:114.1694,difficulty:'mittel',region:'Asien'},
  {id:49,city:'Kyoto',country:'Japan',lat:34.9859,lng:135.7581,difficulty:'schwer',region:'Asien'},
  {id:50,city:'Hanoi',country:'Vietnam',lat:21.0278,lng:105.8342,difficulty:'schwer',region:'Asien'},
  // AFRIKA
  {id:51,city:'Kairo',country:'Ägypten',lat:30.0444,lng:31.2357,difficulty:'mittel',region:'Afrika'},
  {id:52,city:'Marrakesch',country:'Marokko',lat:31.6295,lng:-7.9811,difficulty:'mittel',region:'Afrika'},
  {id:53,city:'Kapstadt',country:'Südafrika',lat:-33.9249,lng:18.4241,difficulty:'mittel',region:'Afrika'},
  {id:54,city:'Nairobi',country:'Kenia',lat:-1.2921,lng:36.8219,difficulty:'schwer',region:'Afrika'},
  {id:55,city:'Jerusalem',country:'Israel',lat:31.7683,lng:35.2137,difficulty:'mittel',region:'Asien'},
  // AMERIKA
  {id:56,city:'New York',country:'USA',lat:40.7580,lng:-73.9855,difficulty:'leicht',region:'Amerika'},
  {id:57,city:'San Francisco',country:'USA',lat:37.8083,lng:-122.4194,difficulty:'mittel',region:'Amerika'},
  {id:58,city:'Rio de Janeiro',country:'Brasilien',lat:-22.9519,lng:-43.2105,difficulty:'mittel',region:'Amerika'},
  {id:59,city:'Buenos Aires',country:'Argentinien',lat:-34.6037,lng:-58.3816,difficulty:'mittel',region:'Amerika'},
  {id:60,city:'Mexiko-Stadt',country:'Mexiko',lat:19.4326,lng:-99.1332,difficulty:'mittel',region:'Amerika'},
  {id:61,city:'Havanna',country:'Kuba',lat:23.1136,lng:-82.3666,difficulty:'schwer',region:'Amerika'},
  {id:62,city:'Toronto',country:'Kanada',lat:43.6532,lng:-79.3832,difficulty:'mittel',region:'Amerika'},
  // OZEANIEN
  {id:63,city:'Sydney',country:'Australien',lat:-33.8568,lng:151.2153,difficulty:'leicht',region:'Ozeanien'},
  {id:64,city:'Melbourne',country:'Australien',lat:-37.8136,lng:144.9631,difficulty:'mittel',region:'Ozeanien'},
  {id:65,city:'Auckland',country:'Neuseeland',lat:-36.8485,lng:174.7633,difficulty:'schwer',region:'Ozeanien'},
  // EXTRA
  {id:66,city:'Kyiv',country:'Ukraine',lat:50.4501,lng:30.5234,difficulty:'mittel',region:'EU'},
  {id:67,city:'Stornoway',country:'Schottland',lat:58.2093,lng:-6.3890,difficulty:'schwer',region:'EU'},
  {id:68,city:'Shetland',country:'UK',lat:60.3894,lng:-1.2618,difficulty:'schwer',region:'EU'},
];

// ─── City Aliases ───
const ALIASES = {
  'tokio':'tokyo','peking':'beijing','mailand':'milano','mailand':'mailand',
  'florenz':'florenz','venedig':'venedig','neapel':'neapel','rom':'rom',
  'bruessel':'brüssel','kopenhagen':'kopenhagen','moskau':'moskau',
  'bombay':'mumbai','muenchen':'münchen','munchen':'münchen',
  'zuerich':'zürich','zurich':'zürich','marrakech':'marrakesch',
  'kapstadt':'kapstadt','cape town':'kapstadt','kairo':'kairo','cairo':'kairo',
  'hong kong':'hongkong','mexico city':'mexiko-stadt','nyc':'new york',
  'new york city':'new york','rio':'rio de janeiro','sf':'san francisco',
  'japan':'tokyo','china':'beijing','deutschland':'berlin','frankreich':'paris',
  'italien':'rom','spanien':'madrid','grossbritannien':'london',
  'tuerkei':'istanbul','türkei':'istanbul','griechenland':'athen',
  'aegypten':'kairo','ägypten':'kairo','thailand':'bangkok','indien':'mumbai',
  'brasilien':'rio de janeiro','mexiko':'mexiko-stadt','australien':'sydney',
  'suedkorea':'seoul','südkorea':'seoul','korea':'seoul','taiwan':'taipei',
  'vietnam':'hanoi','kanada':'toronto','usa':'new york',
  'argentinien':'buenos aires','marokko':'marrakesch','suedafrika':'kapstadt',
  'südafrika':'kapstadt','kenia':'nairobi','israel':'jerusalem',
  'kuba':'havanna','island':'reykjavik','neuseeland':'auckland',
  'eiffelturm':'paris','big ben':'london','kolosseum':'rom','colosseum':'rom',
  'brandenburger tor':'berlin','sagrada familia':'barcelona',
  'taj mahal':'mumbai','freiheitsstatue':'new york','statue of liberty':'new york',
  'burj khalifa':'dubai','opera sydney':'sydney','sydney opera':'sydney',
  'uae':'dubai','v.a.e.':'dubai','emirate':'dubai',
};

// ─── Haversine ───
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function calcPoints(dist) {
  if (dist < 100) return 3;
  if (dist < 500) return 2;
  if (dist < 2000) return 1;
  return 0;
}

function normalizeName(s) {
  return s.toLowerCase().trim()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
    .replace(/á/g,'a').replace(/à/g,'a').replace(/â/g,'a')
    .replace(/ñ/g,'n').replace(/ó/g,'o').replace(/ô/g,'o')
    .replace(/ú/g,'u').replace(/ç/g,'c');
}

function findCity(input) {
  if (!input.trim()) return null;
  const norm = normalizeName(input);
  const aliased = ALIASES[norm] || norm;
  // Exact match
  for (const loc of LOCATIONS) {
    if (normalizeName(loc.city) === aliased || normalizeName(loc.city) === norm) return loc;
  }
  // Partial match
  for (const loc of LOCATIONS) {
    const cn = normalizeName(loc.city);
    if (cn.includes(aliased) || aliased.includes(cn)) return loc;
  }
  return null;
}

// ─── Audio ───
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function beep(freq, dur, vol=0.3) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.value = vol;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function playClick() { beep(660, 0.05, 0.15); }
function playSuccess() { beep(523,0.1,0.3); setTimeout(()=>beep(659,0.1,0.3),120); setTimeout(()=>beep(784,0.15,0.3),240); }
function playPerfect() { beep(523,0.1,0.3); setTimeout(()=>beep(659,0.1,0.3),100); setTimeout(()=>beep(784,0.1,0.3),200); setTimeout(()=>beep(1047,0.2,0.35),300); }
function playError() { beep(220, 0.4, 0.3); }
function playTick() { beep(880, 0.08, 0.2); }
function playWarning() { beep(440,0.3,0.4); setTimeout(()=>beep(440,0.3,0.4),350); }

// ═══════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════
let state = {
  screen: 'home', // home | setup | game | result | summary
  players: [{name:'Spieler 1'},{name:'Spieler 2'}],
  difficulty: 'mittel',
  maxRounds: 10,
  round: 1,
  currentPlayer: 0,
  scores: {},
  timer: 30,
  timerInterval: null,
  phase: 'scan', // scan | view | answer | result
  currentLocation: null,
  usedLocations: [],
  history: [],
  distance: 0,
  points: 0,
  streetViewLoaded: false,
};

function getTimerForDiff(d) {
  return d === 'schwer' ? 20 : 30;
}

// ═══════════════════════════════════════════════════════════════
// STREET VIEW (via Google Maps JavaScript API)
// ═══════════════════════════════════════════════════════════════
let panorama = null;
let svService = null;

function initStreetView() {
  svService = new google.maps.StreetViewService();
}

function loadPanorama(lat, lng) {
  const container = document.getElementById('streetview-container');
  if (!container) return;

  // Try to find a nearby panorama
  svService.getPanorama({ location: { lat, lng }, radius: 50000, preference: 'nearest' }, (data, status) => {
    if (status === 'OK' && data && data.location) {
      panorama = new google.maps.StreetViewPanorama(container, {
        position: data.location.latLng,
        pov: { heading: Math.random()*360, pitch: 0 },
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
      });
      state.streetViewLoaded = true;
    } else {
      // Fallback: static map image
      container.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;">
        <div style="text-align:center;color:#888;">
          <div style="font-size:48px;">🌍</div>
          <div style="margin-top:10px;">Street View nicht verfügbar</div>
          <div style="font-size:12px;margin-top:5px;">Betrachte die Umgebung genau!</div>
        </div>
      </div>`;
      state.streetViewLoaded = false;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'home': renderHome(app); break;
    case 'setup': renderSetup(app); break;
    case 'game': renderGame(app); break;
    case 'summary': renderSummary(app); break;
  }
}

function renderHome(el) {
  el.innerHTML = `
    <div class="screen screen-home">
      <div class="logo-container">
        <div class="logo-icon">🌍</div>
        <h1 class="logo-title">GeoCheckr</h1>
        <p class="logo-subtitle">Finde den Ort. Gewinne das Spiel.</p>
      </div>
      <div class="menu-buttons">
        <button class="btn btn-primary" onclick="startSetup()">
          🎮 Neues Spiel
        </button>
        <button class="btn btn-secondary" onclick="showInfo()">
          ℹ️ Über GeoCheckr
        </button>
      </div>
      <div class="stats-bar">
        <span>📍 ${LOCATIONS.length} Locations</span>
        <span>🌐 Weltweit</span>
        <span>🎯 3 Schwierigkeiten</span>
      </div>
    </div>
  `;
}

function renderSetup(el) {
  const playerInputs = state.players.map((p, i) => `
    <div class="player-row">
      <span class="player-num">${i+1}</span>
      <input type="text" class="input" value="${p.name}" 
             onchange="state.players[${i}].name=this.value||'Spieler ${i+1}'"
             placeholder="Spieler ${i+1}">
      ${state.players.length > 2 ? `<button class="btn-remove" onclick="removePlayer(${i})">✕</button>` : ''}
    </div>
  `).join('');

  el.innerHTML = `
    <div class="screen screen-setup">
      <button class="btn-back" onclick="goHome()">← Zurück</button>
      <h2>⚙️ Spiel einrichten</h2>
      
      <div class="section">
        <h3>👥 Spieler (${state.players.length})</h3>
        ${playerInputs}
        ${state.players.length < 8 ? `<button class="btn btn-add" onclick="addPlayer()">+ Spieler</button>` : ''}
      </div>
      
      <div class="section">
        <h3>🎯 Schwierigkeit</h3>
        <div class="diff-buttons">
          <button class="btn-diff ${state.difficulty==='leicht'?'active':''}" onclick="setDiff('leicht')">😊 Leicht</button>
          <button class="btn-diff ${state.difficulty==='mittel'?'active':''}" onclick="setDiff('mittel')">🤔 Mittel</button>
          <button class="btn-diff ${state.difficulty==='schwer'?'active':''}" onclick="setDiff('schwer')">🔥 Schwer</button>
        </div>
      </div>
      
      <div class="section">
        <h3>🔄 Runden: ${state.maxRounds}</h3>
        <input type="range" min="3" max="20" value="${state.maxRounds}" 
               onchange="state.maxRounds=parseInt(this.value);render()" class="slider">
      </div>
      
      <button class="btn btn-primary btn-start" onclick="startGame()">
        🚀 Spiel starten!
      </button>
    </div>
  `;
}

function renderGame(el) {
  if (state.phase === 'scan') renderScan(el);
  else if (state.phase === 'view') renderView(el);
  else if (state.phase === 'answer') renderAnswer(el);
  else if (state.phase === 'result') renderResult(el);
}

function renderScan(el) {
  const locsLeft = LOCATIONS.length - state.usedLocations.length;
  el.innerHTML = `
    <div class="screen screen-game">
      <div class="game-header">
        <div class="player-info">
          <span class="current-player">${state.players[state.currentPlayer].name}</span>
          <span class="player-turn">ist dran</span>
        </div>
        <div class="round-info">Runde ${state.round}/${state.maxRounds}</div>
      </div>
      <div class="scoreboard">
        ${state.players.map((p,i) => `
          <div class="score-item ${i===state.currentPlayer?'active':''}">
            <span class="score-name">${p.name}</span>
            <span class="score-value">${state.scores[i]||0}</span>
          </div>
        `).join('')}
      </div>
      <div class="scan-phase">
        <div class="scan-icon">📷</div>
        <h2>Bereit?</h2>
        <p>Location laden um zu starten</p>
        <button class="btn btn-primary btn-scan" onclick="loadLocation()">
          📍 Location laden
        </button>
        <p class="scan-hint">${locsLeft} von ${LOCATIONS.length} verfügbar</p>
      </div>
    </div>
  `;
}

function renderView(el) {
  el.innerHTML = `
    <div class="screen screen-game fullscreen-view">
      <div id="streetview-container" class="streetview-box"></div>
      <div class="timer-overlay" id="timer-display">
        <span class="timer-value ${state.timer<=5?'timer-danger':state.timer<=10?'timer-warn':''}">${state.timer}</span>
      </div>
      <button class="btn-skip-timer" onclick="skipTimer()">
        Ich weiß es! →
      </button>
    </div>
  `;
  // Load panorama after render
  setTimeout(() => {
    if (state.currentLocation) {
      loadPanorama(state.currentLocation.lat, state.currentLocation.lng);
    }
  }, 100);
}

function renderAnswer(el) {
  el.innerHTML = `
    <div class="screen screen-game">
      <div class="answer-phase">
        <div class="answer-icon">🎤</div>
        <h2>Deine Antwort</h2>
        <p>Nenne die Stadt</p>
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
  // Focus input
  setTimeout(() => {
    const inp = document.getElementById('answer-input');
    if (inp) inp.focus();
  }, 100);
}

function renderResult(el) {
  const loc = state.currentLocation;
  const p = state.points;
  const emoji = p >= 3 ? '🎯' : p >= 2 ? '👍' : p >= 1 ? '😐' : '😅';
  const label = p >= 3 ? 'Perfekt!' : p >= 2 ? 'Gut!' : p >= 1 ? 'Nicht schlecht!' : 'Daneben!';
  const color = p > 0 ? 'var(--success)' : 'var(--danger)';
  const nextPlayer = state.players[(state.currentPlayer + 1) % state.players.length];
  const isLastTurn = (state.round >= state.maxRounds) && 
                     ((state.currentPlayer + 1) % state.players.length === 0);

  el.innerHTML = `
    <div class="screen screen-game">
      <div class="result-phase">
        <div class="result-emoji">${emoji}</div>
        <h2 class="result-title" style="color:${color}">${label}</h2>
        <div class="result-card">
          <div class="result-row">
            <span>📍 Ort</span>
            <strong>${loc.city}, ${loc.country}</strong>
          </div>
          <div class="result-row">
            <span>📏 Distanz</span>
            <strong>${state.distance.toLocaleString('de-DE')} km</strong>
          </div>
          <div class="result-row">
            <span>⭐ Punkte</span>
            <strong class="pts">+${p}</strong>
          </div>
        </div>
        <button class="btn btn-primary" onclick="${isLastTurn ? 'showSummary()' : 'nextTurn()'}">
          ${isLastTurn ? '🏆 Ergebnis anzeigen' : nextPlayer.name + ' ist dran →'}
        </button>
      </div>
    </div>
  `;
}

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
      
      <h3 class="history-title">📊 Runden-Übersicht</h3>
      <div class="history-list">
        ${state.history.map(h => `
          <div class="history-row">
            <span class="h-round">R${h.round}</span>
            <span class="h-player">${state.players[h.playerIdx]?.name||'?'}</span>
            <span class="h-location">${h.city}</span>
            <span class="h-pts">+${h.points}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="summary-buttons">
        <button class="btn btn-primary" onclick="restartGame()">🔄 Neue Runde</button>
        <button class="btn btn-secondary" onclick="goHome()">🏠 Hauptmenü</button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// GAME ACTIONS
// ═══════════════════════════════════════════════════════════════
function startSetup() {
  playClick();
  state.screen = 'setup';
  render();
}

function goHome() {
  playClick();
  clearTimer();
  state.screen = 'home';
  render();
}

function showInfo() {
  alert('🌍 GeoCheckr v2.0\n\nEin Geografie-Party-Spiel!\n68 Locations weltweit\n2-8 Spieler\n3 Schwierigkeitsstufen\n\nBasiert auf Google Street View.');
}

function addPlayer() {
  playClick();
  state.players.push({name: `Spieler ${state.players.length + 1}`});
  render();
}

function removePlayer(i) {
  playClick();
  state.players.splice(i, 1);
  render();
}

function setDiff(d) {
  playClick();
  state.difficulty = d;
  render();
}

function startGame() {
  playClick();
  // Init scores
  state.scores = {};
  state.players.forEach((_, i) => state.scores[i] = 0);
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  state.history = [];
  state.screen = 'game';
  state.phase = 'scan';
  render();
}

function loadLocation() {
  playClick();
  // Pick random unused location (filtered by difficulty if set)
  let pool = LOCATIONS.filter(l => !state.usedLocations.includes(l.id));
  if (pool.length === 0) {
    state.usedLocations = [];
    pool = LOCATIONS;
  }
  // Filter by difficulty
  const diffPool = pool.filter(l => l.difficulty === state.difficulty);
  const pick = diffPool.length > 0 ? diffPool : pool;
  const loc = pick[Math.floor(Math.random() * pick.length)];
  
  state.currentLocation = loc;
  state.usedLocations.push(loc.id);
  state.timer = getTimerForDiff(state.difficulty);
  state.phase = 'view';
  state.streetViewLoaded = false;
  render();
  
  // Start countdown
  startTimer();
}

function startTimer() {
  clearTimer();
  state.timerInterval = setInterval(() => {
    state.timer--;
    // Update timer display
    const el = document.getElementById('timer-display');
    if (el) {
      const val = el.querySelector('.timer-value');
      if (val) {
        val.textContent = state.timer;
        val.className = 'timer-value' + (state.timer<=5?' timer-danger':state.timer<=10?' timer-warn':'');
      }
      if (state.timer <= 5 && state.timer > 0) playTick();
    }
    if (state.timer <= 0) {
      clearTimer();
      playWarning();
      state.phase = 'answer';
      render();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function skipTimer() {
  playClick();
  clearTimer();
  state.phase = 'answer';
  render();
}

function submitAnswer(skip) {
  const input = skip ? '' : (document.getElementById('answer-input')?.value || '');
  const loc = state.currentLocation;
  
  let dist = 20000; // default: max
  if (input.trim()) {
    const found = findCity(input);
    if (found) {
      dist = calcDistance(loc.lat, loc.lng, found.lat, found.lng);
    }
  }
  
  const pts = calcPoints(dist);
  const timeBonus = (state.difficulty === 'schwer' && state.timer > 10 && pts > 0) ? 1 : 0;
  const total = pts + timeBonus;
  
  state.distance = dist;
  state.points = total;
  state.scores[state.currentPlayer] = (state.scores[state.currentPlayer] || 0) + total;
  
  state.history.push({
    round: state.round,
    playerIdx: state.currentPlayer,
    city: loc.city,
    country: loc.country,
    distance: dist,
    points: total
  });
  
  if (total >= 3) { playPerfect(); }
  else if (total > 0) { playSuccess(); }
  else { playError(); }
  
  state.phase = 'result';
  render();
}

function nextTurn() {
  playClick();
  const nextP = (state.currentPlayer + 1) % state.players.length;
  
  if (nextP === 0) {
    // Round complete
    if (state.round >= state.maxRounds) {
      showSummary();
      return;
    }
    state.round++;
  }
  
  state.currentPlayer = nextP;
  state.phase = 'scan';
  render();
}

function showSummary() {
  playClick();
  state.screen = 'summary';
  render();
}

function restartGame() {
  playClick();
  state.scores = {};
  state.players.forEach((_, i) => state.scores[i] = 0);
  state.round = 1;
  state.currentPlayer = 0;
  state.usedLocations = [];
  state.history = [];
  state.screen = 'game';
  state.phase = 'scan';
  render();
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  render();
});

// Global callback for Google Maps API
function initMap() {
  initStreetView();
}
