// GeoCheckr v9 — RETRO TERMINAL Design (green-on-black, CRT style)
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

const RC = {
  bg: '#000000',
  green: '#00ff41',
  greenDim: '#00aa2a',
  greenDark: '#003311',
  amber: '#ffb000',
  red: '#ff3333',
  white: '#cccccc',
  dim: '#333333',
};

const shuffle = (a) => {
  const arr = [...a];
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
};

export default function App() {
  const [screen, setScreen] = useState('boot');
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [order, setOrder] = useState([]);
  const [timer, setTimer] = useState(30);
  const [bootLines, setBootLines] = useState([]);
  const [heading] = useState(() => Math.floor(Math.random()*360));
  const [input, setInput] = useState('');
  const timerRef = useRef(null);

  // Boot sequence
  useEffect(() => {
    if(screen !== 'boot') return;
    const lines = [
      'GEOCHECKR v9.0 — RETRO TERMINAL',
      '================================',
      '> Initializing satellite uplink...',
      '> Connecting to Google Maps API...',
      '> Loading 10 global locations...',
      '> Calibrating street view sensors...',
      '> Ready.',
      '',
      'PRESS ANY KEY TO CONTINUE_'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if(i < lines.length) {
        setBootLines(prev => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [screen]);

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
    setCurrentLoc(o[0]); setTimer(30);
    setScreen('streetview');
  };

  const nextRound = () => {
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
    setScore(s => s + pts);
    setHistory(h => [...h, { city:currentLoc.city, guess, correct, pts }]);
    setResult({ correct, city:currentLoc.city, country:currentLoc.country, pts, score:score+pts });
    setScreen('result');
  };

  // ═══ BOOT SCREEN ═══
  if(screen==='boot') return (
    <View style={rs.container}>
      <StatusBar barStyle="light-content" backgroundColor={RC.bg} />
      <View style={rs.bootScreen}>
        {bootLines.map((line, i) => (
          <Text key={i} style={[rs.bootLine, line.includes('Ready') && {color:RC.green}]}>{line}</Text>
        ))}
        {bootLines.length > 0 && bootLines[bootLines.length-1].includes('PRESS') && (
          <TouchableOpacity style={rs.bootBtn} onPress={() => setScreen('home')}>
            <Text style={rs.bootBtnText}>[ START ]</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ═══ HOME — TERMINAL STYLE ═══
  if(screen==='home') return (
    <View style={rs.container}>
      <StatusBar barStyle="light-content" backgroundColor={RC.bg} />
      <View style={rs.terminalScreen}>
        <Text style={rs.terminalHeader}>╔══════════════════════════════════╗</Text>
        <Text style={rs.terminalHeader}>║  GEOCHECKR — CARTOGRAPHIC GAME  ║</Text>
        <Text style={rs.terminalHeader}>╚══════════════════════════════════╝</Text>
        <Text style={rs.terminalText}>{''}</Text>
        <Text style={rs.terminalText}>  > Locations: 10 global cities</Text>
        <Text style={rs.terminalText}>  > Mode: Street View identification</Text>
        <Text style={rs.terminalText}>  > Timer: 30 seconds per round</Text>
        <Text style={rs.terminalText}>  > Scoring: +100 per correct answer</Text>
        <Text style={rs.terminalText}>{''}</Text>
        <Text style={rs.terminalText}>  ┌─────────────────────────────┐</Text>
        <Text style={rs.terminalText}>  │  AVAILABLE LOCATIONS:       │</Text>
        {LOCS.map((l,i) => (
          <Text key={l.id} style={rs.terminalText}>
            {'  │  '}{String(i+1).padStart(2,'0')}. {l.city.padEnd(16)}{l.country.padEnd(12)}│
          </Text>
        ))}
        <Text style={rs.terminalText}>  └─────────────────────────────┘</Text>
        <Text style={rs.terminalText}>{''}</Text>
        <TouchableOpacity style={rs.terminalBtn} onPress={startGame}>
          <Text style={rs.terminalBtnText}>{'>'} START GAME {'<'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── STREET VIEW ───
  if(screen==='streetview' && currentLoc) {
    return (
      <View style={rs.container}>
        <StatusBar hidden />
        <Image
          source={{uri: `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${currentLoc.lat},${currentLoc.lng}&heading=${heading}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={rs.scanlines} />
        <View style={rs.timerBox}>
          <Text style={[rs.timerText, timer<=5&&{color:RC.red}]}>T:{timer}</Text>
        </View>
        <View style={rs.roundBox}>
          <Text style={rs.roundText}>R{round}/{maxRounds}</Text>
        </View>
        <TouchableOpacity style={rs.answerBtn} onPress={() => { setInput(''); setScreen('input'); }}>
          <Text style={rs.answerBtnText}>{'>'} ANSWER {'<'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── INPUT ───
  if(screen==='input') {
    return (
      <View style={rs.container}>
        <StatusBar barStyle="light-content" backgroundColor={RC.bg} />
        <View style={rs.inputScreen}>
          <Text style={rs.inputHeader}>┌─ CITY IDENTIFICATION ─┐</Text>
          <Text style={rs.inputHint}>{'>'} Enter city name:</Text>
          <TextInput
            style={rs.textInput}
            placeholder="city_name"
            placeholderTextColor={RC.dim}
            value={input} onChangeText={setInput}
            autoFocus autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => { if(input.trim()) submitAnswer(input); }}
          />
          <TouchableOpacity
            style={[rs.submitBtn, !input.trim()&&{opacity:0.3}]}
            disabled={!input.trim()}
            onPress={() => submitAnswer(input)}
          >
            <Text style={rs.submitBtnText}>[ SUBMIT ]</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── RESULT ───
  if(screen==='result' && result) return (
    <View style={rs.container}>
      <StatusBar barStyle="light-content" backgroundColor={RC.bg} />
      <View style={rs.resultScreen}>
        <Text style={[rs.resultStatus, {color: result.correct ? RC.green : RC.red}]}>
          {result.correct ? '>>> CORRECT <<<' : '>>> INCORRECT <<<'}
        </Text>
        <Text style={rs.resultText}>City: {result.city}, {result.country}</Text>
        <Text style={rs.resultText}>Points: +{result.pts}</Text>
        <Text style={rs.resultText}>Total: {result.score}/{round * 100}</Text>
        <TouchableOpacity style={rs.nextBtn} onPress={nextRound}>
          <Text style={rs.nextBtnText}>{round >= maxRounds ? '[ RESULTS ]' : '[ NEXT ROUND ]'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── SUMMARY ───
  if(screen==='summary') return (
    <View style={rs.container}>
      <StatusBar barStyle="light-content" backgroundColor={RC.bg} />
      <View style={rs.summaryScreen}>
        <Text style={rs.summaryHeader}>═══ FINAL REPORT ═══</Text>
        <Text style={rs.summaryScore}>Score: {score}/{maxRounds * 100}</Text>
        <Text style={rs.summaryText}>Correct: {history.filter(h=>h.correct).length}/{maxRounds}</Text>
        <Text style={rs.summaryText}>{''}</Text>
        {history.map((h,i) => (
          <Text key={i} style={[rs.summaryRow, {color: h.correct ? RC.green : RC.red}]}>
            {String(i+1).padStart(2,'0')}. {h.city.padEnd(16)} {h.correct ? '[OK] +100' : '[--] +0'}
          </Text>
        ))}
        <TouchableOpacity style={rs.restartBtn} onPress={() => setScreen('home')}>
          <Text style={rs.restartBtnText}>[ RESTART ]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return null;
}

const rs = StyleSheet.create({
  container: { flex:1, backgroundColor:RC.bg },
  bootScreen: { flex:1, padding:24, justifyContent:'center' },
  bootLine: { color:RC.green, fontSize:14, fontFamily:'monospace', marginBottom:4 },
  bootBtn: { marginTop:20, alignSelf:'center', borderWidth:1, borderColor:RC.green, padding:12, paddingHorizontal:24 },
  bootBtnText: { color:RC.green, fontSize:16, fontWeight:'700' },
  terminalScreen: { flex:1, padding:20, justifyContent:'center' },
  terminalHeader: { color:RC.green, fontSize:13, fontFamily:'monospace', textAlign:'center', marginBottom:2 },
  terminalText: { color:RC.greenDim, fontSize:13, fontFamily:'monospace', lineHeight:20 },
  terminalBtn: { borderWidth:1, borderColor:RC.green, padding:14, alignItems:'center', marginTop:20, marginHorizontal:20 },
  terminalBtnText: { color:RC.green, fontSize:18, fontWeight:'900', letterSpacing:4 },
  scanlines: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.1)', zIndex:2 },
  timerBox: { position:'absolute', top:48, right:20, backgroundColor:'rgba(0,0,0,0.8)', borderWidth:1, borderColor:RC.green, borderRadius:4, paddingHorizontal:10, paddingVertical:6, zIndex:10 },
  timerText: { color:RC.green, fontSize:18, fontWeight:'700', fontFamily:'monospace' },
  roundBox: { position:'absolute', top:48, left:20, backgroundColor:'rgba(0,0,0,0.8)', borderWidth:1, borderColor:RC.greenDim, borderRadius:4, paddingHorizontal:10, paddingVertical:6, zIndex:10 },
  roundText: { color:RC.greenDim, fontSize:14, fontFamily:'monospace' },
  answerBtn: { position:'absolute', bottom:48, left:20, right:20, backgroundColor:'rgba(0,0,0,0.9)', borderWidth:1, borderColor:RC.green, padding:16, alignItems:'center', zIndex:10 },
  answerBtnText: { color:RC.green, fontSize:16, fontWeight:'900', letterSpacing:2, fontFamily:'monospace' },
  inputScreen: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  inputHeader: { color:RC.green, fontSize:18, fontFamily:'monospace', marginBottom:20 },
  inputHint: { color:RC.greenDim, fontSize:14, fontFamily:'monospace', marginBottom:16 },
  textInput: { backgroundColor:'transparent', borderWidth:1, borderColor:RC.green, borderRadius:0, padding:14, fontSize:18, color:RC.green, width:'100%', marginBottom:16, fontFamily:'monospace' },
  submitBtn: { borderWidth:1, borderColor:RC.green, padding:14, alignItems:'center', width:'100%' },
  submitBtnText: { color:RC.green, fontSize:16, fontWeight:'900', letterSpacing:2, fontFamily:'monospace' },
  resultScreen: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  resultStatus: { fontSize:28, fontWeight:'900', fontFamily:'monospace', marginBottom:16, letterSpacing:2 },
  resultText: { color:RC.greenDim, fontSize:16, fontFamily:'monospace', marginBottom:8 },
  nextBtn: { borderWidth:1, borderColor:RC.green, padding:14, paddingHorizontal:24, marginTop:20 },
  nextBtnText: { color:RC.green, fontSize:16, fontWeight:'700', letterSpacing:2, fontFamily:'monospace' },
  summaryScreen: { flex:1, padding:24, paddingTop:60 },
  summaryHeader: { color:RC.green, fontSize:20, fontFamily:'monospace', textAlign:'center', marginBottom:16 },
  summaryScore: { color:RC.green, fontSize:32, fontWeight:'900', fontFamily:'monospace', textAlign:'center', marginBottom:8 },
  summaryText: { color:RC.greenDim, fontSize:16, fontFamily:'monospace', textAlign:'center', marginBottom:4 },
  summaryRow: { fontSize:14, fontFamily:'monospace', marginBottom:4, paddingHorizontal:8 },
  restartBtn: { borderWidth:1, borderColor:RC.green, padding:14, alignItems:'center', marginTop:24, marginHorizontal:40 },
  restartBtnText: { color:RC.green, fontSize:16, fontWeight:'700', letterSpacing:2, fontFamily:'monospace' },
});
