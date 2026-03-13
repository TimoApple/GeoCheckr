import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

interface Player {
  id: number;
  name: string;
  cards: string[];
}

export default function SetupScreen({ navigation }: any) {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Spieler 1', cards: [] },
    { id: 2, name: 'Spieler 2', cards: [] },
  ]);
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>('mittel');
  const [targetScore, setTargetScore] = useState(10);

  const updatePlayerName = (id: number, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const addPlayer = () => {
    if (playerCount < 8) {
      const newId = players.length + 1;
      setPlayers([...players, { id: newId, name: `Spieler ${newId}`, cards: [] }]);
      setPlayerCount(playerCount + 1);
    }
  };

  const removePlayer = () => {
    if (playerCount > 2) {
      setPlayers(players.slice(0, -1));
      setPlayerCount(playerCount - 1);
    }
  };

  const startGame = () => {
    // Navigate to game with setup data
    navigation.navigate('Game', {
      players,
      difficulty,
      targetScore,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Spieler ({playerCount})</Text>
      {players.map((player, index) => (
        <View key={player.id} style={styles.playerRow}>
          <TextInput
            style={styles.playerInput}
            value={player.name}
            onChangeText={(text) => updatePlayerName(player.id, text)}
            placeholder={`Spieler ${index + 1}`}
            placeholderTextColor="#666"
          />
        </View>
      ))}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.smallButton} onPress={removePlayer}>
          <Text style={styles.smallButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={addPlayer}>
          <Text style={styles.smallButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Schwierigkeit</Text>
      <View style={styles.diffRow}>
        {(['leicht', 'mittel', 'schwer'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.diffButton, difficulty === level && styles.diffButtonActive]}
            onPress={() => setDifficulty(level)}
          >
            <Text style={[styles.diffButtonText, difficulty === level && styles.diffButtonTextActive]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Ziel: {targetScore} Karten</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.smallButton} onPress={() => setTargetScore(Math.max(5, targetScore - 5))}>
          <Text style={styles.smallButtonText}>-5</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={() => setTargetScore(Math.min(30, targetScore + 5))}>
          <Text style={styles.smallButtonText}>+5</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Spiel starten</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  sectionTitle: { color: '#e94560', fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  playerRow: { marginBottom: 10 },
  playerInput: { backgroundColor: '#16213e', color: '#fff', padding: 15, borderRadius: 8, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 10 },
  smallButton: { backgroundColor: '#0f3460', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 },
  smallButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  diffButton: { flex: 1, backgroundColor: '#16213e', padding: 15, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  diffButtonActive: { backgroundColor: '#e94560' },
  diffButtonText: { color: '#666', fontSize: 14 },
  diffButtonTextActive: { color: '#fff', fontWeight: '600' },
  startButton: { backgroundColor: '#e94560', padding: 20, borderRadius: 10, marginTop: 30, marginBottom: 50, alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
