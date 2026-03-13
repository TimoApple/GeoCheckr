import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import locations from '../data/locations_complete';
import { calculateDistance, calculatePoints } from '../utils/distance';
import StreetViewImage from '../components/StreetViewImage';
import VoiceInput from '../components/VoiceInput';

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
  const [phase, setPhase] = useState<'scan' | 'view' | 'answer' | 'result'>('scan');
  const [distance, setDistance] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [round, setRound] = useState(1);
  
  const currentPlayer = players[currentPlayerIndex];
  
  // Timer countdown
  useEffect(() => {
    if (phase === 'view' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0 && phase === 'view') {
      setPhase('answer');
    }
  }, [phase, timer]);
  
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
  
  const simulateScan = () => {
    const difficultyMap: Record<string, string[]> = {
      'leicht': ['leicht'],
      'mittel': ['leicht', 'mittel'],
      'schwer': ['leicht', 'mittel', 'schwer']
    };
    
    const availableLocations = locations.filter(loc => 
      difficultyMap[difficulty]?.includes(loc.difficulty) ?? true
    );
    
    const randomLoc = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    setCurrentLocation(randomLoc);
    setTimer(30);
    setPhase('view');
    setRound(r => r + 1);
  };
  
  const submitAnswer = (cityName: string) => {
    const guessedLocation = locations.find(loc => 
      loc.city.toLowerCase() === cityName.toLowerCase()
    );
    
    let dist = 99999;
    if (guessedLocation) {
      dist = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        guessedLocation.lat, guessedLocation.lng
      );
    }
    
    const pts = calculatePoints(dist);
    
    setDistance(dist);
    setPoints(pts);
    setScores(prev => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] + pts
    }));
    setPhase('result');
  };
  
  const nextTurn = () => {
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    setPhase('scan');
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLeft}>{currentPlayer.name}</Text>
        <Text style={styles.headerCenter}>Runde {round}</Text>
        <Text style={styles.headerRight}>{difficulty}</Text>
      </View>
      
      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        {players.map((p: Player) => (
          <View key={p.id} style={[styles.scoreItem, p.id === currentPlayer.id && styles.activeScore]}>
            <Text style={styles.scoreName}>{p.name}</Text>
            <Text style={styles.scoreValue}>{scores[p.id]}</Text>
          </View>
        ))}
      </View>
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {phase === 'scan' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseTitle}>QR-Code scannen</Text>
            <Text style={styles.phaseText}>Scanne den QR-Code auf der Location-Karte</Text>
            <TouchableOpacity style={styles.scanButton} onPress={simulateScan}>
              <Text style={styles.scanButtonText}>📷 QR-Code scannen</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {phase === 'view' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.timer}>{timer}</Text>
            <Text style={styles.phaseText}>Wo ist dieser Ort?</Text>
            <View style={styles.imageContainer}>
              <StreetViewImage location={currentLocation} />
            </View>
            {timer <= 5 && <Text style={styles.countdown}>Noch {timer} Sekunden!</Text>}
          </View>
        )}
        
        {phase === 'answer' && (
          <VoiceInput 
            onSubmit={submitAnswer}
            placeholder="Stadtname eingeben..."
          />
        )}
        
        {phase === 'result' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.resultTitle}>{points > 0 ? '✅ Richtig!' : '❌ Falsch!'}</Text>
            <Text style={styles.resultText}>Distanz: {distance} km</Text>
            <Text style={styles.resultText}>Punkte: +{points}</Text>
            <Text style={styles.resultText}>Ort: {currentLocation.city}, {currentLocation.country}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={nextTurn}>
              <Text style={styles.nextButtonText}>Nächster Spieler →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#16213e' },
  headerLeft: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  headerCenter: { color: '#fff', fontSize: 16 },
  headerRight: { color: '#888', fontSize: 14 },
  scoreboard: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, backgroundColor: '#0f3460' },
  scoreItem: { alignItems: 'center', padding: 8 },
  activeScore: { borderBottomWidth: 2, borderBottomColor: '#e94560' },
  scoreName: { color: '#ccc', fontSize: 12 },
  scoreValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  mainContent: { flex: 1, justifyContent: 'center', padding: 20 },
  phaseContainer: { alignItems: 'center' },
  timer: { fontSize: 72, color: '#e94560', fontWeight: 'bold', marginBottom: 10 },
  countdown: { fontSize: 24, color: '#ff0', marginTop: 15 },
  phaseTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  phaseText: { fontSize: 18, color: '#ccc', marginBottom: 20, textAlign: 'center' },
  scanButton: { backgroundColor: '#e94560', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12 },
  scanButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  imageContainer: { width: '100%', height: 250, borderRadius: 15, overflow: 'hidden' },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  resultText: { fontSize: 18, color: '#ccc', marginBottom: 8 },
  nextButton: { backgroundColor: '#e94560', padding: 15, borderRadius: 10, marginTop: 20 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
