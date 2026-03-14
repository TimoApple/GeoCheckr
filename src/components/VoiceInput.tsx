import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Vibration } from 'react-native';
import { WebView } from 'react-native-webview';

interface VoiceInputProps {
  onSubmit: (cityName: string) => void;
  placeholder?: string;
}

// HTML page that uses Web Speech API (works in WebView without native modules)
const VOICE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: transparent; 
      font-family: -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    #mic-btn {
      width: 80px;
      height: 80px;
      border-radius: 40px;
      background: #16213e;
      border: 3px solid #2a2a4a;
      color: #fff;
      font-size: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    #mic-btn.listening {
      background: #e94560;
      border-color: #fff;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    #status {
      color: #888;
      font-size: 14px;
      margin-top: 10px;
    }
    #result {
      color: #fff;
      font-size: 18px;
      margin-top: 8px;
      min-height: 24px;
    }
  </style>
</head>
<body>
  <button id="mic-btn" onclick="toggleVoice()">🎤</button>
  <div id="status">Tippen zum Sprechen</div>
  <div id="result"></div>
  
  <script>
    let recognition = null;
    let isListening = false;
    
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      document.getElementById('status').textContent = 'Nicht unterstützt';
      document.getElementById('mic-btn').style.opacity = '0.3';
    }
    
    function toggleVoice() {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }
    
    function startListening() {
      if (!SpeechRecognition) return;
      
      recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        isListening = true;
        document.getElementById('mic-btn').classList.add('listening');
        document.getElementById('mic-btn').textContent = '🔴';
        document.getElementById('status').textContent = 'Höre zu...';
        document.getElementById('result').textContent = '';
        
        // Send status to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'listening', value: true }));
      };
      
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        document.getElementById('result').textContent = '"' + transcript + '"';
        
        if (event.results[event.results.length - 1].isFinal) {
          // Final result - send to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', value: transcript }));
          stopListening();
        } else {
          // Partial result
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'partial', value: transcript }));
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        document.getElementById('status').textContent = 'Fehler: ' + event.error;
        stopListening();
      };
      
      recognition.onend = () => {
        stopListening();
      };
      
      try {
        recognition.start();
      } catch (e) {
        document.getElementById('status').textContent = 'Fehler beim Starten';
      }
    }
    
    function stopListening() {
      isListening = false;
      document.getElementById('mic-btn').classList.remove('listening');
      document.getElementById('mic-btn').textContent = '🎤';
      document.getElementById('status').textContent = 'Tippen zum Sprechen';
      
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
        recognition = null;
      }
    }
  </script>
</body>
</html>
`;

export default function VoiceInput({ onSubmit, placeholder = "Stadtname eingeben..." }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(120);
  const webViewRef = useRef<WebView>(null);
  
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'listening':
          setIsListening(data.value);
          if (data.value) {
            setText('');
          }
          break;
        case 'partial':
          setText(data.value);
          break;
        case 'result':
          setText(data.value);
          Vibration.vibrate(100);
          setIsListening(false);
          break;
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  };
  
  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };
  
  const handleWebViewError = () => {
    // Fallback if WebView fails
    setIsListening(false);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Deine Antwort</Text>
      
      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#555"
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          selectionColor="#e94560"
        />
      </View>
      
      {/* Voice Button via WebView */}
      <View style={styles.voiceContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: VOICE_HTML }}
          style={[styles.webview, { height: webViewHeight }]}
          onMessage={handleMessage}
          onError={handleWebViewError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          containerStyle={styles.webviewContainer}
        />
      </View>
      
      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.submitButtonText}>
          {isListening ? '🎤...' : '✓ Antwort'}
        </Text>
      </TouchableOpacity>
      
      {/* Hint */}
      <Text style={styles.hint}>
        💡 Mikrofon tippen und Stadtnamen sprechen
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 15,
    alignItems: 'center',
  },
  title: { 
    color: '#e94560', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  inputContainer: { 
    width: '100%',
    marginBottom: 15,
  },
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
  voiceContainer: {
    width: '100%',
    height: 120,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  webviewContainer: {
    backgroundColor: 'transparent',
  },
  submitButton: { 
    width: '100%',
    backgroundColor: '#e94560', 
    paddingVertical: 16,
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
