// GeoCheckr v6 — WebView loads Maps Embed URL DIRECTLY
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Vibration, StatusBar, Dimensions, TextInput, Image
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: W, height: H } = Dimensions.get('window');
const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

const LOCATIONS = [
  { id:1, city:'Seoul', country:'Südkorea', lat:37.5665, lng:126.9780 },
  { id:2, city:'Tokyo', country:'Japan', lat:35.6762, lng:139.6503 },
  { id:3, city:'New York', country:'USA', lat:40.7128, lng:-74.0060 },
  { id:4, city:'Portland', country:'USA', lat:45.5152, lng:-122.6784 },
  { id:5, city:'Delhi', country:'Indien', lat:28.6139, lng:77.2090 },
  { id:6, city:'Johannesburg', country:'Südafrika', lat:-26.2041, lng:28.0473 },
  { id:7, city:'Kapstadt', country:'Südafrika', lat:-33.9249, lng:18.4241 },
  { id:8, city:'Kopenhagen', country:'Dänemark', lat:55.6761, lng:12.5683 },
  { id:9, city:'Rio', country:'Brasilien', lat:-22.9068, lng:-43.1729 },
  { id:10, city:'Beijing', country:'China', lat:39.9042, lng:116.4074 },
];

const C = {
  primary:'#BDC2FF', onPrimary:'#181C58', primaryContainer:'#2F3471',
  surfaceContainerLowest:'#111318', surface:'#111318',
  onSurface:'#E2E2E9', onSurfaceVariant:'#C4C5D0', outline:'#8E9099', error:'#FFB4AB',
};

const shuffle = (arr) => {
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState('text');
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [order, setOrder] = useState([]);
  const [timer, setTimer] = useState(30);
  const [svUrl, setSvUrl] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const popAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if(screen==='streetview' && timer>0) {
      timerRef.current = setTimeout(() => setTimer(t=>t-1), 1000);
      return () => clearTimeout(timerRef.current);
    }
    if(timer===0 && screen==='streetview') {
      Vibration.vibrate(200);
      setScreen('input');
    }
  }, [screen, timer]);

  const loadSv = (loc) => {
    const heading = Math.floor(Math.random() * 360);
    // Maps Embed API URL - loaded DIRECTLY in WebView, not as iframe
    const url = `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${loc.lat},${loc.lng}&heading=${heading}&pitch=0&fov=90`;
    setSvUrl(url);
    setUseFallback(false);
  };

  const startGame = (m) => {
    const o = shuffle(LOCATIONS);
    setOrder(o); setMode(m); setRound(1); setScore(0); setHistory([]);
    popAnim.setValue(0);
    const loc = o[0];
    setCurrentLoc(loc); setTimer(30);
    loadSv(loc);
    setScreen('streetview');
  };

  const nextRound = () => {
    popAnim.setValue(0);
    if(round >= maxRounds || score >= 1000) { setScreen('summary'); return; }
    const next = order[round];
    setCurrentLoc(next); setTimer(30); setRound(r => r + 1);
    loadSv(next);
    setScreen('streetview');
  };

  const submitAnswer = (guess) => {
    if(!currentLoc) return;
    const normGuess = guess.toLowerCase().trim()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')
      .replace(/ss/g,'s').replace(/\s/g,'');
    const normCity = currentLoc.city.toLowerCase().trim()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')
      .replace(/ss/g,'s').replace(/\s/g,'');
    const correct = normGuess.includes(normCity) || normCity.includes(normGuess);
    const pts = correct ? 100 : 0;
    const newScore = score + pts;
    setScore(newScore);
    setHistory(h => [...h, { city:currentLoc.city, guess, correct, pts }]);
    setResult({ correct, city:currentLoc.city, country:currentLoc.country, pts, score:newScore });
    popAnim.setValue(0);
    Animated.spring(popAnim, { toValue:1, tension:50, friction:7, useNativeDriver:true }).start();
    setScreen('result');
  };

  // ═══ HOME ═══
  if(screen==='home') return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.bgOrbs}>
        <View style={[s.orb,{top:'10%',left:-50,width:250,height:250,backgroundColor:C.primaryContainer}]}/>
        <View style={[s.orb,{bottom:'20%',right:-80,width:300,height:300,backgroundColor:C.primaryContainer}]}/>
      </View>
      <View style={s.homeContent}>
        <Text style={s.homeIcon}>🌍</Text>
        <Text style={s.homeTitle}>GeoCheckr</Text>
        <Text style={s.homeSub}>Rate die Stadt!</Text>
        <TouchableOpacity style={s.modeBtn} onPress={()=>startGame('text')}>
          <Text style={s.modeBtnIcon}>⌨️</Text>
          <Text style={s.modeBtnLabel}>Text-Input</Text>
          <Text style={s.modeBtnSub}>Stadtname eintippen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── STREET VIEW ───
  if(screen==='streetview' && currentLoc) {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        {useFallback ? (
          <Image
            source={{uri: `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${currentLoc.lat},${currentLoc.lng}&heading=${Math.floor(Math.random()*360)}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <WebView
            source={{uri: svUrl}}
            style={StyleSheet.absoluteFill}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            onError={(e) => {
              console.warn('[GeoCheckr] WebView error:', e.nativeEvent);
              setUseFallback(true);
            }}
            onHttpError={(e) => {
              console.warn('[GeoCheckr] HTTP error:', e.nativeEvent);
              setUseFallback(true);
            }}
          />
        )}
        <View style={s.timerBadge}>
          <Text style={[s.timerText,timer<=5&&{color:C.error}]}>{timer}</Text>
        </View>
        <View style={s.roundBadge}>
          <Text style={s.roundText}>Runde {round}/{maxRounds}</Text>
        </View>
        <TouchableOpacity style={s.actionBtn} onPress={() => setScreen('input')}>
          <Text style={s.actionBtnText}>ICH WEIẞ ES →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── TEXT INPUT ───
  if(screen==='input') {
    const [input, setInput] = useState('');
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.bgOrbs}>
          <View style={[s.orb,{top:'30%',right:-100,width:300,height:300,backgroundColor:C.primaryContainer}]}/>
        </View>
        <View style={s.inputWrap}>
          <Text style={s.inputTitle}>WELCHE STADT?</Text>
          <Text style={s.inputHint}>Tippe den Namen der Stadt</Text>
          <TextInput
            style={s.textInput}
            placeholder="z.B. Seoul, Tokyo, New York..."
            placeholderTextColor={C.outline}
            value={input} onChangeText={setInput}
            autoFocus autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => { if(input.trim()) submitAnswer(input); }}
          />
          <TouchableOpacity
            style={[s.submitBtn, !input.trim() && {opacity:0.4}]}
            disabled={!input.trim()}
            onPress={() => submitAnswer(input)}
          >
            <Text style={s.submitBtnText}>ANTWORTEN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── RESULT ───
  if(screen==='result' && result) return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.bgOrbs}>
        {result.correct ? (
          <View style={[s.orb,{top:'20%',left:'20%',width:200,height:200,backgroundColor:'#1a4a1a'}]}/>
        ) : (
          <View style={[s.orb,{top:'20%',left:'20%',width:200,height:200,backgroundColor:'#4a1a1a'}]}/>
        )}
      </View>
      <Animated.View style={[s.resultContent, { transform:[{scale:popAnim}] }]}>
        <Text style={s.resultEmoji}>{result.correct ? '🎉' : '😅'}</Text>
        <Text style={s.resultTitle}>{result.correct ? 'RICHTIG!' : 'LEIDER NEIN'}</Text>
        <Text style={s.resultCity}>{result.city}, {result.country}</Text>
        {result.pts > 0 && <Text style={s.resultPts}>+{result.pts} Punkte</Text>}
        <Text style={s.resultTotal}>Gesamt: {result.score} / {round * 100}</Text>
        <TouchableOpacity style={s.nextBtn} onPress={nextRound}>
          <Text style={s.nextBtnText}>{round >= maxRounds ? 'ERGEBNISSE' : 'NÄCHSTE RUNDE →'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // ─── SUMMARY ───
  if(screen==='summary') return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.bgOrbs}>
        <View style={[s.orb,{top:'5%',left:'10%',width:350,height:350,backgroundColor:C.primaryContainer}]}/>
      </View>
      <View style={s.summaryContent}>
        <Text style={s.summaryEmoji}>🏆</Text>
        <Text style={s.summaryTitle}>SPIEL BEENDET</Text>
        <Text style={s.summaryScore}>{score} / {maxRounds * 100}</Text>
        <Text style={s.summarySub}>{history.filter(h=>h.correct).length} von {maxRounds} richtig</Text>
        <View style={s.historyList}>
          {history.map((h,i)=>(
            <View key={i} style={s.historyItem}>
              <Text style={s.historyCity}>{h.city}</Text>
              <Text style={[s.historyStatus,{color:h.correct?'#4ade80':'#ff6b6b'}]}>
                {h.correct ? '✅' : '❌'} {h.pts > 0 ? '+'+h.pts : '0'}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.restartBtn} onPress={()=>setScreen('home')}>
          <Text style={s.restartBtnText}>NOCHMAL SPIELEN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return null;
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.surface},
  bgOrbs:{position:'absolute',width:'100%',height:'100%',overflow:'hidden'},
  orb:{position:'absolute',borderRadius:999,opacity:.3},
  homeContent:{flex:1,justifyContent:'center',alignItems:'center',padding:32},
  homeIcon:{fontSize:80,marginBottom:16},
  homeTitle:{fontSize:42,fontWeight:'900',color:C.onSurface,letterSpacing:-1},
  homeSub:{fontSize:18,color:C.onSurfaceVariant,marginTop:4,marginBottom:32},
  modeBtn:{backgroundColor:C.surfaceContainerLowest,borderRadius:24,padding:20,alignItems:'center',borderWidth:1,borderColor:C.outline,paddingVertical:28,width:'100%'},
  modeBtnIcon:{fontSize:36,marginBottom:8},
  modeBtnLabel:{fontSize:20,fontWeight:'800',color:C.onSurface},
  modeBtnSub:{fontSize:13,color:C.onSurfaceVariant,marginTop:4},
  timerBadge:{position:'absolute',top:48,alignSelf:'center',backgroundColor:C.surfaceContainerLowest,borderRadius:12,paddingHorizontal:12,paddingVertical:4},
  timerText:{color:C.onSurface,fontSize:18,fontWeight:'700'},
  roundBadge:{position:'absolute',top:48,left:20,backgroundColor:C.surfaceContainerLowest,borderRadius:12,paddingHorizontal:12,paddingVertical:4},
  roundText:{color:C.onSurfaceVariant,fontSize:14},
  actionBtn:{position:'absolute',bottom:48,left:20,right:20,backgroundColor:C.primary,borderRadius:16,padding:16,alignItems:'center'},
  actionBtnText:{color:C.onPrimary,fontSize:16,fontWeight:'800'},
  inputWrap:{flex:1,justifyContent:'center',padding:24,zIndex:1},
  inputTitle:{fontSize:36,fontWeight:'900',color:C.onSurface,textAlign:'center',marginBottom:4},
  inputHint:{fontSize:14,color:C.onSurfaceVariant,textAlign:'center',marginBottom:24},
  textInput:{backgroundColor:C.surfaceContainerLowest,borderRadius:16,padding:16,fontSize:18,color:C.onSurface,borderWidth:1,borderColor:C.outline,marginBottom:16},
  submitBtn:{backgroundColor:C.primary,borderRadius:16,padding:16,alignItems:'center'},
  submitBtnText:{color:C.onPrimary,fontSize:16,fontWeight:'800'},
  resultContent:{flex:1,justifyContent:'center',alignItems:'center',padding:32},
  resultEmoji:{fontSize:80,marginBottom:16},
  resultTitle:{fontSize:36,fontWeight:'900',color:C.onSurface,textAlign:'center',marginBottom:4},
  resultCity:{fontSize:18,color:C.onSurfaceVariant,textAlign:'center',marginBottom:8},
  resultPts:{fontSize:24,color:'#4ade80',fontWeight:'700',marginBottom:16},
  resultTotal:{fontSize:16,color:C.onSurfaceVariant,marginBottom:32},
  nextBtn:{backgroundColor:C.primary,borderRadius:16,padding:16,paddingHorizontal:32,alignItems:'center'},
  nextBtnText:{color:C.onPrimary,fontSize:16,fontWeight:'800'},
  summaryContent:{flex:1,justifyContent:'center',alignItems:'center',padding:24},
  summaryEmoji:{fontSize:64,marginBottom:12},
  summaryTitle:{fontSize:28,fontWeight:'900',color:C.onSurface,marginBottom:4},
  summaryScore:{fontSize:48,fontWeight:'900',color:C.primary,marginBottom:4},
  summarySub:{fontSize:16,color:C.onSurfaceVariant,marginBottom:24},
  historyList:{width:'100%',marginBottom:24},
  historyItem:{flexDirection:'row',justifyContent:'space-between',padding:12,backgroundColor:C.surfaceContainerLowest,borderRadius:12,marginBottom:8},
  historyCity:{color:C.onSurface,fontSize:14},
  historyStatus:{fontSize:14,fontWeight:'700'},
  restartBtn:{backgroundColor:C.primary,borderRadius:16,padding:16,paddingHorizontal:32,alignItems:'center'},
  restartBtnText:{color:C.onPrimary,fontSize:16,fontWeight:'800'},
});
