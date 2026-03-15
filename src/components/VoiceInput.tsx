// GeoCheckr — Voice + Text Input
// Text input primary, microphone button for voice (Web Speech API via WebView)

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Vibration, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface VoiceInputProps {
  onSubmit: (cityName: string) => void;
  placeholder?: string;
}

const VOICE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  background: transparent; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  height: 100vh;
  font-family: -apple-system, sans-serif;
}
#mic-btn {
  width: 60px; height: 60px; border-radius: 30px;
  background: #16213e; border: 2px solid #e94560;
  color: #fff; font-size: 24px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
#mic-btn.listening { background: #e94560; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
#status { color: #aaa; font-size: 12px; margin-top: 6px; text-align: center; }
</style>
</head>
<body>
<div style="text-align:center">
  <button id="mic-btn" onclick="toggle()">🎤</button>
  <div id="status">Tippen für Spracheingabe</div>
</div>
<script>
let rec = null, listening = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { document.getElementById('status').textContent = 'Nicht verfügbar'; }

function toggle() { listening ? stop() : start(); }

function start() {
  if (!SR) return;
  rec = new SR();
  rec.lang = 'de-DE'; rec.continuous = false; rec.interimResults = true;
  rec.onstart = () => {
    listening = true;
    document.getElementById('mic-btn').classList.add('listening');
    document.getElementById('mic-btn').textContent = '🔴';
    document.getElementById('status').textContent = 'Höre zu...';
    window.ReactNativeWebView.postMessage(JSON.stringify({t:'start'}));
  };
  rec.onresult = (e) => {
    let txt = '';
    for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
    if (e.results[e.results.length-1].isFinal) {
      window.ReactNativeWebView.postMessage(JSON.stringify({t:'result', v:txt}));
      stop();
    } else {
      window.ReactNativeWebView.postMessage(JSON.stringify({t:'partial', v:txt}));
    }
  };
  rec.onerror = () => { stop(); };
  rec.onend = () => { stop(); };
  try { rec.start(); } catch(e) { stop(); }
}

function stop() {
  listening = false;
  document.getElementById('mic-btn').classList.remove('listening');
  document.getElementById('mic-btn').textContent = '🎤';
  document.getElementById('status').textContent = 'Tippen für Spracheingabe';
  if (rec) { try { rec.stop(); } catch(e) {} rec = null; }
}
</script>
</body>
</html>`;

// Auto-start listening after WebView loads
const AUTO_START_JS = `
  setTimeout(() => {
    if (typeof toggle === 'function' && !listening) toggle();
  }, 500);
  true;
`;

export default function VoiceInput({ onSubmit, placeholder = "Stadtname eingeben..." }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const webViewRef = useRef<WebView>(null);
  
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.t === 'start') setIsListening(true);
      if (data.t === 'partial') setText(data.v);
      if (data.t === 'result') {
        setText(data.v);
        setIsListening(false);
        Vibration.vibrate(50);
      }
    } catch (e) {}
  };
  
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
      
      {/* Voice Button */}
      {voiceAvailable && (
        <View style={styles.voiceRow}>
          <View style={styles.webviewWrapper}>
            <WebView
              ref={webViewRef}
              source={{ html: VOICE_HTML }}
              style={styles.webview}
              onMessage={handleMessage}
              onError={() => setVoiceAvailable(false)}
              onHttpError={() => setVoiceAvailable(false)}
              onLoadEnd={() => {
                // Auto-start listening when WebView loads
                setTimeout(() => {
                  try {
                    webViewRef.current?.injectJavaScript(AUTO_START_JS);
                  } catch(e) {}
                }, 1000);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              bounces={false}
            />
          </View>
          <Text style={styles.voiceHint}>
            {isListening ? '🔴 Höre zu...' : '🎤 Oder Sprache nutzen'}
          </Text>
        </View>
      )}
      
      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.submitButtonText}>✓ Antwort abgeben</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, alignItems: 'center', width: '100%' },
  title: { color: '#e94560', fontSize: 20, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
  textInput: { 
    backgroundColor: '#0f3460', color: '#fff', padding: 16, borderRadius: 12, 
    fontSize: 20, borderWidth: 2, borderColor: '#2a2a4a', textAlign: 'center',
    width: '100%', marginBottom: 12,
  },
  voiceRow: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, 
    backgroundColor: '#0f3460', borderRadius: 12, padding: 8, width: '100%',
  },
  webviewWrapper: { width: 70, height: 70 },
  webview: { backgroundColor: 'transparent', width: 70, height: 70 },
  voiceHint: { color: '#aaa', fontSize: 14, marginLeft: 10, flex: 1 },
  submitButton: { 
    width: '100%', backgroundColor: '#e94560', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#333' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
