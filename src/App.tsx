// GeoCheckr — Self-contained App (no navigation library, state-based)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, Platform, KeyboardAvoidingView, StatusBar, ScrollView, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { calculateDistance, calculatePoints, formatDistance } from './utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playAnswerphoneBeep } from './utils/sounds';
import { panoramaLocations, PanoramaLocation } from './data/panoramaLocations';

const { width } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

// ============================================================
// TYPES
// ============================================================
interface Player { id: number; name: string; }
type Screen = 'tutorial' | 'setup' | 'game' | 'result';
type AnswerMode = 'text' | 'map';

// ============================================================
// STREET VIEW HTML BUILDER (same as #170 — UNCHANGED)
// ============================================================
function buildStreetViewHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-family:sans-serif;text-align:center;font-size:14px;z-index:999}
#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#e94560;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="pano"></div>
<div id="status"><div class="spinner"></div>Lade Street View...</div>
<script>
function init(){
  var sv=new google.maps.StreetViewService();
  sv.getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,
    preference:google.maps.StreetViewPreference.NEAREST,
    source:google.maps.StreetViewSource.OUTDOOR},function(data,st){
    if(st===google.maps.StreetViewStatus.OK){
      var p=new google.maps.StreetViewPanorama(document.getElementById('pano'),{
        pano:data.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,
        addressControl:false,linksControl:true,panControl:true,zoomControl:true,
        fullscreenControl:false,motionTracking:false,motionTrackingControl:false,
        enableCloseButton:false,clickToGo:true,scrollwheel:true,disableDefaultUI:false
      });
      document.getElementById('status').style.display='none';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');
    }else{
      document.getElementById('status').innerHTML='❌ Kein Street View';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error:'+st);
    }
  });
}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script>
</body></html>`;
}

// ============================================================
// MAP HTML for answer
// ============================================================
const MAP_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}
#info{position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);
color:#fff;padding:8px 16px;border-radius:20px;font-family:sans-serif;font-size:14px;z-index:999;pointer-events:none}</style>
</head><body>
<div id="map"></div>
<div id="info">Tippe auf die Karte</div>
<script>
var map=L.map('map',{attributionControl:false}).setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
var marker=null;
map.on('click',function(e){
  if(marker)map.removeLayer(marker);
  marker=L.marker(e.latlng).addTo(map);
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng}));
});
</script></body></html>`;

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [tutorialPage, setTutorialPage] = useState(0);

  // Setup state
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>('leicht');

  // Game state
  const [players] = useState<Player[]>([{ id: 1, name: 'Spieler 1' }]);
  const [scores, setScores] = useState<Record<number, number>>({ 1: 0 });
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [phase, setPhase] = useState<'view' | 'answer' | 'result'>('view');
  const [timer, setTimer] = useState(30);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('text');
  const [showMap, setShowMap] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState(0);

  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // ===================== TIMER =====================
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 5 && timer > 0 && phase === 'view') {
      playTimerTick();
      Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    if (timer === 0 && phase === 'view') {
      playTimerWarning();
      Vibration.vibrate(500);
      setPhase('answer');
      setTimeout(() => playAnswerphoneBeep(), 100);
    }
  }, [timer, phase]);

  // ===================== GAME LOGIC =====================
  const getRandomLocation = useCallback(() => {
    const available = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    const pool = available.length > 0 ? available : panoramaLocations;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [usedLocations]);

  const startGame = () => {
    playClickSound();
    const pName = playerName.trim() || 'Spieler 1';
    players[0] = { id: 1, name: pName };
    setScores({ 1: 0 });
    setRound(1);
    setUsedLocations([]);
    startRound();
    setScreen('game');
  };

  const startRound = useCallback(() => {
    const loc = getRandomLocation();
    setUsedLocations(prev => [...prev, loc.id]);
    setLocation(loc);
    setTimer(30);
    setTimerPaused(false);
    setPhase('view');
    setSvLoaded(false);
    setSvError(false);
    setTextInput('');
    setAnswerMode('text');
    setShowMap(false);
    resultScale.setValue(0);
  }, [getRandomLocation, resultScale]);

  const resolveAnswer = (dist: number) => {
    const pts = calculatePoints(dist);
    const timeBonus = (difficulty === 'schwer' && timer > 10 && pts > 0) ? 1 : 0;
    const totalPts = pts + timeBonus;
    if (totalPts >= 3) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); }
    else if (totalPts > 0) { playSuccessSound(); Vibration.vibrate([100, 50, 100]); }
    else { playErrorSound(); Vibration.vibrate(500); }
    setDistance(dist);
    setPoints(totalPts);
    setScores(prev => ({ ...prev, [1]: prev[1] + totalPts }));
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  };

  const submitTextAnswer = () => {
    let dist = 20000;
    if (textInput.trim()) {
      try {
        const allLocs = require('./data/locations_complete').default;
        const normalized = textInput.toLowerCase().trim()
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
        let match = allLocs.find((l: any) => l.city.toLowerCase() === normalized);
        if (!match) match = allLocs.find((l: any) => l.city.toLowerCase().includes(normalized) || normalized.includes(l.city.toLowerCase()));
        if (match) dist = calculateDistance(location.lat, location.lng, match.lat, match.lng);
      } catch (e) {}
    }
    resolveAnswer(dist);
  };

  const submitMapAnswer = (lat: number, lng: number) => {
    setShowMap(false);
    const dist = calculateDistance(location.lat, location.lng, lat, lng);
    resolveAnswer(dist);
  };

  const nextTurn = () => {
    playClickSound();
    if (round >= maxRounds) {
      setScreen('result');
      return;
    }
    setRound(r => r + 1);
    startRound();
  };

  // ===================== TUTORIAL =====================
  const TUTORIAL_SLIDES = [
    { icon: '🌍', title: 'GeoCheckr', sub: 'Finde heraus wo du bist!' },
    { icon: '👆', title: 'Navigiere', sub: 'Bewege dich durch Street View\nKlicke auf Pfeile um zu laufen' },
    { icon: '📍', title: 'Rate den Ort', sub: 'Tippe den Stadtnamen\noder zeige auf die Karte' },
  ];

  // ===================== RENDER =====================
  const timerColor = timer <= 5 ? '#ff4444' : timer <= 10 ? '#ffaa00' : '#e94560';

  // ---------- TUTORIAL ----------
  if (screen === 'tutorial') {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setTutorialPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {TUTORIAL_SLIDES.map((sl, i) => (
            <View key={i} style={[s.tutSlide, { width }]}>
              <Text style={s.tutIcon}>{sl.icon}</Text>
              <Text style={s.tutTitle}>{sl.title}</Text>
              <Text style={s.tutSub}>{sl.sub}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={s.tutDots}>
          {TUTORIAL_SLIDES.map((_, i) => (
            <View key={i} style={[s.tutDot, i === tutorialPage && s.tutDotActive]} />
          ))}
        </View>
        <View style={s.tutBtnRow}>
          <TouchableOpacity style={s.tutSkip} onPress={() => setScreen('setup')}>
            <Text style={s.tutSkipText}>Überspringen</Text>
          </TouchableOpacity>
          {tutorialPage < 2 ? (
            <TouchableOpacity style={s.tutNext} onPress={() => setTutorialPage(tutorialPage + 1)}>
              <Text style={s.tutNextText}>Weiter →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.tutStart} onPress={() => setScreen('setup')}>
              <Text style={s.tutStartText}>Los geht's! 🚀</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ---------- SETUP ----------
  if (screen === 'setup') {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar hidden />
        <View style={s.setupCenter}>
          <Text style={s.setupTitle}>GeoCheckr</Text>
          <Text style={s.setupSub}>Spieler einrichten</Text>

          <Text style={s.setupLabel}>DEIN NAME</Text>
          <TextInput
            style={s.setupInput}
            placeholder="Name..."
            placeholderTextColor="#555"
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
            autoCapitalize="words"
          />

          <Text style={s.setupLabel}>SCHWIERIGKEIT</Text>
          <View style={s.diffRow}>
            {(['leicht', 'mittel', 'schwer'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[s.diffBtn, difficulty === d && s.diffBtnActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={s.diffIcon}>{d === 'leicht' ? '😊' : d === 'mittel' ? '🤔' : '🔥'}</Text>
                <Text style={[s.diffText, difficulty === d && s.diffTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.startBtn} onPress={startGame}>
            <Text style={s.startBtnText}>Starten 🚀</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ---------- GAME ----------
  if (screen === 'game') {
    return (
      <View style={s.container}>
        <StatusBar hidden />

        {/* FULL SCREEN STREET VIEW */}
        <WebView
          key={`${location.lat}-${location.lng}`}
          source={{ html: buildStreetViewHtml(location.lat, location.lng) }}
          style={s.svWebview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          scrollEnabled={true}
          onError={() => setSvError(true)}
          onMessage={(e) => {
            const msg = e.nativeEvent.data;
            if (msg === 'loaded') setSvLoaded(true);
            if (msg.startsWith('error')) setSvError(true);
          }}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />

        {/* Loading */}
        {!svLoaded && !svError && (
          <View style={s.loadingOverlay}>
            <Text style={s.loadingText}>🌍 Lade Street View...</Text>
          </View>
        )}

        {/* Error */}
        {svError && (
          <View style={s.errorOverlay}>
            <Text style={s.errorEmoji}>❌</Text>
            <Text style={s.errorCity}>{location.city}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={nextTurn}>
              <Text style={s.retryText}>Nächste Location →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timer */}
        {phase === 'view' && svLoaded && (
          <Animated.View style={[s.timer, { borderColor: timerColor, transform: [{ scale: timerPulse }] }]}>
            <Text style={[s.timerText, { color: timerColor }]}>{timer}</Text>
          </Animated.View>
        )}

        {/* Top bar */}
        {phase === 'view' && svLoaded && (
          <View style={s.topBar}>
            <Text style={s.topName}>{players[0].name}</Text>
            <Text style={s.topRound}>Runde {round}/{maxRounds}</Text>
            <View style={s.topScore}>
              <Text style={s.topScoreText}>⭐ {scores[1]}</Text>
            </View>
          </View>
        )}

        {/* Skip */}
        {phase === 'view' && svLoaded && (
          <TouchableOpacity style={s.skipBtn} onPress={() => {
            playClickSound();
            setTimerPaused(true);
            setPhase('answer');
            playAnswerphoneBeep();
          }}>
            <Text style={s.skipText}>Ich weiß es! →</Text>
          </TouchableOpacity>
        )}

        {/* ANSWER OVERLAY */}
        {phase === 'answer' && (
          <View style={s.answerOverlay}>
            <View style={s.answerCard}>
              <Text style={s.answerTitle}>📍 Deine Antwort</Text>
              <Text style={s.answerSub}>{players[0].name}, wo bist du?</Text>

              <View style={s.modeTabs}>
                <TouchableOpacity
                  style={[s.modeTab, answerMode === 'text' && s.modeTabActive]}
                  onPress={() => { setAnswerMode('text'); setShowMap(false); }}
                >
                  <Text style={s.modeTabText}>⌨️ Tippen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modeTab, answerMode === 'map' && s.modeTabActive]}
                  onPress={() => { setAnswerMode('map'); setShowMap(true); }}
                >
                  <Text style={s.modeTabText}>🗺️ Karte</Text>
                </TouchableOpacity>
              </View>

              {answerMode === 'text' && (
                <View style={s.textRow}>
                  <TextInput
                    style={s.textInput}
                    placeholder="Stadtname..."
                    placeholderTextColor="#555"
                    value={textInput}
                    onChangeText={setTextInput}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={submitTextAnswer}
                  />
                  <TouchableOpacity style={s.submitBtn} onPress={submitTextAnswer}>
                    <Text style={s.submitText}>✓</Text>
                  </TouchableOpacity>
                </View>
              )}

              {answerMode === 'map' && !showMap && (
                <TouchableOpacity style={s.mapHint} onPress={() => setShowMap(true)}>
                  <Text style={s.mapHintText}>🗺️ Karte öffnen</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.skipAnswerBtn} onPress={() => resolveAnswer(20000)}>
                <Text style={s.skipAnswerText}>Überspringen →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* RESULT OVERLAY */}
        {phase === 'result' && (
          <View style={s.resultOverlay}>
            <Animated.View style={[s.resultCard, { transform: [{ scale: resultScale }] }]}>
              <Text style={s.resultEmoji}>{points >= 3 ? '🎯' : points >= 1 ? '👍' : '😅'}</Text>
              <Text style={[s.resultTitle, points > 0 ? s.correct : s.wrong]}>
                {points >= 3 ? 'Perfekt!' : points >= 2 ? 'Gut!' : points >= 1 ? 'Nicht schlecht!' : 'Daneben!'}
              </Text>
              <View style={s.resultInfo}>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>📍 Ort</Text>
                  <Text style={s.resultValue}>{location.city}</Text>
                </View>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>📏 Distanz</Text>
                  <Text style={s.resultValue}>{formatDistance(distance)}</Text>
                </View>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>⭐ Punkte</Text>
                  <Text style={[s.resultValue, s.ptsHl]}>+{points}</Text>
                </View>
              </View>
              <TouchableOpacity style={s.nextBtn} onPress={nextTurn}>
                <Text style={s.nextBtnText}>
                  {round >= maxRounds ? '🏆 Ergebnis' : 'Nächste Runde →'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* MAP MODAL */}
        {showMap && (
          <View style={s.mapModal}>
            <View style={s.mapHeader}>
              <Text style={s.mapTitle}>📍 Auf Karte zeigen</Text>
              <TouchableOpacity style={s.mapClose} onPress={() => { setShowMap(false); setAnswerMode('text'); }}>
                <Text style={s.mapCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: MAP_HTML }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              onMessage={(e) => {
                try {
                  const { lat, lng } = JSON.parse(e.nativeEvent.data);
                  submitMapAnswer(lat, lng);
                } catch {}
              }}
            />
          </View>
        )}
      </View>
    );
  }

  // ---------- RESULT ----------
  return (
    <View style={s.container}>
      <StatusBar hidden />
      <ScrollView contentContainerStyle={s.resultScreen}>
        <Text style={s.trophy}>🏆</Text>
        <Text style={s.resultScreenTitle}>Spiel beendet!</Text>
        <Text style={s.resultScreenSub}>{maxRounds} Runden gespielt</Text>
        <View style={s.winnerCard}>
          <Text style={s.winnerName}>{players[0].name}</Text>
          <Text style={s.winnerScore}>{scores[1]} ⭐</Text>
        </View>
        <TouchableOpacity style={s.againBtn} onPress={() => { startRound(); setScreen('game'); }}>
          <Text style={s.againText}>🔄 Nochmal spielen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.homeBtn} onPress={() => setScreen('setup')}>
          <Text style={s.homeText}>🏠 Neues Spiel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },

  // Tutorial
  tutSlide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  tutIcon: { fontSize: 80, marginBottom: 30 },
  tutTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  tutSub: { color: '#aaa', fontSize: 18, textAlign: 'center', lineHeight: 26 },
  tutDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  tutDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333', marginHorizontal: 5 },
  tutDotActive: { backgroundColor: '#e94560', width: 24 },
  tutBtnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 50 },
  tutSkip: { paddingVertical: 14, paddingHorizontal: 20 },
  tutSkipText: { color: '#666', fontSize: 16 },
  tutNext: { backgroundColor: '#e94560', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  tutNextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tutStart: { backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  tutStartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Setup
  setupCenter: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  setupTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  setupSub: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 35 },
  setupLabel: { color: '#888', fontSize: 12, marginBottom: 6, fontWeight: '600', letterSpacing: 1 },
  setupInput: { backgroundColor: '#16213e', color: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 25 },
  diffRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  diffBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#333', backgroundColor: '#16213e', alignItems: 'center' },
  diffBtnActive: { borderColor: '#e94560' },
  diffIcon: { fontSize: 24, marginBottom: 4 },
  diffText: { color: '#888', fontSize: 13, fontWeight: '600' },
  diffTextActive: { color: '#fff' },
  startBtn: { backgroundColor: '#e94560', paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // Game — Street View
  svWebview: { flex: 1, backgroundColor: '#000' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', zIndex: 5 },
  loadingText: { color: '#aaa', fontSize: 16 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', zIndex: 10 },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorCity: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  retryBtn: { backgroundColor: '#e94560', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Timer
  timer: {
    position: 'absolute', top: 15, right: 15,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  timerText: { fontSize: 22, fontWeight: 'bold' },

  // Top bar
  topBar: {
    position: 'absolute', top: 15, left: 15,
    flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 20,
  },
  topName: { color: '#e94560', fontSize: 14, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  topRound: { color: '#fff', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  topScore: { backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  topScoreText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },

  // Skip
  skipBtn: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 25, borderWidth: 1.5, borderColor: '#4CAF50', zIndex: 20,
  },
  skipText: { color: '#4CAF50', fontSize: 17, fontWeight: '600' },

  // Answer
  answerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 30, justifyContent: 'center', paddingHorizontal: 24 },
  answerCard: { backgroundColor: '#16213e', borderRadius: 20, padding: 24 },
  answerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  answerSub: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  modeTabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeTab: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: '#333', backgroundColor: '#0f3460', alignItems: 'center' },
  modeTabActive: { borderColor: '#e94560' },
  modeTabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  textRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  textInput: { flex: 1, backgroundColor: '#0f3460', color: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a' },
  submitBtn: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  mapHint: { backgroundColor: '#0f3460', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 12 },
  mapHintText: { color: '#fff', fontSize: 16 },
  skipAnswerBtn: { paddingVertical: 10, alignItems: 'center' },
  skipAnswerText: { color: '#666', fontSize: 14 },

  // Result overlay
  resultOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 40, justifyContent: 'center', paddingHorizontal: 20 },
  resultCard: { backgroundColor: '#16213e', borderRadius: 20, padding: 24, alignItems: 'center' },
  resultEmoji: { fontSize: 50, marginBottom: 10 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  correct: { color: '#4CAF50' },
  wrong: { color: '#ff4444' },
  resultInfo: { width: '100%', marginBottom: 18 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  resultLabel: { color: '#aaa', fontSize: 15 },
  resultValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  ptsHl: { color: '#4CAF50', fontSize: 20, fontWeight: 'bold' },
  nextBtn: { backgroundColor: '#e94560', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 14, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Map modal
  mapModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#0a0a1a' },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40, backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  mapTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mapClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center' },
  mapCloseText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Result screen
  resultScreen: { padding: 30, alignItems: 'center', paddingTop: 60 },
  trophy: { fontSize: 80, marginBottom: 15 },
  resultScreenTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  resultScreenSub: { color: '#888', fontSize: 16, marginBottom: 30, textAlign: 'center' },
  winnerCard: { backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25, borderWidth: 2, borderColor: '#FFD700', width: '100%' },
  winnerName: { color: '#FFD700', fontSize: 26, fontWeight: 'bold', marginBottom: 5 },
  winnerScore: { color: '#fff', fontSize: 22, fontWeight: '600' },
  againBtn: { backgroundColor: '#e94560', paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center', marginTop: 10 },
  againText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  homeBtn: { backgroundColor: '#16213e', paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  homeText: { color: '#aaa', fontSize: 16 },
});
