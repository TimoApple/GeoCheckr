// GeoCheckr — APK v4
// English | Timo's Palette | QR Scanner | Clean Overlay
// Street View: UNCHANGED (Vorlage 2)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, StatusBar, ScrollView, Dimensions, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, calculatePoints, formatDistance } from './src/utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playAnswerphoneBeep } from './src/utils/sounds';
import { panoramaLocations, PanoramaLocation } from './src/data/panoramaLocations';

const { width, height } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

// ═══════════════════════════════════════════════════════════════
// TIMO'S PALETTE
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#111225',
  surface: '#1d1e32',
  surfaceMax: '#252647',
  accent: '#bdc2ff',
  green: '#a6d700',
  blue: '#3340ca',
  text: '#e5e2e1',
  textMuted: '#c6c5d7',
  outline: '#8f8fa0',
  outlineSoft: 'rgba(143,143,160,0.15)',
};

interface Player { id: number; name: string; }
type Screen = 'tutorial' | 'setup' | 'scan' | 'game' | 'summary';
type Phase = 'view' | 'answer' | 'result';

// ═══════════════════════════════════════════════════════════════
// STREET VIEW — UNCHANGED (Vorlage 2)
// ═══════════════════════════════════════════════════════════════
function buildStreetViewHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-family:sans-serif;text-align:center}
#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:${C.green};border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}</style>
</head><body><div id="pano"></div><div id="status"><div class="spinner"></div>Loading...</div>
<script>function init(){new google.maps.StreetViewService().getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){
if(s===google.maps.StreetViewStatus.OK){new google.maps.StreetViewPanorama(document.getElementById('pano'),{pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,addressControl:false,linksControl:true,panControl:true,zoomControl:true,fullscreenControl:false,motionTracking:false,enableCloseButton:false,clickToGo:true,scrollwheel:true});
document.getElementById('status').style.display='none';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');}
else{document.getElementById('status').innerHTML='❌ No Street View here';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error');}});}
</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script></body></html>`;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [tutStep, setTutStep] = useState(0);
  const [players, setPlayers] = useState<Player[]>([{ id: 1, name: '' }, { id: 2, name: '' }]);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(5);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('view');
  const [timer, setTimer] = useState(60);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState(0);
  const [guessCity, setGuessCity] = useState('');
  const [history, setHistory] = useState<Array<{ round: number, playerIdx: number, city: string, distance: number, points: number }>>([]);

  // QR Scanner
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [qrScanned, setQrScanned] = useState(false);

  // Check if tutorial was seen
  useEffect(() => {
    AsyncStorage.getItem('geocheckr_tutorial_done').then(v => {
      if (v === 'true') setScreen('setup');
    });
  }, []);

  // Animations
  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // ═══════════════════════════════════════════════════════════
  // QR SCANNER — scan QR → load location
  // ═══════════════════════════════════════════════════════════
  const handleQRScan = useCallback((data: string) => {
    if (qrScanned) return;
    let locId: number | null = null;

    if (data.includes('loc=')) {
      try { locId = parseInt(new URL(data).searchParams.get('loc') || ''); } catch {
        const m = data.match(/loc=(\d+)/);
        if (m) locId = parseInt(m[1]);
      }
    } else {
      locId = parseInt(data.replace(/[^0-9]/g, ''));
    }

    if (locId && locId > 0) {
      const loc = panoramaLocations.find(l => l.id === locId);
      if (loc) {
        playClickSound();
        setQrScanned(true);
        setLocation(loc);
        setUsedLocations(prev => [...prev, loc.id]);
        setTimer(timerSeconds);
        setTimerPaused(false);
        setPhase('view');
        setSvLoaded(false);
        setSvError(false);
        setTextInput('');
        resultScale.setValue(0);
        setScreen('game');
      }
    }
  }, [qrScanned, timerSeconds, resultScale]);

  // ═══════════════════════════════════════════════════════════
  // TIMER
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const i = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 5 && timer > 0 && phase === 'view') {
      playTimerTick(); Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    if (timer === 0 && phase === 'view') {
      playTimerWarning(); Vibration.vibrate(500);
      setPhase('answer');
      setTimeout(() => playAnswerphoneBeep(), 100);
    }
  }, [timer, phase]);

  // ═══════════════════════════════════════════════════════════
  // GAME LOGIC
  // ═══════════════════════════════════════════════════════════
  const getRandomLocation = useCallback(() => {
    const avail = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    const pool = avail.length > 0 ? avail : panoramaLocations;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [usedLocations]);

  const startRound = useCallback(() => {
    const loc = getRandomLocation();
    setUsedLocations(prev => [...prev, loc.id]);
    setLocation(loc);
    setTimer(timerSeconds);
    setTimerPaused(false);
    setPhase('view');
    setSvLoaded(false);
    setSvError(false);
    setTextInput('');
    setGuessCity('');
    setQrScanned(false);
    resultScale.setValue(0);
  }, [getRandomLocation, timerSeconds, resultScale]);

  const startGame = () => {
    playClickSound();
    const ps = players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` }));
    setPlayers(ps);
    setScores(new Array(ps.length).fill(0));
    setRound(1);
    setCurrentPlayer(0);
    setUsedLocations([]);
    setHistory([]);
    setQrScanned(false);
    setScreen('scan');
  };

  const resolveAnswer = (dist: number, city: string) => {
    const pts = calculatePoints(dist);
    if (pts >= 3) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); }
    else if (pts > 0) { playSuccessSound(); Vibration.vibrate([100, 50, 100]); }
    else { playErrorSound(); Vibration.vibrate(500); }
    setDistance(dist); setPoints(pts); setGuessCity(city);
    setScores(prev => { const n = [...prev]; n[currentPlayer] += pts; return n; });
    setHistory(prev => [...prev, { round, playerIdx: currentPlayer, city: location.city, distance: Math.round(dist), points: pts }]);
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  };

  const submitAnswer = () => {
    let dist = 20000; let city = '';
    if (textInput.trim()) {
      try {
        const allLocs = require('./src/data/locations_complete').default;
        const norm = (s: string) => s.toLowerCase().trim()
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
          .replace(/[^a-z]/g, '');
        const n = norm(textInput);
        let m = allLocs.find((l: any) => norm(l.city) === n);
        if (!m) m = allLocs.find((l: any) => {
          const cn = norm(l.city);
          return cn.includes(n) || n.includes(cn);
        });
        if (m) { dist = calculateDistance(location.lat, location.lng, m.lat, m.lng); city = m.city; }
        else { city = textInput; }
      } catch { }
    }
    resolveAnswer(dist, city);
  };

  const nextTurn = () => {
    playClickSound();
    const next = (currentPlayer + 1) % players.length;
    if (next === 0 && round >= maxRounds) { setScreen('summary'); return; }
    if (next === 0) setRound(r => r + 1);
    setCurrentPlayer(next);
    setQrScanned(false);
    setScreen('scan');
  };

  const addPlayer = () => {
    if (players.length >= 8) return;
    playClickSound();
    setPlayers(prev => [...prev, { id: prev.length + 1, name: '' }]);
    setScores(prev => [...prev, 0]);
  };

  const removePlayer = () => {
    if (players.length <= 2) return;
    playClickSound();
    setPlayers(prev => prev.slice(0, -1));
    setScores(prev => prev.slice(0, -1));
  };

  // ═══════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════

  const completeTutorial = async () => {
    try { await AsyncStorage.setItem('geocheckr_tutorial_done', 'true'); } catch { }
    playClickSound();
    setScreen('setup');
  };

  const TUTS = [
    { icon: '🌍', title: 'Welcome to GeoCheckr!', text: 'You\'ll be dropped into a random Street View location.\nCan you figure out where in the world you are?' },
    { icon: '📱', title: 'Scan QR Cards', text: 'Print the QR cards, then scan them with your camera.\nEach card opens a different Street View location.' },
    { icon: '🏆', title: 'Guess & Score', text: 'Type the city name to guess.\nCloser guesses earn more points!\nMost points wins!' },
  ];

  // ── TUTORIAL ──
  if (screen === 'tutorial') {
    const t = TUTS[tutStep];
    return (
      <View style={ss.c}><StatusBar hidden />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>{t.icon}</Text>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' }}>{t.title}</Text>
          <Text style={{ color: C.outline, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>{t.text}</Text>
        </View>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
          {TUTS.map((_, i) => (
            <View key={i} style={{ width: i === tutStep ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === tutStep ? C.green : C.surfaceMax, marginHorizontal: 4 }} />
          ))}
        </View>
        {/* Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 50 }}>
          {tutStep > 0
            ? <TouchableOpacity onPress={() => setTutStep(tutStep - 1)}><Text style={{ color: C.outline, fontSize: 15, paddingVertical: 14, paddingHorizontal: 20 }}>← Back</Text></TouchableOpacity>
            : <View />}
          {tutStep < TUTS.length - 1
            ? <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 }} onPress={() => setTutStep(tutStep + 1)}>
              <Text style={{ color: C.accent, fontSize: 16, fontWeight: '600' }}>Next →</Text>
            </TouchableOpacity>
            : <TouchableOpacity style={{ backgroundColor: C.green, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 }} onPress={completeTutorial}>
              <Text style={{ color: C.bg, fontSize: 16, fontWeight: '700' }}>Let's go! 🚀</Text>
            </TouchableOpacity>
          }
        </View>
      </View>
    );
  }

  // ── SETUP ──
  if (screen === 'setup') return (
    <View style={ss.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={ss.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={ss.logo}>
          <View style={ss.logoIcon}>
            <Text style={{ fontSize: 24 }}>🌍</Text>
          </View>
          <Text style={ss.title}>GeoCheckr</Text>
          <Text style={ss.sub}>QR Card Game</Text>
        </View>

        {/* Players */}
        <Text style={ss.label}>PLAYERS</Text>
        {players.map((p, i) => (
          <View key={i} style={ss.playerRow}>
            <View style={[ss.playerNum, { borderColor: ['#bdc2ff', '#a6d700', '#88da7d', '#FF9500', '#ffb4ab', '#5ac8fa', '#af52de', '#ff6b6b'][i] }]}>
              <Text style={[ss.playerNumText, { color: ['#bdc2ff', '#a6d700', '#88da7d', '#FF9500', '#ffb4ab', '#5ac8fa', '#af52de', '#ff6b6b'][i] }]}>{i + 1}</Text>
            </View>
            <TextInput
              style={ss.input}
              placeholder={`Player ${i + 1}`}
              placeholderTextColor={C.outline}
              value={p.name}
              onChangeText={t => setPlayers(prev => { const n = [...prev]; n[i] = { ...n[i], name: t }; return n; })}
              maxLength={20}
              autoCapitalize="words"
            />
          </View>
        ))}
        <View style={ss.addBtns}>
          {players.length < 8 && <TouchableOpacity style={ss.addBtn} onPress={addPlayer}><Text style={ss.addBtnText}>+ Add Player</Text></TouchableOpacity>}
          {players.length > 2 && <TouchableOpacity style={ss.addBtn} onPress={removePlayer}><Text style={[ss.addBtnText, { color: '#ff6b6b' }]}>− Remove</Text></TouchableOpacity>}
        </View>

        {/* Timer */}
        <Text style={ss.label}>TIMER</Text>
        <View style={ss.row}>
          {[30, 60, 90, 120].map(t => (
            <TouchableOpacity key={t} style={[ss.timerBtn, timerSeconds === t && ss.timerBtnActive]} onPress={() => setTimerSeconds(t)}>
              <Text style={[ss.timerBtnText, timerSeconds === t && ss.timerBtnTextActive]}>{t}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rounds */}
        <Text style={ss.label}>ROUNDS</Text>
        <View style={ss.row}>
          {[5, 10, 15].map(r => (
            <TouchableOpacity key={r} style={[ss.timerBtn, maxRounds === r && ss.timerBtnActive]} onPress={() => setMaxRounds(r)}>
              <Text style={[ss.timerBtnText, maxRounds === r && ss.timerBtnTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Button */}
        <TouchableOpacity style={ss.startBtn} onPress={startGame}>
          <Text style={ss.startBtnText}>Start Game</Text>
        </TouchableOpacity>

        {/* Cards Link */}
        <TouchableOpacity style={ss.cardsLink} onPress={() => { }}>
          <Text style={ss.cardsLinkText}>Print QR Cards →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── QR SCAN ──
  if (screen === 'scan') {
    if (!cameraPermission?.granted) {
      return (
        <View style={ss.c}>
          <StatusBar hidden />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Camera Required</Text>
            <Text style={{ color: C.outline, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              We need camera access to scan QR codes
            </Text>
            <TouchableOpacity style={ss.startBtn} onPress={requestCameraPermission}>
              <Text style={ss.startBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={ss.c}>
        <StatusBar hidden />
        {/* Camera */}
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={({ data }) => handleQRScan(data)}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        {/* Overlay */}
        <View style={scanS.overlay}>
          {/* Top HUD */}
          <View style={scanS.topHud}>
            <View style={scanS.roundBadge}>
              <Text style={scanS.roundText}>Round {round}</Text>
            </View>
            <Text style={scanS.playerName}>{players[currentPlayer]?.name || `Player ${currentPlayer + 1}`}</Text>
          </View>
          {/* Scan frame */}
          <View style={scanS.frame}>
            <View style={[scanS.corner, scanS.tl]} />
            <View style={[scanS.corner, scanS.tr]} />
            <View style={[scanS.corner, scanS.bl]} />
            <View style={[scanS.corner, scanS.br]} />
          </View>
          {/* Bottom */}
          <Text style={scanS.hint}>Point camera at a QR code</Text>
        </View>
      </View>
    );
  }

  // ── GAME ──
  if (screen === 'game') {
    const tc = timer <= 5 ? '#ff6b6b' : timer <= 10 ? '#FFD700' : C.green;
    return (
      <View style={gs.c}>
        <StatusBar hidden translucent backgroundColor="transparent" />

        {/* FULLSCREEN STREET VIEW — UNCHANGED */}
        <WebView
          key={`${location.lat}-${location.lng}`}
          source={{ html: buildStreetViewHtml(location.lat, location.lng) }}
          style={gs.sv}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          onError={() => setSvError(true)}
          onMessage={e => {
            const m = e.nativeEvent.data;
            if (m === 'loaded') setSvLoaded(true);
            if (m.startsWith('error')) setSvError(true);
          }}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />

        {/* Loading overlay */}
        {!svLoaded && !svError && (
          <View style={gs.loading}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🌍</Text>
            <Text style={{ color: C.outline, fontSize: 14 }}>Loading Street View...</Text>
          </View>
        )}

        {/* Error overlay */}
        {svError && (
          <View style={gs.error}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>❌</Text>
            <Text style={{ color: C.outline, fontSize: 14, marginBottom: 16 }}>Street View not available</Text>
            <TouchableOpacity style={gs.skipBtn} onPress={() => { setQrScanned(false); setScreen('scan'); }}>
              <Text style={gs.skipBtnText}>Scan another QR →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ TOP HUD ═══ */}
        {phase === 'view' && svLoaded && (
          <View style={gs.topBar}>
            {/* Player scores */}
            <View style={gs.scoresRow}>
              {players.map((p, i) => (
                <View key={i} style={[gs.playerBadge, currentPlayer === i && gs.playerBadgeActive]}>
                  <View style={[gs.playerDot, { backgroundColor: ['#bdc2ff', '#a6d700', '#88da7d', '#FF9500', '#ffb4ab', '#5ac8fa', '#af52de', '#ff6b6b'][i] }]} />
                  <Text style={gs.playerName}>{p.name}</Text>
                  <Text style={gs.playerScore}>{scores[i]}</Text>
                </View>
              ))}
            </View>

            {/* Round badge */}
            <View style={gs.roundHud}>
              <Text style={gs.roundHudText}>Round {round}/{maxRounds}</Text>
            </View>
          </View>
        )}

        {/* ═══ TIMER ═══ */}
        {phase === 'view' && svLoaded && (
          <Animated.View style={[gs.timer, { borderColor: tc, transform: [{ scale: timerPulse }] }]}>
            <Text style={[gs.timerText, { color: tc }]}>{timer}</Text>
          </Animated.View>
        )}

        {/* ═══ SKIP BUTTON ═══ */}
        {phase === 'view' && svLoaded && (
          <TouchableOpacity style={gs.skipBtn} onPress={() => { playClickSound(); setTimerPaused(true); setPhase('answer'); playAnswerphoneBeep(); }}>
            <Text style={gs.skipBtnText}>I know it!</Text>
          </TouchableOpacity>
        )}

        {/* ═══ ANSWER OVERLAY ═══ */}
        {phase === 'answer' && (
          <View style={gs.answerOverlay}>
            <View style={gs.answerCard}>
              <Text style={gs.answerTitle}>📍 {players[currentPlayer]?.name}, where are you?</Text>
              <TextInput
                style={gs.answerInput}
                placeholder="City name..."
                placeholderTextColor={C.outline}
                value={textInput}
                onChangeText={setTextInput}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={submitAnswer}
              />
              <View style={gs.answerBtns}>
                <TouchableOpacity style={gs.answerSubmit} onPress={submitAnswer}>
                  <Text style={gs.answerSubmitText}>Answer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={gs.answerSkip} onPress={() => resolveAnswer(20000, '')}>
                  <Text style={gs.answerSkipText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ═══ RESULT OVERLAY ═══ */}
        {phase === 'result' && (
          <View style={gs.resultOverlay}>
            <Animated.View style={[gs.resultCard, { transform: [{ scale: resultScale }] }]}>
              <Text style={gs.resultEmoji}>{points >= 3 ? '🎯' : points >= 2 ? '👍' : points >= 1 ? '😐' : '😅'}</Text>
              <Text style={[gs.resultTitle, { color: points > 0 ? C.green : '#ff6b6b' }]}>
                {points >= 3 ? 'Perfect!' : points >= 2 ? 'Good!' : points >= 1 ? 'Not bad!' : 'Wrong!'}
              </Text>
              <View style={gs.resultInfo}>
                <View style={gs.resultRow}>
                  <Text style={gs.resultLabel}>Your guess</Text>
                  <Text style={gs.resultValue}>{guessCity || '?'}</Text>
                </View>
                <View style={gs.resultRow}>
                  <Text style={gs.resultLabel}>Correct</Text>
                  <Text style={[gs.resultValue, { color: C.green }]}>{location.city}</Text>
                </View>
                <View style={gs.resultRow}>
                  <Text style={gs.resultLabel}>Distance</Text>
                  <Text style={gs.resultValue}>{formatDistance(distance)}</Text>
                </View>
              </View>
              <Text style={gs.resultPoints}>+{points} pts</Text>
              <TouchableOpacity style={gs.nextBtn} onPress={nextTurn}>
                <Text style={gs.nextBtnText}>
                  {(currentPlayer + 1) % players.length === 0 && round >= maxRounds ? '🏆 Results' : `${players[(currentPlayer + 1) % players.length]?.name || 'Next'} →`}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    );
  }

  // ── SUMMARY ──
  const sorted = [...players].map((p, i) => ({ ...p, score: scores[i] })).sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <View style={ss.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={sumS.scroll}>
        <Text style={{ fontSize: 56, marginBottom: 8 }}>🏆</Text>
        <Text style={sumS.title}>Game Over!</Text>
        <Text style={sumS.sub}>{maxRounds} Rounds</Text>

        {sorted.map((p, i) => (
          <View key={p.id} style={[sumS.row, i === 0 && sumS.winner]}>
            <Text style={sumS.medal}>{medals[i] || `#${i + 1}`}</Text>
            <Text style={sumS.name}>{p.name}</Text>
            <Text style={sumS.score}>{p.score} pts</Text>
          </View>
        ))}

        <Text style={sumS.historyTitle}>📊 Rounds</Text>
        {history.map((h, i) => (
          <View key={i} style={sumS.historyRow}>
            <Text style={sumS.hRound}>R{h.round}</Text>
            <Text style={sumS.hPlayer}>{players[h.playerIdx]?.name}</Text>
            <Text style={sumS.hCity}>{h.city}</Text>
            <Text style={sumS.hPoints}>+{h.points}</Text>
          </View>
        ))}

        <TouchableOpacity style={[ss.startBtn, { marginTop: 20 }]} onPress={() => { setScreen('setup'); }}>
          <Text style={ss.startBtnText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ss.cardsLink} onPress={() => setScreen('setup')}>
          <Text style={ss.cardsLinkText}>Back to Menu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES — SETUP
// ═══════════════════════════════════════════════════════════════
const ss = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, alignItems: 'center', paddingTop: 60 },
  logo: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { color: C.text, fontSize: 32, fontWeight: '700' },
  sub: { color: C.outline, fontSize: 14, marginTop: 4 },
  label: { color: C.outline, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 8, marginTop: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, width: '100%' },
  playerNum: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface },
  playerNumText: { fontSize: 13, fontWeight: '700' },
  input: { flex: 1, backgroundColor: C.surface, color: C.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: C.outlineSoft },
  addBtns: { flexDirection: 'row', gap: 12, marginTop: 8, alignSelf: 'flex-start' },
  addBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  addBtnText: { color: C.accent, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 8 },
  timerBtn: { flex: 1, paddingVertical: 12, borderRadius: 9999, borderWidth: 1.5, borderColor: C.outlineSoft, backgroundColor: C.surface, alignItems: 'center' },
  timerBtnActive: { borderColor: C.accent, backgroundColor: 'rgba(189,194,255,0.1)' },
  timerBtnText: { color: C.outline, fontSize: 14, fontWeight: '600' },
  timerBtnTextActive: { color: C.accent },
  startBtn: { backgroundColor: C.blue, paddingVertical: 16, borderRadius: 9999, alignItems: 'center', width: '100%', marginTop: 20 },
  startBtnText: { color: C.accent, fontSize: 17, fontWeight: '700' },
  cardsLink: { padding: 12, marginTop: 8 },
  cardsLinkText: { color: C.outline, fontSize: 13 },
});

// ═══════════════════════════════════════════════════════════════
// STYLES — QR SCAN
// ═══════════════════════════════════════════════════════════════
const scanS = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  topHud: { alignItems: 'center' },
  roundBadge: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 8 },
  roundText: { color: C.green, fontSize: 13, fontWeight: '600' },
  playerName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  frame: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: C.green, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});

// ═══════════════════════════════════════════════════════════════
// STYLES — GAME
// ═══════════════════════════════════════════════════════════════
const gs = StyleSheet.create({
  c: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  sv: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 5 },
  error: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 10 },

  // Top HUD
  topBar: { position: 'absolute', top: 40, left: 12, right: 12, zIndex: 20 },
  scoresRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  playerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 9999, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 2, borderColor: 'transparent' },
  playerBadgeActive: { borderColor: C.green, backgroundColor: 'rgba(166,215,0,0.15)' },
  playerDot: { width: 8, height: 8, borderRadius: 4 },
  playerName: { color: '#fff', fontSize: 11, fontWeight: '600' },
  playerScore: { color: C.green, fontSize: 11, fontWeight: '700' },
  roundHud: { alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingVertical: 4, paddingHorizontal: 12, marginTop: 6 },
  roundHudText: { color: C.textMuted, fontSize: 11, fontWeight: '600' },

  // Timer
  timer: { position: 'absolute', top: 100, right: 12, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 3, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  timerText: { fontSize: 22, fontWeight: '700' },

  // Skip
  skipBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 9999, borderWidth: 1.5, borderColor: C.green, zIndex: 20 },
  skipBtnText: { color: C.green, fontSize: 16, fontWeight: '600' },

  // Answer
  answerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,18,37,0.95)', zIndex: 30, justifyContent: 'center', paddingHorizontal: 24 },
  answerCard: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.outlineSoft },
  answerTitle: { color: C.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  answerInput: { backgroundColor: C.bg, color: C.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, textAlign: 'center', borderWidth: 1, borderColor: C.outlineSoft, marginBottom: 16 },
  answerBtns: { flexDirection: 'row', gap: 10 },
  answerSubmit: { flex: 1, backgroundColor: C.blue, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  answerSubmitText: { color: C.accent, fontSize: 15, fontWeight: '700' },
  answerSkip: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.outlineSoft },
  answerSkipText: { color: C.outline, fontSize: 15 },

  // Result
  resultOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,18,37,0.95)', zIndex: 40, justifyContent: 'center', paddingHorizontal: 20 },
  resultCard: { backgroundColor: C.surface, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.outlineSoft },
  resultEmoji: { fontSize: 48, marginBottom: 8 },
  resultTitle: { fontSize: 26, fontWeight: '700', marginBottom: 16 },
  resultInfo: { width: '100%', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.outlineSoft },
  resultLabel: { color: C.outline, fontSize: 14 },
  resultValue: { color: C.text, fontSize: 14, fontWeight: '600' },
  resultPoints: { fontSize: 26, fontWeight: '700', color: C.green, marginBottom: 16 },
  nextBtn: { backgroundColor: C.blue, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', width: '100%' },
  nextBtnText: { color: C.accent, fontSize: 16, fontWeight: '700' },
});

// ═══════════════════════════════════════════════════════════════
// STYLES — SUMMARY
// ═══════════════════════════════════════════════════════════════
const sumS = StyleSheet.create({
  scroll: { padding: 24, alignItems: 'center', paddingTop: 50 },
  title: { color: C.text, fontSize: 28, fontWeight: '700', marginBottom: 4 },
  sub: { color: C.outline, fontSize: 14, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, width: '100%', borderWidth: 1, borderColor: C.outlineSoft },
  winner: { borderColor: C.green, borderWidth: 2, backgroundColor: 'rgba(166,215,0,0.06)' },
  medal: { fontSize: 22, marginRight: 12 },
  name: { flex: 1, color: C.text, fontSize: 16, fontWeight: '600' },
  score: { color: C.green, fontSize: 16, fontWeight: '700' },
  historyTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 10, width: '100%', textAlign: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.outlineSoft, width: '100%' },
  hRound: { color: C.outline, fontSize: 12, width: 28 },
  hPlayer: { color: C.text, fontSize: 13, flex: 1 },
  hCity: { color: C.textMuted, fontSize: 13, flex: 1 },
  hPoints: { color: C.green, fontSize: 14, fontWeight: '700', width: 40, textAlign: 'right' },
});
