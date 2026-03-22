// GeoCheckr v8 — NEON Design + Static Images (guaranteed to work)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Vibration, StatusBar, Dimensions, TextInput, Image, ScrollView
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

// Neon color palette
const NC = {
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#1a1a28',
  neon1: '#00f5ff',    // cyan
  neon2: '#ff00ff',    // magenta
  neon3: '#39ff14',    // green
  neon4: '#ff6b35',    // orange
  text: '#e8e8f0',
  muted: '#6a6a8a',
  dim: '#3a3a4a',
};

const shuffle = (arr) => {
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
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
  const glowAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

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
    const next = order[round];
    setCurrentLoc(next); setTimer(30); setRound(r => r + 1);
    setScreen('streetview');
  };

  const submitAnswer = (guess) => {
    if(!currentLoc) return;
    const ng = guess.toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s/g,'');
    const nc = currentLoc.city.toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s/g,'');
    const correct = ng.includes(nc) || nc.includes(ng);
    const pts = correct ? 100 : 0;
    const ns = score + pts;
    setScore(ns);
    setHistory(h => [...h, { city:currentLoc.city, guess, correct, pts }]);
    setResult({ correct, city:currentLoc.city, country:currentLoc.country, pts, score:ns });
    popAnim.setValue(0);
    Animated.spring(popAnim, { toValue:1, tension:50, friction:7, useNativeDriver:true }).start();
    setScreen('result');
  };

  const neonGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,245,255,0.2)', 'rgba(0,245,255,0.6)']
  });

  // ═══ HOME — NEON STYLE ═══
  if(screen==='home') return (
    <View style={ns.container}>
      <StatusBar barStyle="light-content" backgroundColor={NC.bg} />
      <View style={ns.bgGrid}>
        {Array.from({length:8}).map((_,i)=>(
          <View key={i} style={[ns.gridLine, {top:i*(100/8)+'%', opacity:0.05}]}/>
        ))}
      </View>
      <Animated.View style={[ns.neonOrb, {top:'15%',left:'10%',backgroundColor:NC.neon1, shadowColor:NC.neon1, shadowOpacity:glowAnim}]} />
      <Animated.View style={[ns.neonOrb, {bottom:'20%',right:'5%',backgroundColor:NC.neon2, shadowColor:NC.neon2, shadowOpacity:glowAnim}]} />
      <View style={ns.homeContent}>
        <Text style={ns.logo}>◈</Text>
        <Text style={ns.title}>GEO</Text>
        <Text style={ns.titleAccent}>CHECKR</Text>
        <Text style={ns.subtitle}>◈ NEON EDITION ◈</Text>
        <Text style={ns.tagline}>Rate die Stadt aus Street View</Text>
        
        <TouchableOpacity style={ns.playBtn} onPress={startGame}>
          <Animated.View style={[ns.playBtnGlow, {shadowColor:NC.neon1, shadowOpacity:glowAnim}]} />
          <Text style={ns.playBtnText}>▶ SPIELEN</Text>
          <Text style={ns.playBtnSub}>10 Runden • 30s Timer</Text>
        </TouchableOpacity>

        <View style={ns.statsRow}>
          <View style={ns.statBox}>
            <Text style={ns.statNum}>10</Text>
            <Text style={ns.statLabel}>STÄDTE</Text>
          </View>
          <View style={ns.statBox}>
            <Text style={ns.statNum}>30s</Text>
            <Text style={ns.statLabel}>TIMER</Text>
          </View>
          <View style={ns.statBox}>
            <Text style={ns.statNum}>100%</Text>
            <Text style={ns.statLabel}>PUNKTE</Text>
          </View>
        </View>

        <ScrollView style={ns.cityList} showsVerticalScrollIndicator={false}>
          {LOCS.map((l,i) => (
            <View key={l.id} style={ns.cityRow}>
              <Text style={ns.cityNum}>{String(i+1).padStart(2,'0')}</Text>
              <Text style={ns.cityName}>{l.city}</Text>
              <Text style={ns.cityCountry}>{l.country}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // ─── STREET VIEW ───
  if(screen==='streetview' && currentLoc) {
    return (
      <View style={ns.container}>
        <StatusBar hidden />
        <Image
          source={{uri: `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${currentLoc.lat},${currentLoc.lng}&heading=${heading}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Neon border overlay */}
        <View style={ns.neonBorder}>
          <View style={[ns.neonCorner,{top:0,left:0,borderColor:NC.neon1}]}/>
          <View style={[ns.neonCorner,{top:0,right:0,borderColor:NC.neon2}]}/>
          <View style={[ns.neonCorner,{bottom:0,left:0,borderColor:NC.neon3}]}/>
          <View style={[ns.neonCorner,{bottom:0,right:0,borderColor:NC.neon4}]}/>
        </View>
        <View style={ns.timerCircle}>
          <Text style={[ns.timerText, timer<=5&&{color:NC.neon2}]}>{timer}</Text>
        </View>
        <View style={ns.roundPill}>
          <Text style={ns.roundText}>⬡ {round}/{maxRounds}</Text>
        </View>
        <TouchableOpacity style={ns.answerBtn} onPress={() => { setInput(''); setScreen('input'); }}>
          <Text style={ns.answerBtnText}>ICH WEIẞ ES →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── TEXT INPUT ───
  if(screen==='input') {
    return (
      <View style={ns.container}>
        <StatusBar barStyle="light-content" backgroundColor={NC.bg} />
        <View style={ns.inputContent}>
          <Text style={ns.inputEmoji}>◈</Text>
          <Text style={ns.inputTitle}>WELCHE STADT?</Text>
          <Text style={ns.inputHint}>Tippe den Namen der Stadt</Text>
          <TextInput
            style={ns.textInput}
            placeholder="Seoul, Tokyo, New York..."
            placeholderTextColor={NC.dim}
            value={input} onChangeText={setInput}
            autoFocus autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => { if(input.trim()) submitAnswer(input); }}
          />
          <TouchableOpacity
            style={[ns.submitBtn, !input.trim()&&{opacity:0.3}]}
            disabled={!input.trim()}
            onPress={() => submitAnswer(input)}
          >
            <Text style={ns.submitBtnText}>BESTÄTIGEN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── RESULT ───
  if(screen==='result' && result) return (
    <View style={ns.container}>
      <StatusBar barStyle="light-content" backgroundColor={NC.bg} />
      <Animated.View style={[ns.resultContent, {transform:[{scale:popAnim}]}]}>
        <Text style={ns.resultEmoji}>{result.correct ? '⚡' : '💀'}</Text>
        <Text style={[ns.resultTitle, {color: result.correct ? NC.neon3 : NC.neon2}]}>
          {result.correct ? 'RICHTIG!' : 'FALSCH!'}
        </Text>
        <Text style={ns.resultCity}>{result.city}, {result.country}</Text>
        <Text style={ns.resultPts}>+{result.pts}</Text>
        <Text style={ns.resultTotal}>TOTAL: {result.score} / {round * 100}</Text>
        <TouchableOpacity style={ns.nextBtn} onPress={nextRound}>
          <Text style={ns.nextBtnText}>{round >= maxRounds ? '◈ ERGEBNIS ◈' : 'NÄCHSTE RUNDE →'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // ─── SUMMARY ───
  if(screen==='summary') return (
    <View style={ns.container}>
      <StatusBar barStyle="light-content" backgroundColor={NC.bg} />
      <ScrollView contentContainerStyle={ns.summaryContent}>
        <Text style={ns.summaryEmoji}>◈</Text>
        <Text style={ns.summaryTitle}>GAME OVER</Text>
        <Text style={ns.summaryScore}>{score} / {maxRounds * 100}</Text>
        <Text style={ns.summarySub}>{history.filter(h=>h.correct).length} von {maxRounds} richtig</Text>
        {history.map((h,i) => (
          <View key={i} style={ns.historyItem}>
            <Text style={ns.historyNum}>{String(i+1).padStart(2,'0')}</Text>
            <Text style={ns.historyCity}>{h.city}</Text>
            <Text style={[ns.historyStatus, {color: h.correct ? NC.neon3 : NC.neon2}]}>
              {h.correct ? '✓ +100' : '✗ 0'}
            </Text>
          </View>
        ))}
        <TouchableOpacity style={ns.restartBtn} onPress={() => setScreen('home')}>
          <Text style={ns.restartBtnText}>NOCHMAL SPIELEN</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return null;
}

const ns = StyleSheet.create({
  container: { flex:1, backgroundColor:NC.bg },
  bgGrid: { position:'absolute', width:'100%', height:'100%' },
  gridLine: { position:'absolute', left:0, right:0, height:1, backgroundColor:NC.neon1 },
  neonOrb: { position:'absolute', width:200, height:200, borderRadius:100, opacity:0.15, shadowOffset:{width:0,height:0}, shadowRadius:40 },
  homeContent: { flex:1, alignItems:'center', justifyContent:'center', padding:24, zIndex:1 },
  logo: { fontSize:48, color:NC.neon1, marginBottom:8 },
  title: { fontSize:56, fontWeight:'900', color:NC.text, letterSpacing:8, marginTop:-4 },
  titleAccent: { fontSize:56, fontWeight:'900', color:NC.neon1, letterSpacing:8, marginTop:-20 },
  subtitle: { fontSize:11, color:NC.neon2, letterSpacing:6, marginTop:4, marginBottom:4 },
  tagline: { fontSize:14, color:NC.muted, marginBottom:32 },
  playBtn: { width:'100%', backgroundColor:NC.surface, borderRadius:16, padding:20, alignItems:'center', marginBottom:24, borderWidth:1, borderColor:NC.neon1, position:'relative', overflow:'hidden' },
  playBtnGlow: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:NC.neon1, opacity:0.05 },
  playBtnText: { fontSize:20, fontWeight:'900', color:NC.neon1, letterSpacing:4 },
  playBtnSub: { fontSize:11, color:NC.muted, marginTop:4, letterSpacing:2 },
  statsRow: { flexDirection:'row', gap:16, marginBottom:24 },
  statBox: { backgroundColor:NC.surface, borderRadius:12, padding:16, alignItems:'center', minWidth:80, borderWidth:1, borderColor:NC.dim },
  statNum: { fontSize:24, fontWeight:'900', color:NC.neon1 },
  statLabel: { fontSize:8, color:NC.muted, letterSpacing:2, marginTop:4 },
  cityList: { width:'100%', maxHeight:200 },
  cityRow: { flexDirection:'row', alignItems:'center', paddingVertical:8, paddingHorizontal:12, backgroundColor:NC.surface, borderRadius:8, marginBottom:4 },
  cityNum: { color:NC.dim, fontSize:12, fontWeight:'700', width:28 },
  cityName: { color:NC.text, fontSize:14, fontWeight:'700', flex:1 },
  cityCountry: { color:NC.muted, fontSize:12 },
  neonBorder: { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:5 },
  neonCorner: { position:'absolute', width:50, height:50, borderWidth:2 },
  timerCircle: { position:'absolute', top:48, alignSelf:'center', backgroundColor:'rgba(10,10,15,0.9)', borderRadius:26, width:52, height:52, alignItems:'center', justifyContent:'center', zIndex:10, borderWidth:2, borderColor:NC.neon1 },
  timerText: { color:NC.neon1, fontSize:22, fontWeight:'900' },
  roundPill: { position:'absolute', top:48, left:20, backgroundColor:'rgba(10,10,15,0.9)', borderRadius:12, paddingHorizontal:14, paddingVertical:6, zIndex:10 },
  roundText: { color:NC.muted, fontSize:13, fontWeight:'700', letterSpacing:2 },
  answerBtn: { position:'absolute', bottom:48, left:20, right:20, backgroundColor:NC.surface, borderRadius:16, padding:18, alignItems:'center', zIndex:10, borderWidth:1, borderColor:NC.neon3 },
  answerBtnText: { color:NC.neon3, fontSize:16, fontWeight:'900', letterSpacing:2 },
  inputContent: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  inputEmoji: { fontSize:48, color:NC.neon1, marginBottom:16 },
  inputTitle: { fontSize:32, fontWeight:'900', color:NC.text, letterSpacing:4, marginBottom:8 },
  inputHint: { fontSize:14, color:NC.muted, marginBottom:24 },
  textInput: { backgroundColor:NC.surface, borderRadius:12, padding:16, fontSize:18, color:NC.text, borderWidth:1, borderColor:NC.neon1, width:'100%', marginBottom:16, textAlign:'center' },
  submitBtn: { backgroundColor:NC.surface, borderRadius:12, padding:16, alignItems:'center', width:'100%', borderWidth:1, borderColor:NC.neon3 },
  submitBtnText: { color:NC.neon3, fontSize:16, fontWeight:'900', letterSpacing:2 },
  resultContent: { flex:1, justifyContent:'center', alignItems:'center', padding:32 },
  resultEmoji: { fontSize:80, marginBottom:16 },
  resultTitle: { fontSize:36, fontWeight:'900', letterSpacing:4, marginBottom:8 },
  resultCity: { fontSize:18, color:NC.muted, marginBottom:8 },
  resultPts: { fontSize:48, fontWeight:'900', color:NC.neon1, marginBottom:8 },
  resultTotal: { fontSize:14, color:NC.muted, marginBottom:32, letterSpacing:2 },
  nextBtn: { backgroundColor:NC.surface, borderRadius:16, padding:16, paddingHorizontal:32, borderWidth:1, borderColor:NC.neon1 },
  nextBtnText: { color:NC.neon1, fontSize:16, fontWeight:'900', letterSpacing:2 },
  summaryContent: { alignItems:'center', padding:24, paddingTop:60 },
  summaryEmoji: { fontSize:64, color:NC.neon1, marginBottom:12 },
  summaryTitle: { fontSize:28, fontWeight:'900', color:NC.text, letterSpacing:6, marginBottom:8 },
  summaryScore: { fontSize:56, fontWeight:'900', color:NC.neon1, marginBottom:4 },
  summarySub: { fontSize:14, color:NC.muted, marginBottom:24, letterSpacing:2 },
  historyItem: { flexDirection:'row', alignItems:'center', backgroundColor:NC.surface, borderRadius:8, padding:12, marginBottom:6, width:'100%' },
  historyNum: { color:NC.dim, fontSize:14, fontWeight:'700', width:32 },
  historyCity: { color:NC.text, fontSize:14, fontWeight:'700', flex:1 },
  historyStatus: { fontSize:14, fontWeight:'900' },
  restartBtn: { backgroundColor:NC.surface, borderRadius:16, padding:16, paddingHorizontal:32, borderWidth:1, borderColor:NC.neon2, marginTop:16, marginBottom:40 },
  restartBtnText: { color:NC.neon2, fontSize:16, fontWeight:'900', letterSpacing:2 },
});
