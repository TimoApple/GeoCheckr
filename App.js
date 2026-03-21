// GeoCheckr — Fixed APK Version  
// Interactive Street View via Native Android WebView (Maps Embed API)
// Text input for guessing
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Vibration, StatusBar, Dimensions, TextInput, NativeModules, Platform, Image
} from 'react-native';


const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';
const { width: SW, height: SH } = Dimensions.get('window');

// ═══ DESIGN ═══
const C = {
  primary:'#bdc2ff', primaryContainer:'#3340ca', secondary:'#88da7d',
  tertiary:'#9dcaff', surface:'#131313', surfaceContainer:'#202020',
  surfaceContainerLow:'#1b1b1c', surfaceContainerLowest:'#0e0e0e',
  surfaceContainerHigh:'#2a2a2a', surfaceContainerHighest:'#353535',
  surfaceBright:'#393939', onSurface:'#e5e2e1', onSurfaceVariant:'#c6c5d7',
  error:'#ffb4ab', errorContainer:'#93000a', outline:'#8f8fa0',
  outlineVariant:'#454654', secondaryFixed:'#a3f796', tertiaryFixed:'#d1e4ff',
};

// ═══ TIMO'S 10 LOCATIONS ═══
const LOCS = [
  { id:1, city:"Seoul", country:"Südkorea", lat:37.571922, lng:126.976715 },
  { id:2, city:"Tokyo", country:"Japan", lat:35.6595, lng:139.700399 },
  { id:3, city:"New York", country:"USA", lat:40.758896, lng:-73.985130 },
  { id:4, city:"Portland", country:"Oregon, USA", lat:45.523062, lng:-122.676482 },
  { id:5, city:"Delhi", country:"Indien", lat:28.613939, lng:77.209021 },
  { id:6, city:"Johannesburg", country:"Südafrika", lat:-26.204103, lng:28.047305 },
  { id:7, city:"Kapstadt", country:"Südafrika", lat:-33.903771, lng:18.421866 },
  { id:8, city:"Kopenhagen", country:"Dänemark", lat:55.68001, lng:12.590604 },
  { id:9, city:"Rio de Janeiro", country:"Brasilien", lat:-22.970548, lng:-43.182883 },
  { id:10, city:"Beijing", country:"China", lat:39.904200, lng:116.407396 },
];

// ═══ UTILS ═══
function haversine(a,b,c,d){const R=6371,dLat=(c-a)*Math.PI/180,dLon=(d-b)*Math.PI/180,v=Math.sin(dLat/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));}
function calcPoints(d){if(d<100)return 3;if(d<500)return 2;if(d<2000)return 1;return 0;}
function fmtDist(km){return km<1?Math.round(km*1000)+'m':km.toFixed(0)+' km';}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

// Native StreetViewModule opens Android WebView with Maps Embed API

// Open native Street View (exact approach from working v10)
const openNativeStreetView = (loc) => {
  // Try native module first
  if (Platform.OS === 'android' && NativeModules.StreetViewModule) {
    try {
      NativeModules.StreetViewModule.openStreetView(loc.lat, loc.lng);
      return;
    } catch (e) {
      console.warn('[GeoCheckr] Native SV error:', e);
    }
  }
  // Fallback: static image (no interactive movement, but guaranteed to work)
  setSvStaticUrl(
    `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${loc.lat},${loc.lng}&heading=${Math.floor(Math.random()*360)}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`
  );
};

// ═══ MAIN APP ═══
export default function App() {
  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState('map');
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [order] = useState(() => shuffle(LOCS));
  const [currentLoc, setCurrentLoc] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [targetScore] = useState(10);
  const [showTutorial, setShowTutorial] = useState(true);
  const [svStaticUrl, setSvStaticUrl] = useState('');

  const timerRef = useRef(null);
  const popAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if(screen==='streetview' && timer>0) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          const next = t - 1;
          if(next <= 5 && next > 0) Vibration.vibrate(50);
          if(next === 0) Vibration.vibrate(500);
          return next;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    if(timer===0 && screen==='streetview') {
      // APK: always go to text input (map crashes in WebView)
      setScreen('input');
    }
  },[screen,timer]);

  const startGame = (m) => {
    setShowTutorial(false);
    setMode(m); setRound(1); setScore(0); setHistory([]);
    popAnim.setValue(0);
    const loc = order[0];
    setCurrentLoc(loc); setTimer(30); setSvStaticUrl(''); setScreen('streetview');
    openNativeStreetView(loc);
  };

  const handleAnswer = useCallback((answer) => {
    clearInterval(timerRef.current);
    let dist = 20000;
    if(answer && answer.lat !== undefined) {
      dist = haversine(currentLoc.lat, currentLoc.lng, answer.lat, answer.lng);
    }
    const pts = calcPoints(dist);
    setScore(s => s + pts);
    const result = { city:currentLoc.city, country:currentLoc.country, dist, pts };
    setLastResult(result);
    setHistory(h => [...h, result]);
    setScreen('result');
    Animated.spring(popAnim, { toValue:1, friction:5, useNativeDriver:true }).start();
    Vibration.vibrate(pts >= 3 ? [100,50,100] : pts > 0 ? 100 : 500);
  },[currentLoc, popAnim]);

  const nextRound = () => {
    popAnim.setValue(0);
    if(round >= maxRounds || score >= targetScore) { setScreen('summary'); return; }
    const next = order[round];
    setCurrentLoc(next); setTimer(30); setRound(r => r + 1); setSvStaticUrl(''); setScreen('streetview');
    openNativeStreetView(next);
  };

  // ─── TUTORIAL ───
  if(screen==='home' && showTutorial) return (
    <View style={s.container}>
      <StatusBar hidden />
      <View style={s.bgOrbs}>
        <View style={[s.orb,{top:'10%',right:-80,width:350,height:350,backgroundColor:C.primaryContainer}]}/>
        <View style={[s.orb,{bottom:'15%',left:-100,width:400,height:400,backgroundColor:C.secondary}]}/>
      </View>
      <View style={s.homeWrap}>
        <Text style={s.brand}>⬡</Text>
        <Text style={s.title}>GEOCHECKR</Text>
        <Text style={s.tagline}>THE CARTOGRAPHIC EXPLORER</Text>
        <Text style={s.locInfo}>10 Locations · 5 Runden · 30s Timer</Text>

        <View style={s.tutorialCard}>
          <Text style={s.tutorialTitle}>SPIELREGELN</Text>
          <View style={s.tutorialStep}>
            <Text style={s.tutorialNum}>1</Text>
            <Text style={s.tutorialText}>Schau dir das Street View Bild an</Text>
          </View>
          <View style={s.tutorialStep}>
            <Text style={s.tutorialNum}>2</Text>
            <Text style={s.tutorialText}>Du hast 30 Sekunden zu erraten</Text>
          </View>
          <View style={s.tutorialStep}>
            <Text style={s.tutorialNum}>3</Text>
            <Text style={s.tutorialText}>Setze einen Marker oder tippe den Namen</Text>
          </View>
          <View style={s.tutorialStep}>
            <Text style={s.tutorialNum}>4</Text>
            <Text style={s.tutorialText}>Je näher, desto mehr Punkte!</Text>
          </View>
          <View style={s.pointsCard}>
            <View style={s.pointRow}>
              <Text style={[s.pointVal,{color:C.secondary}]}>3</Text>
              <Text style={s.pointLabel}>{"<100km"}</Text>
            </View>
            <View style={s.pointRow}>
              <Text style={[s.pointVal,{color:C.primary}]}>2</Text>
              <Text style={s.pointLabel}>{"<500km"}</Text>
            </View>
            <View style={s.pointRow}>
              <Text style={[s.pointVal,{color:C.tertiary}]}>1</Text>
              <Text style={s.pointLabel}>{"<2000km"}</Text>
            </View>
            <View style={s.pointRow}>
              <Text style={[s.pointVal,{color:C.error}]}>0</Text>
              <Text style={s.pointLabel}>{">2000km"}</Text>
            </View>
          </View>
        </View>

        <View style={s.modeRow}>
          <TouchableOpacity style={s.modeBtn} onPress={() => startGame('map')}>
            <Text style={s.modeEmoji}>📍</Text>
            <Text style={s.modeTitle}>MAP MODE</Text>
            <Text style={s.modeDesc}>Marker auf Karte setzen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modeBtnOutline} onPress={() => startGame('input')}>
            <Text style={s.modeEmoji}>⌨️</Text>
            <Text style={s.modeTitle}>TIPPEN</Text>
            <Text style={s.modeDesc}>Stadt eingeben</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBadge}><Text style={s.statNum}>10</Text><Text style={s.statLabel}>KARTEN</Text></View>
          <View style={s.statBadge}><Text style={s.statNum}>5</Text><Text style={s.statLabel}>RUNDEN</Text></View>
          <View style={s.statBadge}><Text style={s.statNum}>10</Text><Text style={s.statLabel}>ZIEL</Text></View>
        </View>
      </View>
    </View>
  );

  // ─── HOME ───
  if(screen==='home') return (
    <View style={s.container}>
      <StatusBar hidden />
      <View style={s.bgOrbs}>
        <View style={[s.orb,{top:'10%',right:-80,width:350,height:350,backgroundColor:C.primaryContainer}]}/>
        <View style={[s.orb,{bottom:'15%',left:-100,width:400,height:400,backgroundColor:C.secondary}]}/>
      </View>
      <View style={s.homeWrap}>
        <Text style={s.brand}>⬡</Text>
        <Text style={s.title}>GEOCHECKR</Text>
        <Text style={s.tagline}>THE CARTOGRAPHIC EXPLORER</Text>
        <Text style={s.locInfo}>10 Locations · 5 Runden</Text>

        <View style={s.modeRow}>
          <TouchableOpacity style={s.modeBtn} onPress={() => startGame('map')}>
            <Text style={s.modeEmoji}>📍</Text>
            <Text style={s.modeTitle}>MAP MODE</Text>
            <Text style={s.modeDesc}>Marker auf Karte setzen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modeBtnOutline} onPress={() => startGame('input')}>
            <Text style={s.modeEmoji}>⌨️</Text>
            <Text style={s.modeTitle}>TIPPEN</Text>
            <Text style={s.modeDesc}>Stadt eingeben</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBadge}><Text style={s.statNum}>10</Text><Text style={s.statLabel}>KARTEN</Text></View>
          <View style={s.statBadge}><Text style={s.statNum}>5</Text><Text style={s.statLabel}>RUNDEN</Text></View>
          <View style={s.statBadge}><Text style={s.statNum}>10</Text><Text style={s.statLabel}>ZIEL</Text></View>
        </View>

        <TouchableOpacity style={s.helpBtn} onPress={() => setShowTutorial(true)}>
          <Text style={s.helpBtnText}>? Spielregeln</Text>
        </TouchableOpacity>

        <View style={s.locList}>
          {LOCS.map(l => (
            <View key={l.id} style={s.locRow}>
              <Text style={s.locQR}>{String(l.id).padStart(2,'0')}</Text>
              <Text style={s.locCity}>{l.city}</Text>
              <Text style={s.locCountry}>{l.country}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ─── STREET VIEW ───
  if(screen==='streetview' && currentLoc) {
    return (
      <View style={s.container}>
        <StatusBar hidden />
        {svStaticUrl ? (
          <Image
            source={{uri: svStaticUrl}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={s.svNativeOverlay}>
            <Text style={s.svNativeTitle}>🌍 Street View</Text>
            <Text style={s.svNativeCity}>{currentLoc.city}, {currentLoc.country}</Text>
            <Text style={s.svNativeHint}>Street View öffnet sich separat</Text>
          </View>
        )}
        <View style={s.timerBadge}>
          <Text style={[s.timerText,timer<=5&&{color:C.error}]}>{timer}</Text>
        </View>
        <View style={s.roundBadge}>
          <Text style={s.roundText}>Runde {round}/{maxRounds}</Text>
        </View>
        <TouchableOpacity style={s.actionBtn} onPress={() => {
          setScreen('input');
        }}>
          <Text style={s.actionBtnText}>ICH WEIẞ ES →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── MAP (APK: just show text input) ───
  // In APK, WebView with Maps API crashes. Always use text input.
  // mode 'map' is treated same as 'input' in APK.

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
            onSubmitEditing={() => {
              const norm = input.toLowerCase().trim()
                .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
              const match = LOCS.find(l =>
                l.city.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue') === norm
              );
              if(match) handleAnswer({lat:match.lat, lng:match.lng});
              else handleAnswer(null);
            }}
          />
          <TouchableOpacity style={s.gradientBtn} onPress={() => {
            const norm = input.toLowerCase().trim()
              .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
            const match = LOCS.find(l =>
              l.city.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue') === norm
            );
            if(match) handleAnswer({lat:match.lat, lng:match.lng});
            else handleAnswer(null);
          }}>
            <Text style={s.gradientBtnText}>BESTÄTIGEN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── RESULT ───
  if(screen==='result' && lastResult) {
    const perf = lastResult.pts >= 3, nah = lastResult.pts >= 1;
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.orbBg}>
          <View style={[s.orb,{top:'5%',right:-60,width:300,height:300,backgroundColor:perf?C.secondary:C.primaryContainer}]}/>
        </View>
        <Animated.View style={[s.resultWrap,{transform:[{scale:popAnim}]}]}>
          <Text style={s.resultEmoji}>{perf?'🎯':nah?'👍':'😅'}</Text>
          <Text style={[s.resultTitle,{color:perf?C.secondary:nah?C.primary:C.error}]}>
            {perf?'SEHR NAH!':nah?'NICHT SCHLECHT!':'SEHR WEIT!'}
          </Text>
          <View style={s.resultCard}>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>ORT</Text>
              <Text style={s.resultVal}>{lastResult.city}, {lastResult.country}</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>DISTANZ</Text>
              <Text style={s.resultVal}>{fmtDist(lastResult.dist)}</Text>
            </View>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>PUNKTE</Text>
              <Text style={[s.resultVal,{color:C.secondary,fontSize:28}]}>+{lastResult.pts}</Text>
            </View>
          </View>
          <View style={s.scoreBar}>
            <Text style={s.scoreBarText}>Score: {score} / {targetScore}</Text>
            <View style={s.scoreBarTrack}>
              <View style={[s.scoreBarFill,{width:`${Math.min(100,(score/targetScore)*100)}%`}]}/>
            </View>
          </View>
          <TouchableOpacity style={s.gradientBtn} onPress={nextRound}>
            <Text style={s.gradientBtnText}>
              {round>=maxRounds||score>=targetScore?'🏆 ERGEBNIS':'NÄCHSTE RUNDE →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── SUMMARY ───
  if(screen==='summary') {
    const won = score >= targetScore;
    return (
      <View style={s.container}>
        <StatusBar hidden />
        <View style={s.orbBg}>
          <View style={[s.orb,{top:'5%',right:-80,width:350,height:350,backgroundColor:C.primaryContainer}]}/>
          <View style={[s.orb,{bottom:'10%',left:-60,width:300,height:300,backgroundColor:C.secondary}]}/>
        </View>
        <View style={s.summaryWrap}>
          <Text style={s.summaryTitle}>{won?'SIEG!':'NICHT GESCHAFFT'}</Text>
          <Text style={s.summarySub}>Match Summary</Text>
          <View style={s.summaryCard}>
            <View style={s.scoreDisplay}>
              <Text style={s.scoreNum}>{score}</Text>
              <Text style={s.scoreDenom}> / {targetScore}</Text>
            </View>
            <View style={s.xpBar}>
              <View style={[s.xpFill,{width:`${Math.min(100,(score/targetScore)*100)}%`}]}/>
            </View>
            <Text style={s.xpLabel}>+{score*200} XP earned</Text>
          </View>
          <View style={s.lbCard}>
            <Text style={s.lbTitle}>STANDINGS</Text>
            {history.map((h,i) => (
              <View key={i} style={s.lbRow}>
                <Text style={[s.lbRank,{color:i===0?C.primary:C.outline}]}>#{i+1}</Text>
                <Text style={s.lbCity}>{h.city}</Text>
                <Text style={s.lbDist}>{fmtDist(h.dist)}</Text>
                <Text style={[s.lbPts,{color:C.secondary}]}>+{h.pts}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.gradientBtn} onPress={() => setScreen('home')}>
            <Text style={s.gradientBtnText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// ═══ STYLES ═══
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.surfaceContainerLowest,justifyContent:'center',alignItems:'center'},
  bgOrbs:{...StyleSheet.absoluteFillObject,zIndex:0},
  orbBg:{...StyleSheet.absoluteFillObject,zIndex:0},
  orb:{position:'absolute',borderRadius:9999,opacity:.15},

  homeWrap:{alignItems:'center',zIndex:1,paddingHorizontal:20,width:'100%'},
  brand:{fontSize:28,color:C.primary,marginBottom:8},
  title:{fontSize:44,fontWeight:'900',letterSpacing:-2,color:C.primary,fontFamily:'Space Grotesk',textTransform:'uppercase',marginBottom:2},
  tagline:{fontSize:10,color:C.onSurfaceVariant,letterSpacing:4,textTransform:'uppercase',fontFamily:'Inter',fontWeight:'600',marginBottom:8},
  locInfo:{fontSize:12,color:C.onSurfaceVariant,fontFamily:'Inter',marginBottom:20},

  tutorialCard:{backgroundColor:C.surfaceContainer,borderRadius:16,padding:20,marginBottom:20,width:'100%',borderWidth:1,borderColor:C.outlineVariant},
  tutorialTitle:{color:C.primary,fontSize:16,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:1,textTransform:'uppercase',marginBottom:16,textAlign:'center'},
  tutorialStep:{flexDirection:'row',alignItems:'center',marginBottom:10},
  tutorialNum:{color:C.primary,fontSize:14,fontWeight:'900',fontFamily:'Space Grotesk',width:28,height:28,borderRadius:14,backgroundColor:C.primaryContainer,justifyContent:'center',alignItems:'center',textAlign:'center',lineHeight:28,marginRight:12},
  tutorialText:{color:C.onSurface,fontSize:14,fontFamily:'Inter',flex:1},
  pointsCard:{flexDirection:'row',justifyContent:'space-around',marginTop:12,paddingTop:12,borderTopWidth:1,borderTopColor:C.outlineVariant+'40'},
  pointRow:{alignItems:'center'},
  pointVal:{fontSize:20,fontWeight:'900',fontFamily:'Space Grotesk'},
  pointLabel:{color:C.onSurfaceVariant,fontSize:10,fontFamily:'Inter',marginTop:2},

  modeRow:{flexDirection:'row',gap:12,marginBottom:16,width:'100%'},
  modeBtn:{flex:1,backgroundColor:C.primaryContainer,borderRadius:16,padding:20,alignItems:'center'},
  modeBtnOutline:{flex:1,backgroundColor:C.surfaceContainer,borderRadius:16,padding:20,alignItems:'center',borderWidth:1,borderColor:C.outlineVariant},
  modeEmoji:{fontSize:32,marginBottom:8},
  modeTitle:{color:C.onSurface,fontSize:14,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:-.5,textTransform:'uppercase',marginBottom:2},
  modeDesc:{color:C.onSurfaceVariant,fontSize:10,fontFamily:'Inter',textAlign:'center'},

  statsRow:{flexDirection:'row',gap:10,marginBottom:12},
  statBadge:{backgroundColor:C.surfaceContainer,borderRadius:12,paddingVertical:10,paddingHorizontal:14,alignItems:'center',borderWidth:1,borderColor:C.outlineVariant},
  statNum:{color:C.primary,fontSize:18,fontWeight:'900',fontFamily:'Space Grotesk'},
  statLabel:{color:C.onSurfaceVariant,fontSize:8,fontFamily:'Inter',letterSpacing:2,textTransform:'uppercase',marginTop:2},

  helpBtn:{backgroundColor:'transparent',paddingVertical:8,paddingHorizontal:16,borderRadius:9999,borderWidth:1,borderColor:C.outlineVariant,marginBottom:12},
  helpBtnText:{color:C.onSurfaceVariant,fontSize:12,fontFamily:'Inter'},

  locList:{width:'100%',backgroundColor:C.surfaceContainer,borderRadius:16,padding:8,borderWidth:1,borderColor:C.outlineVariant},
  locRow:{flexDirection:'row',alignItems:'center',paddingVertical:8,paddingHorizontal:12,borderBottomWidth:.5,borderBottomColor:C.outlineVariant+'40'},
  locQR:{color:C.outline,fontSize:11,fontWeight:'700',fontFamily:'Space Grotesk',width:30},
  locCity:{color:C.onSurface,fontSize:14,fontWeight:'700',fontFamily:'Space Grotesk',flex:1},
  locCountry:{color:C.onSurfaceVariant,fontSize:12,fontFamily:'Inter'},

  // Street View (Static API)
  svWrap:{...StyleSheet.absoluteFillObject,backgroundColor:'#0e0e0e'},
  svImage:{width:'100%',height:'100%'},
  svLoading:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center'},
  svLoadingText:{color:C.onSurfaceVariant,fontSize:14,fontFamily:'Inter',marginTop:12},
  svError:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center'},
  svErrorEmoji:{fontSize:48,marginBottom:16},
  svErrorText:{color:C.onSurfaceVariant,fontSize:16,fontFamily:'Inter'},
  svNativeOverlay:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center',backgroundColor:C.surfaceContainerLowest,zIndex:0},
  svNativeTitle:{color:C.primary,fontSize:24,fontWeight:'900',fontFamily:'Space Grotesk',marginBottom:8},
  svNativeCity:{color:C.onSurface,fontSize:18,fontFamily:'Inter',marginBottom:8},
  svNativeHint:{color:C.onSurfaceVariant,fontSize:14,fontFamily:'Inter'},
  corner:{position:'absolute',width:40,height:40,borderWidth:2,borderColor:'rgba(189,194,255,.3)'},

  timerBadge:{position:'absolute',top:12,right:12,backgroundColor:'rgba(14,14,14,.9)',borderRadius:9999,width:52,height:52,justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:C.error,zIndex:10},
  timerText:{color:C.onSurface,fontSize:22,fontWeight:'900',fontFamily:'Space Grotesk'},
  roundBadge:{position:'absolute',top:12,left:12,backgroundColor:'rgba(14,14,14,.9)',borderRadius:12,paddingHorizontal:14,paddingVertical:8,zIndex:10},
  roundText:{color:C.onSurfaceVariant,fontSize:12,fontWeight:'600',fontFamily:'Inter'},
  actionBtn:{position:'absolute',bottom:28,alignSelf:'center',backgroundColor:C.surfaceBright,paddingHorizontal:28,paddingVertical:14,borderRadius:9999,borderWidth:1,borderColor:C.secondary,zIndex:10},
  actionBtnText:{color:C.secondary,fontSize:15,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:-.5},

  inputWrap:{flex:1,justifyContent:'center',alignItems:'center',padding:24,width:'100%',zIndex:1},
  inputTitle:{color:C.primary,fontSize:28,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:-1,marginBottom:8,textTransform:'uppercase'},
  inputHint:{color:C.onSurfaceVariant,fontSize:14,fontFamily:'Inter',marginBottom:20},
  textInput:{backgroundColor:C.surfaceContainer,color:C.onSurface,fontSize:18,fontFamily:'Inter',padding:16,borderRadius:12,width:'100%',borderWidth:1,borderColor:C.outlineVariant,marginBottom:16,textAlign:'center'},
  gradientBtn:{backgroundColor:C.primaryContainer,paddingVertical:16,borderRadius:9999,width:'100%',alignItems:'center'},
  gradientBtnText:{color:C.primary,fontSize:16,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:-1,textTransform:'uppercase'},

  resultWrap:{alignItems:'center',padding:24,width:'100%',zIndex:1},
  resultEmoji:{fontSize:60,marginBottom:8},
  resultTitle:{fontSize:32,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:-1,textTransform:'uppercase',marginBottom:20},
  resultCard:{backgroundColor:C.surfaceContainer,borderRadius:16,padding:20,width:'100%',marginBottom:16,borderWidth:1,borderColor:C.outlineVariant},
  resultRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:6},
  resultLabel:{color:C.onSurfaceVariant,fontSize:11,fontFamily:'Inter',letterSpacing:2,textTransform:'uppercase',fontWeight:'600'},
  resultVal:{color:C.onSurface,fontSize:16,fontWeight:'700',fontFamily:'Space Grotesk'},
  scoreBar:{width:'100%',marginBottom:16},
  scoreBarText:{color:C.onSurfaceVariant,fontSize:12,fontFamily:'Inter',marginBottom:6,textAlign:'center'},
  scoreBarTrack:{height:8,backgroundColor:C.surfaceContainerHighest,borderRadius:9999,overflow:'hidden'},
  scoreBarFill:{height:'100%',backgroundColor:C.secondary,borderRadius:9999},

  summaryWrap:{flex:1,width:'100%',paddingHorizontal:20,paddingTop:50,zIndex:1},
  summaryTitle:{fontSize:48,fontWeight:'900',fontFamily:'Space Grotesk',color:C.primary,textAlign:'center',letterSpacing:-2,textTransform:'uppercase',fontStyle:'italic'},
  summarySub:{color:C.onSurfaceVariant,fontSize:11,letterSpacing:4,textTransform:'uppercase',fontFamily:'Inter',fontWeight:'700',textAlign:'center',marginBottom:20},
  summaryCard:{backgroundColor:C.surfaceContainer,borderRadius:16,padding:20,marginBottom:12,borderWidth:1,borderColor:C.outlineVariant},
  scoreDisplay:{flexDirection:'row',alignItems:'baseline',justifyContent:'center',marginBottom:12},
  scoreNum:{color:C.onSurface,fontSize:44,fontWeight:'900',fontFamily:'Space Grotesk'},
  scoreDenom:{color:C.onSurfaceVariant,fontSize:16,fontFamily:'Inter'},
  xpBar:{height:10,backgroundColor:C.surfaceContainerHighest,borderRadius:9999,overflow:'hidden',marginBottom:6},
  xpFill:{height:'100%',backgroundColor:C.secondary,borderRadius:9999},
  xpLabel:{color:C.secondaryFixed,fontSize:11,fontFamily:'Inter',textAlign:'right',fontStyle:'italic'},
  lbCard:{backgroundColor:C.surfaceContainerLow,borderRadius:16,overflow:'hidden',marginBottom:12,borderWidth:1,borderColor:C.outlineVariant},
  lbTitle:{color:C.onSurface,fontSize:13,fontWeight:'900',fontFamily:'Space Grotesk',letterSpacing:1,textTransform:'uppercase',padding:14,borderBottomWidth:1,borderBottomColor:C.outlineVariant+'20'},
  lbRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingVertical:12,borderBottomWidth:.5,borderBottomColor:C.outlineVariant+'08'},
  lbRank:{fontSize:18,fontWeight:'900',fontFamily:'Space Grotesk',fontStyle:'italic',width:32},
  lbCity:{color:C.onSurface,fontSize:15,fontWeight:'700',fontFamily:'Space Grotesk',flex:1},
  lbDist:{color:C.onSurfaceVariant,fontSize:11,fontFamily:'Inter',width:70,textAlign:'right'},
  lbPts:{fontSize:15,fontWeight:'900',fontFamily:'Space Grotesk',width:45,textAlign:'right'},
});
