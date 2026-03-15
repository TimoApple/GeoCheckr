import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import locations from '../data/locations_complete';
import { calculateDistance, calculatePoints, findLocationByCity } from '../utils/distance';
import StreetViewImage from '../components/StreetViewImage';
import VoiceInput from '../components/VoiceInput';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playSkipSound, playTimerWarning, playScanSound, playTimerTick, setAudioWebViewRef, onAudioReady, AUDIO_HTML } from '../utils/sounds';

interface Player {
  id: number;
  name: string;
}

interface GameParams {
  players: Player[];
  difficulty: string;
  targetScore: number;
}

export default function GameScreen({ route, navigation }: any) {
  const params: GameParams = route.params || {
    players: [{ id: 1, name: 'Spieler 1' }, { id: 2, name: 'Spieler 2' }],
    difficulty: 'mittel',
    targetScore: 10
  };
  
  const { players, difficulty, targetScore } = params;
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(locations[0]);
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(players.map((p: Player) => [p.id, 0]))
  );
  const [timer, setTimer] = useState(30);
  const [countdownPaused, setCountdownPaused] = useState(false);
  const [phase, setPhase] = useState<'scan' | 'view' | 'answer' | 'result'>('scan');
  const [distance, setDistance] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [round, setRound] = useState(1);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const audioWebViewRef = useRef<WebView>(null);
  
  // Setup audio WebView ref
  useEffect(() => {
    if (audioWebViewRef.current) {
      setAudioWebViewRef(audioWebViewRef.current);
    }
  }, []);
  
  const currentPlayer = players[currentPlayerIndex];
  
  // Timer countdown - only when view phase is active
  useEffect(() => {
    if (phase === 'view' && timer > 0 && !countdownPaused) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0 && phase === 'view') {
      playTimerWarning();
      Vibration.vibrate(500);
      setPhase('answer');
    }
  }, [phase, timer, countdownPaused]);
  
  // Timer pulse animation when low
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
  
  // Check win condition
  useEffect(() => {
    const winner = Object.entries(scores).find(([_, score]) => score >= targetScore);
    if (winner) {
      const winnerPlayer = players.find((p: Player) => p.id === parseInt(winner[0]));
      if (winnerPlayer) {
        navigation.navigate('Result', { 
          winner: winnerPlayer, 
          scores, 
          players 
        });
      }
    }
  }, [scores, targetScore, players, navigation]);
  
  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 200);
  };
  
  const getRandomLocation = () => {
    const difficultyMap: Record<string, string[]> = {
      'leicht': ['leicht'],
      'mittel': ['leicht', 'mittel'],
      'schwer': ['leicht', 'mittel', 'schwer']
    };
    
    const availableLocations = locations.filter(loc => 
      (difficultyMap[difficulty]?.includes(loc.difficulty) ?? true) &&
      !usedLocations.includes(loc.id)
    );
    
    // Reset if all locations used
    if (availableLocations.length === 0) {
      setUsedLocations([]);
      return locations[Math.floor(Math.random() * locations.length)];
    }
    
    return availableLocations[Math.floor(Math.random() * availableLocations.length)];
  };
  
  const simulateScan = () => {
    playScanSound();
    const randomLoc = getRandomLocation();
    setUsedLocations(prev => [...prev, randomLoc.id]);
    setCountdownPaused(false);
    animateTransition(() => {
      setCurrentLocation(randomLoc);
      setTimer(30);
      setPhase('view');
      setRound(r => r + 1);
    });
  };
  
  const submitAnswer = (cityName: string) => {
    const guessedLocation = findLocationByCity(cityName, locations);
    
    let dist = 99999;
    if (guessedLocation && currentLocation) {
      dist = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        guessedLocation.lat, guessedLocation.lng
      );
    }
    
    const pts = calculatePoints(dist);
    
    // Animate result
    Animated.spring(resultScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
    
    if (pts >= 3) {
      playPerfectSound();
      Vibration.vibrate([100, 50, 100]);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (pts > 0) {
      playSuccessSound();
      Vibration.vibrate([100, 50, 100]);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      playErrorSound();
      Vibration.vibrate(500);
    }
    
    setDistance(dist);
    setPoints(pts);
    setScores(prev => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] + pts
    }));
    setPhase('result');
  };
  
  const nextTurn = () => {
    playClickSound();
    resultScaleAnim.setValue(0);
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    animateTransition(() => {
      setCurrentPlayerIndex(nextIndex);
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
      setTimer(30);
      setPhase('view');
      setRound(r => r + 1);
    });
  };

  const getTimerColor = () => {
    if (timer <= 5) return '#ff4444';
    if (timer <= 10) return '#ffaa00';
    return '#e94560';
  };
  
  return (
    <View style={styles.container}>
      {/* Hidden Audio WebView */}
      <WebView
        ref={audioWebViewRef}
        source={{ html: AUDIO_HTML }}
        style={{ width: 0, height: 0, position: 'absolute' }}
        javaScriptEnabled={true}
        onMessage={(e) => {
          if (e.nativeEvent.data === 'ready') onAudioReady();
        }}
        onError={() => {}}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.playerTurn}>ist dran</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.roundText}>Runde {round}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.difficultyBadge}>
            {difficulty === 'leicht' ? '😊' : difficulty === 'mittel' ? '🤔' : '🔥'}
          </Text>
        </View>
      </View>
      
      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        {players.map((p: Player) => (
          <View key={p.id} style={[styles.scoreItem, p.id === currentPlayer.id && styles.activeScore]}>
            <Text style={styles.scoreName}>{p.name}</Text>
            <Animated.Text style={[
              styles.scoreValue,
              p.id === currentPlayer.id && { transform: [{ scale: scaleAnim }] }
            ]}>
              {scores[p.id]}
            </Animated.Text>
            <Text style={styles.scoreTarget}>/ {targetScore}</Text>
          </View>
        ))}
      </View>
      
      {/* Main Content */}
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {phase === 'scan' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={styles.phaseTitle}>QR-Code scannen</Text>
            <Text style={styles.phaseText}>
              Scanne den QR-Code auf der Location-Karte oder tippe unten um zu testen
            </Text>
            <TouchableOpacity style={styles.scanButton} onPress={simulateScan} activeOpacity={0.8}>
              <Text style={styles.scanButtonText}>📍 Location laden</Text>
            </TouchableOpacity>
            <Text style={styles.scanHint}>
              {locations.length - usedLocations.length} von {locations.length} Locations verfügbar
            </Text>
          </View>
        )}
        
        {phase === 'view' && (
          <View style={styles.viewPhaseContainer}>
            {/* Fullscreen Image */}
            <View style={styles.fullscreenImageContainer}>
              <StreetViewImage location={currentLocation} showInfo={false} />
              
              {/* Countdown Overlay - Safe Area aware */}
              <View style={styles.countdownOverlay}>
                <Animated.Text style={[styles.countdownTimer, { 
                  color: getTimerColor(), 
                  transform: [{ scale: timerPulse }] 
                }]}>
                  {timer}
                </Animated.Text>
              </View>
              
              {/* Skip/Pause Button */}
              <TouchableOpacity 
                style={styles.skipTimerButton}
                onPress={() => {
                  playClickSound();
                  setCountdownPaused(true);
                  setPhase('answer');
                }}
              >
                <Text style={styles.skipTimerText}>Ich weiß es! →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {phase === 'answer' && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={100}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.answerIcon}>🎤</Text>
              <Text style={styles.phaseTitle}>Deine Antwort</Text>
              <Text style={styles.phaseText}>Nenne die Stadt, die am nächsten liegt</Text>
              <VoiceInput 
                onSubmit={submitAnswer}
                placeholder="Stadtname eingeben..."
              />
              <TouchableOpacity 
                style={styles.skipAnswerButton}
                onPress={() => { playSkipSound(); submitAnswer(''); }}
              >
                <Text style={styles.skipAnswerText}>Überspringen →</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
        
        {phase === 'result' && (
          <Animated.View style={[styles.phaseContainer, { transform: [{ scale: resultScaleAnim }] }]}>
            <Text style={styles.resultIcon}>
              {points >= 3 ? '🎯' : points >= 1 ? '👍' : '😅'}
            </Text>
            <Text style={[
              styles.resultTitle, 
              points > 0 ? styles.resultCorrect : styles.resultWrong
            ]}>
              {points >= 3 ? 'Perfekt!' : points >= 2 ? 'Gut!' : points >= 1 ? 'Nicht schlecht!' : 'Daneben!'}
            </Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📍 Ort</Text>
                <Text style={styles.resultValue}>{currentLocation.city}, {currentLocation.country}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>📏 Distanz</Text>
                <Text style={styles.resultValue}>{distance.toLocaleString()} km</Text>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  headerLeft: { flex: 1 },
  playerName: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  playerTurn: { color: '#888', fontSize: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  roundText: { color: '#fff', fontSize: 16 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  difficultyBadge: { fontSize: 24 },
  
  // Scoreboard
  scoreboard: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: 12, 
    backgroundColor: '#0f3460' 
  },
  scoreItem: { alignItems: 'center', padding: 8, minWidth: 80 },
  activeScore: { 
    borderBottomWidth: 3, 
    borderBottomColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 8,
  },
  scoreName: { color: '#ccc', fontSize: 12, marginBottom: 2 },
  scoreValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  scoreTarget: { color: '#666', fontSize: 10 },
  
  // Main Content
  mainContent: { flex: 1, justifyContent: 'center', padding: 20 },
  phaseContainer: { alignItems: 'center' },
  
  // Scan Phase
  scanIcon: { fontSize: 60, marginBottom: 15 },
  phaseTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  phaseText: { fontSize: 16, color: '#aaa', marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  scanButton: { 
    backgroundColor: '#e94560', 
    paddingVertical: 18, 
    paddingHorizontal: 40, 
    borderRadius: 12,
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scanHint: { color: '#666', fontSize: 12, marginTop: 15 },
  
  // View Phase - Fullscreen
  viewPhaseContainer: {
    flex: 1,
    marginHorizontal: -20, // Extend to screen edges
    marginTop: -10,
    marginBottom: -20,
  },
  fullscreenImageContainer: {
    flex: 1,
    position: 'relative',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 50,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
    zIndex: 10,
  },
  countdownTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipTimerButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  skipTimerText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Answer Phase
  answerIcon: { fontSize: 50, marginBottom: 15 },
  keyboardAvoid: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  skipAnswerButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipAnswerText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  newCardButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  newCardButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Result Phase
  resultIcon: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  resultCorrect: { color: '#4CAF50' },
  resultWrong: { color: '#ff4444' },
  resultCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  resultRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  resultLabel: { color: '#888', fontSize: 16 },
  resultValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pointsHighlight: { color: '#4CAF50', fontSize: 20 },
  nextButton: { 
    backgroundColor: '#0f3460', 
    paddingVertical: 16, 
    paddingHorizontal: 30, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  nextButtonText: { color: '#e94560', fontSize: 18, fontWeight: '600' },
});
