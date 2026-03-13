import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';

interface VoiceInputProps {
  onSubmit: (cityName: string) => void;
  placeholder?: string;
}

export default function VoiceInput({ onSubmit, placeholder = "Stadtname eingeben..." }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Simulate voice recognition (in real app, use Web Speech API)
  const startListening = () => {
    setIsListening(true);
    // Simulate voice recognition delay
    setTimeout(() => {
      setIsListening(false);
      // For now, just show an alert - in real app, this would use speech recognition
      Alert.alert(
        'Spracheingabe',
        'Spracheingabe wird simuliert. Bitte Textfeld verwenden.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }, 2000);
  };
  
  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Deine Antwort</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#666"
          autoFocus={true}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]} 
          onPress={startListening}
          disabled={isListening}
        >
          <Text style={styles.voiceButtonText}>
            {isListening ? '🔴 Höre zu...' : '🎤 Sprechen'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={!text.trim()}
        >
          <Text style={styles.submitButtonText}>✓ Antwort</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.hint}>
        Tipp: Nutze die Spracheingabe für schnellere Antworten
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  title: { color: '#e94560', fontSize: 20, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
  inputContainer: { marginBottom: 15 },
  textInput: { 
    backgroundColor: '#16213e', 
    color: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a'
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  voiceButton: { 
    flex: 1, 
    backgroundColor: '#0f3460', 
    padding: 15, 
    borderRadius: 10, 
    marginRight: 10,
    alignItems: 'center' 
  },
  voiceButtonActive: { backgroundColor: '#e94560' },
  voiceButtonText: { color: '#fff', fontSize: 16 },
  submitButton: { 
    flex: 1, 
    backgroundColor: '#e94560', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  submitButtonDisabled: { backgroundColor: '#333' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { color: '#666', fontSize: 14, textAlign: 'center' },
});
