// GeoCheckr — APK v6
// English | Timo's Palette | QR Scanner | Voice Input | Clean Design
// Street View: UNCHANGED (Vorlage 2)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, StatusBar, ScrollView, Dimensions
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
// PALETTE — Timo's colors
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#111225',
  surface: '#1d1e32',
  surfaceHigh: '#252647',
  accent: '#bdc2ff',
  green: '#a6d700',
  blue: '#3340ca',
  text: '#e5e2e1',
  muted: '#c6c5d7',
  outline: '#8f8fa0',
  border: 'rgba(143,143,160,0.15)',
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
else{document.getElementById('status').innerHTML='No Street View here';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error');}});}
</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script></body></html>`;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [tutStep, setTutStep] = useState(0);
  const [players, setPlayers] = useState<Player[]>([{ id: 1, name: '' }, { id: 2, name: '' }]);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('view');
  const [timer, setTimer] = useState(60);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [history, setHistory] = useState<Array<{ round: number, playerIdx: number, city: string, distance: number, points: number }>>([]);

  // QR Scanner
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [qrScanned, setQrScanned] = useState(false);

  // Voice Input
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceCountdown, setVoiceCountdown] = useState(0);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const micPulse = useRef(new Animated.Value(1)).current;

  // Tutorial check
  useEffect(() => {
    AsyncStorage.getItem('geocheckr_tut_v6').then(v => { if (v === 'true') setScreen('setup'); });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // VOICE INPUT (WebView Web Speech API)
  // ═══════════════════════════════════════════════════════════
  const voiceWebViewRef = useRef<WebView>(null);

  const VOICE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{background:transparent;display:flex;align-items:center;justify-content:center;height:100vh;width:100vw;overflow:hidden}
#mic{width:80px;height:80px;border-radius:40px;background:#1d1e32;border:3px solid #bdc2ff;color:#fff;font-size:36px;cursor:pointer;text-align:center;line-height:80px;padding:0;outline:none}
#mic.on{background:#a6d700;border-color:#a6d700;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
</style></head><body>
<button id="mic" onclick="toggle()">🎤</button>
<script>
var rec=null,on=false;
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function toggle(){on?stop():start()}
function start(){
  if(!SR){window.ReactNativeWebView.postMessage(JSON.stringify({t:'error',v:'no SR'}));return}
  rec=new SR();rec.lang='en-US';rec.continuous=false;rec.interimResults=true;
  rec.onstart=function(){on=true;document.getElementById('mic').classList.add('on');document.getElementById('mic').textContent='■';window.ReactNativeWebView.postMessage(JSON.stringify({t:'start'}))};
  rec.onresult=function(e){var t='';for(var i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;if(e.results[e.results.length-1].isFinal){window.ReactNativeWebView.postMessage(JSON.stringify({t:'final',v:t}));stop()}else{window.ReactNativeWebView.postMessage(JSON.stringify({t:'partial',v:t}))}};
  rec.onerror=function(e){window.ReactNativeWebView.postMessage(JSON.stringify({t:'error',v:e.error}));stop()};
  rec.onend=function(){stop()};
  try{rec.start()}catch(e){stop()}
}
function stop(){on=false;document.getElementById('mic').classList.remove('on');document.getElementById('mic').textContent='🎤';if(rec){try{rec.stop()}catch(e){}rec=null}window.ReactNativeWebView.postMessage(JSON.stringify({t:'end'}))}
</script></body></html>`;

  const handleVoiceMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.t === 'start') {
        setListening(true);
        setVoiceCountdown(10);
        Vibration.vibrate(100);
        voiceTimerRef.current = setInterval(() => {
          setVoiceCountdown(prev => {
            if (prev <= 1) {
              voiceWebViewRef.current?.injectJavaScript('stop();true;');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      if (data.t === 'partial') setVoiceText(data.v);
      if (data.t === 'final') {
        setVoiceText(data.v);
        Vibration.vibrate(50);
        setTimeout(() => resolveAnswerFromText(data.v), 500);
      }
      if (data.t === 'end' || data.t === 'error') {
        setListening(false);
        setVoiceCountdown(0);
        if (voiceTimerRef.current) { clearInterval(voiceTimerRef.current); voiceTimerRef.current = null; }
      }
    } catch { }
  };

  const startVoice = () => {
    playClickSound();
    setVoiceText('');
    voiceWebViewRef.current?.injectJavaScript('toggle();true;');
  };

  const stopVoice = () => {
    voiceWebViewRef.current?.injectJavaScript('stop();true;');
  };

  const handleVoiceSubmit = (text: string) => {
    if (!text.trim()) return;
    resolveAnswerFromText(text.trim());
  };

  // Pulse animation for mic button
  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulse.setValue(1);
    }
  }, [listening]);

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
  const resolveAnswerFromText = (text: string) => {
    let dist = 20000; let city = '';
    try {
      const allLocs = require('./src/data/locations_complete').default;
      const norm = (s: string) => s.toLowerCase().trim()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z]/g, '');
      const n = norm(text);
      let m = allLocs.find((l: any) => norm(l.city) === n);
      if (!m) m = allLocs.find((l: any) => {
        const cn = norm(l.city);
        return cn.includes(n) || n.includes(cn);
      });
      if (m) { dist = calculateDistance(location.lat, location.lng, m.lat, m.lng); city = m.city; }
      else { city = text; }
    } catch { }
    resolveAnswer(dist, city);
  };

  const resolveAnswer = (dist: number, city: string) => {
    const pts = calculatePoints(dist);
    if (pts >= 3) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); }
    else if (pts > 0) { playSuccessSound(); Vibration.vibrate([100, 50, 100]); }
    else { playErrorSound(); Vibration.vibrate(500); }
    setHistory(prev => [...prev, { round, playerIdx: currentPlayer, city: location.city, distance: Math.round(dist), points: pts }]);
    setScores(prev => { const n = [...prev]; n[currentPlayer] += pts; return n; });
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  };

  const getRandomLocation = useCallback(() => {
    const avail = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    const pool = avail.length > 0 ? avail : panoramaLocations;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [usedLocations]);

  const goToScan = useCallback(() => {
    setQrScanned(false);
    setVoiceText('');
    setListening(false);
    setPhase('view');
    resultScale.setValue(0);
    setScreen('scan');
  }, [resultScale]);

  // Track already-scanned QR codes with error display
  const [qrError, setQrError] = useState('');

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
        // Check if already used
        if (usedLocations.includes(loc.id)) {
          Vibration.vibrate(300);
          setQrError(`${loc.city} was already scanned!`);
          setTimeout(() => setQrError(''), 3000);
          return;
        }
        playClickSound();
        setQrScanned(true);
        setQrError('');
        setLocation(loc);
        setUsedLocations(prev => [...prev, loc.id]);
        setTimer(timerSeconds);
        setTimerPaused(false);
        setPhase('view');
        setSvLoaded(false);
        setSvError(false);
        setVoiceText('');
        resultScale.setValue(0);
        setScreen('game');
      }
    }
  }, [qrScanned, timerSeconds, resultScale, usedLocations]);

  const startGame = () => {
    playClickSound();
    const ps = players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` }));
    setPlayers(ps);
    setScores(new Array(ps.length).fill(0));
    setRound(1);
    setCurrentPlayer(0);
    setUsedLocations([]);
    setHistory([]);
    goToScan();
  };

  const nextTurn = () => {
    playClickSound();
    const next = (currentPlayer + 1) % players.length;
    if (next === 0 && round >= maxRounds) { setScreen('summary'); return; }
    if (next === 0) setRound(r => r + 1);
    setCurrentPlayer(next);
    goToScan();
  };

  const completeTutorial = async () => {
    try { await AsyncStorage.setItem('geocheckr_tut_v6', 'true'); } catch { }
    playClickSound();
    setScreen('setup');
  };

  // ═══════════════════════════════════════════════════════════
  // PLAYER COLORS
  // ═══════════════════════════════════════════════════════════
  const PCOLORS = ['#bdc2ff', '#a6d700', '#88da7d', '#FF9500', '#ffb4ab', '#5ac8fa', '#af52de', '#ff6b6b'];

  // ═══════════════════════════════════════════════════════════
  // TUTORIAL
  // ═══════════════════════════════════════════════════════════
  const TUTS = [
    { icon: 'globe', title: 'Welcome to GeoCheckr', text: 'You\'ll be dropped into a random Street View location.\nFigure out where in the world you are!' },
    { icon: 'scan', title: 'Scan QR Cards', text: 'Print the QR cards, then scan them with your camera.\nEach card opens a different Street View.' },
    { icon: 'mic', title: 'Speak to Guess', text: 'Tap the microphone and say the city name.\nCloser guesses earn more points!' },
  ];

  if (screen === 'tutorial') {
    const t = TUTS[tutStep];
    return (
      <View style={ss.c}><StatusBar hidden />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 36 }}>
              {t.icon === 'globe' ? '🌍' : t.icon === 'scan' ? '📷' : '🎤'}
            </Text>
          </View>
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>{t.title}</Text>
          <Text style={{ color: C.outline, fontSize: 15, textAlign: 'center', lineHeight: 24 }}>{t.text}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
          {TUTS.map((_, i) => (
            <View key={i} style={{ width: i === tutStep ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === tutStep ? C.green : C.surfaceHigh, marginHorizontal: 4 }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 50 }}>
          {tutStep > 0
            ? <TouchableOpacity onPress={() => setTutStep(tutStep - 1)}><Text style={{ color: C.outline, fontSize: 15, paddingVertical: 14, paddingHorizontal: 20 }}>Back</Text></TouchableOpacity>
            : <View />}
          {tutStep < TUTS.length - 1
            ? <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }} onPress={() => setTutStep(tutStep + 1)}>
              <Text style={{ color: C.accent, fontSize: 16, fontWeight: '600' }}>Next</Text>
            </TouchableOpacity>
            : <TouchableOpacity style={{ backgroundColor: C.green, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }} onPress={completeTutorial}>
              <Text style={{ color: C.bg, fontSize: 16, fontWeight: '700' }}>Let's go!</Text>
            </TouchableOpacity>
          }
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════
  if (screen === 'setup') return (
    <View style={ss.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={ss.scroll} keyboardShouldPersistTaps="handled">
        <View style={ss.logo}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.text }}>GeoCheckr</Text>
          <Text style={{ color: C.outline, fontSize: 13, marginTop: 4 }}>QR Card Game</Text>
        </View>

        <Text style={ss.label}>PLAYERS</Text>
        {players.map((p, i) => (
          <View key={i} style={ss.playerRow}>
            <View style={[ss.playerNum, { borderColor: PCOLORS[i] }]}>
              <Text style={[ss.playerNumText, { color: PCOLORS[i] }]}>{i + 1}</Text>
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
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, alignSelf: 'flex-start' }}>
          {players.length < 8 && <TouchableOpacity onPress={() => { if (players.length < 8) { setPlayers(prev => [...prev, { id: prev.length + 1, name: '' }]); setScores(prev => [...prev, 0]); } }}><Text style={{ color: C.accent, fontSize: 13, fontWeight: '600' }}>+ Add Player</Text></TouchableOpacity>}
          {players.length > 2 && <TouchableOpacity onPress={() => { if (players.length > 2) { setPlayers(prev => prev.slice(0, -1)); setScores(prev => prev.slice(0, -1)); } }}><Text style={{ color: '#ff6b6b', fontSize: 13, fontWeight: '600' }}>- Remove</Text></TouchableOpacity>}
        </View>

        <Text style={ss.label}>TIMER</Text>
        <View style={ss.row}>
          {[30, 60, 90, 120].map(t => (
            <TouchableOpacity key={t} style={[ss.pill, timerSeconds === t && ss.pillActive]} onPress={() => setTimerSeconds(t)}>
              <Text style={[ss.pillText, timerSeconds === t && ss.pillTextActive]}>{t}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={ss.label}>ROUNDS</Text>
        <View style={ss.row}>
          {[5, 10, 15].map(r => (
            <TouchableOpacity key={r} style={[ss.pill, maxRounds === r && ss.pillActive]} onPress={() => setMaxRounds(r)}>
              <Text style={[ss.pillText, maxRounds === r && ss.pillTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={ss.startBtn} onPress={startGame}>
          <Text style={ss.startBtnText}>Start Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ═══════════════════════════════════════════════════════════
  // QR SCAN
  // ═══════════════════════════════════════════════════════════
  if (screen === 'scan') {
    if (!cameraPermission?.granted) {
      return (
        <View style={ss.c}><StatusBar hidden />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 36 }}>📷</Text>
            </View>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Camera Required</Text>
            <Text style={{ color: C.outline, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>We need camera access to scan QR cards</Text>
            <TouchableOpacity style={ss.startBtn} onPress={requestCameraPermission}>
              <Text style={ss.startBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={({ data }) => handleQRScan(data)}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={scanS.overlay}>
          <View style={scanS.topHud}>
            <View style={scanS.roundBadge}><Text style={scanS.roundText}>Round {round}</Text></View>
            <Text style={scanS.playerName}>{players[currentPlayer]?.name || `Player ${currentPlayer + 1}`}</Text>
          </View>
          <View style={scanS.frame}>
            <View style={[scanS.corner, { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 }]} />
            <View style={[scanS.corner, { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 }]} />
            <View style={[scanS.corner, { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 }]} />
            <View style={[scanS.corner, { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 }]} />
          </View>
          {qrError ? (
            <View style={{ backgroundColor: 'rgba(255,107,107,0.9)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginBottom: 60 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{qrError}</Text>
            </View>
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 60 }}>Point camera at a QR card</Text>
          )}
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GAME
  // ═══════════════════════════════════════════════════════════
  if (screen === 'game') {
    const tc = timer <= 5 ? '#ff6b6b' : timer <= 10 ? '#FFD700' : C.green;

    // ── ANSWER PHASE: Voice Input ──
    if (phase === 'answer') {
      return (
        <View style={ss.c}><StatusBar hidden />
          {/* Hidden Voice WebView */}
          <WebView
            ref={voiceWebViewRef}
            source={{ html: VOICE_HTML }}
            style={{ width: 0, height: 0, position: 'absolute' }}
            onMessage={handleVoiceMessage}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
            {/* Player name */}
            <Text style={{ color: C.accent, fontSize: 14, fontWeight: '600', marginBottom: 8, letterSpacing: 1 }}>
              {players[currentPlayer]?.name || `Player ${currentPlayer + 1}`}
            </Text>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 40 }}>Where are you?</Text>

            {/* Mic Button */}
            <TouchableOpacity
              onPress={listening ? stopVoice : startVoice}
              activeOpacity={0.7}
            >
              <Animated.View style={{
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: listening ? C.green : C.surface,
                borderWidth: 3, borderColor: listening ? C.green : C.accent,
                justifyContent: 'center', alignItems: 'center',
                transform: [{ scale: micPulse }],
              }}>
                <Text style={{ fontSize: 44, color: listening ? C.bg : C.accent }}>
                  {listening ? '■' : '🎤'}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            {/* Countdown */}
            {listening && (
              <Text style={{ color: C.green, fontSize: 48, fontWeight: '700', marginTop: 24 }}>
                {voiceCountdown}
              </Text>
            )}

            {/* Status text */}
            <Text style={{ color: C.outline, fontSize: 14, marginTop: 16 }}>
              {listening ? 'Listening... speak the city name' : voiceText ? 'Tap to try again' : 'Tap the microphone to speak'}
            </Text>

            {/* Recognized text — BIG */}
            {voiceText.length > 0 && (
              <View style={{
                backgroundColor: C.surface, borderRadius: 16, padding: 20,
                marginTop: 24, width: '100%', borderWidth: 1, borderColor: C.border,
              }}>
                <Text style={{ color: C.text, fontSize: 28, fontWeight: '700', textAlign: 'center' }}>
                  {voiceText}
                </Text>
              </View>
            )}

            {/* Skip button */}
            <TouchableOpacity
              style={{ marginTop: 32, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 9999, borderWidth: 1, borderColor: C.border }}
              onPress={() => resolveAnswer(20000, '')}
            >
              <Text style={{ color: C.outline, fontSize: 14, fontWeight: '600' }}>Skip this round</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ── RESULT PHASE ──
    if (phase === 'result') {
      const dist = history.length > 0 ? history[history.length - 1].distance : 20000;
      const pts = history.length > 0 ? history[history.length - 1].points : 0;
      return (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,18,37,0.95)', justifyContent: 'center', paddingHorizontal: 20, zIndex: 50 }}>
          <Animated.View style={{
            backgroundColor: C.surface, borderRadius: 20, padding: 28, alignItems: 'center',
            borderWidth: 1, borderColor: C.border, transform: [{ scale: resultScale }],
          }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>
              {pts >= 3 ? '🎯' : pts >= 2 ? '👍' : pts >= 1 ? '😐' : '😅'}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: pts > 0 ? C.green : '#ff6b6b', marginBottom: 20 }}>
              {pts >= 3 ? 'Perfect!' : pts >= 2 ? 'Good!' : pts >= 1 ? 'Not bad!' : 'Wrong!'}
            </Text>
            <View style={{ width: '100%', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ color: C.outline, fontSize: 15 }}>Your guess</Text>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>{history.length > 0 ? (history[history.length - 1].city || '?') : '?'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ color: C.outline, fontSize: 15 }}>Correct</Text>
                <Text style={{ color: C.green, fontSize: 15, fontWeight: '600' }}>{location.city}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ color: C.outline, fontSize: 15 }}>Distance</Text>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>{formatDistance(dist)}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '700', color: C.green, marginBottom: 20 }}>+{pts} pts</Text>
            <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, width: '100%', alignItems: 'center' }} onPress={nextTurn}>
              <Text style={{ color: C.accent, fontSize: 17, fontWeight: '700' }}>
                {(currentPlayer + 1) % players.length === 0 && round >= maxRounds ? 'Results' : `${players[(currentPlayer + 1) % players.length]?.name || 'Next'}'s turn`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    // ── VIEW PHASE: Street View ──
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' }}>
        <StatusBar hidden translucent backgroundColor="transparent" />
        <WebView
          key={`${location.lat}-${location.lng}`}
          source={{ html: buildStreetViewHtml(location.lat, location.lng) }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false} mixedContentMode="compatibility"
          onError={() => setSvError(true)}
          onMessage={e => { const m = e.nativeEvent.data; if (m === 'loaded') setSvLoaded(true); if (m.startsWith('error')) setSvError(true); }}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />

        {!svLoaded && !svError && (
          <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 5 }}>
            <Text style={{ color: C.outline, fontSize: 14 }}>Loading Street View...</Text>
          </View>
        )}

        {svError && (
          <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 10 }}>
            <Text style={{ color: C.outline, fontSize: 14, marginBottom: 16 }}>Street View not available</Text>
            <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }} onPress={goToScan}>
              <Text style={{ color: C.accent, fontSize: 15, fontWeight: '600' }}>Scan another QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {svLoaded && (
          <>
            {/* Top HUD */}
            <View style={{ position: 'absolute', top: 40, left: 12, right: 12, zIndex: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {players.map((p, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 9999, paddingVertical: 5, paddingHorizontal: 10,
                    borderWidth: 2, borderColor: currentPlayer === i ? C.green : 'transparent',
                  }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PCOLORS[i] }} />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{p.name}</Text>
                    <Text style={{ color: C.green, fontSize: 11, fontWeight: '700' }}>{scores[i]}</Text>
                  </View>
                ))}
              </View>
              <View style={{ alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingVertical: 4, paddingHorizontal: 12, marginTop: 6 }}>
                <Text style={{ color: C.muted, fontSize: 11, fontWeight: '600' }}>Round {round}/{maxRounds}</Text>
              </View>
            </View>

            {/* Timer */}
            <Animated.View style={{
              position: 'absolute', top: 100, right: 12, width: 52, height: 52, borderRadius: 26,
              backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 3, borderColor: tc,
              justifyContent: 'center', alignItems: 'center', zIndex: 20,
              transform: [{ scale: timerPulse }],
            }}>
              <Text style={{ color: tc, fontSize: 22, fontWeight: '700' }}>{timer}</Text>
            </Animated.View>

            {/* Skip / I Know It button */}
            <TouchableOpacity
              style={{
                position: 'absolute', bottom: 50, alignSelf: 'center', zIndex: 20,
                backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 14, paddingHorizontal: 32,
                borderRadius: 9999, borderWidth: 1.5, borderColor: C.green,
              }}
              onPress={() => { playClickSound(); setTimerPaused(true); setPhase('answer'); playAnswerphoneBeep(); }}
            >
              <Text style={{ color: C.green, fontSize: 17, fontWeight: '600' }}>I know it!</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  const sorted = [...players].map((p, i) => ({ ...p, score: scores[i] })).sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <View style={ss.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', paddingTop: 50 }}>
        <Text style={{ fontSize: 56, marginBottom: 8 }}>🏆</Text>
        <Text style={{ color: C.text, fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Game Over!</Text>
        <Text style={{ color: C.outline, fontSize: 14, marginBottom: 24 }}>{maxRounds} Rounds</Text>

        {sorted.map((p, i) => (
          <View key={p.id} style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12,
            padding: 14, marginBottom: 8, width: '100%', borderWidth: 1,
            borderColor: i === 0 ? C.green : C.border,
          }}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>{medals[i] || `#${i + 1}`}</Text>
            <Text style={{ flex: 1, color: C.text, fontSize: 16, fontWeight: '600' }}>{p.name}</Text>
            <Text style={{ color: C.green, fontSize: 16, fontWeight: '700' }}>{p.score} pts</Text>
          </View>
        ))}

        <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>Round History</Text>
        {history.map((h, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border, width: '100%' }}>
            <Text style={{ color: C.outline, fontSize: 12, width: 32 }}>R{h.round}</Text>
            <Text style={{ color: C.text, fontSize: 13, flex: 1 }}>{players[h.playerIdx]?.name}</Text>
            <Text style={{ color: C.muted, fontSize: 13, flex: 1 }}>{h.city}</Text>
            <Text style={{ color: C.green, fontSize: 14, fontWeight: '700', width: 44, textAlign: 'right' }}>+{h.points}</Text>
          </View>
        ))}

        <TouchableOpacity style={[ss.startBtn, { marginTop: 24 }]} onPress={() => setScreen('setup')}>
          <Text style={ss.startBtnText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 12, marginTop: 8 }} onPress={() => setScreen('setup')}>
          <Text style={{ color: C.outline, fontSize: 13 }}>Back to Menu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const ss = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, alignItems: 'center', paddingTop: 60 },
  logo: { alignItems: 'center', marginBottom: 32 },
  label: { color: C.outline, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 8, marginTop: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, width: '100%' },
  playerNum: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface },
  playerNumText: { fontSize: 13, fontWeight: '700' },
  input: { flex: 1, backgroundColor: C.surface, color: C.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 8 },
  pill: { flex: 1, paddingVertical: 12, borderRadius: 9999, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center' },
  pillActive: { borderColor: C.accent, backgroundColor: 'rgba(189,194,255,0.1)' },
  pillText: { color: C.outline, fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: C.accent },
  startBtn: { backgroundColor: C.blue, paddingVertical: 16, borderRadius: 9999, alignItems: 'center', width: '100%', marginTop: 20 },
  startBtnText: { color: C.accent, fontSize: 17, fontWeight: '700' },
});

const scanS = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  topHud: { alignItems: 'center' },
  roundBadge: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 8 },
  roundText: { color: C.green, fontSize: 13, fontWeight: '600' },
  playerName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  frame: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: C.green, borderWidth: 3 },
});
