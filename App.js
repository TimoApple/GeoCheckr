// GeoCheckr — Game App v2
// Design: The Cartographic Explorer
// Fonts: Space Grotesk (headlines) + Inter (body)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Vibration, StatusBar, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ═══ DESIGN TOKENS ═══
const C = {
  primary: '#bdc2ff',
  primaryContainer: '#3340ca',
  secondary: '#88da7d',
  tertiary: '#9dcaff',
  surface: '#131313',
  surfaceContainer: '#202020',
  surfaceContainerLow: '#1b1b1c',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353535',
  surfaceBright: '#393939',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#c6c5d7',
  onPrimary: '#000fa3',
  onPrimaryContainer: '#bec3ff',
  tertiaryContainer: '#235684',
  onTertiary: '#003257',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  outline: '#8f8fa0',
  outlineVariant: '#454654',
  inverseSurface: '#e5e2e1',
  inverseOnSurface: '#303030',
  inversePrimary: '#404dd6',
  tertiaryFixed: '#d1e4ff',
  secondaryFixed: '#a3f796',
  secondaryContainer: '#015b0d',
  onSecondaryFixedVariant: '#00530b',
};

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

// ═══ UTILS ═══
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

// ═══ HTML TEMPLATES ═══
function streetViewHtml(lat, lng) {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#p{width:100%;height:100%;overflow:hidden;background:#0e0e0e}
#s{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#c6c5d7;text-align:center;font-family:Inter,sans-serif}
#s .e{font-size:48px;margin-bottom:16px}#s.hide{display:none}</style></head><body>
<div id="p"></div><div id="s"><div class="e">🔍</div><div>Lade Street View...</div></div>
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
}window.gm_authFailure=function(){document.getElementById('s').innerHTML='<div class="e" style="color:#ffb4ab">⚠️</div><div>API Key Fehler</div>';};</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init"></script>
</body></html>`;
}

function mapHtml() {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%}
#confirm{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#bdc2ff,#3340ca);color:#000fa3;
border:none;padding:16px 36px;border-radius:9999px;font-size:16px;font-weight:900;z-index:10;display:none;
font-family:Space Grotesk,sans-serif;text-transform:uppercase;letter-spacing:-0.02em;cursor:pointer}
#hint{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:rgba(14,14,14,0.9);color:#e5e2e1;
padding:10px 20px;border-radius:1rem;font-size:14px;z-index:10;font-family:Inter,sans-serif;backdrop-filter:blur(20px)}</style></head>
<body><div id="m"></div><div id="hint">📍 Setze deinen Marker!</div><button id="confirm" onclick="submit()">✓ Bestätigen</button>
<script>var marker,chosenLat,chosenLng;
function init(){var map=new google.maps.Map(document.getElementById('m'),{
center:{lat:20,lng:0},zoom:2,mapTypeId:'roadmap',streetViewControl:false,
mapTypeControl:false,fullscreenControl:false,zoomControl:true,styles:[
{featureType:'all',elementType:'geometry',stylers:[{color:'#1b1b1c'}]},
{featureType:'all',elementType:'labels.text.fill',stylers:[{color:'#c6c5d7'}]},
{featureType:'water',elementType:'geometry',stylers:[{color:'#235684'}]},
{featureType:'road',elementType:'geometry',stylers:[{color:'#454654'}]},
{featureType:'landscape',elementType:'geometry',stylers:[{color:'#202020'}]}
]});
map.addListener('click',function(e){chosenLat=e.latLng.lat();chosenLng=e.latLng.lng();
if(marker)marker.setMap(null);marker=new google.maps.Marker({position:e.latLng,map:map,animation:google.maps.Animation.DROP});
document.getElementById('confirm').style.display='block';});}
function submit(){if(chosenLat!==undefined){window.ReactNativeWebView.postMessage(JSON.stringify({lat:chosenLat,lng:chosenLng}));}}
window.gm_authFailure=function(){document.getElementById('hint').innerHTML='⚠️ API Key Fehler';document.getElementById('hint').style.color='#ffb4ab';};
</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init"></script></body></html>`;
}

// ═══ APP ═══
export default function App() {
  const [screen, setScreen] = useState('home');
  const [gameMode, setGameMode] = useState('map');
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [usedIds, setUsedIds] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const timerRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (screen === 'streetview' && timer > 0) {
      timerRef.current = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (timer === 0 && screen === 'streetview') {
      Vibration.vibrate(500);
      if (gameMode === 'map') setScreen('map');
      else handleAnswer('');
    }
  }, [screen, timer]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [screen]);

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
    setRound(1); setScore(0); setUsedIds([]); setHistory([]);
    fadeAnim.setValue(0);
    pickLocation();
  };

  const handleAnswer = (answer) => {
    clearInterval(timerRef.current);
    let dist = 20000;
    let matched = null;

    if (typeof answer === 'object' && answer.lat !== undefined) {
      dist = haversine(currentLoc.lat, currentLoc.lng, answer.lat, answer.lng);
      matched = LOCATIONS.reduce((closest, loc) => {
        const d = haversine(answer.lat, answer.lng, loc.lat, loc.lng);
        return d < (closest.dist || Infinity) ? { city: loc.city, dist: d } : closest;
      }, { city: '?', dist: Infinity });
    }

    const pts = calcPoints(dist);
    setScore(s => s + pts);
    setLastResult({ city: currentLoc.city, answer: matched?.city || '—', dist, pts });
    setHistory(h => [...h, { city: currentLoc.city, answer: matched?.city || '—', dist, pts }]);
    setScreen('result');

    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    if (pts >= 4) Vibration.vibrate([100,50,100]);
    else if (pts > 0) Vibration.vibrate(100);
    else Vibration.vibrate(500);
  };

  const nextRound = () => {
    scaleAnim.setValue(0);
    if (round >= maxRounds) setScreen('summary');
    else { setRound(r => r + 1); pickLocation(); }
  };

  // ─── HOME ───
  if (screen === 'home') {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.homeBg}>
          <View style={[s.glowOrb, { top: '15%', right: -60, width: 300, height: 300, backgroundColor: C.primaryContainer }]} />
          <View style={[s.glowOrb, { bottom: '20%', left: -80, width: 350, height: 350, backgroundColor: C.secondary }]} />
        </View>
        <Animated.View style={[s.homeContent, { opacity: fadeAnim }]}>
          <Text style={s.explore}>⬡</Text>
          <Text style={s.homeTitle}>GEOCHECKR</Text>
          <Text style={s.homeSubtitle}>The Cartographic Explorer</Text>
          <View style={s.modeRow}>
            <TouchableOpacity style={s.modeBtn} onPress={() => startGame('map')}>
              <Text style={s.modeEmoji}>📍</Text>
              <Text style={s.modeTitle}>MAP MODE</Text>
              <Text style={s.modeDesc}>Marker auf Google Maps setzen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, { borderColor: C.secondary }]} onPress={() => startGame('audio')}>
              <Text style={s.modeEmoji}>🎤</Text>
              <Text style={s.modeTitle}>AUDIO MODE</Text>
              <Text style={s.modeDesc}>Stadt per Stimme nennen</Text>
            </TouchableOpacity>
          </View>
          <View style={s.statsRow}>
            <View style={s.statBadge}>
              <Text style={s.statNum}>50</Text>
              <Text style={s.statLabel}>LOCATIONS</Text>
            </View>
            <View style={s.statBadge}>
              <Text style={s.statNum}>5</Text>
              <Text style={s.statLabel}>ROUNDS</Text>
            </View>
            <View style={s.statBadge}>
              <Text style={s.statNum}>25</Text>
              <Text style={s.statLabel}>MAX PTS</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ─── STREET VIEW ───
  if (screen === 'streetview' && currentLoc) {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <WebView
          key={currentLoc.id}
          source={{ html: streetViewHtml(currentLoc.lat, currentLoc.lng) }}
          style={StyleSheet.absoluteFill}
          javaScriptEnabled domStorageEnabled sharedCookiesEnabled
          userAgent="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36"
        />
        <View style={s.timerBadge}>
          <Text style={[s.timerText, timer <= 5 && { color: C.error }]}>{timer}</Text>
        </View>
        <View style={s.roundBadge}>
          <Text style={s.roundText}>Runde {round}/{maxRounds}</Text>
        </View>
        <TouchableOpacity style={s.actionBtn} onPress={() => {
          if (gameMode === 'map') setScreen('map');
          else handleAnswer('');
        }}>
          <Text style={s.actionBtnText}>ICH WEIẞ ES →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── MAP ───
  if (screen === 'map' && currentLoc) {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <WebView
          source={{ html: mapHtml() }}
          style={StyleSheet.absoluteFill}
          javaScriptEnabled domStorageEnabled
          onMessage={(e) => { try { handleAnswer(JSON.parse(e.nativeEvent.data)); } catch {} }}
        />
      </View>
    );
  }

  // ─── RESULT ───
  if (screen === 'result' && lastResult) {
    const isGood = lastResult.pts >= 4;
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.glowOrbLg} />
        <Animated.View style={[s.resultWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.resultEmoji}>{isGood ? '🎯' : lastResult.pts > 0 ? '👍' : '😅'}</Text>
          <Text style={[s.resultTitle, { color: isGood ? C.primary : C.error }]}>
            {isGood ? 'PERFEKT' : lastResult.pts >= 2 ? 'GUT' : lastResult.pts > 0 ? 'OK' : 'DANEBEN'}
          </Text>
          <View style={s.resultCard}>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>ORT</Text>
              <Text style={s.resultValue}>{lastResult.city}</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>DISTANZ</Text>
              <Text style={s.resultValue}>{fmtDist(lastResult.dist)}</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>PUNKTE</Text>
              <Text style={[s.resultValue, { color: C.secondary, fontSize: 28 }]}>+{lastResult.pts}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.gradientBtn} onPress={nextRound}>
            <Text style={s.gradientBtnText}>
              {round >= maxRounds ? '🏆 ERGEBNIS' : `RUNDE ${round + 1}/${maxRounds} →`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── SUMMARY ───
  if (screen === 'summary') {
    const total = maxRounds * 5;
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.glowOrbLg} />
        <View style={s.summaryWrap}>
          <Text style={s.summaryTitle}>SIEG!</Text>
          <Text style={s.summarySubtitle}>Match Summary</Text>

          <View style={s.summaryCard}>
            <View style={s.scoreDisplay}>
              <Text style={s.scoreNum}>{score}</Text>
              <Text style={s.scoreDenom}>/ {total}</Text>
            </View>
            <View style={s.xpBar}>
              <View style={[s.xpFill, { width: `${(score/total)*100}%` }]} />
            </View>
            <Text style={s.xpLabel}>+{score * 100} XP earned</Text>
          </View>

          {/* Leaderboard style history */}
          <View style={s.lbCard}>
            <Text style={s.lbTitle}>FINAL STANDINGS</Text>
            {history.map((h, i) => (
              <View key={i} style={[s.lbRow, i === 0 && { backgroundColor: C.primary + '10' }]}>
                <Text style={[s.lbRank, { color: i === 0 ? C.primary : C.outline }]}>#{i+1}</Text>
                <Text style={[s.lbCity, { color: i === 0 ? C.primary : C.onSurface }]}>{h.city}</Text>
                <Text style={[s.lbDist, { color: C.onSurfaceVariant }]}>{fmtDist(h.dist)}</Text>
                <Text style={[s.lbPts, { color: C.secondary }]}>+{h.pts}</Text>
              </View>
            ))}
          </View>

          {/* Rewards */}
          <View style={s.rewardsCard}>
            <View style={s.rewardRow}>
              <Text style={s.rewardEmoji}>⭐</Text>
              <View>
                <Text style={s.rewardValue}>+{score * 100} XP</Text>
                <Text style={s.rewardLabel}>EXPERIENCE</Text>
              </View>
            </View>
            <View style={s.rewardRow}>
              <Text style={s.rewardEmoji}>🪙</Text>
              <View>
                <Text style={s.rewardValue}>+{score * 10} Map Coins</Text>
                <Text style={s.rewardLabel}>CURRENCY</Text>
              </View>
            </View>
          </View>

          <View style={s.btnCol}>
            <TouchableOpacity style={s.gradientBtn} onPress={() => { setScreen('home'); }}>
              <Text style={s.gradientBtnText}>PLAY AGAIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.outlineBtn} onPress={() => setScreen('home')}>
              <Text style={s.outlineBtnText}>BACK TO HUB</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

// ═══ STYLES ═══
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surfaceContainerLowest, justifyContent: 'center', alignItems: 'center' },

  // Home
  homeBg: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  glowOrb: { position: 'absolute', borderRadius: 9999, opacity: 0.15, backgroundColor: C.primary },
  glowOrbLg: { position: 'absolute', top: '10%', right: -100, width: 400, height: 400, borderRadius: 9999, backgroundColor: C.primaryContainer, opacity: 0.1, zIndex: 0 },
  homeContent: { alignItems: 'center', zIndex: 1, paddingHorizontal: 24 },
  explore: { fontSize: 32, color: C.primary, marginBottom: 12 },
  homeTitle: { fontSize: 48, fontWeight: '900', letterSpacing: -2, color: C.primary, fontFamily: 'Space Grotesk', textTransform: 'uppercase', marginBottom: 4 },
  homeSubtitle: { fontSize: 12, color: C.onSurfaceVariant, letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'Inter', fontWeight: '600', marginBottom: 40 },
  modeRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  modeBtn: { backgroundColor: C.surfaceContainer, borderRadius: 16, padding: 24, alignItems: 'center', width: SCREEN_W * 0.38, borderWidth: 1, borderColor: C.outlineVariant },
  modeEmoji: { fontSize: 36, marginBottom: 12 },
  modeTitle: { color: C.onSurface, fontSize: 14, fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: -0.5, textTransform: 'uppercase', marginBottom: 4 },
  modeDesc: { color: C.onSurfaceVariant, fontSize: 11, textAlign: 'center', fontFamily: 'Inter' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBadge: { backgroundColor: C.surfaceContainer, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: C.outlineVariant },
  statNum: { color: C.primary, fontSize: 20, fontWeight: '900', fontFamily: 'Space Grotesk' },
  statLabel: { color: C.onSurfaceVariant, fontSize: 9, fontFamily: 'Inter', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },

  // Timer
  timerBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(14,14,14,0.9)', borderRadius: 9999, width: 52, height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.error, zIndex: 10 },
  timerText: { color: C.onSurface, fontSize: 22, fontWeight: '900', fontFamily: 'Space Grotesk' },
  roundBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(14,14,14,0.9)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, zIndex: 10 },
  roundText: { color: C.onSurfaceVariant, fontSize: 13, fontWeight: '600', fontFamily: 'Inter' },

  // Action button
  actionBtn: { position: 'absolute', bottom: 28, alignSelf: 'center', backgroundColor: C.surfaceBright, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 9999, borderWidth: 1, borderColor: C.secondary, zIndex: 10 },
  actionBtnText: { color: C.secondary, fontSize: 15, fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: -0.5 },

  // Result
  resultWrap: { alignItems: 'center', padding: 24, width: '100%', zIndex: 1 },
  resultEmoji: { fontSize: 64, marginBottom: 8 },
  resultTitle: { fontSize: 40, fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: -1, textTransform: 'uppercase', marginBottom: 24 },
  resultCard: { backgroundColor: C.surfaceContainer, borderRadius: 16, padding: 24, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: C.outlineVariant },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  resultLabel: { color: C.onSurfaceVariant, fontSize: 11, fontFamily: 'Inter', letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  resultValue: { color: C.onSurface, fontSize: 18, fontWeight: '700', fontFamily: 'Space Grotesk' },

  // Summary
  summaryWrap: { flex: 1, width: '100%', paddingHorizontal: 20, paddingTop: 60, zIndex: 1 },
  summaryTitle: { fontSize: 56, fontWeight: '900', fontFamily: 'Space Grotesk', color: C.primary, textAlign: 'center', letterSpacing: -2, textTransform: 'uppercase', fontStyle: 'italic' },
  summarySubtitle: { color: C.onSurfaceVariant, fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  summaryCard: { backgroundColor: C.surfaceContainer, borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: C.outlineVariant },
  scoreDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 16 },
  scoreNum: { color: C.onSurface, fontSize: 48, fontWeight: '900', fontFamily: 'Space Grotesk' },
  scoreDenom: { color: C.onSurfaceVariant, fontSize: 16, fontFamily: 'Inter', marginLeft: 4 },
  xpBar: { height: 12, backgroundColor: C.surfaceContainerHighest, borderRadius: 9999, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: C.secondary, borderRadius: 9999, shadowColor: C.secondary, shadowOpacity: 0.4, shadowRadius: 10 },
  xpLabel: { color: C.secondaryFixed, fontSize: 11, fontFamily: 'Inter', textAlign: 'right', fontStyle: 'italic' },

  lbCard: { backgroundColor: C.surfaceContainerLow, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: C.outlineVariant },
  lbTitle: { color: C.onSurface, fontSize: 14, fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: 1, textTransform: 'uppercase', padding: 16, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '20' },
  lbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '08' },
  lbRank: { fontSize: 20, fontWeight: '900', fontFamily: 'Space Grotesk', fontStyle: 'italic', width: 36 },
  lbCity: { fontSize: 16, fontWeight: '700', fontFamily: 'Space Grotesk', flex: 1 },
  lbDist: { fontSize: 12, fontFamily: 'Inter', width: 80, textAlign: 'right' },
  lbPts: { fontSize: 16, fontWeight: '900', fontFamily: 'Space Grotesk', width: 50, textAlign: 'right' },

  rewardsCard: { backgroundColor: C.surfaceContainerHigh, borderRadius: 16, padding: 20, marginBottom: 16, gap: 16 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rewardEmoji: { fontSize: 28 },
  rewardValue: { color: C.onSurface, fontSize: 18, fontWeight: '800', fontFamily: 'Space Grotesk' },
  rewardLabel: { color: C.onSurfaceVariant, fontSize: 9, fontFamily: 'Inter', letterSpacing: 2, textTransform: 'uppercase' },

  // Buttons
  gradientBtn: { backgroundColor: C.primaryContainer, paddingVertical: 18, borderRadius: 9999, width: '100%', alignItems: 'center', shadowColor: C.primaryContainer, shadowOpacity: 0.3, shadowRadius: 20 },
  gradientBtnText: { color: C.primary, fontSize: 18, fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: -1, textTransform: 'uppercase' },
  outlineBtn: { backgroundColor: C.surfaceContainerHighest, paddingVertical: 18, borderRadius: 9999, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: C.outlineVariant },
  outlineBtnText: { color: C.onSurface, fontSize: 16, fontWeight: '700', fontFamily: 'Space Grotesk', letterSpacing: 2, textTransform: 'uppercase' },
  btnCol: { gap: 12, marginTop: 8 },
});
