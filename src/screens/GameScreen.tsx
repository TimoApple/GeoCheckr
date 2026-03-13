import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import locations from '../data/locations_complete';

export default function GameScreen({ route, navigation }: any) {
  const { players, difficulty, targetScore } = route.params || {
    players: [{ id: 1, name: 'Spieler 1' }, { id: 2, name: 'Spieler 2' }],
    difficulty: 'mittel',
    targetScore: 10
  };
  
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(locations[0]);
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(players.map((p: any) => [p.id, 0]))
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
      const winnerPlayer = players.find((p: any) => p.id === parseInt(winner[0]));
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
        {players.map((p: any) => (
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
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>🌍</Text>
              <Text style={styles.placeholderText}>Koordinaten:</Text>
              <Text style={styles.coords}>{currentLocation.lat.toFixed(4)}°, {currentLocation.lng.toFixed(4)}°</Text>
            </View>
            {timer <= 5 && <Text style={styles.countdown}>Noch {timer} Sekunden!</Text>}
          </View>
        )}
        
        {phase === 'answer' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseTitle}>Wo bist du?</Text>
            <Text style={styles.phaseText}>Nenne die nächste Stadt</Text>
            <View style={styles.answerButtons}>
              {['Berlin', 'Paris', 'Tokyo', 'New York'].map(city => (
                <TouchableOpacity key={city} style={styles.answerButton} onPress={() => submitAnswer(city)}>
                  <Text style={styles.answerButtonText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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

// Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

function calculatePoints(distance: number): number {
  if (distance < 100) return 3;
  if (distance < 500) return 2;
  if (distance < 2000) return 1;
  return 0;
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
  imagePlaceholder: { width: 300, height: 200, backgroundColor: '#16213e', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  placeholderEmoji: { fontSize: 50, marginBottom: 10 },
  placeholderText: { color: '#888', fontSize: 16 },
  coords: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  answerButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  answerButton: { backgroundColor: '#0f3460', padding: 15, borderRadius: 10, margin: 5, minWidth: 120, alignItems: 'center' },
  answerButtonText: { color: '#fff', fontSize: 16 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  resultText: { fontSize: 18, color: '#ccc', marginBottom: 8 },
  nextButton: { backgroundColor: '#e94560', padding: 15, borderRadius: 10, marginTop: 20 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
