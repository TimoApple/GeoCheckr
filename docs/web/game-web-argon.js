// ═══════════════════════════════════════════════════════════════
// GeoCheckr Web — Argon Online Multiplayer Game Engine
// Font: EXCLUSIVELY Space Grotesk
// Colors: Timo's 4 Master + Shades
// NO QR Cards — pure online play
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = (typeof ALL_LOCATIONS !== 'undefined') ? ALL_LOCATIONS.map((l, i) => ({...l, id: i+1})) : [];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  screen: 'tutorial',
  tutorialStep: 0,
  playerName: '',
  players: [],     // { name, score, conn? }
  myIndex: 0,
  round: 1,
  maxRounds: 10,
  currentLocation: null,
  timer: 60,
  timerSeconds: 60,
  timerInterval: null,
  usedLocations: [],
  isHost: false,
  roomId: null,
  guessText: '',
  distance: 0,
  lastAnswer: null,
};

// Player colors
const PLAYER_COLORS = ['#bdc2ff', '#a6d700', '#3340ca', '#88da7d', '#7ed957', '#ffb4ab'];

// ═══════════════════════════════════════════════════════════════
// TUTORIAL DATA
// ═══════════════════════════════════════════════════════════════
const TUTORIAL_STEPS = [
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bdc2ff" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>`,
    title: 'Willkommen bei GeoCheckr',
    desc: 'Erkunde die Welt mit Street View und finde heraus, wo du bist!',
  },
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a6d700" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    title: 'Online spielen',
    desc: 'Erstelle einen Raum oder tritt einem bestehenden bei. Spiele gegen Freunde!',
  },
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bdc2ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    title: 'Zeitlimit',
    desc: 'Du hast begrenzte Zeit — schau dich um und errate die Stadt so schnell wie möglich!',
  },
  {
    icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a6d700" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    title: 'Punkte sammeln',
    desc: 'Je näher dein Tipp, desto mehr Punkte. Errate Stadt UND Land für Bonus!',
  },
];

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
  if (dist < 50) return 5;
  if (dist < 200) return 4;
  if (dist < 500) return 3;
  if (dist < 1500) return 2;
  if (dist < 5000) return 1;
  return 0;
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function pickRandomLocation() {
  const available = LOCATIONS.filter(l => !state.usedLocations.includes(l.id));
  if (available.length === 0) { state.usedLocations = []; return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; }
  const loc = available[Math.floor(Math.random() * available.length)];
  state.usedLocations.push(loc.id);
  return loc;
}

// ═══════════════════════════════════════════════════════════════
// STREET VIEW
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
    container.innerHTML = '<div class="loader"><div class="loader-icon" style="width:48px;height:48px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bdc2ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><p class="text-dim">Lade Maps API...</p></div>';
    setTimeout(() => loadPanorama(lat, lng), 1500);
    return;
  }
  try {
    if (panorama) { /* reuse */ }
    panorama = new google.maps.StreetViewPanorama(container, {
      position: { lat, lng },
      pov: { heading: Math.random() * 360, pitch: 0 },
      zoom: 0,
      addressControl: false, linksControl: true, panControl: true,
      zoomControl: true, fullscreenControl: false,
      motionTracking: false, motionTrackingControl: false,
      enableCloseButton: false, clickToGo: true, scrollwheel: true,
    });
  } catch(e) {
    container.innerHTML = '<div class="loader"><p class="text-dim">Street View nicht verfügbar</p></div>';
  }
}

// ═══════════════════════════════════════════════════════════════
// NETWORKING HANDLERS
// ═══════════════════════════════════════════════════════════════
Net.onMessage = (data, conn) => {
  switch(data.type) {
    case 'join':
      if (state.isHost) {
        const player = { name: data.name, score: 0, conn };
        state.players.push(player);
        // Broadcast updated player list
        Net.send({ type: 'players', players: state.players.map(p => ({ name: p.name, score: p.score })) });
        render();
      }
      break;
    case 'players':
      if (!state.isHost) {
        state.players = data.players;
        render();
      }
      break;
    case 'start':
      state.round = data.round;
      state.currentLocation = data.location;
      state.timer = data.timer;
      state.timerSeconds = data.timer;
      state.screen = 'playing';
      render();
      break;
    case 'answer':
      state.lastAnswer = data;
      state.screen = 'answer';
      render();
      break;
    case 'guess':
      // Host receives guesses
      if (state.isHost && data.playerIdx !== undefined) {
        if (!state.roundGuesses) state.roundGuesses = {};
        state.roundGuesses[data.playerIdx] = data;
        checkAllGuessed();
      }
      break;
    case 'scoreUpdate':
      state.players = data.players;
      state.round = data.round;
      state.screen = 'score';
      render();
      break;
    case 'nextRound':
      state.round = data.round;
      state.currentLocation = data.location;
      state.timer = data.timer;
      state.timerSeconds = data.timer;
      state.screen = 'playing';
      render();
      break;
    case 'gameOver':
      state.players = data.players;
      state.screen = 'gameover';
      render();
      break;
  }
};

Net.onPlayerJoin = (info) => {
  playConnect();
  showToast(info.name + ' ist beigetreten');
};

Net.onPlayerLeave = (name) => {
  playDisconnect();
  showToast(name + ' hat das Spiel verlassen');
};

function checkAllGuessed() {
  if (!state.isHost) return;
  const total = state.players.length;
  const guessed = Object.keys(state.roundGuesses || {}).length;
  if (guessed >= total) {
    // All guessed, show answer
    processRoundResults();
  }
}

function processRoundResults() {
  const loc = state.currentLocation;
  const results = [];
  
  state.players.forEach((p, i) => {
    const guess = state.roundGuesses[i];
    let dist = 99999, pts = 0, cityMatch = false;
    if (guess) {
      dist = calcDistance(loc.lat, loc.lng, guess.lat, guess.lng);
      pts = calcPoints(dist);
      cityMatch = guess.city?.toLowerCase().trim() === loc.city.toLowerCase().trim();
      if (cityMatch) pts = Math.min(pts + 1, 5);
    }
    state.players[i].score += pts;
    results.push({ name: p.name, dist, pts, cityMatch, guess: guess?.city || '—' });
  });

  const data = {
    type: 'answer',
    location: loc,
    results,
    players: state.players.map(p => ({ name: p.name, score: p.score })),
  };
  
  Net.send(data);
  state.lastAnswer = data;
  state.roundGuesses = {};
  state.screen = 'answer';
  render();
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'tutorial': renderTutorial(app); break;
    case 'home': renderHome(app); break;
    case 'lobby': renderLobby(app); break;
    case 'playing': renderPlaying(app); break;
    case 'answer': renderAnswer(app); break;
    case 'score': renderScore(app); break;
    case 'gameover': renderGameOver(app); break;
  }
}

// ═══════════════════════════════════════════════════════════════
// TUTORIAL — Swipe through steps
// ═══════════════════════════════════════════════════════════════
function renderTutorial(el) {
  const step = TUTORIAL_STEPS[state.tutorialStep];
  const isLast = state.tutorialStep === TUTORIAL_STEPS.length - 1;
  const progress = ((state.tutorialStep + 1) / TUTORIAL_STEPS.length) * 100;

  el.innerHTML = `
    <div class="screen anim-in">
      <div class="container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;">
        
        <!-- Progress -->
        <div style="width:100%;max-width:300px;margin-bottom:48px;">
          <div class="progress-bar"><div class="fill" style="width:${progress}%"></div></div>
          <p class="label_xs" style="text-align:center;margin-top:8px;">${state.tutorialStep + 1} / ${TUTORIAL_STEPS.length}</p>
        </div>
        
        <!-- Icon -->
        <div style="width:80px;height:80px;border-radius:22px;background:var(--surface);display:flex;align-items:center;justify-content:center;margin-bottom:32px;">
          ${step.icon}
        </div>
        
        <!-- Content -->
        <h2 style="font-size:28px;font-weight:700;text-align:center;margin-bottom:12px;line-height:1.2;">${step.title}</h2>
        <p style="color:var(--text-lavender);font-size:16px;text-align:center;max-width:320px;line-height:1.5;">${step.desc}</p>
        
        <!-- Dots -->
        <div style="display:flex;gap:8px;margin:40px 0;">
          ${TUTORIAL_STEPS.map((_, i) => `
            <div style="width:${i===state.tutorialStep?'24':'8'}px;height:8px;border-radius:4px;background:${i===state.tutorialStep?'var(--green)':'var(--surface-max)'};transition:all 0.3s;"></div>
          `).join('')}
        </div>
        
        <!-- Buttons -->
        <div style="display:flex;gap:12px;width:100%;max-width:320px;">
          ${state.tutorialStep > 0 ? `
            <button class="btn btn-ghost" onclick="tutorialPrev()" style="flex:1;">
              ← Zurück
            </button>
          ` : ''}
          <button class="btn ${isLast ? 'btn-green' : 'btn-primary'}" onclick="${isLast ? 'finishTutorial()' : 'tutorialNext()'}" style="flex:2;">
            ${isLast ? 'Los geht\'s →' : 'Weiter →'}
          </button>
        </div>
        
        <!-- Skip -->
        ${!isLast ? `
          <button class="btn btn-ghost btn-sm" onclick="finishTutorial()" style="margin-top:16px;">
            Überspringen
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function tutorialNext() {
  playSwipe();
  if (state.tutorialStep < TUTORIAL_STEPS.length - 1) {
    state.tutorialStep++;
    render();
  }
}
function tutorialPrev() {
  playSwipe();
  if (state.tutorialStep > 0) {
    state.tutorialStep--;
    render();
  }
}
function finishTutorial() {
  playClick();
  state.screen = 'home';
  render();
}

// ═══════════════════════════════════════════════════════════════
// HOME — Name + Create/Join
// ═══════════════════════════════════════════════════════════════
function renderHome(el) {
  el.innerHTML = `
    <div class="screen anim-in">
      <div class="container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;">
        
        <!-- Logo -->
        <div style="width:72px;height:72px;border-radius:20px;background:var(--surface);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h1 style="font-size:36px;font-weight:700;margin-bottom:4px;letter-spacing:-0.5px;">GeoCheckr</h1>
        <span class="badge badge-accent" style="margin-bottom:40px;">Online Multiplayer</span>
        
        <!-- Name Input -->
        <div style="width:100%;max-width:340px;margin-bottom:32px;">
          <p class="label_sm" style="margin-bottom:10px;">Dein Name</p>
          <input type="text" class="input" id="name-input" value="${state.playerName}"
                 placeholder="Wie heißt du?" maxlength="20"
                 onchange="state.playerName=this.value">
        </div>
        
        <!-- Buttons -->
        <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:340px;">
          <button class="btn btn-green btn-lg btn-full" onclick="createGame()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Raum erstellen
          </button>
          
          <div class="divider"></div>
          
          <div style="display:flex;gap:8px;">
            <input type="text" class="input input-lg" id="room-code-input"
                   placeholder="000000" maxlength="6"
                   inputmode="numeric" pattern="[0-9]*"
                   style="flex:2;letter-spacing:0.2em;">
            <button class="btn btn-primary btn-lg" onclick="joinGame()" style="flex:1;">
              Beitreten
            </button>
          </div>
        </div>
        
        <p class="text-dim" style="margin-top:24px;font-size:13px;">
          6-stelligen Code eingeben um beizutreten
        </p>
      </div>
    </div>
  `;
}

async function createGame() {
  playClick();
  const nameInput = document.getElementById('name-input');
  state.playerName = nameInput?.value?.trim() || 'Spieler 1';
  if (!state.playerName) { showToast('Bitte Name eingeben'); return; }
  
  state.screen = 'lobby';
  render();
  
  try {
    const result = await Net.createRoom(state.playerName);
    state.isHost = true;
    state.roomId = result.roomId;
    state.players = [{ name: state.playerName, score: 0 }];
    render();
  } catch(e) {
    showToast('Fehler: ' + e.message);
    state.screen = 'home';
    render();
  }
}

async function joinGame() {
  playClick();
  const nameInput = document.getElementById('name-input');
  const codeInput = document.getElementById('room-code-input');
  state.playerName = nameInput?.value?.trim() || 'Spieler';
  const code = codeInput?.value?.trim();
  
  if (!state.playerName) { showToast('Bitte Name eingeben'); return; }
  if (!code || code.length !== 6) { showToast('6-stelligen Code eingeben'); return; }
  
  state.screen = 'lobby';
  state.roomId = code;
  render();
  
  try {
    await Net.joinRoom(code, state.playerName);
    state.isHost = false;
  } catch(e) {
    showToast(e.message || 'Verbindung fehlgeschlagen');
    state.screen = 'home';
    render();
  }
}

// ═══════════════════════════════════════════════════════════════
// LOBBY — Show room code + player list
// ═══════════════════════════════════════════════════════════════
function renderLobby(el) {
  const canStart = state.isHost && state.players.length >= 1;
  
  el.innerHTML = `
    <div class="screen anim-in">
      <div class="container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;">
        
        <!-- Room Code -->
        <p class="label_sm" style="margin-bottom:8px;">Raum-Code</p>
        <div class="room-code" style="margin-bottom:8px;">${state.roomId || '······'}</div>
        <p class="text-dim" style="font-size:13px;margin-bottom:40px;">Teile diesen Code mit deinen Freunden</p>
        
        <!-- Player List -->
        <div class="card" style="width:100%;max-width:360px;margin-bottom:32px;">
          <p class="label_sm" style="margin-bottom:16px;">Spieler (${state.players.length})</p>
          ${state.players.map((p, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i > 0 ? 'border-top:1px solid var(--outline-soft);opacity:0.7;' : ''}">
              <div style="width:32px;height:32px;border-radius:50%;background:${PLAYER_COLORS[i]}18;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${PLAYER_COLORS[i]};">${i+1}</div>
              <span style="flex:1;font-size:15px;font-weight:600;">${p.name}</span>
              ${i === 0 && state.isHost ? '<span class="badge badge-green" style="font-size:10px;padding:4px 10px;">HOST</span>' : ''}
            </div>
          `).join('')}
          ${state.players.length === 1 ? `
            <div style="text-align:center;padding:16px 0 0;">
              <p class="text-dim" style="font-size:13px;">Warte auf weitere Spieler...</p>
            </div>
          ` : ''}
        </div>
        
        <!-- Settings (Host only) -->
        ${state.isHost ? `
          <div class="card" style="width:100%;max-width:360px;margin-bottom:24px;">
            <p class="label_sm" style="margin-bottom:12px;">Einstellungen</p>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:14px;">Runden</span>
              <div style="display:flex;gap:6px;">
                ${[5,10,15].map(n => `
                  <button class="btn btn-sm ${state.maxRounds===n?'btn-primary':'btn-ghost'}" onclick="state.maxRounds=${n};render();">${n}</button>
                `).join('')}
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:14px;">Timer</span>
              <div style="display:flex;gap:6px;">
                ${[30,60,90].map(t => `
                  <button class="btn btn-sm ${state.timerSeconds===t?'btn-primary':'btn-ghost'}" onclick="state.timerSeconds=${t};render();">${t}s</button>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
        
        <!-- Start Button -->
        ${state.isHost ? `
          <button class="btn btn-green btn-lg btn-full" onclick="startOnlineGame()" style="max-width:360px;${!canStart ? 'opacity:0.5;pointer-events:none;' : ''}">
            Spiel starten →
          </button>
        ` : `
          <p class="badge badge-blue" style="padding:12px 24px;">Warte auf Host...</p>
        `}
        
        <!-- Back -->
        <button class="btn btn-ghost btn-sm" onclick="leaveLobby()" style="margin-top:24px;">
          ← Zurück
        </button>
      </div>
    </div>
  `;
}

function leaveLobby() {
  playClick();
  Net.disconnect();
  state.players = [];
  state.isHost = false;
  state.screen = 'home';
  render();
}

function startOnlineGame() {
  playClick();
  if (state.players.length < 1) return;
  
  const loc = pickRandomLocation();
  state.round = 1;
  state.currentLocation = loc;
  state.timer = state.timerSeconds;
  state.roundGuesses = {};
  
  // Broadcast start
  Net.send({
    type: 'start',
    round: 1,
    location: loc,
    timer: state.timerSeconds,
  });
  
  state.screen = 'playing';
  render();
}

// ═══════════════════════════════════════════════════════════════
// PLAYING — Street View + Timer + Guess Input
// ═══════════════════════════════════════════════════════════════
function renderPlaying(el) {
  el.innerHTML = `
    <div class="screen" style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;">
      
      <!-- Street View -->
      <div id="streetview-container" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;"></div>
      
      <!-- Timer — Glass HUD -->
      <div class="card-glass" style="position:absolute;top:44px;right:16px;z-index:10;display:flex;align-items:center;gap:8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-lavender)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span id="timer-display" class="timer-display">${state.timer}</span>
      </div>
      
      <!-- Round + Room — Glass HUD -->
      <div class="card-glass" style="position:absolute;top:44px;left:16px;z-index:10;display:flex;align-items:center;gap:10px;">
        <span class="badge badge-green" style="padding:4px 10px;font-size:11px;">R${state.round}</span>
        <span style="font-size:12px;color:var(--text-dim);">${state.roomId}</span>
      </div>
      
      <!-- Player Badges -->
      <div class="card-glass" style="position:absolute;bottom:120px;left:16px;right:16px;z-index:10;display:flex;gap:8px;overflow-x:auto;">
        ${state.players.map((p, i) => `
          <div class="player-badge" style="white-space:nowrap;">
            <div class="dot" style="background:${PLAYER_COLORS[i]};"></div>
            ${p.name}
            <span style="font-weight:700;margin-left:4px;">${p.score}</span>
          </div>
        `).join('')}
      </div>
      
      <!-- Guess Input — Bottom Sheet -->
      <div class="card-glass" style="position:absolute;bottom:28px;left:16px;right:16px;z-index:10;">
        <div style="display:flex;gap:8px;">
          <input type="text" class="input" id="guess-input"
                 placeholder="Stadt eingeben..."
                 value="${state.guessText}"
                 style="flex:1;background:var(--bg-input);border-radius:12px;"
                 onkeydown="if(event.key==='Enter')submitGuess()">
          <button onclick="submitGuess()" class="btn btn-green" style="padding:14px 20px;white-space:nowrap;">
            OK ✓
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Load Street View
  setTimeout(() => {
    if (state.currentLocation) loadPanorama(state.currentLocation.lat, state.currentLocation.lng);
  }, 100);
  
  // Start timer
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
        playTimeUp();
        clearInterval(state.timerInterval);
        submitGuess(true); // Auto-submit on timeout
      }
    }
  }, 1000);
}

function submitGuess(timedOut = false) {
  playClick();
  clearInterval(state.timerInterval);
  
  const input = document.getElementById('guess-input');
  const cityGuess = input?.value?.trim() || '';
  
  if (!state.isHost) {
    // Guest: send guess to host
    // For simplicity, we just send the city name (host checks distance)
    Net.send({
      type: 'guess',
      playerIdx: state.players.findIndex(p => p.name === state.playerName),
      city: cityGuess,
      lat: 0, lng: 0, // Guest doesn't know exact coords
      timedOut,
    });
    // Show waiting state
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen anim-in" style="display:flex;align-items:center;justify-content:center;">
        <div style="text-align:center;">
          <div class="card-glass" style="padding:32px;border-radius:20px;">
            <div class="badge badge-blue" style="margin-bottom:16px;padding:10px 20px;">Warte auf Ergebnis...</div>
            <p class="text-dim" style="font-size:14px;">Dein Tipp: <strong style="color:var(--text);">${cityGuess || '—'}</strong></p>
          </div>
        </div>
      </div>
    `;
  } else {
    // Host: record own guess + process
    const loc = state.currentLocation;
    const dist = cityGuess ? calcDistance(
      loc.lat, loc.lng,
      // Find city in locations
      (LOCATIONS.find(l => l.city.toLowerCase() === cityGuess.toLowerCase()) || loc).lat,
      (LOCATIONS.find(l => l.city.toLowerCase() === cityGuess.toLowerCase()) || loc).lng
    ) : 99999;
    
    // Record host's guess
    if (!state.roundGuesses) state.roundGuesses = {};
    const hostCity = LOCATIONS.find(l => l.city.toLowerCase() === cityGuess.toLowerCase());
    state.roundGuesses[0] = {
      playerIdx: 0,
      city: cityGuess,
      lat: hostCity?.lat || loc.lat,
      lng: hostCity?.lng || loc.lng,
    };
    
    // Set guesses for other players (they send via network)
    checkAllGuessed();
    
    // If no other players, process immediately
    if (state.players.length === 1) {
      processRoundResults();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// ANSWER — Show location + results
// ═══════════════════════════════════════════════════════════════
function renderAnswer(el) {
  const data = state.lastAnswer;
  if (!data) return;
  const loc = data.location;
  const isLastRound = state.round >= state.maxRounds;
  
  el.innerHTML = `
    <div class="screen anim-scale" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;min-height:100vh;min-height:100dvh;">
      
      <!-- Location Reveal -->
      <div class="card" style="text-align:center;margin-bottom:24px;padding:32px;width:100%;max-width:400px;">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(166,215,0,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
        <h2 style="font-size:32px;font-weight:700;color:var(--green);line-height:1.1;">${loc.city}</h2>
        <p style="font-size:18px;color:var(--text-lavender);margin-top:4px;">${loc.country}</p>
      </div>
      
      <!-- Results -->
      <div style="width:100%;max-width:400px;margin-bottom:24px;">
        <p class="label_sm" style="margin-bottom:12px;">Runde ${state.round} Ergebnis</p>
        ${data.results.map((r, i) => `
          <div class="card-high" style="display:flex;align-items:center;gap:12px;padding:14px 18px;margin-bottom:8px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${PLAYER_COLORS[i]}18;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${PLAYER_COLORS[i]};">${i+1}</div>
            <span style="flex:1;font-size:14px;font-weight:600;">${r.name}</span>
            <span style="font-size:12px;color:var(--text-dim);">${r.guess}</span>
            <span class="badge ${r.pts > 0 ? 'badge-green' : 'badge-red'}" style="font-size:11px;padding:4px 10px;">+${r.pts}</span>
          </div>
        `).join('')}
      </div>
      
      <!-- Next -->
      <div style="width:100%;max-width:400px;">
        ${state.isHost ? `
          <button onclick="${isLastRound ? 'endGame()' : 'nextOnlineRound()'}" class="btn ${isLastRound ? 'btn-green' : 'btn-primary'} btn-lg btn-full">
            ${isLastRound ? 'Spiel beenden 🏆' : 'Nächste Runde →'}
          </button>
        ` : `
          <p class="badge badge-blue" style="padding:14px 28px;font-size:14px;">Warte auf Host...</p>
        `}
      </div>
    </div>
  `;
}

function nextOnlineRound() {
  playClick();
  state.round++;
  const loc = pickRandomLocation();
  state.currentLocation = loc;
  state.timer = state.timerSeconds;
  state.roundGuesses = {};
  
  Net.send({
    type: 'nextRound',
    round: state.round,
    location: loc,
    timer: state.timerSeconds,
  });
  
  state.screen = 'playing';
  render();
}

function endGame() {
  playClick();
  playGameOver();
  
  Net.send({
    type: 'gameOver',
    players: state.players.map(p => ({ name: p.name, score: p.score })),
  });
  
  state.screen = 'gameover';
  render();
}

// ═══════════════════════════════════════════════════════════════
// SCORE (Mid-game scoreboard)
// ═══════════════════════════════════════════════════════════════
function renderScore(el) {
  // Handled by answer screen — this is a fallback
  renderAnswer(el);
}

// ═══════════════════════════════════════════════════════════════
// GAME OVER — Final scoreboard
// ═══════════════════════════════════════════════════════════════
function renderGameOver(el) {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...state.players.map(p => p.score), 1);
  const medals = ['🥇', '🥈', '🥉'];
  const winner = sorted[0];
  
  el.innerHTML = `
    <div class="screen anim-up" style="display:flex;flex-direction:column;align-items:center;padding:48px 24px;min-height:100vh;min-height:100dvh;">
      
      <!-- Winner -->
      <div class="card" style="text-align:center;margin-bottom:32px;padding:40px;width:100%;max-width:400px;">
        <div style="font-size:48px;margin-bottom:12px;">🏆</div>
        <h2 style="font-size:28px;font-weight:700;color:var(--green);line-height:1.2;">${winner.name} gewinnt!</h2>
        <p style="font-size:18px;color:var(--text-lavender);margin-top:4px;">${winner.score} Punkte</p>
      </div>
      
      <!-- Final Scoreboard -->
      <div style="width:100%;max-width:400px;margin-bottom:32px;">
        <p class="label_sm" style="margin-bottom:16px;">Endstand — ${state.maxRounds} Runden</p>
        ${sorted.map((p, i) => `
          <div class="card-high" style="display:flex;align-items:center;gap:12px;padding:16px 20px;margin-bottom:8px;">
            <span style="font-size:${i===0?'22':'16'}px;width:32px;text-align:center;">
              ${i < 3 ? medals[i] : '<span style="color:var(--text-dim);font-size:13px;">#'+(i+1)+'</span>'}
            </span>
            <span style="flex:1;font-size:15px;font-weight:600;">${p.name}</span>
            <span class="score-sm">${p.score}</span>
          </div>
          <div class="progress-bar" style="margin-bottom:10px;">
            <div class="fill" style="width:${(p.score/maxScore)*100}%;background:linear-gradient(90deg,var(--dark-blue),var(--green));"></div>
          </div>
        `).join('')}
      </div>
      
      <!-- Play Again -->
      ${state.isHost ? `
        <button onclick="playAgain()" class="btn btn-green btn-lg btn-full" style="max-width:400px;">
          Nochmal spielen ↻
        </button>
      ` : `
        <p class="text-dim" style="font-size:13px;">Danke fürs Spielen!</p>
      `}
      
      <button onclick="backToHome()" class="btn btn-ghost btn-sm" style="margin-top:16px;">
        Zurück zum Menü
      </button>
    </div>
  `;
}

function playAgain() {
  playClick();
  state.players.forEach(p => p.score = 0);
  state.round = 1;
  state.usedLocations = [];
  startOnlineGame();
}

function backToHome() {
  playClick();
  Net.disconnect();
  state.players = [];
  state.isHost = false;
  state.screen = 'home';
  render();
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
(function init() {
  // Show tutorial on first visit
  const seen = localStorage.getItem('geocheckr_tutorial_seen');
  if (seen) {
    state.screen = 'home';
  }
  render();
})();
