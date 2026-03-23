// GeoCheckr — Root App (self-contained, NO navigation crash)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, Platform, KeyboardAvoidingView, StatusBar, ScrollView, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, calculatePoints, formatDistance } from './src/utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playAnswerphoneBeep } from './src/utils/sounds';
import { panoramaLocations, PanoramaLocation } from './src/data/panoramaLocations';

const { width } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface Player { id: number; name: string; }
type Screen = 'tutorial' | 'setup' | 'game' | 'result';
type AnswerMode = 'text' | 'map';

// Street View HTML — same as #170
function buildStreetViewHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-family:sans-serif;text-align:center;font-size:14px;z-index:999}
#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#e94560;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="pano"></div>
<div id="status"><div class="spinner"></div>Lade Street View...</div>
<script>
function init(){
  var sv=new google.maps.StreetViewService();
  sv.getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,
    preference:google.maps.StreetViewPreference.NEAREST,
    source:google.maps.StreetViewSource.OUTDOOR},function(data,st){
    if(st===google.maps.StreetViewStatus.OK){
      new google.maps.StreetViewPanorama(document.getElementById('pano'),{
        pano:data.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,
        addressControl:false,linksControl:true,panControl:true,zoomControl:true,
        fullscreenControl:false,motionTracking:false,motionTrackingControl:false,
        enableCloseButton:false,clickToGo:true,scrollwheel:true,disableDefaultUI:false
      });
      document.getElementById('status').style.display='none';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');
    }else{
      document.getElementById('status').innerHTML='❌ Kein Street View';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error');
    }
  });
}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script>
</body></html>`;
}

const MAP_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}
#info{position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);
color:#fff;padding:8px 16px;border-radius:20px;font-family:sans-serif;font-size:14px;z-index:999;pointer-events:none}</style>
</head><body>
<div id="map"></div>
<div id="info">Tippe auf die Karte</div>
<script>
var map=L.map('map',{attributionControl:false}).setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
var marker=null;
map.on('click',function(e){
  if(marker)map.removeLayer(marker);
  marker=L.marker(e.latlng).addTo(map);
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng}));
});
</script></body></html>`;

export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [tutorialPage, setTutorialPage] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>('leicht');
  const [player, setPlayer] = useState<Player>({ id: 1, name: 'Spieler 1' });
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [phase, setPhase] = useState<'view' | 'answer' | 'result'>('view');
  const [timer, setTimer] = useState(30);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('text');
  const [showMap, setShowMap] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState(0);
  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // Check if tutorial already seen
  useEffect(() => {
    AsyncStorage.getItem('geocheckr_tutorial_done').then(v => {
      if (v === 'true') setScreen('setup');
    });
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const i = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 5 && timer > 0 && phase === 'view') {
      playTimerTick();
      Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    if (timer === 0 && phase === 'view') {
      playTimerWarning();
      Vibration.vibrate(500);
      setPhase('answer');
      setTimeout(() => playAnswerphoneBeep(), 100);
    }
  }, [timer, phase]);

  const getRandomLocation = useCallback(() => {
    const avail = panoramaLocations.filter(l => !usedLocations.includes(l.id));
    const pool = avail.length > 0 ? avail : panoramaLocations;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [usedLocations]);

  const startGame = () => {
    playClickSound();
    setPlayer(prev => ({ ...prev, name: playerName.trim() || 'Spieler 1' }));
    setScore(0);
    setRound(1);
    setUsedLocations([]);
    startRound();
    setScreen('game');
  };

  const startRound = useCallback(() => {
    const loc = getRandomLocation();
    setUsedLocations(prev => [...prev, loc.id]);
    setLocation(loc);
    setTimer(30);
    setTimerPaused(false);
    setPhase('view');
    setSvLoaded(false);
    setSvError(false);
    setTextInput('');
    setAnswerMode('text');
    setShowMap(false);
    resultScale.setValue(0);
  }, [getRandomLocation, resultScale]);

  const resolveAnswer = (dist: number) => {
    const pts = calculatePoints(dist);
    const bonus = (difficulty === 'schwer' && timer > 10 && pts > 0) ? 1 : 0;
    const total = pts + bonus;
    if (total >= 3) { playPerfectSound(); Vibration.vibrate([100, 50, 100]); }
    else if (total > 0) { playSuccessSound(); Vibration.vibrate([100, 50, 100]); }
    else { playErrorSound(); Vibration.vibrate(500); }
    setDistance(dist);
    setPoints(total);
    setScore(s => s + total);
    Animated.spring(resultScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    setPhase('result');
  };

  const submitTextAnswer = () => {
    let dist = 20000;
    if (textInput.trim()) {
      try {
        const allLocs = require('./src/data/locations_complete').default;
        const n = textInput.toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
        let m = allLocs.find((l: any) => l.city.toLowerCase() === n);
        if (!m) m = allLocs.find((l: any) => l.city.toLowerCase().includes(n) || n.includes(l.city.toLowerCase()));
        if (m) dist = calculateDistance(location.lat, location.lng, m.lat, m.lng);
      } catch {}
    }
    resolveAnswer(dist);
  };

  const nextTurn = () => {
    playClickSound();
    if (round >= maxRounds) { setScreen('result'); return; }
    setRound(r => r + 1);
    startRound();
  };

  const completeTutorial = async () => {
    try { await AsyncStorage.setItem('geocheckr_tutorial_done', 'true'); } catch {}
    setScreen('setup');
  };

  const tc = timer <= 5 ? '#ff4444' : timer <= 10 ? '#ffaa00' : '#e94560';
  const T = [
    { icon: '🌍', title: 'GeoCheckr', sub: 'Finde heraus wo du bist!' },
    { icon: '👆', title: 'Navigiere', sub: 'Bewege dich durch Street View\nKlicke auf Pfeile um zu laufen' },
    { icon: '📍', title: 'Rate den Ort', sub: 'Tippe den Stadtnamen\noder zeige auf die Karte' },
  ];

  // ===== TUTORIAL =====
  if (screen === 'tutorial') return (
    <View style={s.c}><StatusBar hidden />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setTutorialPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {T.map((t,i) => <View key={i} style={[s.ts,{width}]}><Text style={s.ti}>{t.icon}</Text><Text style={s.tt}>{t.title}</Text><Text style={s.tsub}>{t.sub}</Text></View>)}
      </ScrollView>
      <View style={s.td}>{T.map((_,i)=><View key={i} style={[s.dot,i===tutorialPage&&s.dotA]}/>)}</View>
      <View style={s.tbr}>
        <TouchableOpacity style={s.tsk} onPress={completeTutorial}><Text style={s.tskt}>Überspringen</Text></TouchableOpacity>
        {tutorialPage<2?<TouchableOpacity style={s.tn} onPress={()=>setTutorialPage(tutorialPage+1)}><Text style={s.tnt}>Weiter →</Text></TouchableOpacity>
        :<TouchableOpacity style={s.tgo} onPress={completeTutorial}><Text style={s.tgot}>Los! 🚀</Text></TouchableOpacity>}
      </View>
    </View>
  );

  // ===== SETUP =====
  if (screen === 'setup') return (
    <KeyboardAvoidingView style={s.c} behavior={Platform.OS==='ios'?'padding':undefined}><StatusBar hidden />
      <View style={s.sc}>
        <Text style={s.sTi}>GeoCheckr</Text><Text style={s.sSu}>Spieler</Text>
        <Text style={s.sL}>NAME</Text>
        <TextInput style={s.sIn} placeholder="Dein Name..." placeholderTextColor="#555" value={playerName} onChangeText={setPlayerName} maxLength={20} autoCapitalize="words"/>
        <Text style={s.sL}>SCHWIERIGKEIT</Text>
        <View style={s.dr}>{(['leicht','mittel','schwer'] as const).map(d=>
          <TouchableOpacity key={d} style={[s.db,difficulty===d&&s.dbA]} onPress={()=>setDifficulty(d)}>
            <Text style={s.di}>{d==='leicht'?'😊':d==='mittel'?'🤔':'🔥'}</Text>
            <Text style={[s.dt,difficulty===d&&s.dtA]}>{d[0].toUpperCase()+d.slice(1)}</Text>
          </TouchableOpacity>)}
        </View>
        <TouchableOpacity style={s.go} onPress={startGame}><Text style={s.got}>Starten 🚀</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // ===== GAME =====
  if (screen === 'game') return (
    <View style={s.c}><StatusBar hidden />
      <WebView key={`${location.lat}-${location.lng}`}
        source={{html:buildStreetViewHtml(location.lat,location.lng)}}
        style={s.sv} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false} mixedContentMode="compatibility"
        onError={()=>setSvError(true)}
        onMessage={e=>{const m=e.nativeEvent.data;if(m==='loaded')setSvLoaded(true);if(m.startsWith('error'))setSvError(true);}}
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"/>
      {!svLoaded&&!svError&&<View style={s.lo}><Text style={s.lot}>🌍 Lade Street View...</Text></View>}
      {svError&&<View style={s.eo}><Text style={s.ee}>❌</Text><Text style={s.ec}>{location.city}</Text>
        <TouchableOpacity style={s.rb} onPress={nextTurn}><Text style={s.rbt}>Nächste →</Text></TouchableOpacity></View>}
      {phase==='view'&&svLoaded&&<Animated.View style={[s.tmr,{borderColor:tc,transform:[{scale:timerPulse}]}]}><Text style={[s.tmt,{color:tc}]}>{timer}</Text></Animated.View>}
      {phase==='view'&&svLoaded&&<View style={s.tb}>
        <Text style={s.tn2}>{player.name}</Text>
        <Text style={s.tr}>Runde {round}/{maxRounds}</Text>
        <View style={s.tsc}><Text style={s.tsct}>⭐ {score}</Text></View></View>}
      {phase==='view'&&svLoaded&&<TouchableOpacity style={s.sk} onPress={()=>{playClickSound();setTimerPaused(true);setPhase('answer');playAnswerphoneBeep();}}>
        <Text style={s.skt}>Ich weiß es! →</Text></TouchableOpacity>}
      {phase==='answer'&&<View style={s.ao}><View style={s.ac}>
        <Text style={s.at}>📍 Deine Antwort</Text><Text style={s.asu}>{player.name}, wo bist du?</Text>
        <View style={s.mt}>
          <TouchableOpacity style={[s.mtb,answerMode==='text'&&s.mtA]} onPress={()=>{setAnswerMode('text');setShowMap(false);}}><Text style={s.mtt}>⌨️ Tippen</Text></TouchableOpacity>
          <TouchableOpacity style={[s.mtb,answerMode==='map'&&s.mtA]} onPress={()=>{setAnswerMode('map');setShowMap(true);}}><Text style={s.mtt}>🗺️ Karte</Text></TouchableOpacity>
        </View>
        {answerMode==='text'&&<View style={s.tr2}>
          <TextInput style={s.tin} placeholder="Stadtname..." placeholderTextColor="#555" value={textInput} onChangeText={setTextInput} autoFocus returnKeyType="send" onSubmitEditing={submitTextAnswer}/>
          <TouchableOpacity style={s.sbtn} onPress={submitTextAnswer}><Text style={s.sbt}>✓</Text></TouchableOpacity></View>}
        {answerMode==='map'&&!showMap&&<TouchableOpacity style={s.mh} onPress={()=>setShowMap(true)}><Text style={s.mht}>🗺️ Karte öffnen</Text></TouchableOpacity>}
        <TouchableOpacity style={s.sab} onPress={()=>resolveAnswer(20000)}><Text style={s.sat}>Überspringen →</Text></TouchableOpacity>
      </View></View>}
      {phase==='result'&&<View style={s.ro}><Animated.View style={[s.rc,{transform:[{scale:resultScale}]}]}>
        <Text style={s.re}>{points>=3?'🎯':points>=1?'👍':'😅'}</Text>
        <Text style={[s.rti,points>0?s.co:s.wr]}>{points>=3?'Perfekt!':points>=2?'Gut!':points>=1?'Nicht schlecht!':'Daneben!'}</Text>
        <View style={s.ri}>
          <View style={s.rr}><Text style={s.rl}>📍 Ort</Text><Text style={s.rv}>{location.city}</Text></View>
          <View style={s.rr}><Text style={s.rl}>📏 Distanz</Text><Text style={s.rv}>{formatDistance(distance)}</Text></View>
          <View style={s.rr}><Text style={s.rl}>⭐ Punkte</Text><Text style={[s.rv,s.ph]}>+{points}</Text></View>
        </View>
        <TouchableOpacity style={s.nb} onPress={nextTurn}><Text style={s.nbt}>{round>=maxRounds?'🏆 Ergebnis':'Nächste Runde →'}</Text></TouchableOpacity>
      </Animated.View></View>}
      {showMap&&<View style={s.mm}><View style={s.mh2}>
        <Text style={s.mt2}>📍 Auf Karte zeigen</Text>
        <TouchableOpacity style={s.mc} onPress={()=>{setShowMap(false);setAnswerMode('text');}}><Text style={s.mct}>✕</Text></TouchableOpacity></View>
        <WebView source={{html:MAP_HTML}} style={{flex:1}} javaScriptEnabled
          onMessage={e=>{try{const{lat,lng}=JSON.parse(e.nativeEvent.data);setShowMap(false);const d=calculateDistance(location.lat,location.lng,lat,lng);resolveAnswer(d);}catch{}}}/></View>}
    </View>
  );

  // ===== RESULT =====
  return (
    <View style={s.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={s.rsc}>
        <Text style={s.tp}>🏆</Text><Text style={s.rst}>Spiel beendet!</Text><Text style={s.rss}>{maxRounds} Runden</Text>
        <View style={s.wc}><Text style={s.wn}>{player.name}</Text><Text style={s.ws}>{score} ⭐</Text></View>
        <TouchableOpacity style={s.ag} onPress={()=>{startRound();setScreen('game');}}><Text style={s.agt}>🔄 Nochmal</Text></TouchableOpacity>
        <TouchableOpacity style={s.hm} onPress={()=>setScreen('setup')}><Text style={s.hmt}>🏠 Neues Spiel</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0a0a1a'},
  // Tutorial
  ts:{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:40},
  ti:{fontSize:80,marginBottom:30},tt:{color:'#fff',fontSize:32,fontWeight:'bold',marginBottom:15,textAlign:'center'},
  tsub:{color:'#aaa',fontSize:18,textAlign:'center',lineHeight:26},
  td:{flexDirection:'row',justifyContent:'center',marginBottom:30},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:'#333',marginHorizontal:5},dotA:{backgroundColor:'#e94560',width:24},
  tbr:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:30,paddingBottom:50},
  tsk:{paddingVertical:14,paddingHorizontal:20},tskt:{color:'#666',fontSize:16},
  tn:{backgroundColor:'#e94560',paddingVertical:14,paddingHorizontal:28,borderRadius:12},tnt:{color:'#fff',fontSize:16,fontWeight:'600'},
  tgo:{backgroundColor:'#4CAF50',paddingVertical:14,paddingHorizontal:28,borderRadius:12},tgot:{color:'#fff',fontSize:16,fontWeight:'bold'},
  // Setup
  sc:{flex:1,justifyContent:'center',paddingHorizontal:30},
  sTi:{color:'#fff',fontSize:36,fontWeight:'bold',textAlign:'center',marginBottom:5},
  sSu:{color:'#888',fontSize:16,textAlign:'center',marginBottom:35},
  sL:{color:'#888',fontSize:12,marginBottom:6,fontWeight:'600',letterSpacing:1},
  sIn:{backgroundColor:'#16213e',color:'#fff',borderRadius:10,paddingHorizontal:16,paddingVertical:14,fontSize:16,borderWidth:1,borderColor:'#2a2a4a',marginBottom:25},
  dr:{flexDirection:'row',gap:10,marginBottom:30},
  db:{flex:1,paddingVertical:14,borderRadius:12,borderWidth:2,borderColor:'#333',backgroundColor:'#16213e',alignItems:'center'},
  dbA:{borderColor:'#e94560'},di:{fontSize:24,marginBottom:4},
  dt:{color:'#888',fontSize:13,fontWeight:'600'},dtA:{color:'#fff'},
  go:{backgroundColor:'#e94560',paddingVertical:18,borderRadius:14,alignItems:'center'},
  got:{color:'#fff',fontSize:20,fontWeight:'bold'},
  // Game
  sv:{flex:1,backgroundColor:'#000'},
  lo:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:'#000',zIndex:5},
  lot:{color:'#aaa',fontSize:16},
  eo:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:'#1a1a2e',zIndex:10},
  ee:{fontSize:60,marginBottom:15},ec:{color:'#fff',fontSize:20,fontWeight:'bold',marginBottom:20},
  rb:{backgroundColor:'#e94560',paddingHorizontal:24,paddingVertical:12,borderRadius:10},rbt:{color:'#fff',fontSize:16,fontWeight:'600'},
  tmr:{position:'absolute',top:15,right:15,width:52,height:52,borderRadius:26,backgroundColor:'rgba(0,0,0,0.85)',borderWidth:3,justifyContent:'center',alignItems:'center',zIndex:20},
  tmt:{fontSize:22,fontWeight:'bold'},
  tb:{position:'absolute',top:15,left:15,flexDirection:'row',alignItems:'center',gap:8,zIndex:20},
  tn2:{color:'#e94560',fontSize:14,fontWeight:'bold',backgroundColor:'rgba(0,0,0,0.75)',paddingHorizontal:10,paddingVertical:5,borderRadius:8},
  tr:{color:'#fff',fontSize:12,backgroundColor:'rgba(0,0,0,0.75)',paddingHorizontal:10,paddingVertical:5,borderRadius:8},
  tsc:{backgroundColor:'rgba(0,0,0,0.75)',paddingHorizontal:10,paddingVertical:5,borderRadius:8},
  tsct:{color:'#FFD700',fontSize:13,fontWeight:'bold'},
  sk:{position:'absolute',bottom:40,alignSelf:'center',backgroundColor:'rgba(0,0,0,0.85)',paddingHorizontal:28,paddingVertical:14,borderRadius:25,borderWidth:1.5,borderColor:'#4CAF50',zIndex:20},
  skt:{color:'#4CAF50',fontSize:17,fontWeight:'600'},
  ao:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.92)',zIndex:30,justifyContent:'center',paddingHorizontal:24},
  ac:{backgroundColor:'#16213e',borderRadius:20,padding:24},
  at:{color:'#fff',fontSize:22,fontWeight:'bold',textAlign:'center',marginBottom:5},
  asu:{color:'#888',fontSize:14,textAlign:'center',marginBottom:20},
  mt:{flexDirection:'row',gap:10,marginBottom:20},
  mtb:{flex:1,paddingVertical:12,borderRadius:10,borderWidth:2,borderColor:'#333',backgroundColor:'#0f3460',alignItems:'center'},
  mtA:{borderColor:'#e94560'},mtt:{color:'#888',fontSize:14,fontWeight:'600'},
  tr2:{flexDirection:'row',gap:8,marginBottom:12},
  tin:{flex:1,backgroundColor:'#0f3460',color:'#fff',borderRadius:10,paddingHorizontal:16,paddingVertical:14,fontSize:16,borderWidth:1,borderColor:'#2a2a4a'},
  sbtn:{width:52,height:52,borderRadius:12,backgroundColor:'#4CAF50',justifyContent:'center',alignItems:'center'},
  sbt:{color:'#fff',fontSize:24,fontWeight:'bold'},
  mh:{backgroundColor:'#0f3460',paddingVertical:16,borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#2a2a4a',marginBottom:12},
  mht:{color:'#fff',fontSize:16},
  sab:{paddingVertical:10,alignItems:'center'},sat:{color:'#666',fontSize:14},
  ro:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.92)',zIndex:40,justifyContent:'center',paddingHorizontal:20},
  rc:{backgroundColor:'#16213e',borderRadius:20,padding:24,alignItems:'center'},
  re:{fontSize:50,marginBottom:10},
  rti:{fontSize:28,fontWeight:'bold',marginBottom:18,textAlign:'center'},
  co:{color:'#4CAF50'},wr:{color:'#ff4444'},
  ri:{width:'100%',marginBottom:18},
  rr:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#2a2a4a'},
  rl:{color:'#aaa',fontSize:15},rv:{color:'#fff',fontSize:15,fontWeight:'600'},
  ph:{color:'#4CAF50',fontSize:20,fontWeight:'bold'},
  nb:{backgroundColor:'#e94560',paddingVertical:16,paddingHorizontal:30,borderRadius:14,width:'100%',alignItems:'center'},
  nbt:{color:'#fff',fontSize:18,fontWeight:'bold'},
  mm:{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:50,backgroundColor:'#0a0a1a'},
  mh2:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,paddingTop:40,backgroundColor:'#16213e',borderBottomWidth:1,borderBottomColor:'#2a2a4a'},
  mt2:{color:'#fff',fontSize:16,fontWeight:'600'},
  mc:{width:36,height:36,borderRadius:18,backgroundColor:'#e94560',justifyContent:'center',alignItems:'center'},
  mct:{color:'#fff',fontSize:18,fontWeight:'bold'},
  // Result screen
  rsc:{padding:30,alignItems:'center',paddingTop:60},
  tp:{fontSize:80,marginBottom:15},
  rst:{color:'#fff',fontSize:32,fontWeight:'bold',marginBottom:5,textAlign:'center'},
  rss:{color:'#888',fontSize:16,marginBottom:30,textAlign:'center'},
  wc:{backgroundColor:'rgba(255,215,0,0.1)',borderRadius:20,padding:25,alignItems:'center',marginBottom:25,borderWidth:2,borderColor:'#FFD700',width:'100%'},
  wn:{color:'#FFD700',fontSize:26,fontWeight:'bold',marginBottom:5},
  ws:{color:'#fff',fontSize:22,fontWeight:'600'},
  ag:{backgroundColor:'#e94560',paddingVertical:16,borderRadius:14,width:'100%',alignItems:'center',marginTop:10},
  agt:{color:'#fff',fontSize:18,fontWeight:'bold'},
  hm:{backgroundColor:'#16213e',paddingVertical:14,borderRadius:14,width:'100%',alignItems:'center',marginTop:12,borderWidth:1,borderColor:'#2a2a4a'},
  hmt:{color:'#aaa',fontSize:16},
});
