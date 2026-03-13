import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import locations from '../data/locations_full';
import { calculateDistance, calculatePoints } from '../utils/distance';

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
  const [playerAnswer, setPlayerAnswer] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  
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
  
  const simulateScan = () => {
    // Simulate QR scan - pick random location
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    setCurrentLocation(randomLoc);
    setTimer(30);
    setPhase('view');
  };
  
  const submitAnswer = (cityName: string) => {
    const dist = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      currentLocation.lat, currentLocation.lng // In real app, use guessed city coords
    );
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
    
    // Check win condition
    const winner = Object.entries(scores).find(([_, score]) => score >= targetScore);
    if (winner) {
      navigation.navigate('Result', { winner: players.find((p: any) => p.id === parseInt(winner[0])), scores });
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.playerName}>{currentPlayer.name} ist dran</Text>
        <Text style={styles.score}>
          {Object.entries(scores).map(([id, s]) => 
            `${players.find((p: any) => p.id === parseInt(id))?.name}: ${s}`
          ).join(' | ')}
        </Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {phase === 'scan' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseTitle}>QR-Code scannen</Text>
            <Text style={styles.phaseText}>Scan den QR-Code auf der Location-Karte</Text>
            <TouchableOpacity style={styles.scanButton} onPress={simulateScan}>
              <Text style={styles.scanButtonText}>📷 Scanner öffnen</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {phase === 'view' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.timer}>{timer}</Text>
            <Text style={styles.phaseText}>Wo ist dieser Ort?</Text>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>[Street View Bild]</Text>
              <Text style={styles.placeholderText}>Koordinaten: {currentLocation.lat.toFixed(2)}, {currentLocation.lng.toFixed(2)}</Text>
            </View>
            {timer <= 5 && <Text style={styles.countdown}>Noch {timer} Sekunden!</Text>}
          </View>
        )}
        
        {phase === 'answer' && (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseTitle}>Wo bist du?</Text>
            <Text style={styles.phaseText}>Nenne die nächste Stadt</Text>
            <View style={styles.answerButtons}>
              {['Berlin', 'Tokyo', 'New York', 'Sydney'].map(city => (
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
            <TouchableOpacity style={styles.nextButton} onPress={() => {
              setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
              setPhase('scan');
            }}>
              <Text style={styles.nextButtonText}>Nächster Spieler</Text>
            </TouchableOpacity>
          </View>
        )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 15, backgroundColor: '#16213e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 16 },
  gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  phaseContainer: { alignItems: 'center' },
  timer: { fontSize: 72, color: '#e94560', fontWeight: 'bold' },
  countdown: { fontSize: 24, color: '#ff0', marginTop: 10 },
  phaseTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  phaseText: { fontSize: 18, color: '#ccc', marginBottom: 20 },
  imagePlaceholder: { width: 300, height: 200, backgroundColor: '#333', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#888', fontSize: 14 },
  answerButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  answerButton: { backgroundColor: '#0f3460', padding: 15, borderRadius: 10, margin: 5, minWidth: 120, alignItems: 'center' },
  answerButtonText: { color: '#fff', fontSize: 16 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  resultText: { fontSize: 18, color: '#ccc', marginBottom: 8 },
  nextButton: { backgroundColor: '#e94560', padding: 15, borderRadius: 10, marginTop: 20 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  scoreboard: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#16213e' },
  scoreItem: { alignItems: 'center', padding: 10 },
  activeScore: { borderBottomWidth: 2, borderBottomColor: '#e94560' },
  scoreName: { color: '#ccc', fontSize: 14 },
  scoreValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
