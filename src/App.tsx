// GeoCheckr — QR Card Game mit Multi-City Tracking
// Design System: "The Tactical Cartographer"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, Platform, KeyboardAvoidingView, StatusBar, ScrollView, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { calculateDistance, formatDistance } from './utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playAnswerphoneBeep } from './utils/sounds';
import { panoramaLocations, PanoramaLocation } from './data/panoramaLocations';

const { width, height } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

// ============================================================
// CI COLORS — "The Tactical Cartographer"
// ============================================================
const C = {
  bg: '#111225',
  surfaceLow: '#191a2d',
  surface: '#1d1e31',
  surfaceHigh: '#27283c',
  surfaceHighest: '#323348',
  primary: '#a6d700',
  primaryBright: '#c1f432',
  onPrimary: '#273500',
  onPrimaryContainer: '#445a00',
  secondary: '#bdc2ff',
  secondaryContainer: '#2734c0',
  onSecondaryContainer: '#acb3ff',
  onSurface: '#e1e0fb',
  outline: '#444934',
  outlineVariant: '#444934',
  error: '#ffb4ab',
};

// ============================================================
// TYPES
// ============================================================
interface Player {
  id: number;
  name: string;
  city: string;
  cityId: number;
  lat: number;
  lng: number;
  score: number;
}

interface TableCity {
  city: string;
  lat: number;
  lng: number;
  ownerPlayerId: number | null;
  isPlayerCity: boolean;
}

type Screen = 'tutorial' | 'setup' | 'game' | 'result';
type ScanMode = 'player-city' | 'qr-card';

// ============================================================
// STREET VIEW HTML BUILDER
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
#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#a6d700;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="pano"></div>
<div id="status"><div class="spinner"></div>Loading Street View...</div>
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
      document.getElementById('status').innerHTML='No Street View';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error:'+st);
    }
  });
}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script>
</body></html>`;
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [tutorialPage, setTutorialPage] = useState(0);
  const [tutorialSwiping, setTutorialSwiping] = useState(false);

  // Setup state
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('player-city');
  const [scanned, setScanned] = useState(false);
  const [scanningForPlayerIdx, setScanningForPlayerIdx] = useState<number | null>(null);
  const [timerSetting, setTimerSetting] = useState(15);
  const [roundsSetting, setRoundsSetting] = useState(10);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Game state
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
  const [closestCityIdx, setClosestCityIdx] = useState<number | null>(null);
  const [distances, setDistances] = useState<number[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [tieBreak, setTieBreak] = useState(false);

  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  // ============================================================
  // COMPUTED
  // ============================================================
  const allPlayersScanned = players.length >= 2 && players.every(p => p.city.length > 0);

  // ============================================================
  // TIMER
  // ============================================================
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 10 && timer > 0 && phase === 'view') {
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
      setPhase('pick');
    }
  }, [timer, phase]);

  // ============================================================
  // GAME LOGIC
  // ============================================================
  const getRandomLocation = useCallback(() => {
    const available = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    const pool = available.length > 0 ? available : panoramaLocations;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [usedLocations]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newP: Player = {
      id: Date.now(),
      name: newPlayerName.trim(),
      city: '', cityId: -1, lat: 0, lng: 0, score: 0,
    };
    setPlayers(prev => [...prev, newP]);
    setNewPlayerName('');
    playClickSound();
  };

  const removePlayer = (id: number) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const openScannerForPlayer = (playerIdx: number) => {
    setScanningForPlayerIdx(playerIdx);
    setScanMode('player-city');
    setShowScanner(true);
    setScanned(false);
  };

  const startGame = () => {
    if (!allPlayersScanned) return;
    playClickSound();
    const initialTable: TableCity[] = players.map(p => ({
      city: p.city, lat: p.lat, lng: p.lng,
      ownerPlayerId: p.id, isPlayerCity: true,
    }));
    setTableCities(initialTable);
    setRound(1);
    setMaxRounds(roundsSetting);
    setActivePlayerIdx(0);
    setUsedLocations([]);
    setPhase('scan-qr');
    setScreen('game');
  };

  const startRound = useCallback(() => {
    setPhase('scan-qr');
    setSvLoaded(false);
    setSvError(false);
    setClosestCityIdx(null);
    setDistances([]);
    setWinnerId(null);
    setTimer(timerSetting);
    setTimerPaused(false);
    resultScale.setValue(0);
  }, [timerSetting, resultScale]);

  const onQrScanned = useCallback((loc: PanoramaLocation) => {
    setLocation(loc);
    setUsedLocations(prev => [...prev, loc.id]);
    setTimer(timerSetting);
    setTimerPaused(false);
    setPhase('view');
    setShowScanner(false);
    setScanned(false);
    Vibration.vibrate(100);
  }, [timerSetting]);

  const pickCity = useCallback((pickedIdx: number) => {
    playClickSound();
    setTimerPaused(true);
    const dists = tableCities.map(tc =>
      calculateDistance(location.lat, location.lng, tc.lat, tc.lng)
    );
    setDistances(dists);
    let minIdx = 0;
    for (let i = 1; i < dists.length; i++) {
      if (dists[i] < dists[minIdx]) minIdx = i;
    }
    setClosestCityIdx(minIdx);
    const correct = pickedIdx === minIdx;
    if (correct) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); }
    else { playErrorSound(); Vibration.vibrate(500); }
    const actualWinner = tableCities[minIdx].ownerPlayerId;
    if (actualWinner !== null) {
      setPlayers(prev => prev.map(p =>
        p.id === actualWinner ? { ...p, score: p.score + 1 } : p
      ));
    }
    setWinnerId(actualWinner);
    setTableCities(prev => [...prev, {
      city: location.city, lat: location.lat, lng: location.lng,
      ownerPlayerId: null, isPlayerCity: false,
    }]);
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  }, [tableCities, location, resultScale]);

  const nextTurn = () => {
    playClickSound();
    if (round >= maxRounds) {
      // Check for tie — only start Tie Break if scores are actually tied
      const maxScore = Math.max(...players.map(p => p.score));
      const tiedPlayers = players.filter(p => p.score === maxScore);
      if (tiedPlayers.length > 1 && !tieBreak) {
        // TIE BREAK — continue until one player leads
        setTieBreak(true);
        setMaxRounds(maxRounds + 1);
        setActivePlayerIdx(prev => (prev + 1) % players.length);
        setRound(r => r + 1);
        startRound();
        return;
      }
      // No tie or tie break already active — show results
      setScreen('result');
      return;
    }
    setActivePlayerIdx(prev => (prev + 1) % players.length);
    setRound(r => r + 1);
    startRound();
  };

  // ============================================================
  // SCAN HANDLER — BLOCK QR IN SETUP, ALLOW #NUMBERS, BLOCK DUPLICATES
  // ============================================================
  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    playClickSound();
    setScanned(true);

    // BLOCK: URLs and protocols
    if (data.includes('http') || data.includes('geocheckr:') || data.includes('://')) {
      setScanned(false);
      return;
    }

    // PARSE: "#042" or "042" or "GC042"
    let id: number | null = null;
    const numMatch = data.match(/#?(\d+)/);
    if (numMatch) id = parseInt(numMatch[1], 10);

    if (id !== null && id >= 0 && id < panoramaLocations.length) {
      const loc = panoramaLocations.find(l => l.id === id);
      if (loc) {
        // CHECK DUPLICATE: Is this city already assigned to a player or on the table?
        const alreadyAssigned = players.some(p => p.cityId === id);
        const alreadyOnTable = tableCities.some(tc => {
          const tableLoc = panoramaLocations.find(l => l.city === tc.city);
          return tableLoc && tableLoc.id === id;
        });

        if (scanMode === 'player-city' && scanningForPlayerIdx !== null) {
          if (alreadyAssigned) {
            // BLOCK: City card already assigned to another player
            Vibration.vibrate(500);
            setScanned(false);
            return;
          }
          // ASSIGN CITY TO PLAYER
          setPlayers(prev => prev.map((p, i) =>
            i === scanningForPlayerIdx
              ? { ...p, city: loc.city, cityId: id!, lat: loc.lat, lng: loc.lng }
              : p
          ));
          setShowScanner(false);
          setScanned(false);
          setScanningForPlayerIdx(null);
          Vibration.vibrate(100);
          return;
        } else if (scanMode === 'qr-card') {
          if (alreadyOnTable || alreadyAssigned) {
            // BLOCK: This QR belongs to a city already in play — skip it
            Vibration.vibrate(500);
            setScanned(false);
            return;
          }
          // GAME: QR card → Street View
          onQrScanned(loc);
          return;
        }
      }
    }
    setScanned(false);
  };

  // ============================================================
  // TUTORIAL SLIDES
  // ============================================================
  const TUTORIAL_SLIDES = [
    { icon: '🌍', title: 'GEOCHECKR', sub: 'The QR Card Game' },
    { icon: '🃏', title: 'CITY CARDS', sub: 'Each player gets a city card\nplaced face-up on the table' },
    { icon: '📷', title: 'DRAW & SCAN', sub: 'Draw a QR card → see the location\nWhich table city is closest?' },
    { icon: '🏆', title: 'SCORE', sub: 'Correct guess = point\nRevealed city joins the table' },
  ];

  const onTutorialScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setTutorialPage(page);
    // Auto-advance to setup when swiping right on last slide
    if (page >= TUTORIAL_SLIDES.length - 1 && offsetX > (TUTORIAL_SLIDES.length - 1) * width + 20) {
      if (!tutorialSwiping) {
        setTutorialSwiping(true);
        setScreen('setup');
      }
    }
  };


  // ============================================================
  // SCANNER MODAL
  // ============================================================
  if (showScanner) {
    if (!cameraPermission?.granted) {
      return (
        <View style={s.container}>
          <StatusBar hidden />
          <View style={s.centerScreen}>
            <Text style={s.permText}>Camera permission required</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={requestCameraPermission}>
              <Text style={s.primaryBtnText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tertiaryBtn} onPress={() => { setShowScanner(false); setScanned(false); }}>
              <Text style={s.tertiaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : ({ data }) => handleScan({ data })}
          barcodeScannerSettings={{
            barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'qr'],
          }}
        >
          <View style={s.scanOverlay}>
            <View style={s.scanFrame}>
              <Text style={s.scanTitle}>
                {scanMode === 'player-city' ? 'SCAN CITY CARD' : 'SCAN QR CARD'}
              </Text>
              <Text style={s.scanSub}>
                {scanMode === 'player-city'
                  ? 'Barcode, QR code, or enter number manually'
                  : 'Hold the QR card in frame to load Street View'}
              </Text>
            </View>
            {/* Enter Code Backup */}
            <TouchableOpacity
              style={s.enterCodeBtn}
              onPress={() => setShowManualInput(true)}
            >
              <Text style={s.enterCodeBtnText}>ENTER CODE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.scanClose} onPress={() => { setShowScanner(false); setScanned(false); }}>
              <Text style={s.scanCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // ============================================================
  // MANUAL CODE INPUT — Backup when camera fails
  // ============================================================
  if (showManualInput) {
    const submitManualCode = () => {
      const trimmed = manualCode.trim();
      if (!trimmed) return;
      handleScan({ data: trimmed });
      setShowManualInput(false);
      setManualCode('');
    };
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.centerScreen}>
          <Text style={[s.phaseTitle, { marginBottom: 8 }]}>ENTER CODE</Text>
          <Text style={[s.phaseSub, { marginBottom: 32 }]}>
            Type the number from your city card (e.g. 42 or #42)
          </Text>
          <TextInput
            style={[s.playerInput, { width: '100%', maxWidth: 300, textAlign: 'center', fontSize: 24, marginBottom: 24 }]}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="#042"
            placeholderTextColor="rgba(225,224,251,0.3)"
            keyboardType="number-pad"
            autoFocus
            onSubmitEditing={submitManualCode}
            returnKeyType="done"
          />
          <TouchableOpacity style={[s.primaryBtn, { width: '100%', maxWidth: 300 }]} onPress={submitManualCode}>
            <Text style={s.primaryBtnText}>CONFIRM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tertiaryBtn} onPress={() => { setShowManualInput(false); setManualCode(''); }}>
            <Text style={s.tertiaryBtnText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // TUTORIAL — 4 slides, swipe right on last = setup
  // ============================================================
  if (screen === 'tutorial') {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onTutorialScroll}
          onScrollEndDrag={onTutorialScroll}
          scrollEventThrottle={16}
          overScrollMode="always"
          bounces={true}
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
          <TouchableOpacity style={s.tertiaryBtn} onPress={() => setScreen('setup')}>
            <Text style={s.tertiaryBtnText}>SKIP</Text>
          </TouchableOpacity>
          {tutorialPage < TUTORIAL_SLIDES.length - 1 ? (
            <TouchableOpacity style={s.secondaryBtn} onPress={() => {
              scrollRef.current?.scrollTo({ x: (tutorialPage + 1) * width, animated: true });
              setTutorialPage(tutorialPage + 1);
            }}>
              <Text style={s.secondaryBtnText}>NEXT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={() => setScreen('setup')}>
              <Text style={s.primaryBtnText}>LET'S GO</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ============================================================
  // SETUP — Timo's HTML Design in React Native
  // ============================================================
  if (screen === 'setup') {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <ScrollView contentContainerStyle={s.setupScroll} keyboardShouldPersistTaps="handled">
          {/* HEADER */}
          <Text style={s.setupHeader}>GEOCHECKR</Text>

          {/* SETUP SESSION */}
          <View style={s.setupSection}>
            <Text style={s.setupTitle}>SETUP SESSION</Text>
            <View style={s.titleBar} />
          </View>

          {/* PLAYER MANAGEMENT */}
          <View style={s.sectionLabel}>
            <Text style={s.sectionLabelText}>PLAYER MANAGEMENT</Text>
          </View>

          {players.map((p, i) => (
            <View key={p.id} style={s.playerRow}>
              <View style={s.playerInputWrapper}>
                <TextInput
                  style={s.playerInput}
                  value={p.name}
                  onChangeText={(text) => setPlayers(prev => prev.map((pp, idx) => idx === i ? { ...pp, name: text } : pp))}
                  placeholder="Player name..."
                  placeholderTextColor="rgba(225,224,251,0.3)"
                />
                {players.length > 1 && (
                  <TouchableOpacity
                    style={s.clearBtn}
                    onPress={() => removePlayer(p.id)}
                  >
                    <Text style={s.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[s.scanBtn, p.city.length > 0 && s.scanBtnDone]}
                onPress={() => openScannerForPlayer(i)}
              >
                <Text style={[s.scanBtnIcon, p.city.length > 0 && s.scanBtnIconDone]}>
                  {p.city.length > 0 ? '✓' : '#'}
                </Text>
              </TouchableOpacity>
              {p.city.length > 0 && (
                <Text style={s.cityLabel}>{p.city}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity style={s.recruitBtn} onPress={addPlayer}>
            <Text style={s.recruitBtnText}>+ RECRUIT</Text>
          </TouchableOpacity>

          {players.length === 0 && (
            <View style={s.nameRow}>
              <TextInput
                style={s.playerInput}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder="Enter name and press + RECRUIT"
                placeholderTextColor="rgba(225,224,251,0.3)"
                onSubmitEditing={addPlayer}
                returnKeyType="done"
              />
            </View>
          )}

          {players.length > 0 && (
            <View style={s.nameRow}>
              <TextInput
                style={s.playerInput}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder="Next player name..."
                placeholderTextColor="rgba(225,224,251,0.3)"
                onSubmitEditing={addPlayer}
                returnKeyType="done"
              />
            </View>
          )}

          {/* TIMER & ROUNDS */}
          <View style={s.gridRow}>
            <View style={s.gridCol}>
              <View style={s.sectionLabel}>
                <Text style={s.sectionLabelText}>TIMER</Text>
              </View>
              <View style={s.chipRow}>
                {[5, 15, 30].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.chip, timerSetting === t && s.chipActive]}
                    onPress={() => setTimerSetting(t)}
                  >
                    <Text style={[s.chipText, timerSetting === t && s.chipTextActive]}>{t}s</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.gridCol}>
              <View style={s.sectionLabel}>
                <Text style={s.sectionLabelText}>ROUNDS</Text>
              </View>
              <View style={s.chipRow}>
                {[5, 10, 15].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s.chip, roundsSetting === r && s.chipActive]}
                    onPress={() => setRoundsSetting(r)}
                  >
                    <Text style={[s.chipText, roundsSetting === r && s.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* MAIN ACTION BUTTON */}
          <View style={s.actionSection}>
            <TouchableOpacity
              style={[s.mainBtn, !allPlayersScanned && s.mainBtnDisabled]}
              disabled={!allPlayersScanned}
              onPress={startGame}
            >
              <Text style={s.mainBtnText}>
                {allPlayersScanned ? 'ALL SET, LET\'S GO!' : 'SCAN ALL CARDS FIRST'}
              </Text>
            </TouchableOpacity>
            <Text style={s.actionHint}>
              {allPlayersScanned
                ? `${players.length} players ready`
                : `Scan city cards for all players`}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }


  // ============================================================
  // GAME SCREEN
  // ============================================================
  if (screen === 'game') {
    const activePlayer = players[activePlayerIdx];
    const timerColor = timer <= 10 ? C.error : C.primary;

    return (
      <View style={s.container}>
        <StatusBar hidden />

        {/* TOP BAR */}
        <View style={s.gameTopBar}>
          <Text style={s.gameActivePlayer}>{activePlayer.name}</Text>
          <Text style={s.gameRound}>R{round}/{maxRounds}</Text>
        </View>

        {/* PHASE: SCAN QR */}
        {phase === 'scan-qr' && (
          <View style={s.centerScreen}>
            <Text style={s.phaseEmoji}>📷</Text>
            <Text style={s.phaseTitle}>{activePlayer.name}, draw a QR card!</Text>
            <Text style={s.phaseSub}>Scan the QR card to reveal the location</Text>

            {/* TABLE CITIES */}
            <View style={s.tableList}>
              <Text style={s.tableListTitle}>CITIES ON TABLE</Text>
              {tableCities.map((tc, i) => (
                <View key={i} style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
                  <Text style={s.tableDot}>{tc.isPlayerCity ? '◉' : '◈'}</Text>
                  <Text style={s.tableName}>{tc.city}</Text>
                  {tc.isPlayerCity && (
                    <Text style={s.tableOwner}>
                      — {players.find(p => p.id === tc.ownerPlayerId)?.name}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={() => {
              setScanMode('qr-card');
              setShowScanner(true);
              setScanned(false);
            }}>
              <Text style={s.primaryBtnText}>SCAN QR CARD</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PHASE: VIEW STREET VIEW */}
        {phase === 'view' && (
          <>
            <WebView
              key={`${location.lat}-${location.lng}`}
              source={{ html: buildStreetViewHtml(location.lat, location.lng) }}
              style={{ flex: 1 }}
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

            {!svLoaded && !svError && (
              <View style={s.loadingOverlay}>
                <Text style={s.loadingText}>Loading Street View...</Text>
              </View>
            )}

            {svError && (
              <View style={s.errorOverlay}>
                <Text style={s.errorText}>No Street View available</Text>
                <TouchableOpacity style={s.primaryBtn} onPress={nextTurn}>
                  <Text style={s.primaryBtnText}>SKIP →</Text>
                </TouchableOpacity>
              </View>
            )}

            {svLoaded && (
              <>
                <Animated.View style={[s.timer, { borderColor: timerColor, transform: [{ scale: timerPulse }] }]}>
                  <Text style={[s.timerText, { color: timerColor }]}>{timer}</Text>
                </Animated.View>
                <TouchableOpacity style={s.pickBtn} onPress={() => {
                  playClickSound();
                  setTimerPaused(true);
                  setPhase('pick');
                }}>
                  <Text style={s.pickBtnText}>I KNOW IT!</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* PHASE: PICK CLOSEST CITY */}
        {phase === 'pick' && (
          <View style={s.pickScreen}>
            <Text style={s.pickTitle}>WHICH CITY IS CLOSEST?</Text>
            <Text style={s.pickSub}>{activePlayer.name}, choose the city nearest to the shown location</Text>
            <ScrollView style={{ flex: 1, width: '100%' }}>
              {tableCities.map((tc, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.pickOption, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}
                  onPress={() => pickCity(i)}
                >
                  <Text style={s.pickOptionDot}>{tc.isPlayerCity ? '◉' : '◈'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickOptionName}>{tc.city}</Text>
                    {tc.isPlayerCity && tc.ownerPlayerId !== null && (
                      <Text style={s.pickOptionOwner}>
                        {players.find(p => p.id === tc.ownerPlayerId)?.name}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* PHASE: RESULT */}
        {phase === 'result' && closestCityIdx !== null && (
          <View style={s.resultOverlay}>
            <Animated.View style={[s.resultCard, { transform: [{ scale: resultScale }] }]}>
              <Text style={s.resultEmoji}>
                {winnerId !== null && winnerId === activePlayer.id ? '🎯' : '📍'}
              </Text>
              <Text style={s.resultTitle}>
                {tableCities[closestCityIdx].city} was closest!
              </Text>

              {tableCities.map((tc, i) => (
                <View key={i} style={s.resultRow}>
                  <Text style={s.resultLabel}>
                    {tc.isPlayerCity ? '◉' : '◈'} {tc.city}
                  </Text>
                  <Text style={s.resultValue}>{formatDistance(distances[i] ?? 0)}</Text>
                </View>
              ))}

              {winnerId !== null && (
                <Text style={s.resultWinner}>
                  ⭐ {players.find(p => p.id === winnerId)?.name} scores!
                </Text>
              )}

              <TouchableOpacity style={s.primaryBtn} onPress={nextTurn}>
                <Text style={s.primaryBtnText}>
                  {round >= maxRounds ? 'FINAL RESULTS' : 'NEXT ROUND →'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    );
  }

  // ============================================================
  // END SCREEN — Win / Loss / Tie
  // ============================================================
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const maxScore = sortedPlayers.length > 0 ? sortedPlayers[0].score : 0;
  const minScore = sortedPlayers.length > 0 ? sortedPlayers[sortedPlayers.length - 1].score : 0;

  const getPlayerResult = (score: number, rank: number) => {
    if (score === maxScore) return { label: 'GEWONNEN', color: C.primary };
    if (score === minScore) return { label: 'VERLOREN', color: C.error };
    return { label: 'UNENTSCHIEDEN', color: C.secondary };
  };

  return (
    <View style={s.container}>
      <StatusBar hidden />
      <ScrollView contentContainerStyle={s.endScroll}>
        <Text style={s.endCheck}>✓</Text>
        <Text style={s.endTitle}>EVALUATION COMPLETE</Text>
        <Text style={s.endSub}>SESSION DATA READY FOR ANALYSIS</Text>

        {sortedPlayers.map((p, i) => {
          const result = getPlayerResult(p.score, i);
          return (
            <View key={p.id} style={[s.endPlayerRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
              <Text style={s.endRank}>
                {i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : `#${i + 1}`}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={s.endPlayerName}>{p.name}</Text>
                <Text style={s.endPlayerCity}>{p.city}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.endPlayerScore}>{p.score}</Text>
                <Text style={[s.endResultLabel, { color: result.color }]}>{result.label}</Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={s.primaryBtn} onPress={() => {
          // Play Again: keep names, reset cities
          setPlayers(prev => prev.map(p => ({
            ...p,
            city: '',
            cityId: -1,
            lat: 0,
            lng: 0,
            score: 0,
          })));
          setTableCities([]);
          setTieBreak(false);
          setScreen('setup');
        }}>
          <Text style={s.primaryBtnText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}


// ============================================================
// STYLES — "The Tactical Cartographer" Design System
// No borders. Tonal layering. Space Grotesk only.
// ============================================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ---- CENTER SCREEN (generic) ----
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // ---- TUTORIAL ----
  tutSlide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  tutIcon: { fontSize: 80, marginBottom: 32 },
  tutTitle: { color: C.onSurface, fontSize: 32, fontWeight: '700', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  tutSub: { color: 'rgba(225,224,251,0.6)', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  tutDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 },
  tutDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.surfaceHighest },
  tutDotActive: { backgroundColor: C.primary, width: 24 },
  tutBtnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 48 },

  // ---- BUTTONS (Design System) ----
  // Primary: #a6d700 bg, #445a00 text
  primaryBtn: { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  primaryBtnText: { color: C.onPrimaryContainer, fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  // Secondary: #2734c0 bg, #acb3ff text
  secondaryBtn: { backgroundColor: C.secondaryContainer, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  secondaryBtnText: { color: C.onSecondaryContainer, fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  // Tertiary: no bg, green text
  tertiaryBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  tertiaryBtnText: { color: C.primary, fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  // ---- SETUP SCREEN ----
  setupScroll: { paddingTop: 48, paddingBottom: 80, paddingHorizontal: 24 },
  setupHeader: {
    color: C.primary, fontSize: 24, fontWeight: '700', letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 32,
  },
  setupSection: { marginBottom: 32 },
  setupTitle: {
    color: C.onSurface, fontSize: 28, fontWeight: '700', letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleBar: { width: 48, height: 4, backgroundColor: C.primary },

  // Section labels
  sectionLabel: { marginBottom: 12, marginTop: 8 },
  sectionLabelText: {
    color: C.secondary, fontSize: 10, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },

  // Player rows
  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceLow, marginBottom: 8,
    gap: 0,
  },
  playerInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceLow, position: 'relative',
  },
  playerInput: {
    flex: 1, color: C.onSurface, fontSize: 16, fontWeight: '500',
    paddingVertical: 16, paddingHorizontal: 16,
    paddingRight: 36,
    backgroundColor: C.surfaceLow,
    borderBottomWidth: 1, borderBottomColor: 'rgba(68,73,52,0.15)',
  },
  clearBtn: {
    position: 'absolute', right: 8, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    width: 28, height: '100%',
  },
  clearBtnText: { color: C.outline, fontSize: 14, fontWeight: '600' },
  scanBtn: {
    backgroundColor: C.secondaryContainer, paddingVertical: 16, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnDone: { backgroundColor: C.primary },
  scanBtnIcon: { color: C.onSecondaryContainer, fontSize: 16, fontWeight: '700' },
  scanBtnIconDone: { color: C.onPrimaryContainer },
  removeBtn: {
    paddingVertical: 16, paddingHorizontal: 12,
    backgroundColor: C.surfaceLow,
  },
  removeBtnText: { color: C.error, fontSize: 14, fontWeight: '700' },
  removeBtnDisabled: { opacity: 0.2 },
  removeBtnTextDisabled: { color: C.outline },
  cityLabel: {
    position: 'absolute', right: 80, top: 18,
    color: C.primary, fontSize: 11, fontWeight: '600', letterSpacing: 1,
  },

  // Name input row (for adding new players)
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceLow, marginBottom: 8,
  },

  // Recruit button
  recruitBtn: {
    alignItems: 'center', paddingVertical: 16, marginBottom: 32,
  },
  recruitBtnText: {
    color: C.primary, fontSize: 12, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },

  // Timer & Rounds grid
  gridRow: { flexDirection: 'row', gap: 24, marginBottom: 48 },
  gridCol: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(68,73,52,0.3)',
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: 'rgba(225,224,251,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  chipTextActive: { color: C.onPrimaryContainer },

  // Main action button
  actionSection: { marginTop: 16 },
  mainBtn: {
    backgroundColor: C.primary, paddingVertical: 20, alignItems: 'center',
  },
  mainBtnDisabled: { backgroundColor: C.surfaceHighest },
  mainBtnText: {
    color: C.onPrimaryContainer, fontSize: 15, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  actionHint: {
    color: 'rgba(225,224,251,0.3)', fontSize: 10, textAlign: 'center',
    marginTop: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500',
  },

  // ---- GAME SCREEN ----
  gameTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 44, paddingBottom: 8,
    backgroundColor: 'rgba(17,18,37,0.85)', zIndex: 20,
  },
  gameActivePlayer: {
    color: C.primary, fontSize: 14, fontWeight: '700', letterSpacing: 1,
  },
  gameRound: {
    color: C.onSurface, fontSize: 12, fontWeight: '500', letterSpacing: 1,
    backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 4,
  },

  // Phase screens
  phaseEmoji: { fontSize: 64, marginBottom: 24 },
  phaseTitle: { color: C.onSurface, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8, letterSpacing: -0.3 },
  phaseSub: { color: 'rgba(225,224,251,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 32 },

  // Table list
  tableList: { width: '100%', backgroundColor: C.surface, padding: 16, marginBottom: 32 },
  tableListTitle: { color: C.secondary, fontSize: 10, fontWeight: '700', letterSpacing: 3, marginBottom: 12 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  tableRowEven: { backgroundColor: C.surfaceLow },
  tableRowOdd: { backgroundColor: C.surface },
  tableDot: { color: C.primary, fontSize: 14, marginRight: 10 },
  tableName: { color: C.onSurface, fontSize: 15, fontWeight: '600' },
  tableOwner: { color: 'rgba(225,224,251,0.4)', fontSize: 12, marginLeft: 8 },

  // Timer
  timer: {
    position: 'absolute', top: 80, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(17,18,37,0.9)', borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  timerText: { fontSize: 22, fontWeight: '700' },

  // Pick button
  pickBtn: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: 'rgba(17,18,37,0.9)', paddingHorizontal: 28, paddingVertical: 14,
    borderWidth: 1.5, borderColor: C.primary, zIndex: 20,
  },
  pickBtnText: { color: C.primary, fontSize: 16, fontWeight: '700', letterSpacing: 2 },

  // Loading / Error overlays
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 5 },
  loadingText: { color: 'rgba(225,224,251,0.5)', fontSize: 14, letterSpacing: 1 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, zIndex: 10, paddingHorizontal: 32 },
  errorText: { color: C.error, fontSize: 16, fontWeight: '600', marginBottom: 20 },

  // Pick screen
  pickScreen: { flex: 1, backgroundColor: C.bg, paddingTop: 60, paddingHorizontal: 20 },
  pickTitle: { color: C.onSurface, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4, letterSpacing: -0.3 },
  pickSub: { color: 'rgba(225,224,251,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  pickOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, marginBottom: 4,
  },
  pickOptionDot: { color: C.primary, fontSize: 18, marginRight: 14 },
  pickOptionName: { color: C.onSurface, fontSize: 18, fontWeight: '600' },
  pickOptionOwner: { color: 'rgba(225,224,251,0.4)', fontSize: 12, marginTop: 2 },

  // Result overlay
  resultOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,18,37,0.95)',
    zIndex: 40, justifyContent: 'center', paddingHorizontal: 20,
  },
  resultCard: { backgroundColor: C.surface, padding: 24 },
  resultEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  resultTitle: { color: C.onSurface, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.surfaceLow, marginBottom: 2,
  },
  resultLabel: { color: 'rgba(225,224,251,0.7)', fontSize: 14, fontWeight: '500' },
  resultValue: { color: C.onSurface, fontSize: 14, fontWeight: '600' },
  resultWinner: { color: C.primary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginVertical: 16 },

  // ---- END SCREEN — "EVALUATION COMPLETE" ----
  endScroll: { paddingTop: 60, paddingBottom: 80, paddingHorizontal: 24, alignItems: 'center' },
  endCheck: {
    fontSize: 64, color: C.primary, marginBottom: 16,
    width: 80, height: 80, textAlign: 'center', lineHeight: 80,
  },
  endTitle: {
    color: C.onSurface, fontSize: 28, fontWeight: '700',
    textAlign: 'center', marginBottom: 4, letterSpacing: -0.5,
  },
  endSub: {
    color: 'rgba(225,224,251,0.4)', fontSize: 11, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center',
    marginBottom: 40,
  },
  endPlayerRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingVertical: 18, paddingHorizontal: 16,
    marginBottom: 2,
  },
  endRank: {
    color: C.primary, fontSize: 14, fontWeight: '700',
    width: 36, letterSpacing: 1,
  },
  endPlayerName: { color: C.onSurface, fontSize: 18, fontWeight: '700' },
  endPlayerCity: { color: 'rgba(225,224,251,0.4)', fontSize: 12, marginTop: 2, letterSpacing: 1 },
  endPlayerScore: { color: C.onSurface, fontSize: 28, fontWeight: '700' },
  endResultLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },

  // ---- SCANNER ----
  permText: { color: C.onSurface, fontSize: 18, marginBottom: 20, textAlign: 'center' },
  scanOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100 },
  scanFrame: { width: 280, height: 200, borderWidth: 2, borderColor: C.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  scanTitle: { color: C.onSurface, fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 2 },
  scanSub: { color: 'rgba(225,224,251,0.6)', fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  scanClose: { position: 'absolute', bottom: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 24, paddingVertical: 12 },
  scanCloseText: { color: C.onSurface, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});
