import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ResultScreen({ route, navigation }: any) {
  const { winner, scores, players } = route.params || {
    winner: { name: 'Spieler 1', id: 1 },
    scores: { 1: 10, 2: 7 },
    players: [{ id: 1, name: 'Spieler 1' }, { id: 2, name: 'Spieler 2' }]
  };
  
  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  
  return (
    <View style={styles.container}>
      <View style={styles.trophyContainer}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.winnerText}>{winner.name} gewinnt!</Text>
        <Text style={styles.scoreText}>{scores[winner.id]} Punkte</Text>
      </View>
      
      <View style={styles.leaderboard}>
        <Text style={styles.leaderboardTitle}>Endstand</Text>
        {sortedPlayers.map((player, index) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerScore}>{scores[player.id] || 0}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Setup')}
        >
          <Text style={styles.primaryButtonText}>🔄 Neues Spiel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryButtonText}>🏠 Hauptmenü</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  trophyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  trophy: { fontSize: 80, marginBottom: 15 },
  winnerText: { fontSize: 32, fontWeight: 'bold', color: '#e94560', marginBottom: 10 },
  scoreText: { fontSize: 24, color: '#fff', marginBottom: 20 },
  leaderboard: { backgroundColor: '#16213e', borderRadius: 15, padding: 20, marginBottom: 30 },
  leaderboardTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 15, textAlign: 'center' },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  rank: { width: 40, fontSize: 18, color: '#e94560', fontWeight: 'bold' },
  playerName: { flex: 1, fontSize: 18, color: '#fff' },
  playerScore: { fontSize: 18, color: '#ccc', fontWeight: '600' },
  buttonContainer: { marginBottom: 20 },
  primaryButton: { backgroundColor: '#e94560', paddingVertical: 18, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#16213e', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  secondaryButtonText: { color: '#ccc', fontSize: 16 },
});
