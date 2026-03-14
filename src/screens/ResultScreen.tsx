import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration } from 'react-native';

export default function ResultScreen({ route, navigation }: any) {
  const { winner, scores, players } = route.params || {
    winner: { name: 'Spieler 1', id: 1 },
    scores: { 1: 10, 2: 7 },
    players: [{ id: 1, name: 'Spieler 1' }, { id: 2, name: 'Spieler 2' }]
  };
  
  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  
  // Animations
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Celebration animation
    Vibration.vibrate([200, 100, 200, 100, 400]);
    
    Animated.sequence([
      Animated.spring(trophyScale, {
        toValue: 1.2,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyRotate, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(trophyRotate, { toValue: -1, duration: 1000, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    ).start();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);
  
  const trophyRotation = trophyRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.trophyContainer}>
        <Animated.Text 
          style={[
            styles.trophy, 
            { 
              transform: [
                { scale: trophyScale },
                { rotate: trophyRotation }
              ] 
            }
          ]}
        >
          🏆
        </Animated.Text>
        <Text style={styles.winnerText}>{winner.name} gewinnt!</Text>
        <Text style={styles.scoreText}>{scores[winner.id]} Punkte</Text>
        <View style={styles.confettiRow}>
          <Text style={styles.confetti}>🎉</Text>
          <Text style={styles.confetti}>⭐</Text>
          <Text style={styles.confetti}>🎊</Text>
          <Text style={styles.confetti}>⭐</Text>
          <Text style={styles.confetti}>🎉</Text>
        </View>
      </View>
      
      <Animated.View 
        style={[
          styles.leaderboard, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.leaderboardTitle}>📊 Endstand</Text>
        {sortedPlayers.map((player, index) => {
          const medals = ['🥇', '🥈', '🥉'];
          const medal = index < 3 ? medals[index] : `${index + 1}.`;
          
          return (
            <View 
              key={player.id} 
              style={[
                styles.playerRow,
                index === 0 && styles.winnerRow,
                index === sortedPlayers.length - 1 && styles.lastRow,
              ]}
            >
              <Text style={styles.rank}>{medal}</Text>
              <Text style={[
                styles.playerName,
                player.id === winner.id && styles.winnerName
              ]}>
                {player.name}
              </Text>
              <Text style={styles.playerScore}>{scores[player.id] || 0}</Text>
            </View>
          );
        })}
      </Animated.View>
      
      <Animated.View 
        style={[styles.buttonContainer, { opacity: fadeAnim }]}
      >
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Setup')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>🔄 Revanche!</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>🏠 Hauptmenü</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  
  trophyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 20,
  },
  trophy: { 
    fontSize: 100, 
    marginBottom: 15,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  winnerText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#FFD700', 
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scoreText: { 
    fontSize: 24, 
    color: '#fff', 
    marginBottom: 15 
  },
  confettiRow: {
    flexDirection: 'row',
    gap: 15,
  },
  confetti: {
    fontSize: 28,
  },
  
  leaderboard: { 
    backgroundColor: '#16213e', 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  leaderboardTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#fff', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  playerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2a2a4a' 
  },
  winnerRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 2,
    borderBottomWidth: 0,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rank: { 
    width: 40, 
    fontSize: 20, 
    textAlign: 'center',
  },
  playerName: { 
    flex: 1, 
    fontSize: 18, 
    color: '#fff' 
  },
  winnerName: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  playerScore: { 
    fontSize: 20, 
    color: '#e94560', 
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  
  buttonContainer: { 
    marginBottom: 20 
  },
  primaryButton: { 
    backgroundColor: '#e94560', 
    paddingVertical: 18, 
    borderRadius: 12, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  secondaryButton: { 
    backgroundColor: '#16213e', 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#2a2a4a' 
  },
  secondaryButtonText: { 
    color: '#ccc', 
    fontSize: 16 
  },
});
