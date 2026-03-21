// GeoCheckr — Street View v7
// Fixes: Cookie consent bypass, better error handling, debug logs
// WebView user agent + consent auto-accept
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getCityImage } from '../data/locationImages';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface StreetViewProps {
  location: {
    city: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  showInfo?: boolean;
}

function getStreetViewHtml(lat: number, lng: number, apiKey: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>GeoCheckr</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#pano{width:100%;height:100%;overflow:hidden;background:#0a0a14}
#loading{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#8888aa;text-align:center;font-family:-apple-system,sans-serif;font-size:14px;z-index:10}
#loading .emoji{font-size:32px;margin-bottom:12px}
#debug{position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.9);color:#4CAF50;padding:8px 12px;border-radius:6px;font-size:11px;font-family:monospace;z-index:100;max-width:90vw}
</style>
</head>
<body>
<div id="pano"></div>
<div id="loading"><div class="emoji">🔍</div><div>Suche Street View...</div></div>
<div id="debug">waiting...</div>

<script>
var INIT_LAT=${lat};
var INIT_LNG=${lng};
var HEADING=Math.floor(Math.random()*360);

function log(msg){document.getElementById('debug').innerText=msg;console.log('[GeoCheckr]',msg)}

// Auto-accept cookie consent (like GeoGuessr does)
function killConsent(){
  try{
    var btns=document.querySelectorAll('button');
    for(var i=0;i<btns.length;i++){
      var t=(btns[i].innerText||'').toLowerCase();
      if(t.includes('accept')||t.includes('agree')||t.includes('zustimmen')||t.includes('akzeptieren')||t.includes('consent')){
        btns[i].click();log('Consent clicked');return true;
      }
    }
    // Try by aria-label
    var els=document.querySelectorAll('[aria-label*="Accept"],[aria-label*="agree"],[aria-label*="akzeptieren"]');
    for(var j=0;j<els.length;j++){els[j].click();log('Consent (aria) clicked');return true;}
    // Try iframes (Google embeds consent in iframe)
    var frames=document.querySelectorAll('iframe');
    for(var k=0;k<frames.length;k++){
      try{
        var fbtns=frames[k].contentDocument.querySelectorAll('button');
        for(var l=0;l<fbtns.length;l++){
          var ft=(fbtns[l].innerText||'').toLowerCase();
          if(ft.includes('accept')||ft.includes('agree')){fbtns[l].click();log('Consent (iframe) clicked');return true;}
        }
      }catch(e){}
    }
  }catch(e){log('Consent error: '+e.message)}
  return false;
}

// Run consent kill repeatedly
killConsent();
setTimeout(killConsent,500);
setTimeout(killConsent,1500);
setTimeout(killConsent,3000);
setTimeout(killConsent,5000);

function init(){
  log('API loaded ✅');
  
  // Kill consent again after API loads
  setTimeout(killConsent,500);
  
  var sv=new google.maps.StreetViewService();
  log('Finding panorama...');
  
  sv.getPanorama({
    location:{lat:INIT_LAT,lng:INIT_LNG},
    radius:50000,
    preference:google.maps.StreetViewPreference.NEAREST,
    source:google.maps.StreetViewSource.OUTDOOR
  },function(data,status){
    log('Status: '+status);
    if(status===google.maps.StreetViewStatus.OK){
      var desc=data.location.description||'unknown';
      var lat=data.location.latLng.lat();
      var lng=data.location.latLng.lng();
      log('FOUND: '+desc+' @ '+lat.toFixed(4)+','+lng.toFixed(4));
      document.getElementById('loading').style.display='none';
      
      new google.maps.StreetViewPanorama(document.getElementById('pano'),{
        pano:data.location.pano,
        pov:{heading:HEADING,pitch:0},
        zoom:1,
        addressControl:false,
        showRoadLabels:false,
        linksControl:true,
        panControl:false,
        zoomControl:true,
        fullscreenControl:false,
        motionTracking:false,
        motionTrackingControl:false,
        enableCloseButton:false,
        scrollwheel:true,
        clickToGo:true
      });
      
      // Remove Google UI overlays via CSS
      setTimeout(function(){
        var s=document.createElement('style');
        s.innerHTML='.gm-iv-address,.gm-iv-logo,.gm-iv-show-hide-button,.gmnoprint:not(.gm-svpc),[title="Report a problem"],[title="Open in Google Maps"]{display:none!important}';
        document.head.appendChild(s);
        killConsent();
      },1000);
      
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'loaded',city:desc}));
    }else{
      log('NOT FOUND: '+status+' for '+INIT_LAT+','+INIT_LNG);
      document.getElementById('loading').innerHTML='<div class="emoji">📷</div><div>Kein Street View</div>';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'not_found',status:status}));
    }
  });
}

window.gm_authFailure=function(){
  log('❌ AUTH FAILURE - check API key');
  document.getElementById('loading').innerHTML='<div class="emoji" style="color:#ff3333">⚠️</div><div>API Key Fehler</div>';
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'auth_error'}));
};

// Timeout fallback
setTimeout(function(){
  var d=document.getElementById('debug').innerText;
  if(d.includes('waiting')||d.includes('init')){
    log('⚠️ TIMEOUT - API never loaded');
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'timeout'}));
  }
},15000);
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=init"></script>
</body></html>`;
}

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const hasCoords = !!(location.lat && location.lng);
  const fallbackImage = getCityImage(location.city);

  if (!hasCoords) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />
      </View>
    );
  }

  const html = getStreetViewHtml(location.lat!, location.lng!, API_KEY);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[GeoCheckr RN]', data.type, data);
      if (data.type === 'loaded') {
        setLoading(false);
      } else if (data.type === 'not_found' || data.type === 'auth_error' || data.type === 'timeout') {
        setLoading(false);
        setError(true);
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* WebView — fullscreen, this IS the Street View */}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        onMessage={handleMessage}
        onError={(e) => {
          console.warn('[GeoCheckr RN] WebView error:', e.nativeEvent);
          setLoading(false);
          setError(true);
        }}
        onHttpError={(e) => {
          console.warn('[GeoCheckr RN] HTTP error:', e.nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('[GeoCheckr RN] WebView loaded');
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>📷</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>Street View nicht verfügbar</Text>
        </View>
      )}

      {showInfo && !loading && !error && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoText}>{location.city}, {location.country}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  webview: { flex: 1 },
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14', zIndex: 10,
  },
  loadingText: { color: '#8888aa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14', zIndex: 10,
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#8888aa', fontSize: 14, marginTop: 8 },
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
