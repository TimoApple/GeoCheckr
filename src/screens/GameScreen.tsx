import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import locations from '../data/locations';
import { haversineDistance, calculateScore, formatDistance, getRandomLocations, getDistractors } from '../utils/gameUtils';

const { width, height } = Dimensions.get('window');

interface RoundData {
  location: typeof locations[0];
  options: typeof locations[];
  correctIndex: number;
}

export default function GameScreen({ route, navigation }: any) {
  const { players, difficulty, targetScore } = route.params;
  const [playerScores, setPlayerScores] = useState<Record<number, number>>(
    Object.fromEntries(players.map((p: any) => [p.id, 0]))
  );
  const [playerRounds, setPlayerRounds] = useState<Record<number, number>>(
    Object.fromEntries(players.map((p: any) => [p.id, 0]))
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [phase, setPhase] = useState<'scan' | 'view' | 'guess' | 'result'>('scan');
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; distance: number; points: number; guessedCity: string; correctCity: string } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const currentPlayer = players[currentPlayerIndex];

  // Timer countdown
  useEffect(() => {
    if (phase === 'view' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'view' && timeLeft === 0) {
      setPhase('guess');
    }
  }, [phase, timeLeft]);

  const startRound = useCallback(() => {
    // Pick random location
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const distractors = getDistractors(randomLoc, locations, 3);
    
    // Combine correct + distractors, shuffle
    const allOptions = [randomLoc, ...distractors].sort(() => Math.random() - 0.5);
    const correctIdx = allOptions.findIndex(l => l.id === randomLoc.id);
    
    setRoundData({
      location: randomLoc,
      options: allOptions,
      correctIndex: correctIdx,
    });
    setPhase('view');
    setTimeLeft(difficulty === 'leicht' ? 45 : difficulty === 'schwer' ? 15 : 30);
  }, [difficulty]);

  const handleQRScan = (data: string) => {
    // Match QR code or pick random
    const location = locations.find((l) => l.qrCode === data) || locations[Math.floor(Math.random() * locations.length)];
    const distractors = getDistractors(location, locations, 3);
    const allOptions = [location, ...distractors].sort(() => Math.random() - 0.5);
    const correctIdx = allOptions.findIndex(l => l.id === location.id);
    
    setRoundData({
      location,
      options: allOptions,
      correctIndex: correctIdx,
    });
    setScanning(false);
    setPhase('view');
    setTimeLeft(difficulty === 'leicht' ? 45 : difficulty === 'schwer' ? 15 : 30);
  };

  const handleGuess = (guessedIndex: number) => {
    if (!roundData) return;
    
    const guessed = roundData.options[guessedIndex];
    const correct = roundData.location;
    const distance = haversineDistance(guessed.lat, guessed.lng, correct.lat, correct.lng);
    const points = guessed.id === correct.id ? calculateScore(0) : calculateScore(distance);
    const isCorrect = guessed.id === correct.id;
    
    setLastResult({
      correct: isCorrect,
      distance,
      points: isCorrect ? points : 0,
      guessedCity: guessed.city,
      correctCity: correct.city,
    });
    
    // Update scores
    const newScores = { ...playerScores };
    newScores[currentPlayer.id] = (newScores[currentPlayer.id] || 0) + (isCorrect ? points : 0);
    setPlayerScores(newScores);
    
    // Update rounds
    const newRounds = { ...playerRounds };
    newRounds[currentPlayer.id] = (newRounds[currentPlayer.id] || 0) + 1;
    setPlayerRounds(newRounds);
    
    setPhase('result');
  };

  const nextTurn = () => {
    // Check win condition
    if (playerScores[currentPlayer.id] >= targetScore) {
      navigation.navigate('Result', { players, scores: playerScores, winner: currentPlayer });
      return;
    }
    
    // Next player
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    setPhase('scan');
    setRoundData(null);
    setLastResult(null);
  };

  const skipScan = () => {
    // Skip QR, just get random location
    startRound();
  };

  if (scanning) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Kamera-Berechtigung erforderlich</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Berechtigung geben</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setScanning(false)}>
            <Text style={styles.buttonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={({ data }) => handleQRScan(data)}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>QR-Code scannen</Text>
          <View style={styles.scannerFrame} />
          <TouchableOpacity style={styles.skipButton} onPress={skipScan}>
            <Text style={styles.skipButtonText}>Ohne QR starten</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Player Info Bar */}
      <View style={styles.playerBar}>
        <View>
          <Text style={styles.currentPlayer}>{currentPlayer.name}</Text>
          <Text style={styles.roundInfo}>Runde {playerRounds[currentPlayer.id] || 0}</Text>
        </View>
        <Text style={styles.score}>{playerScores[currentPlayer.id]} / {targetScore} pts</Text>
      </View>

      {phase === 'scan' && (
        <View style={styles.centerContent}>
          <Text style={styles.playerName}>{currentPlayer.name}, du bist dran!</Text>
          <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
            <Text style={styles.buttonText}>📷 QR-Code scannen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={skipScan}>
            <Text style={styles.skipButtonText}>oder ohne QR spielen</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'view' && roundData && (
        <View style={styles.centerContent}>
          <Text style={styles.timer}>{timeLeft}s</Text>
          <View style={styles.imageContainer}>
            <Text style={styles.locationEmoji}>🌍</Text>
            <Text style={styles.imageHint}>Studiere die Umgebung...</Text>
            <Text style={styles.difficultyBadge}>
              {roundData.location.difficulty === 'leicht' ? '🟢 Leicht' : 
               roundData.location.difficulty === 'schwer' ? '🔴 Schwer' : '🟡 Mittel'}
            </Text>
          </View>
          <Text style={styles.timerWarning}>Zeit läuft! Rate-Phase startet automatisch.</Text>
        </View>
      )}

      {phase === 'guess' && roundData && (
        <View style={styles.centerContent}>
          <Text style={styles.guessTitle}>Welche Stadt ist das?</Text>
          <Text style={styles.guessSubtitle}>Wähle die richtige Antwort!</Text>
          <View style={styles.optionsGrid}>
            {roundData.options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={() => handleGuess(index)}
              >
                <Text style={styles.optionText}>{option.city}</Text>
                <Text style={styles.optionCountry}>{option.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {phase === 'result' && lastResult && (
        <View style={styles.centerContent}>
          <Text style={styles.resultEmoji}>{lastResult.correct ? '🎉' : '😅'}</Text>
          <Text style={styles.resultTitle}>
            {lastResult.correct ? 'Richtig!' : 'Leider falsch!'}
          </Text>
          <Text style={styles.correctAnswer}>Richtig: {lastResult.correctCity}</Text>
          {!lastResult.correct && (
            <Text style={styles.yourAnswer}>Deine Antwort: {lastResult.guessedCity}</Text>
          )}
          <Text style={styles.distanceText}>
            Entfernung: {formatDistance(lastResult.distance)}
          </Text>
          <Text style={styles.pointsText}>+{lastResult.points} Punkte</Text>
          
          <TouchableOpacity style={styles.nextButton} onPress={nextTurn}>
            <Text style={styles.buttonText}>
              {playerScores[currentPlayer.id] >= targetScore ? '🏆 Spiel beenden' : 'Nächste Runde →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  playerBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 15, backgroundColor: '#16213e', borderBottomWidth: 2, borderBottomColor: '#e94560' 
  },
  currentPlayer: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  roundInfo: { color: '#888', fontSize: 12, marginTop: 2 },
  score: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  playerName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  timer: { color: '#e94560', fontSize: 64, fontWeight: 'bold', marginBottom: 20 },
  timerWarning: { color: '#888', fontSize: 14, marginTop: 15 },
  text: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#e94560', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10, marginBottom: 10 },
  secondaryButton: { backgroundColor: '#0f3460' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  scanButton: { backgroundColor: '#e94560', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 15, marginBottom: 15 },
  skipButton: { paddingVertical: 10 },
  skipButtonText: { color: '#888', fontSize: 16 },
  scannerContainer: { flex: 1 },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  scannerText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 30 },
  scannerFrame: { width: 220, height: 220, borderWidth: 3, borderColor: '#e94560', borderRadius: 20 },
  cancelButton: { marginTop: 30, paddingHorizontal: 20, paddingVertical: 10 },
  cancelButtonText: { color: '#fff', fontSize: 16 },
  imageContainer: { 
    width: width - 40, height: height * 0.45, backgroundColor: '#16213e', borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333'
  },
  locationEmoji: { fontSize: 80, marginBottom: 15 },
  imageHint: { color: '#aaa', fontSize: 18 },
  difficultyBadge: { color: '#fff', fontSize: 14, marginTop: 15, backgroundColor: '#0f3460', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  guessTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 5 },
  guessSubtitle: { color: '#888', fontSize: 16, marginBottom: 25 },
  optionsGrid: { width: '100%', gap: 12 },
  optionButton: { 
    backgroundColor: '#16213e', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#333',
    alignItems: 'center'
  },
  optionText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  optionCountry: { color: '#888', fontSize: 13, marginTop: 3 },
  resultEmoji: { fontSize: 80, marginBottom: 15 },
  resultTitle: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginBottom: 15 },
  correctAnswer: { color: '#4ecca3', fontSize: 20, marginBottom: 5 },
  yourAnswer: { color: '#e94560', fontSize: 18, marginBottom: 10 },
  distanceText: { color: '#aaa', fontSize: 16, marginBottom: 5 },
  pointsText: { color: '#FFD700', fontSize: 28, fontWeight: 'bold', marginBottom: 25 },
  nextButton: { backgroundColor: '#e94560', paddingHorizontal: 35, paddingVertical: 16, borderRadius: 12 },
});
