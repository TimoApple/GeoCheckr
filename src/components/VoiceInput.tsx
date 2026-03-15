// GeoCheckr — Simple Text Input (no WebView, no crashes)
// Just a text input with submit button

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Vibration } from 'react-native';

interface VoiceInputProps {
  onSubmit: (cityName: string) => void;
  placeholder?: string;
}

export default function VoiceInput({ onSubmit, placeholder = "Stadtname eingeben..." }: VoiceInputProps) {
  const [text, setText] = useState('');
  
  const handleSubmit = () => {
    if (text.trim()) {
      Vibration.vibrate(50);
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏙️ Stadt erraten</Text>
      
      {/* Text Input */}
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        selectionColor="#e94560"
        autoCorrect={false}
        autoCapitalize="words"
      />
      
      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.submitButtonText}>✓ Antwort abgeben</Text>
      </TouchableOpacity>
      
      {/* Hint */}
      <Text style={styles.hint}>
        💡 Stadtnamen eintippen und ✓ drücken
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  title: { 
    color: '#e94560', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  textInput: { 
    backgroundColor: '#0f3460', 
    color: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    fontSize: 20,
    borderWidth: 2,
    borderColor: '#2a2a4a',
    textAlign: 'center',
    width: '100%',
    marginBottom: 15,
  },
  submitButton: { 
    width: '100%',
    backgroundColor: '#e94560', 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: { 
    backgroundColor: '#333',
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  hint: {
    color: '#666',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
