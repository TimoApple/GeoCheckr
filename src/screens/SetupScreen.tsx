// GeoCheckr — Player Setup
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

export default function SetupScreen({ navigation }: any) {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [mode, setMode] = useState<'solo' | 'duo'>('solo');
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>('leicht');

  const canStart = mode === 'solo' ? player1.trim().length > 0 : player1.trim().length > 0 && player2.trim().length > 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>GeoCheckr</Text>
      <Text style={styles.subtitle}>Spieler einrichten</Text>

      {/* Mode Toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'solo' && styles.modeBtnActive]}
          onPress={() => setMode('solo')}
        >
          <Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>👤 Solo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'duo' && styles.modeBtnActive]}
          onPress={() => setMode('duo')}
        >
          <Text style={[styles.modeText, mode === 'duo' && styles.modeTextActive]}>👥 Duo</Text>
        </TouchableOpacity>
      </View>

      {/* Player Names */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Spieler 1</Text>
        <TextInput
          style={styles.input}
          placeholder="Name..."
          placeholderTextColor="#555"
          value={player1}
          onChangeText={setPlayer1}
          maxLength={20}
          autoCapitalize="words"
        />
      </View>

      {mode === 'duo' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Spieler 2</Text>
          <TextInput
            style={styles.input}
            placeholder="Name..."
            placeholderTextColor="#555"
            value={player2}
            onChangeText={setPlayer2}
            maxLength={20}
            autoCapitalize="words"
          />
        </View>
      )}

      {/* Difficulty */}
      <Text style={styles.label}>Schwierigkeit</Text>
      <View style={styles.diffRow}>
        {(['leicht', 'mittel', 'schwer'] as const).map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={styles.diffIcon}>
              {d === 'leicht' ? '😊' : d === 'mittel' ? '🤔' : '🔥'}
            </Text>
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start */}
      <TouchableOpacity
        style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
        disabled={!canStart}
        onPress={() => navigation.replace('Game', {
          players: mode === 'solo'
            ? [{ id: 1, name: player1.trim() || 'Spieler 1' }]
            : [
                { id: 1, name: player1.trim() || 'Spieler 1' },
                { id: 2, name: player2.trim() || 'Spieler 2' },
              ],
          difficulty,
          rounds: 10,
        })}
      >
        <Text style={styles.startText}>Starten 🚀</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', paddingHorizontal: 30, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 35 },
  modeRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  modeBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#333', backgroundColor: '#16213e', alignItems: 'center' },
  modeBtnActive: { borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,0.15)' },
  modeText: { color: '#888', fontSize: 16, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 15 },
  label: { color: '#888', fontSize: 13, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#16213e', color: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a' },
  diffRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  diffBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#333', backgroundColor: '#16213e', alignItems: 'center' },
  diffBtnActive: { borderColor: '#e94560' },
  diffIcon: { fontSize: 24, marginBottom: 4 },
  diffText: { color: '#888', fontSize: 13, fontWeight: '600' },
  diffTextActive: { color: '#fff' },
  startBtn: { backgroundColor: '#e94560', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  startBtnDisabled: { backgroundColor: '#333' },
  startText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
