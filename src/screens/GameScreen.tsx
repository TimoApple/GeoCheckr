// GeoCheckr — Game Screen v2
// Fixed: round system, panorama display, distance calc, layout, summary

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { panoramaLocations, PanoramaLocation } from '../data/panoramaLocations';
import { calculateDistance, calculatePoints, formatDistance } from '../utils/distance';
import StreetViewImage from '../components/StreetViewImage';
import VoiceInput from '../components/VoiceInput';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playSkipSound, playTimerWarning, playScanSound, playTimerTick, playAnswerphoneBeep, setAudioWebViewRef, onAudioReady, AUDIO_HTML } from '../utils/sounds';

interface Player {
  id: number;
  name: string;
}

interface GameParams {
  players: Player[];
  difficulty: string;
  targetScore: number;
  rounds: number;
}

export default function GameScreen({ route, navigation }: any) {
  const params: GameParams = route.params || {
    players: [{ id: 1, name: 'Spieler 1' }, { id: 2, name: 'Spieler 2' }],
    difficulty: 'mittel',
    targetScore: 10,
    rounds: 10,
  };

  const { players, difficulty, targetScore, rounds: maxRounds } = params;
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(players.map((p: Player) => [p.id, 0]))
  );
  // Timer: leicht/mittel = 30s, schwer = 20s
  // Difficulty = Image difficulty, not timer
  const timerByDifficulty: Record<string, number> = { leicht: 30, mittel: 30, schwer: 20 };
  const initialTimer = timerByDifficulty[difficulty] || 30;
  const [timer, setTimer] = useState(initialTimer);
  const [countdownPaused, setCountdownPaused] = useState(false);
  const [phase, setPhase] = useState<'scan' | 'view' | 'answer' | 'result' | 'summary'>('scan');
  const [distance, setDistance] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [round, setRound] = useState(1); // Startet bei Runde 1
  const [turnInRound, setTurnInRound] = useState(0); // Zähler für Spieler in aktueller Runde
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [roundHistory, setRoundHistory] = useState<Array<{round: number, playerId: number, location: string, distance: number, points: number}>>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const headerSlide = useRef(new Animated.Value(0)).current; // 0 = visible, -100 = hidden
  const [headerHidden, setHeaderHidden] = useState(false);
  const audioWebViewRef = useRef<WebView>(null);

  // Auto-hide header during view phase
  useEffect(() => {
    if (phase === 'view') {
      // Slide header up after 2 seconds
      const timeout = setTimeout(() => {
        Animated.timing(headerSlide, { toValue: -100, duration: 300, useNativeDriver: true }).start();
        setHeaderHidden(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      // Show header again
      Animated.timing(headerSlide, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setHeaderHidden(false);
    }
  }, [phase]);

  useEffect(() => {
    if (audioWebViewRef.current) {
      setAudioWebViewRef(audioWebViewRef.current);
    }
  }, []);

  const currentPlayer = players[currentPlayerIndex];

  // Timer countdown
  useEffect(() => {
    if (phase === 'view' && timer > 0 && !countdownPaused) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0 && phase === 'view') {
      playTimerWarning();
      Vibration.vibrate(500);
      setPhase('answer');
      // BEEEEEP like Anrufbeantworter
      setTimeout(() => playAnswerphoneBeep(), 100);
    }
  }, [phase, timer, countdownPaused]);

  // Timer pulse
  useEffect(() => {
    if (phase === 'view' && timer <= 5 && timer > 0) {
      playTimerTick();
      Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [timer, phase]);

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 200);
  };

  const getRandomLocation = () => {
    const available = panoramaLocations.filter(loc => !usedLocations.includes(loc.id));
    if (available.length === 0) {
      setUsedLocations([]);
      return panoramaLocations[Math.floor(Math.random() * panoramaLocations.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const simulateScan = () => {
    playScanSound();
    const randomLoc = getRandomLocation();
    setUsedLocations(prev => [...prev, randomLoc.id]);
    setCountdownPaused(false);
    animateTransition(() => {
      setCurrentLocation(randomLoc);
      setTimer(initialTimer);
      setPhase('view');
    });
  };

  const submitAnswer = (cityName: string) => {
    // ALWAYS calculate distance using Haversine
    // Match answer to a location in the database
    let dist = 20000; // Default: max Earth distance (~20000 km half globe)
    
    if (cityName.trim()) {
      // Try to find matching city in panorama locations first, then all locations
      const allLocs = require('../data/locations_complete').default;
      const normalized = cityName.toLowerCase().trim()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
      
      let match = allLocs.find((l: any) => l.city.toLowerCase() === normalized);
      if (!match) match = allLocs.find((l: any) => l.city.toLowerCase().includes(normalized) || normalized.includes(l.city.toLowerCase()));
      
      if (match) {
        dist = calculateDistance(currentLocation.lat, currentLocation.lng, match.lat, match.lng);
      } else {
        // No match found - use max distance (player gets 0 points)
        dist = 20000;
      }
    }
    
    const pts = calculatePoints(dist);
    
    // Time bonus ONLY for "schwer" difficulty: faster = +1 point
    const timeBonus = (difficulty === 'schwer' && timer > 10 && pts > 0) ? 1 : 0;
    const totalPts = pts + timeBonus;

    Animated.spring(resultScaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();

    if (totalPts >= 3) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); }
    else if (totalPts > 0) { playSuccessSound(); Vibration.vibrate([100, 50, 100]); }
    else { playErrorSound(); Vibration.vibrate(500); }

    setDistance(dist);
    setPoints(totalPts);
    setScores(prev => ({ ...prev, [currentPlayer.id]: prev[currentPlayer.id] + totalPts }));

    // Track history
    setRoundHistory(prev => [...prev, {
      round, playerId: currentPlayer.id, location: currentLocation.city, distance: dist, points: totalPts
    }]);

    setPhase('result');
  };

  const nextTurn = () => {
    playClickSound();
    resultScaleAnim.setValue(0);

    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newTurnInRound = turnInRound + 1;

    // Check if round is complete (all players played)
    if (nextPlayerIndex === 0) {
      // Round complete!
      if (round >= maxRounds) {
        // Game over → Summary
        setPhase('summary');
        return;
      }
      setRound(r => r + 1);
      setTurnInRound(0);
    } else {
      setTurnInRound(newTurnInRound);
    }

    animateTransition(() => {
      setCurrentPlayerIndex(nextPlayerIndex);
      setPhase('scan');
    });
  };

  const newCard = () => {
    playScanSound();
    resultScaleAnim.setValue(0);
    const randomLoc = getRandomLocation();
    setUsedLocations(prev => [...prev, randomLoc.id]);
    setCountdownPaused(false);
    animateTransition(() => {
      setCurrentLocation(randomLoc);
      setTimer(initialTimer);
      setPhase('view');
    });
  };

  const getTimerColor = () => {
    if (timer <= 5) return '#ff4444';
    if (timer <= 10) return '#ffaa00';
    return '#e94560';
  };

  // Get sorted leaderboard
  const getLeaderboard = () => {
    return [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  };

  const restartGame = () => {
    setScores(Object.fromEntries(players.map((p: Player) => [p.id, 0])));
    setRound(1);
    setTurnInRound(0);
    setCurrentPlayerIndex(0);
    setUsedLocations([]);
    setRoundHistory([]);
    setPhase('scan');
  };

  return (
    <View style={styles.container}>
      {/* Hidden Audio WebView */}
      <WebView
        ref={audioWebViewRef}
        source={{ html: AUDIO_HTML }}
        style={{ width: 60, height: 60, position: 'absolute', opacity: 0.01 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(e) => { if (e.nativeEvent.data === 'ready') onAudioReady(); }}
        onError={() => {}}
        onLoadEnd={() => {
          // Initialize audio context on load
          audioWebViewRef.current?.injectJavaScript(`
            if (typeof ensureCtx === 'function') ensureCtx();
            true;
          `);
        }}
      />

      {/* Header - Auto-hides during view phase */}
      {phase !== 'summary' && (
        <Animated.View style={[styles.header, { transform: [{ translateY: headerSlide }] }]}>
          <TouchableOpacity 
            style={styles.headerLeft} 
            onPress={() => {
              // Tap to show header when hidden
              if (headerHidden) {
                Animated.timing(headerSlide, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                setHeaderHidden(false);
              }
            }}
          >
            <Text style={styles.playerName}>{currentPlayer.name}</Text>
            <Text style={styles.playerTurn}>ist dran</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.roundText}>Runde {round}/{maxRounds}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.difficultyBadge}>
              {difficulty === 'leicht' ? '😊' : difficulty === 'mittel' ? '🤔' : '🔥'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Scoreboard */}
      {phase !== 'summary' && (
        <View style={styles.scoreboard}>
          {players.map((p: Player) => (
            <View key={p.id} style={[styles.scoreItem, p.id === currentPlayer.id && styles.activeScore]}>
              <Text style={styles.scoreName}>{p.name}</Text>
              <Text style={styles.scoreValue}>{scores[p.id]}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Main Content */}
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>

        {/* SCAN PHASE */}
        {phase === 'scan' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={styles.phaseTitle}>QR-Code scannen</Text>
            <Text style={styles.phaseText}>Scanne den QR-Code oder tippe unten</Text>
            <TouchableOpacity style={styles.scanButton} onPress={simulateScan} activeOpacity={0.8}>
              <Text style={styles.scanButtonText}>📍 Location laden</Text>
            </TouchableOpacity>
            <Text style={styles.scanHint}>{panoramaLocations.length - usedLocations.length} von {panoramaLocations.length} Locations</Text>
          </View>
        )}

        {/* VIEW PHASE */}
        {phase === 'view' && (
          <View style={styles.viewPhaseContainer}>
            <View style={styles.fullscreenImageContainer}>
              <StreetViewImage location={currentLocation} showInfo={false} />
              {/* Timer oben rechts */}
              <View style={styles.countdownOverlay}>
                <Animated.Text style={[styles.countdownTimer, { color: getTimerColor(), transform: [{ scale: timerPulse }] }]}>
                  {timer}
                </Animated.Text>
              </View>
              {/* Skip Button unten */}
              <TouchableOpacity style={styles.skipTimerButton} onPress={() => {
                playClickSound();
                setCountdownPaused(true);
                setPhase('answer');
                playAnswerphoneBeep();
              }}>
                <Text style={styles.skipTimerText}>Ich weiß es! →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ANSWER PHASE - NO SCROLL, everything visible */}
        {phase === 'answer' && (
          <View style={styles.answerPhaseContainer}>
            <Text style={styles.answerIcon}>🎤</Text>
            <Text style={styles.phaseTitle}>Deine Antwort</Text>
            <Text style={styles.phaseText}>Nenne die Stadt</Text>
            <View style={styles.answerInputArea}>
              <VoiceInput onSubmit={submitAnswer} placeholder="Stadtname..." />
            </View>
            <TouchableOpacity style={styles.skipAnswerButton} onPress={() => { playSkipSound(); submitAnswer(''); }}>
              <Text style={styles.skipAnswerText}>Überspringen →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <Animated.View style={[styles.phaseContainer, { transform: [{ scale: resultScaleAnim }] }]}>
            <Text style={styles.resultIcon}>{points >= 3 ? '🎯' : points >= 1 ? '👍' : '😅'}</Text>
            <Text style={[styles.resultTitle, points > 0 ? styles.resultCorrect : styles.resultWrong]}>
              {points >= 3 ? 'Perfekt!' : points >= 2 ? 'Gut!' : points >= 1 ? 'Nicht schlecht!' : 'Daneben!'}
            </Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📍 Ort</Text>
                <Text style={styles.resultValue}>{currentLocation.city}, {currentLocation.country}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📏 Distanz</Text>
                <Text style={styles.resultValue}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>⭐ Punkte</Text>
                <Text style={[styles.resultValue, styles.pointsHighlight]}>+{points}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={nextTurn} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>
                {players[(currentPlayerIndex + 1) % players.length].name} ist dran →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newCardButton} onPress={newCard} activeOpacity={0.8}>
              <Text style={styles.newCardButtonText}>🔄 Neue Karte</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* SUMMARY PHASE (after all rounds) */}
        {phase === 'summary' && (
          <ScrollView style={styles.summaryContainer} contentContainerStyle={styles.summaryContent}>
            <Text style={styles.summaryTitle}>🏆 Spiel beendet!</Text>
            <Text style={styles.summarySubtitle}>Nach {maxRounds} Runden</Text>

            {/* Leaderboard */}
            {getLeaderboard().map((p, i) => (
              <View key={p.id} style={[styles.leaderboardItem, i === 0 && styles.leaderboardFirst]}>
                <Text style={styles.leaderboardRank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </Text>
                <Text style={styles.leaderboardName}>{p.name}</Text>
                <Text style={styles.leaderboardScore}>{scores[p.id]} ⭐</Text>
              </View>
            ))}

            {/* Round History */}
            <Text style={styles.historyTitle}>📊 Runden-Übersicht</Text>
            {roundHistory.map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyRound}>R{h.round}</Text>
                <Text style={styles.historyPlayer}>{players.find(p => p.id === h.playerId)?.name}</Text>
                <Text style={styles.historyLocation}>{h.location}</Text>
                <Text style={styles.historyPoints}>+{h.points}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.restartButton} onPress={restartGame} activeOpacity={0.8}>
              <Text style={styles.restartButtonText}>🔄 Neue Runde</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
              <Text style={styles.homeButtonText}>🏠 Hauptmenü</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  headerLeft: { flex: 1 },
  playerName: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  playerTurn: { color: '#888', fontSize: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  roundText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  difficultyBadge: { fontSize: 24 },

  // Scoreboard
  scoreboard: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#0f3460', borderBottomWidth: 2, borderBottomColor: '#1a4a8a' },
  scoreItem: { alignItems: 'center', padding: 10, minWidth: 90, borderRadius: 8 },
  activeScore: { borderBottomWidth: 3, borderBottomColor: '#e94560', backgroundColor: 'rgba(233, 69, 96, 0.15)' },
  scoreName: { color: '#ccc', fontSize: 13, marginBottom: 4, textAlign: 'center' },
  scoreValue: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center' },

  // Main
  mainContent: { flex: 1, justifyContent: 'center', padding: 20 },
  phaseContainer: { alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20 },

  // Scan
  scanIcon: { fontSize: 60, marginBottom: 15 },
  phaseTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  phaseText: { fontSize: 16, color: '#aaa', marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  scanButton: { backgroundColor: '#e94560', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12, shadowColor: '#e94560', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  scanButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scanHint: { color: '#666', fontSize: 12, marginTop: 15 },

  // View - TRUE FULLSCREEN
  viewPhaseContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
  fullscreenImageContainer: { flex: 1, position: 'relative' },
  countdownOverlay: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e94560', zIndex: 10 },
  countdownTimer: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  skipTimerButton: { position: 'absolute', bottom: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, borderWidth: 1, borderColor: '#4CAF50', zIndex: 20 },
  skipTimerText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },

  // Answer - FULLY VISIBLE, no scroll
  answerPhaseContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1a1a2e', zIndex: 10, alignItems: 'center', justifyContent: 'center', padding: 20 },
  answerInputArea: { width: '100%', marginVertical: 15 },
  answerIcon: { fontSize: 40, marginBottom: 10 },
  skipAnswerButton: { marginTop: 15, paddingVertical: 10, paddingHorizontal: 20 },
  skipAnswerText: { color: '#666', fontSize: 14, textDecorationLine: 'underline' },

  // Result
  resultIcon: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  resultCorrect: { color: '#4CAF50' },
  resultWrong: { color: '#ff4444' },
  resultCard: { backgroundColor: '#16213e', borderRadius: 15, padding: 20, width: '100%', marginBottom: 20, borderWidth: 2, borderColor: '#3a3a5a' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#3a3a5a' },
  resultLabel: { color: '#aaa', fontSize: 16, flexShrink: 0 },
  resultValue: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'right', flexShrink: 1, marginLeft: 10 },
  pointsHighlight: { color: '#4CAF50', fontSize: 22, fontWeight: 'bold' },
  nextButton: { backgroundColor: '#0f3460', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 12, borderWidth: 1, borderColor: '#e94560', marginBottom: 10 },
  nextButtonText: { color: '#e94560', fontSize: 18, fontWeight: '600' },
  newCardButton: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  newCardButtonText: { color: '#4CAF50', fontSize: 16, fontWeight: '600', textAlign: 'center' },

  // Summary
  summaryContainer: { flex: 1 },
  summaryContent: { padding: 20, alignItems: 'center' },
  summaryTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 5, textAlign: 'center' },
  summarySubtitle: { fontSize: 16, color: '#888', marginBottom: 25, textAlign: 'center' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, padding: 15, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: '#2a2a4a' },
  leaderboardFirst: { borderColor: '#FFD700', borderWidth: 2, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  leaderboardRank: { fontSize: 24, marginRight: 15 },
  leaderboardName: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '600' },
  leaderboardScore: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  historyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 25, marginBottom: 15, textAlign: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4a', width: '100%' },
  historyRound: { color: '#888', fontSize: 12, width: 30 },
  historyPlayer: { color: '#fff', fontSize: 13, flex: 1 },
  historyLocation: { color: '#aaa', fontSize: 13, flex: 1 },
  historyPoints: { color: '#4CAF50', fontSize: 14, fontWeight: 'bold', width: 40, textAlign: 'right' },
  restartButton: { backgroundColor: '#e94560', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 12, marginTop: 25, width: '100%', alignItems: 'center' },
  restartButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  homeButton: { backgroundColor: '#16213e', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 12, marginTop: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  homeButtonText: { color: '#aaa', fontSize: 16 },
});
