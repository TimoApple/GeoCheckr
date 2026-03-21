// GeoCheckr — Game App with Street View
// Two modes: Audio (speak city) or Map (place marker like GeoGuessr)
// Working Street View via WebView + Maps JS API
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Vibration, StatusBar, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// 50 verified locations with exact Street View coordinates
const LOCATIONS = [
  { id:1, city:'Paris', country:'Frankreich', lat:48.8584, lng:2.2945 },
  { id:2, city:'Tokyo', country:'Japan', lat:35.6595, lng:139.7004 },
  { id:3, city:'Berlin', country:'Deutschland', lat:52.52, lng:13.405 },
  { id:4, city:'Rom', country:'Italien', lat:41.8900, lng:12.4920 },
  { id:5, city:'Sydney', country:'Australien', lat:-33.8568, lng:151.2154 },
  { id:6, city:'New York', country:'USA', lat:40.7580, lng:-73.9855 },
  { id:7, city:'London', country:'UK', lat:51.5007, lng:-0.1246 },
  { id:8, city:'Barcelona', country:'Spanien', lat:41.4036, lng:2.1744 },
  { id:9, city:'Dubai', country:'VAE', lat:25.1972, lng:55.2744 },
  { id:10, city:'Amsterdam', country:'Niederlande', lat:52.3727, lng:4.8926 },
  { id:11, city:'Wien', country:'Österreich', lat:48.2081, lng:16.3729 },
  { id:12, city:'Prag', country:'Tschechien', lat:50.0865, lng:14.4114 },
  { id:13, city:'Budapest', country:'Ungarn', lat:47.5070, lng:19.0459 },
  { id:14, city:'Stockholm', country:'Schweden', lat:59.3254, lng:18.0712 },
  { id:15, city:'Oslo', country:'Norwegen', lat:59.9070, lng:10.7528 },
  { id:16, city:'Kopenhagen', country:'Dänemark', lat:55.6800, lng:12.5906 },
  { id:17, city:'Hamburg', country:'Deutschland', lat:53.5505, lng:9.9928 },
  { id:18, city:'München', country:'Deutschland', lat:48.1374, lng:11.5755 },
  { id:19, city:'Zürich', country:'Schweiz', lat:47.3763, lng:8.5401 },
  { id:20, city:'Madrid', country:'Spanien', lat:40.4169, lng:-3.7035 },
  { id:21, city:'Lissabon', country:'Portugal', lat:38.7073, lng:-9.1364 },
  { id:22, city:'Dublin', country:'Irland', lat:53.3456, lng:-6.2637 },
  { id:23, city:'San Francisco', country:'USA', lat:37.8198, lng:-122.4785 },
  { id:24, city:'Chicago', country:'USA', lat:41.8827, lng:-87.6226 },
  { id:25, city:'Toronto', country:'Kanada', lat:43.6427, lng:-79.3872 },
  { id:26, city:'Bangkok', country:'Thailand', lat:13.7436, lng:100.4886 },
  { id:27, city:'Seoul', country:'Südkorea', lat:37.5719, lng:126.9767 },
  { id:28, city:'Istanbul', country:'Türkei', lat:41.0076, lng:28.9793 },
  { id:29, city:'Kapstadt', country:'Südafrika', lat:-33.9038, lng:18.4219 },
  { id:30, city:'Nairobi', country:'Kenia', lat:-1.2864, lng:36.8172 },
  { id:31, city:'Buenos Aires', country:'Argentinien', lat:-34.6036, lng:-58.3816 },
  { id:32, city:'Lima', country:'Peru', lat:-12.0464, lng:-77.0429 },
  { id:33, city:'Mexiko-Stadt', country:'Mexiko', lat:19.4326, lng:-99.1332 },
  { id:34, city:'Bogotá', country:'Kolumbien', lat:4.5980, lng:-74.0755 },
  { id:35, city:'Singapur', country:'Singapur', lat:1.2837, lng:103.8605 },
  { id:36, city:'Kuala Lumpur', country:'Malaysia', lat:3.1574, lng:101.7109 },
  { id:37, city:'Taipei', country:'Taiwan', lat:25.0338, lng:121.5646 },
  { id:38, city:'Melbourne', country:'Australien', lat:-37.8179, lng:144.9675 },
  { id:39, city:'Mailand', country:'Italien', lat:45.4641, lng:9.1906 },
  { id:40, city:'Brüssel', country:'Belgien', lat:50.8466, lng:4.3526 },
  { id:41, city:'Edinburgh', country:'Schottland', lat:55.9508, lng:-3.1869 },
  { id:42, city:'Warschau', country:'Polen', lat:52.2495, lng:21.0126 },
  { id:43, city:'Tallinn', country:'Estland', lat:59.4371, lng:24.7453 },
  { id:44, city:'Riga', country:'Lettland', lat:56.9496, lng:24.1053 },
  { id:45, city:'Miami', country:'USA', lat:25.7907, lng:-80.1300 },
  { id:46, city:'Vancouver', country:'Kanada', lat:49.2978, lng:-123.1456 },
  { id:47, city:'Auckland', country:'Neuseeland', lat:-36.8485, lng:174.7625 },
  { id:48, city:'Sevilla', country:'Spanien', lat:37.3772, lng:-5.9869 },
  { id:49, city:'Bergen', country:'Norwegen', lat:60.3969, lng:5.3232 },
  { id:50, city:'Rio de Janeiro', country:'Brasilien', lat:-22.9705, lng:-43.1829 },
];

// Haversine distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calcPoints(dist) {
  if (dist < 50) return 5;
  if (dist < 200) return 4;
  if (dist < 750) return 3;
  if (dist < 2500) return 2;
  if (dist < 7500) return 1;
  return 0;
}

function fmtDist(km) {
  if (km < 1) return Math.round(km * 1000) + 'm';
  return km.toFixed(1) + ' km';
}

// ─── Street View HTML ───
function streetViewHtml(lat, lng) {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#p{width:100%;height:100%;overflow:hidden;background:#0a0a14}
#s{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;text-align:center;font-family:sans-serif}
#s .e{font-size:48px;margin-bottom:16px}#s.hide{display:none}</style></head><body>
<div id="p"></div><div id="s"><div class="e">🔍</div><div>Lade...</div></div>
<script>function init(){var sv=new google.maps.StreetViewService();
sv.getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,
preference:google.maps.StreetViewPreference.NEAREST,
source:google.maps.StreetViewSource.OUTDOOR},function(d,s){
if(s===google.maps.StreetViewStatus.OK){document.getElementById('s').className='hide';
new google.maps.StreetViewPanorama(document.getElementById('p'),{
pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:1,
addressControl:false,showRoadLabels:false,linksControl:true,
panControl:false,zoomControl:true,fullscreenControl:false,
motionTracking:false,motionTrackingControl:false,
enableCloseButton:false,scrollwheel:true,clickToGo:true});}
else{document.getElementById('s').innerHTML='<div class="e">📷</div><div>Kein Street View</div>';}});
}window.gm_authFailure=function(){document.getElementById('s').innerHTML='<div class="e" style="color:red">⚠️</div><div>API Key Fehler</div>';};</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init"></script>
</body></html>`;
}

// ─── Map HTML (for marker placement) ───
function mapHtml(targetLat, targetLng) {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%}
#confirm{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#ff3333;color:#fff;
border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:bold;z-index:10;display:none}
#hint{position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;
padding:8px 16px;border-radius:8px;font-size:14px;z-index:10;font-family:sans-serif}</style></head>
<body><div id="m"></div><div id="hint">📍 Setze deinen Marker!</div><button id="confirm" onclick="submit()">✓ Bestätigen</button>
<script>var marker,chosenLat,chosenLng;
function init(){var map=new google.maps.Map(document.getElementById('m'),{
center:{lat:20,lng:0},zoom:2,mapTypeId:'roadmap',streetViewControl:false,
mapTypeControl:false,fullscreenControl:false,zoomControl:true});
map.addListener('click',function(e){chosenLat=e.latLng.lat();chosenLng=e.latLng.lng();
if(marker)marker.setMap(null);marker=new google.maps.Marker({position:e.latLng,map:map,animation:google.maps.Animation.DROP});
document.getElementById('confirm').style.display='block';});}
function submit(){if(chosenLat!==undefined){window.ReactNativeWebView.postMessage(JSON.stringify({lat:chosenLat,lng:chosenLng}));}}
window.gm_authFailure=function(){document.getElementById('hint').innerHTML='⚠️ API Key Fehler';document.getElementById('hint').style.color='red';};
</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init"></script></body></html>`;
}

// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('home'); // home, streetview, map, result, summary
  const [gameMode, setGameMode] = useState('map'); // 'audio' or 'map'
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [usedIds, setUsedIds] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);

  const timerRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    if (screen === 'streetview' && timer > 0) {
      timerRef.current = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (timer === 0 && screen === 'streetview') {
      Vibration.vibrate(500);
      if (gameMode === 'map') { setMapVisible(true); setScreen('map'); }
      else { handleAnswer(''); }
    }
  }, [screen, timer]);

  const pickLocation = useCallback(() => {
    const available = LOCATIONS.filter(l => !usedIds.includes(l.id));
    const loc = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setUsedIds(prev => [...prev, loc.id]);
    setCurrentLoc(loc);
    setTimer(30);
    setScreen('streetview');
  }, [usedIds]);

  const startGame = (mode) => {
    setGameMode(mode);
    setRound(1);
    setScore(0);
    setUsedIds([]);
    setHistory([]);
    pickLocation();
  };

  const handleAnswer = (answer) => {
    clearInterval(timerRef.current);
    let dist = 20000;
    let matched = null;

    if (typeof answer === 'object' && answer.lat !== undefined) {
      // Map marker answer
      dist = haversine(currentLoc.lat, currentLoc.lng, answer.lat, answer.lng);
      matched = LOCATIONS.reduce((closest, loc) => {
        const d = haversine(answer.lat, answer.lng, loc.lat, loc.lng);
        return d < (closest.dist || Infinity) ? { city: loc.city, dist: d } : closest;
      }, { city: '?', dist: Infinity });
    } else if (typeof answer === 'string' && answer.trim()) {
      // Audio text answer
      const norm = answer.toLowerCase().trim()
        .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
      matched = LOCATIONS.find(l =>
        l.city.toLowerCase() === norm ||
        l.city.toLowerCase().includes(norm) ||
        norm.includes(l.city.toLowerCase())
      );
      if (matched) dist = haversine(currentLoc.lat, currentLoc.lng, matched.lat, matched.lng);
    }

    const pts = calcPoints(dist);
    setScore(s => s + pts);
    const result = {
      city: currentLoc.city,
      answer: typeof answer === 'object' ? (matched?.city || '?') : (answer || '—'),
      dist, pts
    };
    setLastResult(result);
    setHistory(h => [...h, result]);
    setScreen('result');

    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    if (pts >= 4) { Vibration.vibrate([100,50,100]); }
    else if (pts > 0) { Vibration.vibrate(100); }
    else { Vibration.vibrate(500); }
  };

  const nextRound = () => {
    scaleAnim.setValue(0);
    setMapVisible(false);
    if (round >= maxRounds) {
      setScreen('summary');
    } else {
      setRound(r => r + 1);
      pickLocation();
    }
  };

  // ─── HOME SCREEN ───
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Text style={styles.title}>🌍 GeoCheckr</Text>
        <Text style={styles.subtitle}>Wie gut kennst du die Welt?</Text>
        <View style={styles.modeContainer}>
          <TouchableOpacity style={styles.modeBtn} onPress={() => startGame('map')}>
            <Text style={styles.modeEmoji}>📍</Text>
            <Text style={styles.modeTitle}>Map Mode</Text>
            <Text style={styles.modeDesc}>Marker auf Google Maps setzen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeBtn} onPress={() => startGame('audio')}>
            <Text style={styles.modeEmoji}>🎤</Text>
            <Text style={styles.modeTitle}>Audio Mode</Text>
            <Text style={styles.modeDesc}>Stadt per Stimme nennen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── STREET VIEW SCREEN ───
  if (screen === 'streetview' && currentLoc) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <WebView
          key={currentLoc.id}
          source={{ html: streetViewHtml(currentLoc.lat, currentLoc.lng) }}
          style={StyleSheet.absoluteFill}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36"
        />
        {/* Timer */}
        <View style={styles.timerBadge}>
          <Text style={[styles.timerText, timer <= 5 && { color: '#ff4444' }]}>{timer}</Text>
        </View>
        {/* Round info */}
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>{round}/{maxRounds}</Text>
        </View>
        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => {
          setTimer(0);
          if (gameMode === 'map') { setMapVisible(true); setScreen('map'); }
          else { handleAnswer(''); }
        }}>
          <Text style={styles.skipText}>Ich weiß es! →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── MAP SCREEN (marker placement) ───
  if (screen === 'map' && currentLoc) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <WebView
          source={{ html: mapHtml(currentLoc.lat, currentLoc.lng) }}
          style={StyleSheet.absoluteFill}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(e) => {
            try {
              const data = JSON.parse(e.nativeEvent.data);
              handleAnswer(data);
            } catch {}
          }}
        />
      </View>
    );
  }

  // ─── AUDIO SCREEN (voice input) ───
  // (simplified: text input for now, voice would need expo-speech-recognition)
  // For audio mode, we go directly to result with empty answer or a text prompt

  // ─── RESULT SCREEN ───
  if (screen === 'result' && lastResult) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Animated.View style={[styles.resultContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.resultEmoji}>
            {lastResult.pts >= 4 ? '🎯' : lastResult.pts > 0 ? '👍' : '😅'}
          </Text>
          <Text style={[styles.resultTitle, lastResult.pts > 0 ? { color: '#4CAF50' } : { color: '#ff4444' }]}>
            {lastResult.pts >= 4 ? 'Perfekt!' : lastResult.pts >= 2 ? 'Gut!' : lastResult.pts > 0 ? 'OK!' : 'Daneben!'}
          </Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultRow}>📍 Ort: <Text style={styles.resultVal}>{lastResult.city}</Text></Text>
            <Text style={styles.resultRow}>📝 Antwort: <Text style={styles.resultVal}>{lastResult.answer}</Text></Text>
            <Text style={styles.resultRow}>📏 Distanz: <Text style={styles.resultVal}>{fmtDist(lastResult.dist)}</Text></Text>
            <Text style={styles.resultRow}>⭐ Punkte: <Text style={[styles.resultVal, { color: '#4CAF50', fontSize: 22 }]}>+{lastResult.pts}</Text></Text>
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={nextRound}>
            <Text style={styles.nextBtnText}>
              {round >= maxRounds ? '🏆 Ergebnis' : `Runde ${round + 1}/${maxRounds} →`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── SUMMARY SCREEN ───
  if (screen === 'summary') {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Text style={styles.summaryTitle}>🏆 Spiel beendet!</Text>
        <Text style={styles.summaryScore}>{score} / {maxRounds * 5} Punkte</Text>
        {history.map((h, i) => (
          <View key={i} style={styles.historyRow}>
            <Text style={styles.historyNum}>{i + 1}.</Text>
            <Text style={styles.historyCity}>{h.city}</Text>
            <Text style={styles.historyDist}>{fmtDist(h.dist)}</Text>
            <Text style={styles.historyPts}>+{h.pts}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.restartBtn} onPress={() => { setScreen('home'); setMapVisible(false); }}>
          <Text style={styles.restartBtnText}>🔄 Nochmal spielen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14', justifyContent: 'center', alignItems: 'center' },

  // Home
  title: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 40 },
  modeContainer: { flexDirection: 'row', gap: 16 },
  modeBtn: { backgroundColor: '#12121f', borderRadius: 16, padding: 24, alignItems: 'center', width: 160, borderWidth: 1, borderColor: '#1e1e30' },
  modeEmoji: { fontSize: 40, marginBottom: 10 },
  modeTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modeDesc: { color: '#888', fontSize: 12, textAlign: 'center' },

  // Timer
  timerBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 24, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ff3333', zIndex: 10 },
  timerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  roundBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, zIndex: 10 },
  roundText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  skipBtn: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, borderWidth: 1, borderColor: '#4CAF50', zIndex: 10 },
  skipText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },

  // Result
  resultContainer: { alignItems: 'center', padding: 20, width: '100%' },
  resultEmoji: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 30, fontWeight: 'bold', marginBottom: 20 },
  resultCard: { backgroundColor: '#12121f', borderRadius: 15, padding: 20, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#1e1e30' },
  resultRow: { color: '#888', fontSize: 16, paddingVertical: 8 },
  resultVal: { color: '#fff', fontWeight: '600' },
  nextBtn: { backgroundColor: '#ff3333', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 14, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Summary
  summaryTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  summaryScore: { color: '#FFD700', fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e30', width: '100%' },
  historyNum: { color: '#555', fontSize: 14, width: 30 },
  historyCity: { color: '#fff', fontSize: 15, flex: 1 },
  historyDist: { color: '#888', fontSize: 14, width: 80, textAlign: 'right' },
  historyPts: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold', width: 50, textAlign: 'right' },
  restartBtn: { backgroundColor: '#ff3333', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 14, marginTop: 24, width: '100%', alignItems: 'center' },
  restartBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
