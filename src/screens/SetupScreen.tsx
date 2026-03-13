import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

interface Player {
  id: number;
  name: string;
}

export default function SetupScreen({ navigation }: any) {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Spieler 1' },
    { id: 2, name: 'Spieler 2' }
  ]);
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>('mittel');
  const [targetScore, setTargetScore] = useState(10);
  
  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, { id: Date.now(), name: `Spieler ${players.length + 1}` }]);
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
    navigation.navigate('Game', { players, difficulty, targetScore });
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>👥 Spieler ({players.length})</Text>
      {players.map((player, index) => (
        <View key={player.id} style={styles.playerRow}>
          <TextInput
            style={styles.playerInput}
            value={player.name}
            onChangeText={(text) => updatePlayerName(player.id, text)}
            placeholder={`Spieler ${index + 1}`}
            placeholderTextColor="#666"
          />
          {players.length > 2 && (
            <TouchableOpacity onPress={() => removePlayer(player.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      {players.length < 8 && (
        <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
          <Text style={styles.addButtonText}>+ Spieler hinzufügen</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.sectionTitle}>🎯 Schwierigkeit</Text>
      <View style={styles.diffRow}>
        {(['leicht', 'mittel', 'schwer'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.diffButton, difficulty === level && styles.diffActive]}
            onPress={() => setDifficulty(level)}
          >
            <Text style={[styles.diffText, difficulty === level && styles.diffTextActive]}>
              {level === 'leicht' ? '😊 Leicht' : level === 'mittel' ? '🤔 Mittel' : '🔥 Schwer'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>🏁 Ziel-Score</Text>
      <View style={styles.scoreRow}>
        {[5, 10, 15, 20].map((score) => (
          <TouchableOpacity
            key={score}
            style={[styles.scoreButton, targetScore === score && styles.scoreActive]}
            onPress={() => setTargetScore(score)}
          >
            <Text style={[styles.scoreText, targetScore === score && styles.scoreTextActive]}>
              {score}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📱 Benötigt: Kamera + Internet</Text>
        <Text style={styles.infoText}>⏱️ Geschätzte Spielzeit: 20-45 Min</Text>
      </View>
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>🚀 Spiel starten</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  sectionTitle: { color: '#e94560', fontSize: 20, fontWeight: '600', marginTop: 25, marginBottom: 15 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerInput: { flex: 1, backgroundColor: '#16213e', color: '#fff', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a' },
  removeButton: { marginLeft: 10, width: 40, height: 40, backgroundColor: '#333', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  removeButtonText: { color: '#e94560', fontSize: 18 },
  addButton: { backgroundColor: '#0f3460', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  addButtonText: { color: '#fff', fontSize: 16 },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between' },
  diffButton: { flex: 1, backgroundColor: '#16213e', padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  diffActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  diffText: { color: '#666', fontSize: 14 },
  diffTextActive: { color: '#fff', fontWeight: '600' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreButton: { flex: 1, backgroundColor: '#16213e', padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  scoreActive: { backgroundColor: '#0f3460', borderColor: '#0f3460' },
  scoreText: { color: '#666', fontSize: 18 },
  scoreTextActive: { color: '#fff', fontWeight: '600' },
  infoBox: { backgroundColor: '#16213e', borderRadius: 10, padding: 15, marginTop: 25, borderWidth: 1, borderColor: '#2a2a4a' },
  infoText: { color: '#888', fontSize: 14, marginBottom: 5 },
  startButton: { backgroundColor: '#e94560', paddingVertical: 18, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
