import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { playClickSound } from '../utils/sounds';

interface Player {
  id: number;
  name: string;
}

export default function SetupScreen({ navigation }: any) {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: '' },
    { id: 2, name: '' }
  ]);
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>('mittel');
  const [targetScore, setTargetScore] = useState(10);
  const [rounds, setRounds] = useState(10);
  
  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, { id: Date.now(), name: '' }]);
    }
  };
  
  const removePlayer = (id: number) => {
    if (players.length > 2) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };
  
  const updatePlayerName = (id: number, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };
  
  const startGame = () => {
    // Fill in default names if empty
    const filledPlayers = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Spieler ${i + 1}`
    }));
    playClickSound();
    navigation.navigate('Game', { players: filledPlayers, difficulty, targetScore, rounds });
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      {/* SPIELER */}
      <Text style={styles.sectionTitle}>👥 Spieler ({players.length})</Text>
      {players.map((player, index) => (
        <View key={player.id} style={styles.playerRow}>
          <View style={styles.playerNumber}>
            <Text style={styles.playerNumberText}>{index + 1}</Text>
          </View>
          <TextInput
            style={styles.playerInput}
            value={player.name}
            onChangeText={(text) => updatePlayerName(player.id, text)}
            placeholder={`Spieler ${index + 1}`}
            placeholderTextColor="#555"
            selectionColor="#e94560"
          />
          {players.length > 2 && (
            <TouchableOpacity onPress={() => removePlayer(player.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      {players.length < 8 && (
        <TouchableOpacity style={styles.addButton} onPress={addPlayer} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+ Spieler hinzufügen</Text>
        </TouchableOpacity>
      )}
      
      {/* SCHWIERIGKEIT */}
      <Text style={styles.sectionTitle}>🎯 Schwierigkeit</Text>
      <View style={styles.diffRow}>
        <TouchableOpacity
          style={[styles.diffButton, difficulty === 'leicht' && styles.diffLeicht]}
          onPress={() => setDifficulty('leicht')}
          activeOpacity={0.7}
        >
          <Text style={[styles.diffText, difficulty === 'leicht' && styles.diffTextActive]}>😊 Leicht</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.diffButton, difficulty === 'mittel' && styles.diffMittel]}
          onPress={() => setDifficulty('mittel')}
          activeOpacity={0.7}
        >
          <Text style={[styles.diffText, difficulty === 'mittel' && styles.diffTextActive]}>🤔 Mittel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.diffButton, difficulty === 'schwer' && styles.diffSchwer]}
          onPress={() => setDifficulty('schwer')}
          activeOpacity={0.7}
        >
          <Text style={[styles.diffText, difficulty === 'schwer' && styles.diffTextActive]}>🔥 Schwer</Text>
        </TouchableOpacity>
      </View>
      
      {/* ZIEL-SCORE */}
      <Text style={styles.sectionTitle}>🏁 Ziel-Score</Text>
      <View style={styles.scoreRow}>
        {[5, 10, 15, 20].map((score) => (
          <TouchableOpacity
            key={score}
            style={[styles.scoreButton, targetScore === score && styles.scoreActive]}
            onPress={() => setTargetScore(score)}
            activeOpacity={0.7}
          >
            <Text style={[styles.scoreText, targetScore === score && styles.scoreTextActive]}>{score}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* RUNDEN */}
      <Text style={styles.sectionTitle}>🔄 Runden</Text>
      <View style={styles.scoreRow}>
        {[5, 10, 15, 20].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.scoreButton, rounds === r && styles.scoreActive]}
            onPress={() => setRounds(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.scoreText, rounds === r && styles.scoreTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* INFO */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📱 Kamera + Internet nötig</Text>
        <Text style={styles.infoText}>⏱️ ~20-45 Min Spielzeit</Text>
      </View>
      
      {/* START */}
      <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.8}>
        <Text style={styles.startButtonText}>🚀 Spiel starten</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a2e',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,  // More space for Start button (nav bar overlap)
  },
  
  sectionTitle: { 
    color: '#e94560', 
    fontSize: 20, 
    fontWeight: '700', 
    marginTop: 25, 
    marginBottom: 15 
  },
  
  // Spieler
  playerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  playerNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInput: { 
    flex: 1, 
    backgroundColor: '#0f3460', 
    color: '#ffffff', 
    padding: 14, 
    borderRadius: 10, 
    fontSize: 16, 
    borderWidth: 2, 
    borderColor: '#2a2a4a',
  },
  removeButton: { 
    marginLeft: 10, 
    width: 36, 
    height: 36, 
    backgroundColor: '#2a2a4a', 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  removeButtonText: { 
    color: '#e94560', 
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: { 
    backgroundColor: '#16213e', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 5,
    borderWidth: 2,
    borderColor: '#2a2a4a',
    borderStyle: 'dashed',
  },
  addButtonText: { 
    color: '#aaa', 
    fontSize: 16 
  },
  
  // Schwierigkeit
  diffRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 8,
  },
  diffButton: { 
    flex: 1, 
    backgroundColor: '#16213e', 
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#2a2a4a' 
  },
  diffLeicht: { 
    backgroundColor: '#1b4332', 
    borderColor: '#4CAF50' 
  },
  diffMittel: { 
    backgroundColor: '#3d2c00', 
    borderColor: '#FF9800' 
  },
  diffSchwer: { 
    backgroundColor: '#3d0000', 
    borderColor: '#f44336' 
  },
  diffText: { 
    color: '#888', 
    fontSize: 15,
    fontWeight: '600',
  },
  diffTextActive: { 
    color: '#fff',
  },
  
  // Score
  scoreRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreButton: { 
    flex: 1, 
    backgroundColor: '#16213e', 
    paddingVertical: 18,
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#2a2a4a' 
  },
  scoreActive: { 
    backgroundColor: '#0f3460', 
    borderColor: '#e94560',
    borderWidth: 2,
  },
  scoreText: { 
    color: '#888', 
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreTextActive: { 
    color: '#fff',
  },
  
  // Info
  infoBox: { 
    backgroundColor: '#16213e', 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 25, 
    borderWidth: 1, 
    borderColor: '#2a2a4a' 
  },
  infoText: { 
    color: '#888', 
    fontSize: 14, 
    marginBottom: 4 
  },
  
  // Start
  startButton: { 
    backgroundColor: '#e94560', 
    paddingVertical: 18, 
    borderRadius: 14, 
    marginTop: 30,
    marginBottom: 40,  // Space above nav bar
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
});
