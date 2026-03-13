import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ResultScreen({ route, navigation }: any) {
  const { players, scores, winner } = route.params;

  const sortedPlayers = [...players].sort((a: any, b: any) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <View style={styles.container}>
      <Text style={styles.trophy}>🏆</Text>
      <Text style={styles.winnerText}>{winner.name} gewinnt!</Text>
      <Text style={styles.subtitle}>Punktestand</Text>

      {sortedPlayers.map((player: any, index: number) => (
        <View key={player.id} style={[styles.playerRow, index === 0 && styles.winnerRow]}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerScore}>{scores[player.id] || 0}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.buttonText}>Zum Start</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => navigation.navigate('Setup')}>
        <Text style={styles.buttonText}>Nochmal spielen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, justifyContent: 'center' },
  trophy: { fontSize: 80, textAlign: 'center', marginBottom: 10 },
  winnerText: { color: '#e94560', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 30 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', padding: 15, borderRadius: 10, marginBottom: 10 },
  winnerRow: { backgroundColor: '#0f3460', borderWidth: 2, borderColor: '#e94560' },
  rank: { color: '#e94560', fontSize: 18, fontWeight: 'bold', width: 40 },
  playerName: { color: '#fff', fontSize: 18, flex: 1 },
  playerScore: { color: '#e94560', fontSize: 22, fontWeight: 'bold' },
  button: { backgroundColor: '#e94560', padding: 18, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#0f3460' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
