import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Vibration } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

interface VoiceInputProps {
  onSubmit: (cityName: string) => void;
  placeholder?: string;
}

export default function VoiceInput({ onSubmit, placeholder = "Stadtname eingeben..." }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [partialResult, setPartialResult] = useState('');
  
  useEffect(() => {
    setupVoice();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);
  
  const setupVoice = async () => {
    try {
      const available = await Voice.isAvailable();
      setVoiceAvailable(!!available);
      
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
          const spoken = e.value[0];
          setText(spoken);
          setIsListening(false);
          Vibration.vibrate(100);
        }
      };
      
      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
          setPartialResult(e.value[0]);
        }
      };
      
      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        console.error('Speech error:', e.error);
        setIsListening(false);
        setPartialResult('');
      };
      
      Voice.onSpeechEnd = () => {
        setIsListening(false);
        setPartialResult('');
      };
    } catch (error) {
      console.error('Voice setup error:', error);
      setVoiceAvailable(false);
    }
  };
  
  const startListening = async () => {
    try {
      setIsListening(true);
      setPartialResult('');
      setText('');
      await Voice.start('de-DE'); // German by default, could be configurable
    } catch (error) {
      console.error('Voice start error:', error);
      setIsListening(false);
      // Fallback: show instructions for manual input
      setVoiceAvailable(false);
    }
  };
  
  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };
  
  const handleSubmit = () => {
    const answer = text.trim() || partialResult.trim();
    if (answer) {
      onSubmit(answer);
      setText('');
      setPartialResult('');
    }
  };
  
  const displayText = text || partialResult;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Deine Antwort</Text>
      
      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={displayText}
          onChangeText={(t) => {
            setText(t);
            setPartialResult('');
          }}
          placeholder={placeholder}
          placeholderTextColor="#555"
          autoFocus={true}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          selectionColor="#e94560"
        />
      </View>
      
      {/* Buttons */}
      <View style={styles.buttonRow}>
        {voiceAvailable ? (
          <TouchableOpacity 
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]} 
            onPress={isListening ? stopListening : startListening}
            activeOpacity={0.7}
          >
            <Text style={styles.voiceButtonText}>
              {isListening ? '🔴 Stopp' : '🎤 Sprechen'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.voiceButtonDisabled}>
            <Text style={styles.voiceButtonDisabledText}>🎤 Nicht verfügbar</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.submitButton, !displayText.trim() && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={!displayText.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>✓ Antwort</Text>
        </TouchableOpacity>
      </View>
      
      {/* Status */}
      {isListening && (
        <View style={styles.listeningContainer}>
          <Text style={styles.listeningText}>🔴 Höre zu...</Text>
          {partialResult ? (
            <Text style={styles.partialText}>"{partialResult}"</Text>
          ) : (
            <Text style={styles.hintText}>Sprich jetzt den Stadtnamen</Text>
          )}
        </View>
      )}
      
      {!voiceAvailable && !isListening && (
        <Text style={styles.fallbackHint}>
          💡 Tipp: Stadtname eintippen und "Antwort" drücken
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  title: { 
    color: '#e94560', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  inputContainer: { marginBottom: 15 },
  textInput: { 
    backgroundColor: '#0f3460', 
    color: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#2a2a4a',
    textAlign: 'center',
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15,
    gap: 10,
  },
  voiceButton: { 
    flex: 1, 
    backgroundColor: '#16213e', 
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a4a',
  },
  voiceButtonActive: { 
    backgroundColor: '#3d0000',
    borderColor: '#e94560',
  },
  voiceButtonText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600',
  },
  voiceButtonDisabled: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  voiceButtonDisabledText: {
    color: '#555',
    fontSize: 14,
  },
  submitButton: { 
    flex: 1, 
    backgroundColor: '#e94560', 
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: { 
    backgroundColor: '#333',
    shadowOpacity: 0,
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  listeningContainer: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  listeningText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  partialText: {
    color: '#fff',
    fontSize: 18,
    fontStyle: 'italic',
  },
  hintText: {
    color: '#888',
    fontSize: 14,
  },
  fallbackHint: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
});
