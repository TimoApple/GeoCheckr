// GeoCheckr — APK v7.5
// All Timo's feedback: swipe tutorial, blocking card assignment,
// fuzzy voice, bigger text, animated text, proper icons
// Street View: UNCHANGED (Vorlage 2)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, StatusBar, ScrollView, Dimensions, Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, calculatePoints, formatDistance } from './src/utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playAnswerphoneBeep } from './src/utils/sounds';
import { panoramaLocations, PanoramaLocation } from './src/data/panoramaLocations';

const { width: W, height: H } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM (Timo's palette ONLY)
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#111225', surface: '#1d1e32', surfaceHigh: '#252647',
  accent: '#bdc2ff', green: '#a6d700', blue: '#3340ca',
  text: '#e5e2e1', muted: '#c6c5d7', outline: '#8f8fa0',
  border: 'rgba(143,143,160,0.15)',
};
const PCOLORS = ['#bdc2ff', '#a6d700', '#88da7d', '#FF9500', '#ffb4ab', '#5ac8fa', '#af52de', '#ff6b6b'];

// ═══════════════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════════════
const QUOTES = [
  "All roads lead to Rome.",
  "Not all those who wander are lost.",
  "The world is a book, and those who do not travel read only one page.",
  "To travel is to live.",
  "A journey of a thousand miles begins with a single step.",
  "The earth has music for those who listen.",
  "Life is either a daring adventure or nothing at all.",
  "Go where you feel most alive.",
  "Collect moments, not things.",
  "Travel far enough, you meet yourself.",
  "The map is not the territory.",
  "Paris is always a good idea.",
  "Geography is destiny.",
  "The globe is a map, the world is a book.",
  "Travel is the only thing you buy that makes you richer.",
  "Every journey has secret destinations of which the traveler is unaware.",
  "Without geography, you are nowhere.",
  "Borders? I have never seen one.",
  "Somewhere, something incredible is waiting to be known.",
  "Adventure is worthwhile in itself.",
];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Player { id: number; name: string; cardId: number | null; cardCity: string; }
type Screen = 'tutorial' | 'setup' | 'assign' | 'scan' | 'game' | 'summary';
type Phase = 'view' | 'answer' | 'result';

// ═══════════════════════════════════════════════════════════════
// VOICE HTML (WebView-based Web Speech API)
// ═══════════════════════════════════════════════════════════════
const VOICE_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:transparent}</style></head><body><script>
var rec=null,on=false;var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function start(){if(!SR){window.ReactNativeWebView.postMessage(JSON.stringify({t:'error'}));return}rec=new SR();rec.lang='en-US';rec.continuous=false;rec.interimResults=true;rec.onstart=function(){on=true;window.ReactNativeWebView.postMessage(JSON.stringify({t:'start'}))};rec.onresult=function(e){var t='';for(var i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;if(e.results[e.results.length-1].isFinal){window.ReactNativeWebView.postMessage(JSON.stringify({t:'final',v:t}));stop()}else{window.ReactNativeWebView.postMessage(JSON.stringify({t:'partial',v:t}))}};rec.onerror=function(){stop()};rec.onend=function(){stop()};try{rec.start()}catch(e){stop()}}
function stop(){on=false;if(rec){try{rec.stop()}catch(e){}rec=null}window.ReactNativeWebView.postMessage(JSON.stringify({t:'end'}))}
window.startVoice=start;window.stopVoice=stop;
</script></body></html>`;

// ═══════════════════════════════════════════════════════════════
// FUZZY CITY MATCHING
// ═══════════════════════════════════════════════════════════════
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let curr = [i];
    for (let j = 1; j <= n; j++) {
      curr.push(a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]));
    }
    prev = curr;
  }
  return prev[n];
}

function fuzzyMatchCity(voiceText: string): { city: string; country: string; lat: number; lng: number } | null {
  try {
    const allLocs = require('./src/data/locations_complete').default;
    const { citySynonyms } = require('./src/data/citySynonyms');
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    const n = normalize(voiceText);
    if (n.length < 2) return null;

    // 0. Check synonyms
    const synId = citySynonyms[n];
    if (synId) {
      const synMatch = allLocs.find((l: any) => l.id === synId);
      if (synMatch) return synMatch;
    }

    // 1. Exact match
    let match = allLocs.find((l: any) => normalize(l.city) === n);
    if (match) return match;

    // 2. Contains match
    match = allLocs.find((l: any) => {
      const cn = normalize(l.city);
      return cn.includes(n) || n.includes(cn);
    });
    if (match) return match;

    // 3. Levenshtein
    let bestMatch: any = null;
    let bestScore = Infinity;
    for (const loc of allLocs) {
      const score = levenshtein(n, normalize(loc.city));
      const threshold = Math.max(2, Math.floor(n.length * 0.35));
      if (score < bestScore && score <= threshold) {
        bestScore = score;
        bestMatch = loc;
      }
    }
    return bestMatch || null;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// STREET VIEW HTML
// ═══════════════════════════════════════════════════════════════
function buildStreetViewHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{margin:0;padding:0;box-sizing:border-box}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-family:sans-serif;text-align:center}#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#a6d700;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div id="pano"></div><div id="status"><div class="spinner"></div>Loading...</div><script>function init(){new google.maps.StreetViewService().getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){if(s===google.maps.StreetViewStatus.OK){new google.maps.StreetViewPanorama(document.getElementById('pano'),{pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,addressControl:false,linksControl:true,panControl:true,zoomControl:true,fullscreenControl:false,motionTracking:false,enableCloseButton:false,clickToGo:true,scrollwheel:true});document.getElementById('status').style.display='none';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');}else{document.getElementById('status').innerHTML='No Street View here';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error');}});}</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script></body></html>`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: '', cardId: null, cardCity: '' },
    { id: 2, name: '', cardId: null, cardCity: '' }
  ]);
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [usedCards, setUsedCards] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('view');
  const [timer, setTimer] = useState(30);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [history, setHistory] = useState<Array<{ round: number; playerIdx: number; city: string; distance: number; points: number }>>([]);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [qrScanned, setQrScanned] = useState(false);
  const [qrError, setQrError] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceCountdown, setVoiceCountdown] = useState(0);
  const [showLoading, setShowLoading] = useState(true);
  const [loadingQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [tutPage, setTutPage] = useState(0);
  const [assignCameraOpen, setAssignCameraOpen] = useState(false);
  const [cardError, setCardError] = useState('');
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceWebViewRef = useRef<WebView>(null);
  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const loadingFade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const tutScrollRef = useRef<ScrollView>(null);

  // ═══ EFFECTS ═══
  useEffect(() => {
    AsyncStorage.getItem('geocheckr_tut_v7').then(v => { if (v === 'true') setScreen('setup'); });
  }, []);

  // Loading animation
  useEffect(() => {
    if (!showLoading) return;
    Animated.sequence([
      Animated.timing(loadingFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(loadingFade, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => setShowLoading(false));
  }, [showLoading]);

  // Tutorial text animation
  useEffect(() => {
    textFade.setValue(0);
    Animated.timing(textFade, { toValue: 1, duration: 600, useNativeDriver: true, delay: 200 }).start();
  }, [tutPage]);

  // Timer
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const i = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 5 && timer > 0 && phase === 'view') { playTimerTick(); Vibration.vibrate(200); Animated.sequence([Animated.timing(timerPulse, { toValue: 1.3, duration: 150, useNativeDriver: true }), Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true })]).start(); }
    if (timer === 0 && phase === 'view') { playTimerWarning(); Vibration.vibrate(500); setPhase('answer'); setTimeout(() => { playAnswerphoneBeep(); startVoice(); }, 300); }
  }, [timer, phase]);

  // Mic pulse
  useEffect(() => {
    if (listening) { Animated.loop(Animated.sequence([Animated.timing(micPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }), Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true })])).start(); } else { micPulse.setValue(1); }
  }, [listening]);

  // ═══ VOICE ═══
  const handleVoiceMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.t === 'start') {
        setListening(true); setVoiceCountdown(10); Vibration.vibrate(100);
        voiceTimerRef.current = setInterval(() => {
          setVoiceCountdown(prev => {
            if (prev <= 1) { voiceWebViewRef.current?.injectJavaScript('stopVoice();true;'); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
      if (data.t === 'partial') setVoiceText(data.v);
      if (data.t === 'final') { setVoiceText(data.v); Vibration.vibrate(50); setTimeout(() => resolveAnswerFromText(data.v), 500); }
      if (data.t === 'end' || data.t === 'error') { setListening(false); setVoiceCountdown(0); if (voiceTimerRef.current) { clearInterval(voiceTimerRef.current); voiceTimerRef.current = null; } }
    } catch { }
  };

  const startVoice = () => { playClickSound(); setVoiceText(''); voiceWebViewRef.current?.injectJavaScript('startVoice();true;'); };
  const stopVoice = () => { voiceWebViewRef.current?.injectJavaScript('stopVoice();true;'); };

  const resolveAnswerFromText = (text: string) => {
    let dist = 20000;
    let city = text;
    const match = fuzzyMatchCity(text);
    if (match) { dist = calculateDistance(location.lat, location.lng, match.lat, match.lng); city = match.city; }
    resolveAnswer(dist, city);
  };

  const resolveAnswer = (dist: number, city: string) => {
    const pts = calculatePoints(dist);
    if (pts >= 3) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); } else if (pts > 0) { playSuccessSound(); Vibration.vibrate([100, 50, 100]); } else { playErrorSound(); Vibration.vibrate(500); }
    setHistory(prev => [...prev, { round, playerIdx: currentPlayer, city: location.city, distance: Math.round(dist), points: pts }]);
    setScores(prev => { const n = [...prev]; n[currentPlayer] += pts; return n; });
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  };

  // ═══ NAVIGATION ═══
  const getRandomLocation = useCallback(() => {
    const avail = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    return (avail.length > 0 ? avail : panoramaLocations)[Math.floor(Math.random() * (avail.length > 0 ? avail : panoramaLocations).length)];
  }, [usedLocations]);

  const goToScan = useCallback(() => { setQrScanned(false); setVoiceText(''); setListening(false); setPhase('view'); resultScale.setValue(0); setScreen('scan'); }, [resultScale]);

  // ═══ SCAN HANDLER ═══
  const handleScan = useCallback((data: string) => {
    // City card scan: "city:ID"
    if (data.startsWith('city:')) {
      const cardId = parseInt(data.split(':')[1]);
      if (cardId && !usedCards.includes(cardId)) {
        const loc = panoramaLocations.find(l => l.id === cardId);
        if (loc) {
          playClickSound();
          setUsedCards(prev => [...prev, cardId]);
          setPlayers(prev => { const n = [...prev]; const idx = prev.findIndex(p => p.cardId === null); if (idx >= 0) n[idx] = { ...n[idx], cardId, cardCity: loc.city }; return n; });
          setAssignCameraOpen(false);
        }
      } else if (usedCards.includes(cardId)) {
        Vibration.vibrate(300); setQrError('Already assigned!'); setTimeout(() => setQrError(''), 3000);
      }
      return;
    }
    // Game QR: plain number
    if (qrScanned) return;
    let locId: number | null = parseInt(data.replace(/[^0-9]/g, ''));
    if (locId && locId > 0) {
      const loc = panoramaLocations.find(l => l.id === locId);
      if (loc) {
        if (usedLocations.includes(loc.id)) { Vibration.vibrate(300); setQrError(`${loc.city} already scanned!`); setTimeout(() => setQrError(''), 3000); return; }
        playClickSound(); setQrScanned(true); setQrError('');
        setLocation(loc); setUsedLocations(prev => [...prev, loc.id]);
        setTimer(timerSeconds); setTimerPaused(false); setPhase('view'); setSvLoaded(false); setSvError(false); setVoiceText('');
        resultScale.setValue(0); setScreen('game');
      }
    }
  }, [qrScanned, timerSeconds, resultScale, usedLocations, usedCards]);

  // ═══ GAME FLOW ═══
  const startGame = () => {
    if (players.some(p => p.cardId === null)) { setCardError('Scan cards for all players first!'); Vibration.vibrate(300); return; }
    playClickSound();
    const ps = players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` }));
    setPlayers(ps); setScores(new Array(ps.length).fill(0)); setRound(1); setCurrentPlayer(0);
    setUsedLocations([]); setUsedCards([]); setHistory([]); goToScan();
  };

  const nextTurn = () => {
    playClickSound();
    const next = (currentPlayer + 1) % players.length;
    if (next === 0 && round >= maxRounds) { setScreen('summary'); return; }
    if (next === 0) setRound(r => r + 1);
    setCurrentPlayer(next); goToScan();
  };

  const completeTutorial = async () => { try { await AsyncStorage.setItem('geocheckr_tut_v7', 'true'); } catch { } playClickSound(); setScreen('setup'); };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // ── LOADING ──
  if (showLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <StatusBar hidden />
        <Animated.View style={{ opacity: loadingFade, alignItems: 'center' }}>
          <Image source={require('./assets/icon.png')} style={{ width: 100, height: 100, marginBottom: 24 }} resizeMode="contain" />
          <Text style={{ color: C.green, fontSize: 14, fontWeight: '700', letterSpacing: 3, marginBottom: 20 }}>GEOCHECKR</Text>
          <Text style={{ color: C.muted, fontSize: 17, textAlign: 'center', fontStyle: 'italic', lineHeight: 26 }}>"{loadingQuote}"</Text>
        </Animated.View>
        <View style={{ position: 'absolute', bottom: 80, flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, opacity: 0.6 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, opacity: 0.3 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, opacity: 0.15 }} />
        </View>
      </View>
    );
  }

  // ── TUTORIAL (Swipeable) ──
  if (screen === 'tutorial') {
    const pages = [
      { bg: C.bg, titleColor: C.green, title: 'You Had One Job.', body: 'A Street View drops somewhere on Earth.\nYou\'re holding a City Card.\nFigure out which city on the table\nis closest to what you\'re looking at.\n\nSimple? Sure. Easy? Absolutely not.' },
      { bg: C.blue, titleColor: C.accent, title: 'Flip. Scan. Clock\'s Ticking.', body: 'Grab a card from the deck.\nScan the QR code with the app.\nA Street View loads instantly —\nand the timer starts\nwhether you\'re ready or not.' },
      { bg: C.bg, titleColor: C.accent, title: 'Name That City.', body: 'Study the Street View.\nPick the closest city from the\ncards on the table.\nTap the mic and say it out loud —\nthe app locks in your answer.\n\nThe closer you are, the more points.' },
      { bg: '#0a2a0a', titleColor: C.green, title: 'Feeling Dangerous?', body: 'Think someone guessed wrong?\nBet a token and name YOUR city.\n\nRight → bonus points.\nWrong → goodbye, token.\n\n→ Let\'s play!' },
    ];
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden />
        <ScrollView
          ref={tutScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setTutPage(Math.round(e.nativeEvent.contentOffset.x / W))}
        >
          {pages.map((p, i) => (
            <View key={i} style={{ width: W, height: H, backgroundColor: p.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 }}>
              <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
                <Text style={{ color: p.titleColor, fontSize: 34, fontWeight: '700', textAlign: 'center', marginBottom: 32, lineHeight: 42 }}>{p.title}</Text>
                <Text style={{ color: i === 3 ? '#c8f040' : C.text, fontSize: 21, textAlign: 'center', lineHeight: 32, opacity: 0.9 }}>{p.body}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 100, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {pages.map((_, i) => <View key={i} style={{ width: tutPage === i ? 28 : 8, height: 8, borderRadius: 4, backgroundColor: tutPage === i ? pages[i].titleColor : 'rgba(255,255,255,0.2)', marginHorizontal: 2 }} />)}
        </View>
        <View style={{ position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={completeTutorial}><Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Skip Tutorial</Text></TouchableOpacity>
          {tutPage < pages.length - 1 ? (
            <TouchableOpacity onPress={() => { tutScrollRef.current?.scrollTo({ x: (tutPage + 1) * W, animated: true }); setTutPage(tutPage + 1); }}>
              <Text style={{ color: C.green, fontSize: 15, fontWeight: '600' }}>Swipe →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={{ backgroundColor: C.green, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 9999 }} onPress={completeTutorial}>
              <Text style={{ color: C.bg, fontSize: 17, fontWeight: '700' }}>Let's play!</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── SETUP ──
  if (screen === 'setup') {
    const allCardsAssigned = players.every(p => p.cardId !== null);
    return (
      <View style={ss.c}><StatusBar hidden />
        <ScrollView contentContainerStyle={{ padding: 28, alignItems: 'center', paddingTop: 50 }} keyboardShouldPersistTaps="handled">
          <Image source={require('./assets/icon.png')} style={{ width: 80, height: 80, marginBottom: 12 }} resizeMode="contain" />
          <Text style={{ color: C.green, fontSize: 30, fontWeight: '700', marginBottom: 2 }}>GeoCheckr</Text>
          <Text style={{ color: C.outline, fontSize: 13, marginBottom: 28, letterSpacing: 1 }}>QR CARD GAME</Text>

          <Text style={{ color: C.outline, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 12 }}>PLAYERS</Text>
          {players.map((p, i) => {
            const hasCard = p.cardId !== null;
            const borderColor = hasCard ? C.border : 'rgba(255,100,100,0.5)';
            const bgColor = hasCard ? C.surface : 'rgba(255,100,100,0.08)';
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, width: '100%' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: PCOLORS[i], justifyContent: 'center', alignItems: 'center', backgroundColor: C.surface }}>
                  <Text style={{ color: PCOLORS[i], fontSize: 14, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{ backgroundColor: C.surface, color: C.text, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13, fontSize: 16, borderWidth: 1, borderColor }}
                    placeholder={`Player ${i + 1}`} placeholderTextColor={C.outline}
                    value={p.name}
                    onChangeText={t => setPlayers(prev => { const n = [...prev]; n[i] = { ...n[i], name: t }; return n; })}
                    maxLength={20} autoCapitalize="words"
                  />
                  {hasCard && (
                    <Text style={{ color: C.green, fontSize: 11, marginTop: 3, marginLeft: 12 }}>✓ {p.cardCity}</Text>
                  )}
                  {!hasCard && (
                    <Text style={{ color: '#ff6b6b', fontSize: 11, marginTop: 3, marginLeft: 12 }}>⚠ Scan city card required</Text>
                  )}
                </View>
                {!hasCard && (
                  <TouchableOpacity
                    style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,100,100,0.4)', backgroundColor: 'rgba(255,100,100,0.1)', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => { setAssignCameraOpen(true); setScreen('assign'); setQrError(''); }}
                  >
                    <Text style={{ color: '#ff6b6b', fontSize: 11, fontWeight: '700' }}>QR</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {cardError ? <Text style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{cardError}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 4, alignSelf: 'flex-start' }}>
            {players.length < 8 && <TouchableOpacity onPress={() => { setPlayers(prev => [...prev, { id: prev.length + 1, name: '', cardId: null, cardCity: '' }]); setScores(prev => [...prev, 0]); }}><Text style={{ color: C.accent, fontSize: 14, fontWeight: '600' }}>+ Add Player</Text></TouchableOpacity>}
            {players.length > 2 && <TouchableOpacity onPress={() => { setPlayers(prev => prev.slice(0, -1)); setScores(prev => prev.slice(0, -1)); }}><Text style={{ color: '#ff6b6b', fontSize: 14, fontWeight: '600' }}>- Remove</Text></TouchableOpacity>}
          </View>

          <Text style={{ color: C.outline, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, alignSelf: 'flex-start', marginTop: 24, marginBottom: 12 }}>TIMER</Text>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            {[5, 15, 30].map(t => (
              <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, borderWidth: 1.5, borderColor: timerSeconds === t ? C.accent : C.border, backgroundColor: timerSeconds === t ? 'rgba(189,194,255,0.1)' : C.surface, alignItems: 'center' }}
                onPress={() => setTimerSeconds(t)}>
                <Text style={{ color: timerSeconds === t ? C.accent : C.outline, fontSize: 15, fontWeight: '600' }}>{t}s</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: C.outline, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, alignSelf: 'flex-start', marginTop: 24, marginBottom: 12 }}>ROUNDS</Text>
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            {[5, 10, 15].map(r => (
              <TouchableOpacity key={r} style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, borderWidth: 1.5, borderColor: maxRounds === r ? C.accent : C.border, backgroundColor: maxRounds === r ? 'rgba(189,194,255,0.1)' : C.surface, alignItems: 'center' }}
                onPress={() => setMaxRounds(r)}>
                <Text style={{ color: maxRounds === r ? C.accent : C.outline, fontSize: 15, fontWeight: '600' }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={{ backgroundColor: allCardsAssigned ? C.blue : 'rgba(51,64,202,0.3)', paddingVertical: 16, borderRadius: 9999, alignItems: 'center', width: '100%', marginTop: 28 }}
            onPress={startGame}
          >
            <Text style={{ color: allCardsAssigned ? C.accent : C.outline, fontSize: 18, fontWeight: '700' }}>{allCardsAssigned ? 'Start Game' : 'Scan all cards first'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── ASSIGN CARDS ──
  if (screen === 'assign') {
    if (!cameraPermission?.granted) {
      return <View style={ss.c}><StatusBar hidden /><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Camera Required</Text>
        <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 9999 }} onPress={requestCameraPermission}>
          <Text style={{ color: C.accent, fontSize: 16, fontWeight: '700' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View></View>;
    }
    const nextUnassigned = players.findIndex(p => p.cardId === null);
    const p = players[nextUnassigned];
    if (!p) { setScreen('setup'); return null; }
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={({ data }) => handleScan(data)} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 60 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: C.accent, fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 6 }}>ASSIGN CARD</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{p.name || `Player ${nextUnassigned + 1}`}</Text>
          </View>
          <View style={{ width: 220, height: 220, position: 'relative' }}>
            {[{top:0,left:0,bt:3,bl:3,bt2:0,bl2:0},{top:0,right:0,bt:3,br:3,bt2:0,br2:0},{bottom:0,left:0,bb:3,bl:3,bb2:0,bl2:0},{bottom:0,right:0,bb:3,br:3,bb2:0,br2:0}].map((s,i)=>(<View key={i} style={{position:'absolute',...s,width:28,height:28,borderColor:C.green,borderWidth:3,borderRightWidth:s.right!==undefined?0:undefined,borderLeftWidth:s.left!==undefined?0:undefined,borderTopWidth:s.top!==undefined?0:undefined,borderBottomWidth:s.bottom!==undefined?0:undefined,borderRadius:6}}/>))}
          </View>
          {qrError ? <View style={{ backgroundColor: 'rgba(255,100,100,0.9)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{qrError}</Text></View> : <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Scan the city card QR code</Text>}
        </View>
      </View>
    );
  }

  // ── GAME QR SCAN ──
  if (screen === 'scan') {
    if (!cameraPermission?.granted) {
      return <View style={ss.c}><StatusBar hidden /><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Camera Required</Text>
        <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 9999 }} onPress={requestCameraPermission}>
          <Text style={{ color: C.accent, fontSize: 16, fontWeight: '700' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View></View>;
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={({ data }) => handleScan(data)} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 60 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ color: C.green, fontSize: 13, fontWeight: '600' }}>Round {round}</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{players[currentPlayer]?.name || `Player ${currentPlayer + 1}`}</Text>
          </View>
          <View style={{ width: 220, height: 220, position: 'relative' }}>
            {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((s,i)=>(<View key={i} style={{position:'absolute',...s,width:28,height:28,borderColor:C.green,borderWidth:3,borderRightWidth:s.right!==undefined?0:undefined,borderLeftWidth:s.left!==undefined?0:undefined,borderTopWidth:s.top!==undefined?0:undefined,borderBottomWidth:s.bottom!==undefined?0:undefined,borderRadius:6}}/>))}
          </View>
          {qrError ? <View style={{ backgroundColor: 'rgba(255,100,100,0.9)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{qrError}</Text></View> : <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Scan a QR card to start</Text>}
        </View>
      </View>
    );
  }

  // ── GAME ──
  if (screen === 'game') {
    const tc = timer <= 5 ? '#ff6b6b' : timer <= 10 ? C.accent : C.green;

    // ANSWER: Voice Input
    if (phase === 'answer') {
      return (
        <View style={{ flex: 1, backgroundColor: 'rgba(17,18,37,0.92)' }}>
          <StatusBar hidden />
          <WebView ref={voiceWebViewRef} source={{ html: VOICE_HTML }} style={{ width: 0, height: 0, position: 'absolute' }} onMessage={handleVoiceMessage} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
            <Text style={{ color: C.accent, fontSize: 14, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>{players[currentPlayer]?.name || `Player ${currentPlayer + 1}`}</Text>
            <Text style={{ color: C.text, fontSize: 26, fontWeight: '700', marginBottom: 48 }}>Which city is closest?</Text>

            <TouchableOpacity onPress={listening ? stopVoice : startVoice} activeOpacity={0.7}>
              <Animated.View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: listening ? C.green : C.surface, borderWidth: 3, borderColor: listening ? C.green : C.accent, justifyContent: 'center', alignItems: 'center', transform: [{ scale: micPulse }] }}>
                {listening ? (
                  <View style={{ width: 22, height: 22, backgroundColor: C.bg, borderRadius: 4 }} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 16, height: 24, borderRadius: 8, borderWidth: 3, borderColor: C.accent }} />
                    <View style={{ width: 3, height: 8, backgroundColor: C.accent, marginTop: 2, borderRadius: 2 }} />
                    <View style={{ width: 12, height: 2, backgroundColor: C.accent, marginTop: 2, borderRadius: 1 }} />
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>

            {listening && <Text style={{ color: C.green, fontSize: 52, fontWeight: '700', marginTop: 28 }}>{voiceCountdown}</Text>}
            <Text style={{ color: C.outline, fontSize: 16, marginTop: 18 }}>{listening ? 'Listening...' : voiceText ? 'Tap to retry' : 'Tap microphone to speak'}</Text>

            {voiceText.length > 0 && (
              <Animated.View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 24, marginTop: 28, width: '100%', borderWidth: 1, borderColor: C.green }}>
                <Text style={{ color: C.green, fontSize: 36, fontWeight: '700', textAlign: 'center' }}>{voiceText}</Text>
              </Animated.View>
            )}

            <TouchableOpacity style={{ marginTop: 36, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 9999, borderWidth: 1, borderColor: C.border }} onPress={() => resolveAnswer(20000, '')}>
              <Text style={{ color: C.outline, fontSize: 14, fontWeight: '600' }}>Skip round</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // RESULT
    if (phase === 'result') {
      const dist = history.length > 0 ? history[history.length - 1].distance : 20000;
      const pts = history.length > 0 ? history[history.length - 1].points : 0;
      const guessCity = history.length > 0 ? (history[history.length - 1].city || '?') : '?';
      return (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,18,37,0.95)', justifyContent: 'center', paddingHorizontal: 20, zIndex: 50 }}>
          <Animated.View style={{ backgroundColor: C.surface, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: pts > 0 ? C.green : 'rgba(255,100,100,0.3)', transform: [{ scale: resultScale }] }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{pts >= 3 ? '\u{1F3AF}' : pts >= 2 ? '\u{1F44D}' : pts >= 1 ? '\u{1F610}' : '\u{1F605}'}</Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: pts > 0 ? C.green : '#ff6b6b', marginBottom: 20 }}>{pts >= 3 ? 'Perfect!' : pts >= 2 ? 'Good!' : pts >= 1 ? 'Not bad!' : 'Wrong!'}</Text>

            <View style={{ width: '100%', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ color: C.outline, fontSize: 16 }}>Your guess</Text>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>{guessCity}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ color: C.outline, fontSize: 16 }}>Correct</Text>
                <Text style={{ color: C.green, fontSize: 16, fontWeight: '600' }}>{location.city}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ color: C.outline, fontSize: 16 }}>Distance</Text>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>{formatDistance(dist)}</Text>
              </View>
            </View>

            <Text style={{ fontSize: 36, fontWeight: '700', color: C.green, marginBottom: 24 }}>+{pts} pts</Text>

            <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, width: '100%', alignItems: 'center' }} onPress={nextTurn}>
              <Text style={{ color: C.accent, fontSize: 17, fontWeight: '700' }}>
                {(currentPlayer + 1) % players.length === 0 && round >= maxRounds ? 'Results' : `${players[(currentPlayer + 1) % players.length]?.name || 'Next'}'s turn`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    // VIEW: Street View
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' }}>
        <StatusBar hidden translucent backgroundColor="transparent" />
        <WebView key={`${location.lat}-${location.lng}`} source={{ html: buildStreetViewHtml(location.lat, location.lng) }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} mixedContentMode="compatibility" onError={() => setSvError(true)} onMessage={e => { const m = e.nativeEvent.data; if (m === 'loaded') setSvLoaded(true); if (m.startsWith('error')) setSvError(true); }} userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" />

        {!svLoaded && !svError && <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 5 }}><Text style={{ color: C.outline, fontSize: 14 }}>Loading...</Text></View>}
        {svError && <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 10 }}><Text style={{ color: C.outline, fontSize: 14, marginBottom: 16 }}>Street View unavailable</Text><TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }} onPress={goToScan}><Text style={{ color: C.accent, fontSize: 15, fontWeight: '600' }}>Scan another</Text></TouchableOpacity></View>}

        {svLoaded && <>
          {/* Score bar */}
          <View style={{ position: 'absolute', top: 40, left: 12, right: 12, zIndex: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {players.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 9999, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 2, borderColor: currentPlayer === i ? C.green : 'transparent' }}>
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
          <Animated.View style={{ position: 'absolute', top: 100, right: 12, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 3, borderColor: tc, justifyContent: 'center', alignItems: 'center', zIndex: 20, transform: [{ scale: timerPulse }] }}>
            <Text style={{ color: tc, fontSize: 22, fontWeight: '700' }}>{timer}</Text>
          </Animated.View>

          {/* I know it button */}
          <TouchableOpacity style={{ position: 'absolute', bottom: 50, alignSelf: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 9999, borderWidth: 1.5, borderColor: C.green }} onPress={() => { playClickSound(); setTimerPaused(true); setPhase('answer'); setTimeout(() => { playAnswerphoneBeep(); startVoice(); }, 300); }}>
            <Text style={{ color: C.green, fontSize: 17, fontWeight: '600' }}>I know it!</Text>
          </TouchableOpacity>
        </>}
      </View>
    );
  }

  // ── SUMMARY ──
  const sorted = [...players].map((p, i) => ({ ...p, score: scores[i] })).sort((a, b) => b.score - a.score);
  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  return (
    <View style={ss.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center', paddingTop: 50 }}>
        <Text style={{ fontSize: 56, marginBottom: 8 }}>{'\u{1F3C6}'}</Text>
        <Text style={{ color: C.text, fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Game Over!</Text>
        <Text style={{ color: C.outline, fontSize: 14, marginBottom: 24 }}>{maxRounds} Rounds</Text>

        {sorted.map((p, i) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, width: '100%', borderWidth: 1, borderColor: i === 0 ? C.green : C.border }}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>{medals[i] || `#${i + 1}`}</Text>
            <Text style={{ flex: 1, color: C.text, fontSize: 16, fontWeight: '600' }}>{p.name}{p.cardCity ? ` (${p.cardCity})` : ''}</Text>
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

        <TouchableOpacity style={{ backgroundColor: C.blue, paddingVertical: 16, borderRadius: 9999, alignItems: 'center', width: '100%', marginTop: 24 }} onPress={() => setScreen('setup')}>
          <Text style={{ color: C.accent, fontSize: 17, fontWeight: '700' }}>Play Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.bg },
});
