// GeoCheckr — Result Screen (after all rounds)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Player {
  id: number;
  name: string;
}

interface Props {
  route: any;
  navigation: any;
}

export default function ResultScreen({ route, navigation }: Props) {
  const { players, scores, rounds } = route.params as {
    players: Player[];
    scores: Record<number, number>;
    rounds: number;
  };

  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const winner = sorted[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>Spiel beendet!</Text>
        <Text style={styles.subtitle}>{rounds} Runden gespielt</Text>

        {/* Winner highlight */}
        <View style={styles.winnerCard}>
          <Text style={styles.winnerEmoji}>🥇</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <Text style={styles.winnerScore}>{scores[winner.id]} ⭐</Text>
        </View>

        {/* All players */}
        {sorted.map((p, i) => (
          <View key={p.id} style={[styles.playerRow, i === 0 && styles.firstRow]}>
            <Text style={styles.rank}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </Text>
            <Text style={styles.playerName}>{p.name}</Text>
            <Text style={styles.playerScore}>{scores[p.id]} ⭐</Text>
          </View>
        ))}

        {/* Buttons */}
        <TouchableOpacity style={styles.againBtn} onPress={() => navigation.replace('Game', route.params)}>
          <Text style={styles.againText}>🔄 Nochmal spielen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.replace('Setup')}>
          <Text style={styles.homeText}>🏠 Neues Spiel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  content: { padding: 30, alignItems: 'center', paddingTop: 60 },
  trophy: { fontSize: 80, marginBottom: 15 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 30, textAlign: 'center' },
  winnerCard: { backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25, borderWidth: 2, borderColor: '#FFD700', width: '100%' },
  winnerEmoji: { fontSize: 40, marginBottom: 8 },
  winnerName: { color: '#FFD700', fontSize: 26, fontWeight: 'bold', marginBottom: 5 },
  winnerScore: { color: '#fff', fontSize: 22, fontWeight: '600' },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: '#2a2a4a' },
  firstRow: { borderColor: '#FFD700', borderWidth: 2 },
  rank: { fontSize: 24, marginRight: 15 },
  playerName: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '600' },
  playerScore: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  againBtn: { backgroundColor: '#e94560', paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center', marginTop: 25 },
  againText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  homeBtn: { backgroundColor: '#16213e', paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  homeText: { color: '#aaa', fontSize: 16 },
});
