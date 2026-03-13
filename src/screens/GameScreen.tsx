import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import locations from '../data/locations_sample';

const { width, height } = Dimensions.get('window');

export default function GameScreen({ route, navigation }: any) {
  const { players, difficulty, targetScore } = route.params;
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(players.map((p: any) => [p.id, 0]))
  );
  const [phase, setPhase] = useState<'scan' | 'view' | 'guess' | 'result'>('scan');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const currentPlayer = players[currentPlayerIndex];

  useEffect(() => {
    if (phase === 'view' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'view' && timeLeft === 0) {
      setPhase('guess');
    }
  }, [phase, timeLeft]);

  const handleQRScan = (data: string) => {
    // Find location by QR code
    const location = locations.find((l: any) => l.qrCode === data) || locations[Math.floor(Math.random() * locations.length)];
    setCurrentLocation(location);
    setScanning(false);
    setPhase('view');
    setTimeLeft(30);
  };

  const handleGuess = (guessedCity: string) => {
    // Calculate distance and update score
    // For now, simple logic
    const correct = Math.random() > 0.5; // Placeholder
    
    if (correct) {
      setScores({ ...scores, [currentPlayer.id]: scores[currentPlayer.id] + 1 });
    }
    
    setPhase('result');
  };

  const nextTurn = () => {
    // Check win condition
    if (scores[currentPlayer.id] >= targetScore) {
      navigation.navigate('Result', { players, scores, winner: currentPlayer });
      return;
    }
    
    // Next player
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    setPhase('scan');
    setCurrentLocation(null);
  };

  if (scanning) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Kamera-Berechtigung erforderlich</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Berechtigung geben</Text>
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
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Player Info */}
      <View style={styles.playerBar}>
        <Text style={styles.currentPlayer}>{currentPlayer.name}</Text>
        <Text style={styles.score}>{scores[currentPlayer.id]} / {targetScore}</Text>
      </View>

      {phase === 'scan' && (
        <View style={styles.centerContent}>
          <Text style={styles.instruction}>Du bist dran!</Text>
          <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
            <Text style={styles.scanButtonText}>QR-Code scannen</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'view' && currentLocation && (
        <View style={styles.centerContent}>
          <Text style={styles.timer}>{timeLeft}s</Text>
          <View style={styles.imageContainer}>
            <Text style={styles.imagePlaceholder}>[Street View Bild]</Text>
            <Text style={styles.imageHint}>Ort: {currentLocation.city}</Text>
          </View>
        </View>
      )}

      {phase === 'guess' && (
        <View style={styles.centerContent}>
          <Text style={styles.instruction}>Welche Stadt ist am nächsten?</Text>
          <Text style={styles.timer}>5 Sekunden!</Text>
          {/* City buttons would be dynamic based on player cards */}
          <View style={styles.cityGrid}>
            {players.map((player: any) => (
              <TouchableOpacity key={player.id} style={styles.cityButton}>
                <Text style={styles.cityButtonText}>{player.name}: ???</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {phase === 'result' && (
        <View style={styles.centerContent}>
          <Text style={styles.resultTitle}>Ergebnis</Text>
          <Text style={styles.resultText}>{currentLocation?.city}</Text>
          <TouchableOpacity style={styles.button} onPress={nextTurn}>
            <Text style={styles.buttonText}>Nächste Runde</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  playerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#16213e' },
  currentPlayer: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  score: { color: '#fff', fontSize: 18 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  timer: { color: '#e94560', fontSize: 48, fontWeight: 'bold', marginBottom: 20 },
  text: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#e94560', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scanButton: { backgroundColor: '#e94560', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 15 },
  scanButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scannerContainer: { flex: 1 },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerText: { color: '#fff', fontSize: 20, marginBottom: 30 },
  scannerFrame: { width: 200, height: 200, borderWidth: 3, borderColor: '#e94560', borderRadius: 15 },
  cancelButton: { marginTop: 30, paddingHorizontal: 20, paddingVertical: 10 },
  cancelButtonText: { color: '#fff', fontSize: 16 },
  imageContainer: { width: width - 40, height: height * 0.5, backgroundColor: '#16213e', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { color: '#666', fontSize: 18 },
  imageHint: { color: '#e94560', fontSize: 14, marginTop: 10 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 20 },
  cityButton: { backgroundColor: '#0f3460', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 10, minWidth: 150 },
  cityButtonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  resultTitle: { color: '#e94560', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
  resultText: { color: '#fff', fontSize: 22, marginBottom: 30 },
});
