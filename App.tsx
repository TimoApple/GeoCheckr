// GeoCheckr — APK v3 (matches Web App v3)
// Street View: UNVERÄNDERT (Vorlage 2)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Vibration, Platform, StatusBar, ScrollView, Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, calculatePoints, formatDistance } from './src/utils/distance';
import { playClickSound, playSuccessSound, playErrorSound, playPerfectSound, playTimerWarning, playTimerTick, playAnswerphoneBeep } from './src/utils/sounds';
import { panoramaLocations, PanoramaLocation } from './src/data/panoramaLocations';

const { width } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface Player { id: number; name: string; }
type Screen = 'tutorial' | 'setup' | 'game' | 'summary';

// Street View HTML — UNVERÄNDERT (Vorlage 2)
function buildStreetViewHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-family:sans-serif;text-align:center}
#status .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#e94560;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}</style>
</head><body><div id="pano"></div><div id="status"><div class="spinner"></div>Lade...</div>
<script>function init(){new google.maps.StreetViewService().getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){
if(s===google.maps.StreetViewStatus.OK){new google.maps.StreetViewPanorama(document.getElementById('pano'),{pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,addressControl:false,linksControl:true,panControl:true,zoomControl:true,fullscreenControl:false,motionTracking:false,enableCloseButton:false,clickToGo:true,scrollwheel:true});
document.getElementById('status').style.display='none';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');}
else{document.getElementById('status').innerHTML='❌ Kein Street View';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error');}});}
</script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init&libraries=streetView"></script></body></html>`;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('tutorial');
  const [tutStep, setTutStep] = useState(0);
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [difficulty, setDifficulty] = useState<'leicht'|'mittel'|'schwer'>('leicht');
  const [maxRounds, setMaxRounds] = useState(5);
  const [players, setPlayers] = useState<Player[]>([{id:1,name:'Spieler 1'},{id:2,name:'Spieler 2'}]);
  const [scores, setScores] = useState([0,0]);
  const [round, setRound] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [location, setLocation] = useState<PanoramaLocation>(panoramaLocations[0]);
  const [usedLocations, setUsedLocations] = useState<number[]>([]);
  const [phase, setPhase] = useState<'view'|'answer'|'result'>('view');
  const [timer, setTimer] = useState(30);
  const [timerPaused, setTimerPaused] = useState(false);
  const [svLoaded, setSvLoaded] = useState(false);
  const [svError, setSvError] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState(0);
  const [guessCity, setGuessCity] = useState('');
  const [history, setHistory] = useState<Array<{round:number,playerIdx:number,city:string,distance:number,points:number}>>([]);

  const timerPulse = useRef(new Animated.Value(1)).current;
  const resultScale = useRef(new Animated.Value(0)).current;

  // Check tutorial
  useEffect(() => {
    AsyncStorage.getItem('geocheckr_tut3').then(v => { if (v === 'true') setScreen('setup'); });
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'view' || timerPaused || timer <= 0) return;
    const i = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [phase, timerPaused, timer]);

  useEffect(() => {
    if (timer <= 5 && timer > 0 && phase === 'view') {
      playTimerTick(); Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(timerPulse,{toValue:1.3,duration:150,useNativeDriver:true}),
        Animated.timing(timerPulse,{toValue:1,duration:150,useNativeDriver:true}),
      ]).start();
    }
    if (timer === 0 && phase === 'view') {
      playTimerWarning(); Vibration.vibrate(500); setPhase('answer');
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
    setPlayers([{id:1,name:p1Name.trim()||'Spieler 1'},{id:2,name:p2Name.trim()||'Spieler 2'}]);
    setScores([0,0]); setRound(1); setCurrentPlayer(0);
    setUsedLocations([]); setHistory([]);
    startRound(); setScreen('game');
  };

  const startRound = useCallback(() => {
    const loc = getRandomLocation();
    setUsedLocations(prev => [...prev, loc.id]);
    setLocation(loc);
    setTimer(difficulty==='schwer'?20:30);
    setTimerPaused(false); setPhase('view');
    setSvLoaded(false); setSvError(false);
    setTextInput(''); setGuessCity('');
    resultScale.setValue(0);
  }, [getRandomLocation, difficulty, resultScale]);

  const resolveAnswer = (dist: number, city: string) => {
    const pts = calculatePoints(dist);
    if (pts >= 3) { playPerfectSound(); Vibration.vibrate([100,50,100]); }
    else if (pts > 0) { playSuccessSound(); Vibration.vibrate([100,50,100]); }
    else { playErrorSound(); Vibration.vibrate(500); }
    setDistance(dist); setPoints(pts); setGuessCity(city);
    setScores(prev => { const n=[...prev]; n[currentPlayer]+=pts; return n; });
    setHistory(prev => [...prev,{round,playerIdx:currentPlayer,city:location.city,distance:Math.round(dist),points:pts}]);
    Animated.spring(resultScale,{toValue:1,friction:6,useNativeDriver:true}).start();
    setPhase('result');
  };

  const submitAnswer = () => {
    let dist = 20000; let city = '';
    if (textInput.trim()) {
      try {
        const allLocs = require('./src/data/locations_complete').default;
        const n = textInput.toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
        let m = allLocs.find((l: any) => l.city.toLowerCase() === n);
        if (!m) m = allLocs.find((l: any) => l.city.toLowerCase().includes(n) || n.includes(l.city.toLowerCase()));
        if (m) { dist = calculateDistance(location.lat,location.lng,m.lat,m.lng); city = m.city; }
        else { city = textInput; }
      } catch {}
    }
    resolveAnswer(dist, city);
  };

  const nextTurn = () => {
    playClickSound();
    const next = (currentPlayer + 1) % players.length;
    if (next === 0 && round >= maxRounds) { setScreen('summary'); return; }
    if (next === 0) setRound(r => r + 1);
    setCurrentPlayer(next); startRound();
  };

  const completeTutorial = async () => {
    try { await AsyncStorage.setItem('geocheckr_tut3','true'); } catch {}
    setScreen('setup');
  };

  const TUTS = [
    {icon:'🌍',title:'Willkommen!',text:'Du wirst an einen zufälligen Ort gebracht.\nFinde heraus wo du bist!'},
    {icon:'👆',title:'Navigiere',text:'Bewege dich durch Street View.\nKlicke auf Pfeile um zu laufen.'},
    {icon:'📍',title:'Rate den Ort',text:'Gib den Stadtnamen ein.\nPunkte für Nähe!'},
  ];

  const tc = timer<=5?'#ff4444':timer<=10?'#ffaa00':'#e94560';

  // ===== TUTORIAL =====
  if (screen === 'tutorial') {
    const t = TUTS[tutStep];
    return (
      <View style={s.c}><StatusBar hidden />
        <View style={s.tutContent}>
          <Text style={s.tutIcon}>{t.icon}</Text>
          <Text style={s.tutTitle}>{t.title}</Text>
          <Text style={s.tutText}>{t.text}</Text>
        </View>
        <View style={s.tutDots}>{TUTS.map((_,i)=><View key={i} style={[s.dot,i===tutStep&&s.dotA]}/>)}</View>
        <View style={s.tutBtns}>
          {tutStep>0?<TouchableOpacity onPress={()=>setTutStep(tutStep-1)}><Text style={s.ghost}>← Zurück</Text></TouchableOpacity>:<View/>}
          {tutStep<2?<TouchableOpacity style={s.pri} onPress={()=>setTutStep(tutStep+1)}><Text style={s.priT}>Weiter →</Text></TouchableOpacity>
          :<TouchableOpacity style={s.ok} onPress={completeTutorial}><Text style={s.okT}>Verstanden! 🚀</Text></TouchableOpacity>}
        </View>
      </View>
    );
  }

  // ===== SETUP =====
  if (screen === 'setup') return (
    <View style={s.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={s.setupC}>
        <Text style={s.setupT}>Spieler einrichten</Text>
        <Text style={s.label}>SPIELER 1</Text>
        <TextInput style={s.input} placeholder="Name..." placeholderTextColor="#555" value={p1Name} onChangeText={setP1Name} maxLength={20} autoCapitalize="words"/>
        <Text style={s.label}>SPIELER 2</Text>
        <TextInput style={s.input} placeholder="Name..." placeholderTextColor="#555" value={p2Name} onChangeText={setP2Name} maxLength={20} autoCapitalize="words"/>
        <Text style={s.label}>SCHWIERIGKEIT</Text>
        <View style={s.row}>{(['leicht','mittel','schwer'] as const).map(d=>
          <TouchableOpacity key={d} style={[s.diff,difficulty===d&&s.diffA]} onPress={()=>setDifficulty(d)}>
            <Text style={s.diffI}>{d==='leicht'?'😊':d==='mittel'?'🤔':'🔥'}</Text>
            <Text style={[s.diffT,difficulty===d&&s.diffTA]}>{d[0].toUpperCase()+d.slice(1)}</Text>
          </TouchableOpacity>)}</View>
        <Text style={s.label}>RUNDEN</Text>
        <View style={s.row}>{[5,10,15].map(r=>
          <TouchableOpacity key={r} style={[s.diff,maxRounds===r&&s.diffA]} onPress={()=>setMaxRounds(r)}>
            <Text style={[s.diffT,maxRounds===r&&s.diffTA]}>{r}</Text>
          </TouchableOpacity>)}</View>
        <TouchableOpacity style={s.start} onPress={startGame}><Text style={s.startT}>Starten 🚀</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ===== GAME =====
  if (screen === 'game') return (
    <View style={s.gc}><StatusBar hidden translucent backgroundColor="transparent" />
      {/* FULLSCREEN STREET VIEW — UNVERÄNDERT */}
      <WebView key={`${location.lat}-${location.lng}`}
        source={{html:buildStreetViewHtml(location.lat,location.lng)}}
        style={s.sv} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false} mixedContentMode="compatibility"
        onError={()=>setSvError(true)}
        onMessage={e=>{const m=e.nativeEvent.data;if(m==='loaded')setSvLoaded(true);if(m.startsWith('error'))setSvError(true);}}
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"/>

      {!svLoaded&&!svError&&<View style={s.lo}><Text style={s.lot}>🌍 Lade...</Text></View>}
      {svError&&<View style={s.eo}><Text style={s.ee}>❌</Text><TouchableOpacity style={s.rb} onPress={nextTurn}><Text style={s.rbt}>Nächste →</Text></TouchableOpacity></View>}

      {/* Top Bar: 2 Players */}
      {phase==='view'&&svLoaded&&<View style={s.tb}>
        <View style={[s.pb,currentPlayer===0&&s.pbA]}>
          <Text style={s.pn}>{players[0].name}</Text>
          <Text style={s.ps}>{scores[0]}⭐</Text>
        </View>
        <View style={s.rb2}><Text style={s.rb2t}>Runde {round}/{maxRounds}</Text></View>
        <View style={[s.pb,currentPlayer===1&&s.pbA]}>
          <Text style={s.pn}>{players[1].name}</Text>
          <Text style={s.ps}>{scores[1]}⭐</Text>
        </View>
      </View>}

      {/* Timer */}
      {phase==='view'&&svLoaded&&<Animated.View style={[s.tm,{borderColor:tc,transform:[{scale:timerPulse}]}]}>
        <Text style={[s.tmt,{color:tc}]}>{timer}</Text></Animated.View>}

      {/* Skip */}
      {phase==='view'&&svLoaded&&<TouchableOpacity style={s.sk} onPress={()=>{playClickSound();setTimerPaused(true);setPhase('answer');playAnswerphoneBeep();}}>
        <Text style={s.skt}>Ich weiß es! →</Text></TouchableOpacity>}

      {/* ANSWER */}
      {phase==='answer'&&<View style={s.ao}><View style={s.ac}>
        <Text style={s.at}>📍 {players[currentPlayer].name}, wo bist du?</Text>
        <TextInput style={s.tin} placeholder="Stadtname..." placeholderTextColor="#555" value={textInput} onChangeText={setTextInput} autoFocus returnKeyType="send" onSubmitEditing={submitAnswer}/>
        <View style={s.abtns}>
          <TouchableOpacity style={s.pri} onPress={submitAnswer}><Text style={s.priT}>✓ Antworten</Text></TouchableOpacity>
          <TouchableOpacity style={s.skipB} onPress={()=>resolveAnswer(20000,'')}><Text style={s.skipT}>Überspringen</Text></TouchableOpacity>
        </View>
      </View></View>}

      {/* RESULT */}
      {phase==='result'&&<View style={s.ro}><Animated.View style={[s.rc,{transform:[{scale:resultScale}]}]}>
        <Text style={s.re}>{points>=3?'🎯':points>=2?'👍':points>=1?'😐':'😅'}</Text>
        <Text style={[s.rti,{color:points>0?'#4CAF50':'#ff4444'}]}>{points>=3?'Perfekt!':points>=2?'Gut!':points>=1?'Nicht schlecht!':'Daneben!'}</Text>
        <View style={s.ri}>
          <View style={s.rr}><Text style={s.rl}>📍 Tipp</Text><Text style={s.rv}>{guessCity||'?'}</Text></View>
          <View style={s.rr}><Text style={s.rl}>✅ Ort</Text><Text style={s.rv}>{location.city}</Text></View>
          <View style={s.rr}><Text style={s.rl}>📏</Text><Text style={s.rv}>{formatDistance(distance)}</Text></View>
        </View>
        <Text style={s.pts}>+{points} ⭐</Text>
        <TouchableOpacity style={s.pri} onPress={nextTurn}>
          <Text style={s.priT}>{(currentPlayer+1)%players.length===0&&round>=maxRounds?'🏆 Ergebnis':players[(currentPlayer+1)%players.length].name+' ist dran →'}</Text>
        </TouchableOpacity>
      </Animated.View></View>}
    </View>
  );

  // ===== SUMMARY =====
  const sorted = [...players].map((p,i)=>({...p,score:scores[i]})).sort((a,b)=>b.score-a.score);
  return (
    <View style={s.c}><StatusBar hidden />
      <ScrollView contentContainerStyle={s.sc}>
        <Text style={s.tp}>🏆</Text>
        <Text style={s.st}>Spiel beendet!</Text>
        <Text style={s.ss}>{maxRounds} Runden</Text>
        {sorted.map((p,i)=><View key={p.id} style={[s.li,i===0&&s.lf]}>
          <Text style={s.lr}>{i===0?'🥇':i===1?'🥈':'🥉'}</Text>
          <Text style={s.ln}>{p.name}</Text>
          <Text style={s.ls}>{p.score} ⭐</Text>
        </View>)}
        <Text style={s.ht}>📊 Runden</Text>
        {history.map((h,i)=><View key={i} style={s.hr}>
          <Text style={s.hrn}>R{h.round}</Text>
          <Text style={s.hp}>{players[h.playerIdx]?.name}</Text>
          <Text style={s.hl}>{h.city}</Text>
          <Text style={s.hpt}>+{h.points}</Text>
        </View>)}
        <TouchableOpacity style={[s.pri,{marginTop:20,width:'100%'}]} onPress={()=>{setScreen('setup');}}><Text style={s.priT}>🔄 Nochmal</Text></TouchableOpacity>
        <TouchableOpacity style={[s.skipB,{width:'100%',marginTop:10}]} onPress={()=>setScreen('tutorial')}><Text style={s.skipT}>🏠 Menü</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  c:{flex:1,backgroundColor:'#0a0a1a'},
  // Tutorial
  tutContent:{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:40},
  tutIcon:{fontSize:64,marginBottom:16},tutTitle:{color:'#fff',fontSize:22,fontWeight:'800',marginBottom:10,textAlign:'center'},
  tutText:{color:'#aaa',fontSize:15,textAlign:'center',lineHeight:22},
  tutDots:{flexDirection:'row',justifyContent:'center',marginBottom:30},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:'#333',marginHorizontal:5},dotA:{backgroundColor:'#e94560',width:24},
  tutBtns:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:30,paddingBottom:50},
  ghost:{color:'#666',fontSize:15,paddingVertical:14,paddingHorizontal:20},
  pri:{backgroundColor:'#e94560',paddingVertical:14,paddingHorizontal:24,borderRadius:12},priT:{color:'#fff',fontSize:16,fontWeight:'600'},
  ok:{backgroundColor:'#4CAF50',paddingVertical:14,paddingHorizontal:24,borderRadius:12},okT:{color:'#fff',fontSize:16,fontWeight:'bold'},
  // Setup
  setupC:{padding:30,alignItems:'center',paddingTop:60},
  setupT:{color:'#fff',fontSize:28,fontWeight:'800',marginBottom:25},
  label:{color:'#888',fontSize:11,fontWeight:'600',letterSpacing:1,alignSelf:'flex-start',marginBottom:6,marginTop:12},
  input:{backgroundColor:'#16213e',color:'#fff',borderRadius:10,paddingHorizontal:16,paddingVertical:14,fontSize:16,borderWidth:1,borderColor:'#2a2a4a',width:'100%'},
  row:{flexDirection:'row',gap:8,width:'100%',marginBottom:8},
  diff:{flex:1,paddingVertical:12,borderRadius:12,borderWidth:2,borderColor:'#333',backgroundColor:'#16213e',alignItems:'center'},
  diffA:{borderColor:'#e94560'},diffI:{fontSize:20,marginBottom:2},
  diffT:{color:'#888',fontSize:13,fontWeight:'600'},diffTA:{color:'#fff'},
  start:{backgroundColor:'#e94560',paddingVertical:18,borderRadius:14,alignItems:'center',width:'100%',marginTop:16},
  startT:{color:'#fff',fontSize:18,fontWeight:'bold'},
  // Game
  gc:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#000'},
  sv:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#000'},
  lo:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:'#000',zIndex:5},
  lot:{color:'#aaa',fontSize:16},
  eo:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:'#0a0a1a',zIndex:10},
  ee:{fontSize:60,marginBottom:15},
  rb:{backgroundColor:'#e94560',paddingHorizontal:24,paddingVertical:12,borderRadius:10},rbt:{color:'#fff',fontSize:16,fontWeight:'600'},
  tb:{position:'absolute',top:40,left:12,right:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',zIndex:20},
  pb:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(0,0,0,0.65)',borderRadius:20,paddingVertical:6,paddingHorizontal:12,borderWidth:2,borderColor:'transparent'},
  pbA:{borderColor:'#e94560',backgroundColor:'rgba(233,69,96,0.2)'},
  pn:{color:'#fff',fontSize:12,fontWeight:'600'},ps:{color:'#FFD700',fontSize:12,fontWeight:'700'},
  rb2:{backgroundColor:'rgba(0,0,0,0.65)',borderRadius:16,paddingVertical:6,paddingHorizontal:12},
  rb2t:{color:'#fff',fontSize:12,fontWeight:'600'},
  tm:{position:'absolute',top:80,right:12,width:52,height:52,borderRadius:26,backgroundColor:'rgba(0,0,0,0.85)',borderWidth:3,justifyContent:'center',alignItems:'center',zIndex:20},
  tmt:{fontSize:22,fontWeight:'bold'},
  sk:{position:'absolute',bottom:60,alignSelf:'center',backgroundColor:'rgba(0,0,0,0.85)',paddingHorizontal:28,paddingVertical:14,borderRadius:25,borderWidth:1.5,borderColor:'#4CAF50',zIndex:20},
  skt:{color:'#4CAF50',fontSize:17,fontWeight:'600'},
  ao:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.92)',zIndex:30,justifyContent:'center',paddingHorizontal:24},
  ac:{backgroundColor:'#16213e',borderRadius:20,padding:24},
  at:{color:'#fff',fontSize:18,fontWeight:'700',textAlign:'center',marginBottom:16},
  tin:{backgroundColor:'#0f3460',color:'#fff',borderRadius:10,paddingHorizontal:16,paddingVertical:14,fontSize:18,borderWidth:1,borderColor:'#2a2a4a',textAlign:'center',marginBottom:16},
  abtns:{flexDirection:'row',gap:10},
  skipB:{backgroundColor:'transparent',paddingVertical:14,paddingHorizontal:20,borderRadius:12,borderWidth:1,borderColor:'#333'},skipT:{color:'#888',fontSize:15},
  ro:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.92)',zIndex:40,justifyContent:'center',paddingHorizontal:20},
  rc:{backgroundColor:'#16213e',borderRadius:20,padding:24,alignItems:'center'},
  re:{fontSize:48,marginBottom:8},rti:{fontSize:26,fontWeight:'800',marginBottom:16,textAlign:'center'},
  ri:{width:'100%',marginBottom:12},
  rr:{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#2a2a4a'},
  rl:{color:'#aaa',fontSize:14},rv:{color:'#fff',fontSize:14,fontWeight:'600'},
  pts:{fontSize:26,fontWeight:'800',color:'#FFD700',marginBottom:16},
  // Summary
  sc:{padding:30,alignItems:'center',paddingTop:50},
  tp:{fontSize:64,marginBottom:10},st:{color:'#fff',fontSize:28,fontWeight:'800',marginBottom:4},ss:{color:'#888',fontSize:14,marginBottom:20},
  li:{flexDirection:'row',alignItems:'center',backgroundColor:'#16213e',borderRadius:12,padding:14,marginBottom:8,width:'100%',borderWidth:1,borderColor:'#2a2a4a'},
  lf:{borderColor:'#FFD700',borderWidth:2,backgroundColor:'rgba(255,215,0,0.08)'},
  lr:{fontSize:22,marginRight:12},ln:{flex:1,color:'#fff',fontSize:16,fontWeight:'600'},ls:{color:'#FFD700',fontSize:16,fontWeight:'700'},
  ht:{color:'#fff',fontSize:16,fontWeight:'700',marginTop:16,marginBottom:10,width:'100%',textAlign:'center'},
  hr:{flexDirection:'row',alignItems:'center',paddingVertical:6,borderBottomWidth:1,borderBottomColor:'#2a2a4a',width:'100%'},
  hrn:{color:'#666',fontSize:12,width:28},hp:{color:'#fff',fontSize:13,flex:1},hl:{color:'#aaa',fontSize:13,flex:1},hpt:{color:'#4CAF50',fontSize:14,fontWeight:'700',width:36,textAlign:'right'},
});
