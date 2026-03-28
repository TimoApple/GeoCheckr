// GeoCheckr — QR Card Game
// Design System: "The Tactical Cartographer"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, Platform, KeyboardAvoidingView, StatusBar, ScrollView, Dimensions, Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import MlkitOcr from 'rn-mlkit-ocr';

import { calculateDistance, formatDistance } from './src/utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playScanSound, playAnswerphoneBeep } from './src/utils/sounds';
import { panoramaLocations, PanoramaLocation } from './src/data/panoramaLocations';

const { width, height } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';
const FF = { regular: 'SpaceGrotesk_400Regular', bold: 'SpaceGrotesk_700Bold' };

// CI COLORS
const C = {
  bg: '#111225', surfaceLow: '#191a2d', surface: '#1d1e31',
  surfaceHigh: '#27283c', surfaceHighest: '#323348',
  primary: '#a6d700', primaryBright: '#c1f432',
  onPrimary: '#273500', onPrimaryContainer: '#445a00',
  secondary: '#bdc2ff', secondaryContainer: '#2734c0',
  onSecondaryContainer: '#acb3ff',
  onSurface: '#e1e0fb', outline: '#444934',
  error: '#ffb4ab', accent: '#bdc2ff', green: '#a6d700', blue: '#3340ca',
  text: '#e5e2e1', muted: '#c6c5d7',
};

// TYPES
interface Player { id: number; name: string; city: string; cityId: number; lat: number; lng: number; score: number; }
interface TableCity { city: string; lat: number; lng: number; ownerPlayerId: number | null; isPlayerCity: boolean; }
type Screen = 'loading' | 'tutorial' | 'setup' | 'scan-city' | 'game' | 'result' | 'reshuffle';

// LOADING QUOTES
const QUOTES = [
  "The world is a book. Those who don't travel read only one page.",
  "Not all those who wander are lost.",
  "To travel is to live.",
  "The Earth has music for those who listen.",
  "Adventure is worthwhile in itself.",
];

// STREET VIEW HTML
function buildStreetViewHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{margin:0;padding:0;box-sizing:border-box}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-family:sans-serif;text-align:center;font-size:14px;z-index:999}#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#a6d700;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div id="pano"></div><div id="status"><div class="spinner"></div>Loading Street View...</div><script>function init(){var sv=new google.maps.StreetViewService();sv.getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(data,st){if(st===google.maps.StreetViewStatus.OK){new google.maps.StreetViewPanorama(document.getElementById('pano'),{pano:data.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,addressControl:false,linksControl:true,panControl:true,zoomControl:true,fullscreenControl:false,motionTracking:false,motionTrackingControl:false,enableCloseButton:false,clickToGo:true,scrollwheel:true,disableDefaultUI:false});document.getElementById('status').style.display='none';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded')}else{document.getElementById('status').innerHTML='No Street View';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error')}})}</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script></body></html>`;
}

export default function App() {
  const [fontsLoaded] = useFonts({ SpaceGrotesk_400Regular, SpaceGrotesk_700Bold });
  const [screen, setScreen] = useState<Screen>('loading');
  const [tutorialPage, setTutorialPage] = useState(0);
  const [loadingFade] = useState(new Animated.Value(0));
  const [loadingQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Setup
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', city: '', cityId: -1, lat: 0, lng: 0, score: 0 },
    { id: 2, name: 'Player 2', city: '', cityId: -1, lat: 0, lng: 0, score: 0 },
  ]);
  const [timerSetting, setTimerSetting] = useState(15);
  const [roundsSetting, setRoundsSetting] = useState(10);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // City scan
  const [scanCityForIdx, setScanCityForIdx] = useState<number | null>(null);
  const [showCityScanner, setShowCityScanner] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textSuggestions, setTextSuggestions] = useState<PanoramaLocation[]>([]);
  const [textMatchError, setTextMatchError] = useState('');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState('');
  const cameraRef = useRef<any>(null);

  // Game
  const [tableCities, setTableCities] = useState<TableCity[]>([]);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(10);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [phase, setPhase] = useState<'scan-qr' | 'view' | 'pick' | 'result'>('scan-qr');
  const [timer, setTimer] = useState(30);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [closestCityIdx, setClosestCityIdx] = useState<number | null>(null);
  const [distances, setDistances] = useState<number[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);

  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const tutScrollRef = useRef<ScrollView>(null);
  const [tutOpacity] = useState(new Animated.Value(1));

  const allPlayersScanned = players.length >= 2 && players.every(p => p.city.length > 0);

  // FUZZY MATCH — Levenshtein distance for city name matching
  const levenshtein = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  };

  const fuzzyMatchCity = (input: string): PanoramaLocation | null => {
    const norm = input.toLowerCase().trim()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    // Exact match first
    const exact = panoramaLocations.find(l => l.city.toLowerCase() === norm);
    if (exact) return exact;
    // Fuzzy match — find best within threshold
    let best: PanoramaLocation | null = null;
    let bestDist = Infinity;
    for (const loc of panoramaLocations) {
      const cityNorm = loc.city.toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
      const dist = levenshtein(norm, cityNorm);
      if (dist < bestDist) { bestDist = dist; best = loc; }
    }
    // Max 2 edits for short names, 3 for longer
    const threshold = norm.length <= 5 ? 1 : norm.length <= 10 ? 2 : 3;
    return bestDist <= threshold ? best : null;
  };

  // LOADING SCREEN
  useEffect(() => {
    Animated.timing(loadingFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    const t = setTimeout(() => setScreen('tutorial'), 2500);
    return () => clearTimeout(t);
  }, []);

  // TIMER
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 10 && timer > 0 && phase === 'view') {
      playTimerTick(); Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    if (timer === 0 && phase === 'view') { playTimerWarning(); Vibration.vibrate(500); setPhase('pick'); }
  }, [timer, phase]);

  // GAME LOGIC
  const getRandomLocation = useCallback(() => {
    const available = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : panoramaLocations[Math.floor(Math.random() * panoramaLocations.length)];
  }, [usedLocations]);

  const addPlayer = () => {
    const count = players.length + 1;
    setPlayers(prev => [...prev, { id: Date.now(), name: `Player ${count}`, city: '', cityId: -1, lat: 0, lng: 0, score: 0 }]);

    playClickSound();
  };

  // OCR CAPTURE
  const captureAndOcr = async () => {
    if (!cameraRef.current || ocrProcessing) return;
    setOcrProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      const result = await MlkitOcr.recognizeText(photo.uri);
      const allText = result.text;
      console.log('[OCR]', allText);

      // Try #number first
      const numMatch = allText.match(/#?(\d{1,3})/);
      if (numMatch) {
        const id = parseInt(numMatch[1], 10);
        if (id >= 0 && id < panoramaLocations.length) {
          const loc = panoramaLocations.find(l => l.id === id);
          if (loc && scanCityForIdx !== null) {
            playScanSound(); Vibration.vibrate(100);
            setPlayers(prev => prev.map((p, i) =>
              i === scanCityForIdx ? { ...p, city: loc.city, cityId: id, lat: loc.lat, lng: loc.lng } : p
            ));
            setShowCityScanner(false); setScanCityForIdx(null); setOcrProcessing(false);
            return;
          }
        }
      }

      // Fuzzy match city name from OCR text
      const match = fuzzyMatchCity(allText);
      if (match && scanCityForIdx !== null) {
        playScanSound(); Vibration.vibrate(100);
        setPlayers(prev => prev.map((p, i) =>
          i === scanCityForIdx ? { ...p, city: match.city, cityId: match.id, lat: match.lat, lng: match.lng } : p
        ));
        setShowCityScanner(false); setScanCityForIdx(null); setOcrProcessing(false);
        return;
      }

      // No match — retry
      setScanError('Not recognized — try again');
      setTimeout(() => setScanError(''), 2000);
    } catch (e) {
      console.error('[OCR] Error:', e);
      setScanError('Camera error — try again');
      setTimeout(() => setScanError(''), 2000);
    }
    setOcrProcessing(false);
  };

  const openCityScan = (idx: number) => {
    setScanCityForIdx(idx); setShowCityScanner(true); setShowTextInput(false); setScanned(false); setOcrProcessing(false); setTextInputValue('');
  };

  const submitCityText = () => {
    if (scanCityForIdx === null) return;
    const input = textInputValue.trim();
    if (!input) { return; }
    const match = fuzzyMatchCity(input);
    if (match) {
      playClickSound(); Vibration.vibrate(100);
      setPlayers(prev => prev.map((p, i) =>
        i === scanCityForIdx ? { ...p, city: match.city, cityId: match.id, lat: match.lat, lng: match.lng } : p
      ));
      setShowTextInput(false); setShowCityScanner(false); setScanCityForIdx(null); setTextInputValue(''); setTextSuggestions([]);
    }
  };

  const onChangeText = (text: string) => {
    setTextInputValue(text);
    if (text.length >= 2) {
      const norm = text.toLowerCase().trim()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
      const matches = panoramaLocations
        .filter(l => l.city.toLowerCase().includes(norm) || levenshtein(norm, l.city.toLowerCase()) <= 2)
        .slice(0, 5);
      setTextSuggestions(matches);
    } else {
      setTextSuggestions([]);
    }
  };

  const selectSuggestion = (loc: PanoramaLocation) => {
    if (scanCityForIdx === null) return;
    playClickSound(); Vibration.vibrate(100);
    setPlayers(prev => prev.map((p, i) =>
      i === scanCityForIdx ? { ...p, city: loc.city, cityId: loc.id, lat: loc.lat, lng: loc.lng } : p
    ));
    setShowTextInput(false); setShowCityScanner(false); setScanCityForIdx(null); setTextInputValue(''); setTextSuggestions([]);
  };

  // OCR PHOTO CAPTURE

  const startGame = () => {
    if (!allPlayersScanned) return;
    playClickSound();
    setTableCities(players.map(p => ({ city: p.city, lat: p.lat, lng: p.lng, ownerPlayerId: p.id, isPlayerCity: true })));
    setRound(1); setMaxRounds(roundsSetting); setActivePlayerIdx(0); setUsedLocations([]);
    setPhase('scan-qr'); setScreen('game');
  };

  const startRound = useCallback(() => {
    setPhase('scan-qr'); setSvLoaded(false); setSvError(false);
    setClosestCityIdx(null); setDistances([]); setWinnerId(null);
    setTimer(timerSetting); setTimerPaused(false); resultScale.setValue(0);
  }, [timerSetting]);

  const onQrScanned = useCallback((loc: PanoramaLocation) => {
    setLocation(loc); setUsedLocations(prev => [...prev, loc.id]);
    setTimer(timerSetting); setTimerPaused(false); setPhase('view');
    setShowQrScanner(false); setScanned(false); Vibration.vibrate(100);
  }, [timerSetting]);

  const pickCity = useCallback((idx: number) => {
    playClickSound(); setTimerPaused(true);
    const dists = tableCities.map(tc => calculateDistance(location.lat, location.lng, tc.lat, tc.lng));
    setDistances(dists);
    let minIdx = 0; for (let i = 1; i < dists.length; i++) if (dists[i] < dists[minIdx]) minIdx = i;
    setClosestCityIdx(minIdx);
    if (idx === minIdx) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); } else { playErrorSound(); Vibration.vibrate(500); }
    const actualWinner = tableCities[minIdx].ownerPlayerId;
    if (actualWinner !== null) setPlayers(prev => prev.map(p => p.id === actualWinner ? { ...p, score: p.score + 1 } : p));
    setWinnerId(actualWinner);
    setTableCities(prev => [...prev, { city: location.city, lat: location.lat, lng: location.lng, ownerPlayerId: null, isPlayerCity: false }]);
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  }, [tableCities, location]);

  const nextTurn = () => {
    playClickSound();
    if (round >= maxRounds) { setScreen('result'); return; }
    setActivePlayerIdx(prev => (prev + 1) % players.length);
    setRound(r => r + 1); startRound();
  };

  // ═══════════════ SCAN HANDLER — 3 MECHANICS ═══════════════
  // ═══ SCANNER: TEXT INPUT ONLY ═══
  const handleScan = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    console.log('[TEXT SCAN]', data);

    // Only game QR — city assignment uses text input
    if (showQrScanner) {
      const m = data.match(/#?(\d+)/);
      if (m) {
        const id = parseInt(m[1], 10);
        if (id >= 0 && id < panoramaLocations.length) {
          const loc = panoramaLocations.find(l => l.id === id);
          if (loc) {
            if (usedLocations.includes(id)) { setScanError('Already scanned!'); setTimeout(() => setScanError(''), 2000); return; }
            playScanSound(); setScanned(true); Vibration.vibrate(100); onQrScanned(loc); return;
          }
        }
      }
      if (data.startsWith('city:')) {
        const id = parseInt(data.split(':')[1]);
        if (id >= 0 && id < panoramaLocations.length) {
          const loc = panoramaLocations.find(l => l.id === id);
          if (loc) {
            if (usedLocations.includes(id)) { setScanError('Already scanned!'); setTimeout(() => setScanError(''), 2000); return; }
            playScanSound(); setScanned(true); Vibration.vibrate(100); onQrScanned(loc); return;
          }
        }
      }
    }
  }, [scanned, showQrScanner, onQrScanned, usedLocations]);

  // TUTORIAL
  const TUT_PAGES = [
    { bg: C.bg, titleColor: C.green, title: 'You Had One Job.', body: 'A Street View drops somewhere on Earth. You\'re holding a City Card. Figure out which city on the table is closest to what you\'re looking at.\n\nSimple? Sure. Easy? Absolutely not.' },
    { bg: C.blue, titleColor: C.accent, title: 'Flip. Scan. Clock\'s Ticking.', body: 'Grab a card from the deck. Scan the QR code with the app. A Street View loads instantly — and the timer starts whether you\'re ready or not.' },
    { bg: C.bg, titleColor: C.accent, title: 'Name That City.', body: 'Study the Street View. Pick the closest city from the cards on the table. Tap the mic and say it out loud — the app locks in your answer.\n\nThe closer you are, the more points.' },
    { bg: '#0a2a0a', titleColor: C.green, title: 'Feeling Dangerous?', body: 'Think someone guessed wrong? Bet a token and name YOUR city.\n\nRight → bonus points.\nWrong → goodbye, token.\n\n→ Let\'s play!' },
  ];

  // ═══════════════ SCANNERS ═══════════════
  if (showCityScanner || showQrScanner) {
    if (!cameraPermission?.granted) {
      return (
        <View style={s.container}><StatusBar hidden />
          <View style={s.centerScreen}>
            <Text style={{ color: C.onSurface, fontSize: 18, fontFamily: FF.regular, marginBottom: 20, textAlign: 'center' }}>Camera permission required</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={requestCameraPermission}><Text style={s.primaryBtnText}>GRANT</Text></TouchableOpacity>
            <TouchableOpacity style={s.tertiaryBtn} onPress={() => { setShowCityScanner(false); setShowQrScanner(false); setScanned(false); setShowTextInput(false); }}><Text style={s.tertiaryBtnText}>CANCEL</Text></TouchableOpacity>
          </View>
        </View>
      );
    }

    const assignName = showCityScanner && scanCityForIdx !== null ? players[scanCityForIdx]?.name : '';

    // ─── CITY SCANNER: OCR CAMERA ───
    if (showCityScanner) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000' }}><StatusBar hidden />
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
            <View style={s.scanOverlay}>
              <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <Text style={{ color: C.primary, fontSize: 13, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2, marginBottom: 6 }}>ASSIGN CARD</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: FF.bold }}>{assignName}</Text>
              </View>
              <View style={s.scanFrame}>
                <Text style={{ color: C.primary, fontSize: 16, fontWeight: '600', fontFamily: FF.bold, textAlign: 'center' }}>
                  {ocrProcessing ? 'Recognizing...' : 'Point at city card'}
                </Text>
              </View>
              {scanError ? (
                <View style={{ backgroundColor: 'rgba(255,100,100,0.9)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginTop: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: FF.bold }}>{scanError}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[s.primaryBtn, { marginTop: 20, width: 200, alignItems: 'center', borderRadius: 8 }]}
                onPress={captureAndOcr}
                disabled={ocrProcessing}
              >
                <Text style={s.primaryBtnText}>{ocrProcessing ? '...' : 'CAPTURE'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.scanCloseBtn} onPress={() => { setShowCityScanner(false); setScanCityForIdx(null); setOcrProcessing(false); }}>
                <Text style={s.scanCloseText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      );
    }

    // ─── GAME QR SCANNER ───
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}><StatusBar hidden />
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={s.scanOverlay}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text style={{ color: C.primary, fontSize: 13, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2, marginBottom: 6 }}>SCAN QR CARD</Text>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: FF.bold }}>Player</Text>
            </View>
            <View style={s.scanFrame}>
              <Text style={{ color: C.primary, fontSize: 16, fontWeight: '600', fontFamily: FF.bold, textAlign: 'center' }}>Hold QR card in frame</Text>
            </View>
            <TouchableOpacity style={s.scanCloseBtn} onPress={() => { setShowQrScanner(false); setScanned(false); }}>
              <Text style={s.scanCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // ═══════════════ LOADING ═══════════════
  if (screen === 'loading') {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }]}>
        <StatusBar hidden />
        <Animated.View style={{ opacity: loadingFade, alignItems: 'center' }}>
          <Image source={require('./assets/icon.png')} style={{ width: 100, height: 100, marginBottom: 24 }} resizeMode="contain" />
          <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: 3, marginBottom: 20 }}>GEOCHECKR</Text>
          <Text style={{ color: 'rgba(225,224,251,0.4)', fontSize: 17, textAlign: 'center', fontStyle: 'italic', lineHeight: 26 }}>"{loadingQuote}"</Text>
        </Animated.View>
        <View style={{ position: 'absolute', bottom: 80, flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, opacity: 0.6 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, opacity: 0.3 }} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, opacity: 0.15 }} />
        </View>
      </View>
    );
  }

  // ═══════════════ TUTORIAL ═══════════════
  if (screen === 'tutorial') {
    const goToPage = (idx: number) => {
      if (idx < 0 || idx >= TUT_PAGES.length || idx === tutorialPage) return;
      tutOpacity.setValue(0);
      tutScrollRef.current?.scrollTo({ x: idx * width, animated: false });
      setTutorialPage(idx);
      Animated.timing(tutOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    };
    return (
      <View style={{ flex: 1 }}>
        <StatusBar hidden />
        <ScrollView
          ref={tutScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const newPage = Math.round(e.nativeEvent.contentOffset.x / width);
            if (newPage !== tutorialPage && newPage >= 0 && newPage < TUT_PAGES.length) {
              tutOpacity.setValue(0);
              setTutorialPage(newPage);
              Animated.timing(tutOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            }
          }}
        >
          {TUT_PAGES.map((p, i) => (
            <View key={i} style={{ width, height, backgroundColor: p.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 }}>
              <Animated.View style={{ opacity: tutorialPage === i ? tutOpacity : 0.15, alignItems: 'center', paddingHorizontal: 10 }}>
                <Text style={{ color: p.titleColor, fontSize: 40, fontWeight: '700', fontFamily: FF.bold, textAlign: 'center', marginBottom: 36, lineHeight: 48 }}>{p.title}</Text>
                <Text style={{ color: i === 3 ? '#c8f040' : C.text, fontSize: 24, fontFamily: FF.regular, textAlign: 'center', lineHeight: 38, opacity: 0.95 }}>{p.body}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 100, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {TUT_PAGES.map((_, i) => <View key={i} style={{ width: tutorialPage === i ? 28 : 8, height: 8, borderRadius: 4, backgroundColor: tutorialPage === i ? TUT_PAGES[i].titleColor : 'rgba(255,255,255,0.2)', marginHorizontal: 2 }} />)}
        </View>
        <View style={{ position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setScreen('setup')}><Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontFamily: FF.regular }}>Skip Tutorial</Text></TouchableOpacity>
          {tutorialPage < TUT_PAGES.length - 1 ? (
            <TouchableOpacity onPress={() => goToPage(tutorialPage + 1)}>
              <Text style={{ color: C.green, fontSize: 15, fontWeight: '600', fontFamily: FF.bold }}>Swipe →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={{ backgroundColor: C.green, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 9999 }} onPress={() => setScreen('setup')}>
              <Text style={{ color: C.bg, fontSize: 17, fontWeight: '700', fontFamily: FF.bold }}>Let's play!</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ═══════════════ SETUP — Timo's HTML Design ═══════════════
  if (screen === 'setup') {
    return (
      <View style={s.container}><StatusBar hidden />
        <ScrollView contentContainerStyle={s.setupScroll} keyboardShouldPersistTaps="handled">
          <Text style={s.setupHeader}>GEOCHECKR</Text>
          <Text style={s.setupTitle}>SETUP SESSION</Text>
          <View style={s.titleBar} />

          <View style={s.sectionLabel}><Text style={s.sectionLabelText}>PLAYER MANAGEMENT</Text></View>

          {players.map((p, i) => (
            <View key={p.id} style={s.playerRow}>
              <TextInput
                style={s.playerInput}
                value={p.name.startsWith('Player ') ? '' : p.name}
                onChangeText={t => setPlayers(prev => prev.map((pp, idx) => idx === i ? { ...pp, name: t.length > 0 ? t : `Player ${idx + 1}` } : pp))}
                placeholder={`Player ${i + 1}`}
                placeholderTextColor="rgba(225,224,251,0.3)"
              />
              <TouchableOpacity style={[s.hashBtn, p.city.length > 0 && s.hashBtnDone]} onPress={() => openCityScan(i)}>
                <Text style={[s.hashBtnText, p.city.length > 0 && s.hashBtnTextDone]}>
                  {p.city.length > 0 ? '✓' : '#'}
                </Text>
              </TouchableOpacity>
              {players.length > 2 && (
                <TouchableOpacity style={s.removeBtn} onPress={() => setPlayers(prev => prev.filter(pp => pp.id !== p.id))}>
                  <Text style={{ color: C.error, fontSize: 14, fontWeight: '700', fontFamily: FF.bold }}>✕</Text>
                </TouchableOpacity>
              )}
              {players.length <= 2 && <View style={s.removeBtn} />}
            </View>
          ))}

          <TouchableOpacity style={s.recruitBtn} onPress={addPlayer}>
            <Text style={s.recruitBtnText}>+ RECRUIT</Text>
          </TouchableOpacity>

          <View style={s.gridRow}>
            <View style={s.gridCol}>
              <View style={s.sectionLabel}><Text style={s.sectionLabelText}>TIMER</Text></View>
              <View style={s.chipRow}>
                {[5, 15, 30].map(t => (
                  <TouchableOpacity key={t} style={[s.chip, timerSetting === t && s.chipActive]} onPress={() => setTimerSetting(t)}>
                    <Text style={[s.chipText, timerSetting === t && s.chipTextActive]}>{t}s</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.gridCol}>
              <View style={s.sectionLabel}><Text style={s.sectionLabelText}>ROUNDS</Text></View>
              <View style={s.chipRow}>
                {[5, 10, 15].map(r => (
                  <TouchableOpacity key={r} style={[s.chip, roundsSetting === r && s.chipActive]} onPress={() => setRoundsSetting(r)}>
                    <Text style={[s.chipText, roundsSetting === r && s.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={{ marginTop: 32 }}>
            <TouchableOpacity style={[s.mainBtn, !allPlayersScanned && s.mainBtnDisabled]} disabled={!allPlayersScanned} onPress={startGame}>
              <Text style={s.mainBtnText}>{allPlayersScanned ? 'ALL SET, LET\'S GO!' : 'SCAN ALL CARDS FIRST'}</Text>
            </TouchableOpacity>
            <Text style={s.actionHint}>{allPlayersScanned ? `${players.length} players ready` : 'Scan city cards for all players'}</Text>
          </View>
        </ScrollView>

        {/* TEXT INPUT MODAL */}
        {showTextInput && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <View style={{ backgroundColor: C.surface, padding: 32, borderRadius: 16, width: '85%', maxWidth: 360 }}>
              <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginBottom: 8 }}>ENTER CITY NAME</Text>
              <Text style={{ color: C.onSurface, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 24 }}>
                {scanCityForIdx !== null ? players[scanCityForIdx]?.name : ''}
              </Text>
              <TextInput
                style={{ backgroundColor: C.surfaceLow, color: C.onSurface, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 8, fontSize: 18, borderWidth: 1, borderColor: C.surfaceHighest }}
                value={textInputValue}
                onChangeText={t => { setTextInputValue(t); setTextMatchError(''); }}
                placeholder="Berlin, Tokyo, Cairo..."
                placeholderTextColor="rgba(225,224,251,0.3)"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submitCityText}
                autoCapitalize="words"
              />
              {textMatchError.length > 0 && (
                <Text style={{ color: C.error, fontSize: 13, marginTop: 10, textAlign: 'center' }}>{textMatchError}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: C.surfaceHighest }}
                  onPress={() => { setShowTextInput(false); setScanCityForIdx(null); }}>
                  <Text style={{ color: C.onSurface, fontSize: 15, fontWeight: '600' }}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: C.primary, paddingVertical: 14, alignItems: 'center', borderRadius: 8 }}
                  onPress={submitCityText}>
                  <Text style={{ color: C.bg, fontSize: 15, fontWeight: '700' }}>ASSIGN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ═══════════════ GAME ═══════════════
  if (screen === 'game') {
    const activePlayer = players[activePlayerIdx];
    const timerColor = timer <= 10 ? C.error : C.primary;

    if (phase === 'scan-qr') {
      return (
        <View style={s.container}><StatusBar hidden />
          <View style={s.gameTopBar}>
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>{activePlayer.name}</Text>
            <Text style={{ color: C.onSurface, fontSize: 12, backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 4 }}>R{round}/{maxRounds}</Text>
          </View>
          <View style={s.centerScreen}>
            <Text style={{ fontSize: 64, marginBottom: 24 }}>📷</Text>
            <Text style={{ color: C.onSurface, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>{activePlayer.name}, draw a QR card!</Text>
            <Text style={{ color: 'rgba(225,224,251,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>Scan the QR card to reveal the location</Text>
            <View style={s.tableList}>
              <Text style={{ color: C.secondary, fontSize: 10, fontWeight: '700', letterSpacing: 3, marginBottom: 12 }}>CITIES ON TABLE</Text>
              {tableCities.map((tc, i) => (
                <View key={i} style={[s.tableRow, i % 2 === 0 ? { backgroundColor: C.surfaceLow } : { backgroundColor: C.surface }]}>
                  <Text style={{ color: C.primary, fontSize: 14, marginRight: 10 }}>{tc.isPlayerCity ? '◉' : '◈'}</Text>
                  <Text style={{ color: C.onSurface, fontSize: 15, fontWeight: '600' }}>{tc.city}</Text>
                  {tc.isPlayerCity && <Text style={{ color: 'rgba(225,224,251,0.4)', fontSize: 12, marginLeft: 8 }}>— {players.find(pp => pp.id === tc.ownerPlayerId)?.name}</Text>}
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={() => { setShowQrScanner(true); setScanned(false); }}>
              <Text style={s.primaryBtnText}>SCAN QR CARD</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={s.container}><StatusBar hidden />
        <View style={s.gameTopBar}>
          <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>{activePlayer.name}</Text>
          <Text style={{ color: C.onSurface, fontSize: 12, backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 4 }}>R{round}/{maxRounds}</Text>
        </View>

        {phase === 'view' && (
          <>
            <WebView key={`${location.lat}-${location.lng}`} source={{ html: buildStreetViewHtml(location.lat, location.lng) }}
              style={{ flex: 1 }} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false} mixedContentMode="compatibility" scrollEnabled
              onError={() => setSvError(true)}
              onMessage={(e) => { const msg = e.nativeEvent.data; if (msg === 'loaded') setSvLoaded(true); if (msg.startsWith('error')) setSvError(true); }}
              userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" />
            {!svLoaded && !svError && <View style={s.loadingOverlay}><Text style={{ color: 'rgba(225,224,251,0.5)' }}>Loading Street View...</Text></View>}
            {svError && <View style={s.errorOverlay}><Text style={{ color: C.error, fontSize: 16, marginBottom: 20 }}>No Street View</Text><TouchableOpacity style={s.primaryBtn} onPress={nextTurn}><Text style={s.primaryBtnText}>SKIP</Text></TouchableOpacity></View>}
            {svLoaded && <>
              <Animated.View style={[s.timer, { borderColor: timerColor, transform: [{ scale: timerPulse }] }]}><Text style={[s.timerText, { color: timerColor }]}>{timer}</Text></Animated.View>
              <TouchableOpacity style={s.pickBtn} onPress={() => { playClickSound(); setTimerPaused(true); setPhase('pick'); }}><Text style={s.pickBtnText}>I KNOW IT!</Text></TouchableOpacity>
            </>}
          </>
        )}

        {phase === 'pick' && (
          <View style={s.pickScreen}>
            <Text style={{ color: C.onSurface, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>WHICH CITY IS CLOSEST?</Text>
            <Text style={{ color: 'rgba(225,224,251,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{activePlayer.name}, choose the city nearest to the shown location</Text>
            <ScrollView style={{ flex: 1, width: '100%' }}>
              {tableCities.map((tc, i) => (
                <TouchableOpacity key={i} style={[s.pickOption, i % 2 === 0 ? { backgroundColor: C.surfaceLow } : { backgroundColor: C.surface }]} onPress={() => pickCity(i)}>
                  <Text style={{ color: C.primary, fontSize: 18, marginRight: 14 }}>{tc.isPlayerCity ? '◉' : '◈'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.onSurface, fontSize: 18, fontWeight: '600' }}>{tc.city}</Text>
                    {tc.isPlayerCity && tc.ownerPlayerId !== null && <Text style={{ color: 'rgba(225,224,251,0.4)', fontSize: 12 }}>{players.find(pp => pp.id === tc.ownerPlayerId)?.name}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {phase === 'result' && closestCityIdx !== null && (
          <View style={s.resultOverlay}>
            <Animated.View style={[s.resultCard, { transform: [{ scale: resultScale }] }]}>
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>{winnerId !== null && winnerId === activePlayer.id ? '🎯' : '📍'}</Text>
              <Text style={{ color: C.onSurface, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 }}>{tableCities[closestCityIdx].city} was closest!</Text>
              {tableCities.map((tc, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.surfaceLow, marginBottom: 2 }}>
                  <Text style={{ color: 'rgba(225,224,251,0.7)', fontSize: 14 }}>{tc.isPlayerCity ? '◉' : '◈'} {tc.city}</Text>
                  <Text style={{ color: C.onSurface, fontSize: 14, fontWeight: '600' }}>{formatDistance(distances[i] ?? 0)}</Text>
                </View>
              ))}
              {winnerId !== null && <Text style={{ color: C.primary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginVertical: 16 }}>⭐ {players.find(pp => pp.id === winnerId)?.name} scores!</Text>}
              <TouchableOpacity style={s.primaryBtn} onPress={nextTurn}>
                <Text style={s.primaryBtnText}>{round >= maxRounds ? 'FINAL RESULTS' : 'NEXT ROUND →'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    );
  }

  // ═══════════════ END SCREEN ═══════════════
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <View style={s.container}><StatusBar hidden />
      <ScrollView contentContainerStyle={s.endScroll}>
        <Text style={{ fontSize: 64, color: C.primary, marginBottom: 16 }}>✓</Text>
        <Text style={{ color: C.onSurface, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>EVALUATION COMPLETE</Text>
        <Text style={{ color: 'rgba(225,224,251,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 40 }}>SESSION DATA READY FOR ANALYSIS</Text>
        {sorted.map((p, i) => (
          <View key={p.id} style={[s.endRow, i % 2 === 0 ? { backgroundColor: C.surfaceLow } : { backgroundColor: C.surface }]}>
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700', width: 36 }}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.onSurface, fontSize: 18, fontWeight: '700' }}>{p.name}</Text>
              <Text style={{ color: 'rgba(225,224,251,0.4)', fontSize: 12, marginTop: 2 }}>{p.city}</Text>
            </View>
            <Text style={{ color: C.onSurface, fontSize: 28, fontWeight: '700' }}>{p.score}</Text>
          </View>
        ))}
        <TouchableOpacity style={[s.primaryBtn, { marginTop: 32, width: '100%' }]} onPress={() => {
          setPlayers(prev => prev.map(p => ({ ...p, city: '', cityId: -1, lat: 0, lng: 0, score: 0 })));
          setUsedLocations([]);
          setRound(1);
          setScreen('reshuffle');
        }}>
          <Text style={s.primaryBtnText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

// ═══════════════ RESHUFFLE ═══════════════
if (screen === 'reshuffle') {
  return (
    <View style={[s.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }]}>
      <StatusBar hidden />
      <Text style={{ color: C.green, fontSize: 40, fontWeight: '700', fontFamily: FF.bold, textAlign: 'center', marginBottom: 36, lineHeight: 48 }}>Shuffle Up.</Text>
      <Text style={{ color: C.text, fontSize: 22, fontFamily: FF.regular, textAlign: 'center', lineHeight: 38, marginBottom: 60 }}>
        Shuffle all the cards now{'\n'}including your personal cards.{'\n'}Each player picks a new card{'\n'}from the stack.
      </Text>
      <TouchableOpacity style={[s.primaryBtn, { paddingVertical: 18, paddingHorizontal: 48 }]} onPress={() => setScreen('setup')}>
        <Text style={[s.primaryBtnText, { fontSize: 18 }]}>GO!</Text>
      </TouchableOpacity>
    </View>
  );
}

}


// ═══════════════ STYLES ═══════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // Tutorial
  tutSlide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  tutEmoji: { fontSize: 80, marginBottom: 32 },
  tutTitle: { fontSize: 28, fontWeight: '700', marginBottom: 16, textAlign: 'center', letterSpacing: -0.5 },
  tutBody: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  tutDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 },
  tutDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.surfaceHighest },
  tutDotActive: { backgroundColor: C.primary, width: 24 },
  tutBtnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 48 },

  // Buttons
  primaryBtn: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  primaryBtnText: { color: C.onPrimaryContainer, fontSize: 14, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2, textTransform: 'uppercase' },
  tertiaryBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  tertiaryBtnText: { color: 'rgba(225,224,251,0.35)', fontSize: 13, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2, textTransform: 'uppercase' },

  // Setup
  setupScroll: { paddingTop: 48, paddingBottom: 80, paddingHorizontal: 24 },
  setupHeader: { color: C.primary, fontSize: 24, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32 },
  setupTitle: { color: C.onSurface, fontSize: 28, fontWeight: '700', fontFamily: FF.bold, marginBottom: 8 },
  titleBar: { width: 48, height: 4, backgroundColor: C.primary, marginBottom: 32 },
  sectionLabel: { marginBottom: 12, marginTop: 8 },
  sectionLabelText: { color: C.secondary, fontSize: 10, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 3, textTransform: 'uppercase' },

  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLow, marginBottom: 8 },
  playerInput: { flex: 1, color: C.onSurface, fontSize: 16, fontWeight: '500', fontFamily: FF.regular, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: C.surfaceLow, borderBottomWidth: 1, borderBottomColor: 'rgba(68,73,52,0.15)' },
  hashBtn: { backgroundColor: C.secondaryContainer, paddingVertical: 16, paddingHorizontal: 20, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  hashBtnDone: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 20, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  hashBtnText: { color: C.onSecondaryContainer, fontSize: 16, fontWeight: '700', fontFamily: FF.bold },
  hashBtnTextDone: { color: C.onPrimaryContainer },
  cityBadge: { color: C.primary, fontSize: 11, fontWeight: '600', fontFamily: FF.bold, letterSpacing: 1, marginLeft: 8 },
  removeBtn: { paddingVertical: 16, paddingHorizontal: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceLow, marginBottom: 8 },
  recruitBtn: { alignItems: 'center', paddingVertical: 16, marginBottom: 32 },
  recruitBtnText: { color: C.primary, fontSize: 12, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 3, textTransform: 'uppercase' },

  gridRow: { flexDirection: 'row', gap: 24, marginBottom: 48 },
  gridCol: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(68,73,52,0.3)' },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: 'rgba(225,224,251,0.5)', fontSize: 12, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2 },
  chipTextActive: { color: C.onPrimaryContainer },

  mainBtn: { backgroundColor: C.primary, paddingVertical: 20, alignItems: 'center' },
  mainBtnDisabled: { backgroundColor: C.surfaceHighest },
  mainBtnText: { color: C.onPrimaryContainer, fontSize: 15, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 3, textTransform: 'uppercase' },
  actionHint: { color: 'rgba(225,224,251,0.3)', fontSize: 10, fontFamily: FF.regular, textAlign: 'center', marginTop: 12, letterSpacing: 2, textTransform: 'uppercase' },

  // Scanner
  scanOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  scanFrame: { width: 260, height: 260, borderWidth: 3, borderColor: C.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: 20 },
  scanCloseBtn: { position: 'absolute', bottom: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 24, paddingVertical: 12 },
  scanCloseText: { color: C.onSurface, fontSize: 14, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2 },

  // Game
  gameTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 8, backgroundColor: 'rgba(17,18,37,0.85)', zIndex: 20 },
  tableList: { width: '100%', backgroundColor: C.surface, padding: 16, marginBottom: 32 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },

  timer: { position: 'absolute', top: 80, right: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(17,18,37,0.9)', borderWidth: 3, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  timerText: { fontSize: 22, fontWeight: '700', fontFamily: FF.bold },
  pickBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(17,18,37,0.9)', paddingHorizontal: 28, paddingVertical: 14, borderWidth: 1.5, borderColor: C.primary, zIndex: 20 },
  pickBtnText: { color: C.primary, fontSize: 16, fontWeight: '700', fontFamily: FF.bold, letterSpacing: 2 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 5 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 10, paddingHorizontal: 32 },

  pickScreen: { flex: 1, backgroundColor: C.bg, paddingTop: 60, paddingHorizontal: 20 },
  pickOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 4 },

  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,18,37,0.95)', zIndex: 40, justifyContent: 'center', paddingHorizontal: 20 },
  resultCard: { backgroundColor: C.surface, padding: 24 },

  // End screen
  endScroll: { paddingTop: 60, paddingBottom: 80, paddingHorizontal: 24, alignItems: 'center' },
  endRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 18, paddingHorizontal: 16, marginBottom: 2 },
});
