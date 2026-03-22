// GeoCheckr v10 — MINIMAL WHITE Design (clean, Apple-like)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Vibration, StatusBar, Dimensions, TextInput, Image
} from 'react-native';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

const LOCS = [
  { id:1, city:'Seoul', country:'Südkorea', lat:37.571922, lng:126.976715 },
  { id:2, city:'Tokyo', country:'Japan', lat:35.6595, lng:139.700399 },
  { id:3, city:'New York', country:'USA', lat:40.758896, lng:-73.985130 },
  { id:4, city:'Portland', country:'Oregon, USA', lat:45.523062, lng:-122.676482 },
  { id:5, city:'Delhi', country:'Indien', lat:28.613939, lng:77.209021 },
  { id:6, city:'Johannesburg', country:'Südafrika', lat:-26.204103, lng:28.047305 },
  { id:7, city:'Kapstadt', country:'Südafrika', lat:-33.903771, lng:18.421866 },
  { id:8, city:'Kopenhagen', country:'Dänemark', lat:55.68001, lng:12.590604 },
  { id:9, city:'Rio', country:'Brasilien', lat:-22.970548, lng:-43.182883 },
  { id:10, city:'Beijing', country:'China', lat:39.904200, lng:116.407396 },
];

const WC = {
  bg: '#ffffff',
  surface: '#f5f5f7',
  card: '#ffffff',
  text: '#1d1d1f',
  secondary: '#86868b',
  accent: '#0071e3',
  success: '#34c759',
  error: '#ff3b30',
  separator: '#d2d2d7',
};

const shuffle = (a) => {
  const arr = [...a];
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [order, setOrder] = useState([]);
  const [timer, setTimer] = useState(30);
  const [heading] = useState(() => Math.floor(Math.random()*360));
  const [input, setInput] = useState('');
  const popAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if(screen==='streetview' && timer>0) {
      timerRef.current = setTimeout(() => setTimer(t=>t-1), 1000);
      return () => clearTimeout(timerRef.current);
    }
    if(timer===0 && screen==='streetview') {
      Vibration.vibrate(200);
      setInput('');
      setScreen('input');
    }
  }, [screen, timer]);

  const startGame = () => {
    const o = shuffle(LOCS);
    setOrder(o); setRound(1); setScore(0); setHistory([]);
    popAnim.setValue(0);
    setCurrentLoc(o[0]); setTimer(30);
    setScreen('streetview');
  };

  const nextRound = () => {
    popAnim.setValue(0);
    if(round >= maxRounds) { setScreen('summary'); return; }
    setCurrentLoc(order[round]); setTimer(30); setRound(r => r + 1);
    setScreen('streetview');
  };

  const submitAnswer = (guess) => {
    if(!currentLoc) return;
    const ng = guess.toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s/g,'');
    const nc = currentLoc.city.toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s/g,'');
    const correct = ng.includes(nc) || nc.includes(ng);
    const pts = correct ? 100 : 0;
    setScore(s => s + pts);
    setHistory(h => [...h, { city:currentLoc.city, guess, correct, pts }]);
    setResult({ correct, city:currentLoc.city, country:currentLoc.country, pts, score:score+pts });
    popAnim.setValue(0);
    Animated.spring(popAnim, { toValue:1, tension:50, friction:7, useNativeDriver:true }).start();
    setScreen('result');
  };

  // ═══ HOME — CLEAN WHITE ═══
  if(screen==='home') return (
    <View style={ws.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WC.bg} />
      <View style={ws.homeContent}>
        <View style={ws.iconCircle}>
          <Text style={ws.icon}>🌍</Text>
        </View>
        <Text style={ws.title}>GeoCheckr</Text>
        <Text style={ws.subtitle}>Rate die Stadt</Text>
        
        <View style={ws.infoRow}>
          <View style={ws.infoChip}>
            <Text style={ws.infoChipText}>10 Städte</Text>
          </View>
          <View style={ws.infoChip}>
            <Text style={ws.infoChipText}>30s Timer</Text>
          </View>
        </View>

        <TouchableOpacity style={ws.playBtn} onPress={startGame}>
          <Text style={ws.playBtnText}>Spielen</Text>
        </TouchableOpacity>

        <View style={ws.cityList}>
          {LOCS.map((l,i) => (
            <View key={l.id} style={ws.cityRow}>
              <Text style={ws.cityName}>{l.city}</Text>
              <Text style={ws.cityCountry}>{l.country}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ─── STREET VIEW ───
  if(screen==='streetview' && currentLoc) {
    return (
      <View style={ws.container}>
        <StatusBar hidden />
        <Image
          source={{uri: `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${currentLoc.lat},${currentLoc.lng}&heading=${heading}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={ws.timerBadge}>
          <Text style={[ws.timerText, timer<=5&&{color:WC.error}]}>{timer}</Text>
        </View>
        <View style={ws.roundBadge}>
          <Text style={ws.roundText}>{round} / {maxRounds}</Text>
        </View>
        <TouchableOpacity style={ws.answerBtn} onPress={() => { setInput(''); setScreen('input'); }}>
          <Text style={ws.answerBtnText}>Ich weiß es</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── INPUT ───
  if(screen==='input') {
    return (
      <View style={ws.container}>
        <StatusBar barStyle="dark-content" backgroundColor={WC.bg} />
        <View style={ws.inputScreen}>
          <Text style={ws.inputTitle}>Welche Stadt?</Text>
          <Text style={ws.inputHint}>Tippe den Namen der Stadt</Text>
          <TextInput
            style={ws.textInput}
            placeholder="z.B. Seoul"
            placeholderTextColor={WC.secondary}
            value={input} onChangeText={setInput}
            autoFocus autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => { if(input.trim()) submitAnswer(input); }}
          />
          <TouchableOpacity
            style={[ws.submitBtn, !input.trim()&&{opacity:0.4}]}
            disabled={!input.trim()}
            onPress={() => submitAnswer(input)}
          >
            <Text style={ws.submitBtnText}>Bestätigen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── RESULT ───
  if(screen==='result' && result) return (
    <View style={ws.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WC.bg} />
      <Animated.View style={[ws.resultScreen, {transform:[{scale:popAnim}]}]}>
        <Text style={ws.resultEmoji}>{result.correct ? '✅' : '❌'}</Text>
        <Text style={[ws.resultTitle, {color: result.correct ? WC.success : WC.error}]}>
          {result.correct ? 'Richtig!' : 'Leider nein'}
        </Text>
        <Text style={ws.resultCity}>{result.city}, {result.country}</Text>
        <Text style={ws.resultPts}>+{result.pts}</Text>
        <TouchableOpacity style={ws.nextBtn} onPress={nextRound}>
          <Text style={ws.nextBtnText}>{round >= maxRounds ? 'Ergebnis' : 'Nächste Runde'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // ─── SUMMARY ───
  if(screen==='summary') return (
    <View style={ws.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WC.bg} />
      <View style={ws.summaryScreen}>
        <Text style={ws.summaryTitle}>Spiel beendet</Text>
        <Text style={ws.summaryScore}>{score} / {maxRounds * 100}</Text>
        <Text style={ws.summarySub}>{history.filter(h=>h.correct).length} von {maxRounds} richtig</Text>
        {history.map((h,i) => (
          <View key={i} style={ws.historyRow}>
            <Text style={ws.historyCity}>{h.city}</Text>
            <Text style={[ws.historyStatus, {color: h.correct ? WC.success : WC.error}]}>
              {h.correct ? '✓ +100' : '✗ 0'}
            </Text>
          </View>
        ))}
        <TouchableOpacity style={ws.restartBtn} onPress={() => setScreen('home')}>
          <Text style={ws.restartBtnText}>Nochmal spielen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return null;
}

const ws = StyleSheet.create({
  container: { flex:1, backgroundColor:WC.bg },
  homeContent: { flex:1, alignItems:'center', padding:24, paddingTop:60 },
  iconCircle: { width:80, height:80, borderRadius:40, backgroundColor:WC.surface, alignItems:'center', justifyContent:'center', marginBottom:16 },
  icon: { fontSize:40 },
  title: { fontSize:36, fontWeight:'700', color:WC.text, marginBottom:4 },
  subtitle: { fontSize:16, color:WC.secondary, marginBottom:20 },
  infoRow: { flexDirection:'row', gap:8, marginBottom:24 },
  infoChip: { backgroundColor:WC.surface, borderRadius:20, paddingHorizontal:16, paddingVertical:8 },
  infoChipText: { fontSize:13, color:WC.secondary },
  playBtn: { backgroundColor:WC.accent, borderRadius:14, padding:16, alignItems:'center', width:'100%', marginBottom:24 },
  playBtnText: { color:'#fff', fontSize:17, fontWeight:'600' },
  cityList: { width:'100%' },
  cityRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:WC.separator },
  cityName: { fontSize:16, color:WC.text, fontWeight:'500' },
  cityCountry: { fontSize:14, color:WC.secondary },
  timerBadge: { position:'absolute', top:48, alignSelf:'center', backgroundColor:'rgba(255,255,255,0.95)', borderRadius:20, width:44, height:44, alignItems:'center', justifyContent:'center', zIndex:10 },
  timerText: { color:WC.text, fontSize:18, fontWeight:'700' },
  roundBadge: { position:'absolute', top:48, left:20, backgroundColor:'rgba(255,255,255,0.95)', borderRadius:16, paddingHorizontal:12, paddingVertical:6, zIndex:10 },
  roundText: { color:WC.secondary, fontSize:13 },
  answerBtn: { position:'absolute', bottom:48, left:20, right:20, backgroundColor:'rgba(255,255,255,0.95)', borderRadius:14, padding:16, alignItems:'center', zIndex:10 },
  answerBtnText: { color:WC.accent, fontSize:16, fontWeight:'600' },
  inputScreen: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  inputTitle: { fontSize:28, fontWeight:'700', color:WC.text, marginBottom:4 },
  inputHint: { fontSize:15, color:WC.secondary, marginBottom:24 },
  textInput: { backgroundColor:WC.surface, borderRadius:12, padding:16, fontSize:17, color:WC.text, width:'100%', marginBottom:16, textAlign:'center' },
  submitBtn: { backgroundColor:WC.accent, borderRadius:12, padding:16, alignItems:'center', width:'100%' },
  submitBtnText: { color:'#fff', fontSize:16, fontWeight:'600' },
  resultScreen: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  resultEmoji: { fontSize:64, marginBottom:12 },
  resultTitle: { fontSize:28, fontWeight:'700', marginBottom:8 },
  resultCity: { fontSize:16, color:WC.secondary, marginBottom:8 },
  resultPts: { fontSize:40, fontWeight:'700', color:WC.text, marginBottom:8 },
  nextBtn: { backgroundColor:WC.accent, borderRadius:12, padding:16, paddingHorizontal:32, marginTop:16 },
  nextBtnText: { color:'#fff', fontSize:16, fontWeight:'600' },
  summaryScreen: { flex:1, alignItems:'center', padding:24, paddingTop:60 },
  summaryTitle: { fontSize:24, fontWeight:'700', color:WC.text, marginBottom:8 },
  summaryScore: { fontSize:44, fontWeight:'700', color:WC.accent, marginBottom:4 },
  summarySub: { fontSize:15, color:WC.secondary, marginBottom:24 },
  historyRow: { flexDirection:'row', justifyContent:'space-between', width:'100%', paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:WC.separator },
  historyCity: { fontSize:15, color:WC.text },
  historyStatus: { fontSize:15, fontWeight:'600' },
  restartBtn: { backgroundColor:WC.accent, borderRadius:12, padding:16, paddingHorizontal:32, marginTop:24 },
  restartBtnText: { color:'#fff', fontSize:16, fontWeight:'600' },
});
