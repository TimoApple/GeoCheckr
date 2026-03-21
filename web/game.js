// GeoCheckr — Clean Web Version
// Timo's 10 Locations, Working Street View, 30s Timer, Map + Text Input
const API_KEY='AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';
const TARGET=10, MAX_ROUNDS=5;

const LOCS = [
  {id:1,city:"Seoul",country:"Südkorea",lat:37.571922,lng:126.976715},
  {id:2,city:"Tokyo",country:"Japan",lat:35.6595,lng:139.700399},
  {id:3,city:"New York",country:"USA",lat:40.758896,lng:-73.985130},
  {id:4,city:"Portland",country:"Oregon, USA",lat:45.523062,lng:-122.676482},
  {id:5,city:"Delhi",country:"Indien",lat:28.613939,lng:77.209021},
  {id:6,city:"Johannesburg",country:"Südafrika",lat:-26.204103,lng:28.047305},
  {id:7,city:"Kapstadt",country:"Südafrika",lat:-33.903771,lng:18.421866},
  {id:8,city:"Kopenhagen",country:"Dänemark",lat:55.68001,lng:12.590604},
  {id:9,city:"Rio de Janeiro",country:"Brasilien",lat:-22.970548,lng:-43.182883},
  {id:10,city:"Beijing",country:"China",lat:39.904200,lng:116.407396},
];

let mode='map',round=1,score=0,history=[],currentLoc=null,timer=30,timerInt=null;
let order=shuffle([...LOCS]);

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame(m){
  mode=m;round=1;score=0;history=[];
  order=shuffle([...LOCS]);
  pickCard();
}

function pickCard(){
  currentLoc=order[round-1];timer=30;
  showScreen('streetview');
  document.getElementById('sv-frame').srcdoc=getSvHtml(currentLoc.lat,currentLoc.lng);
  document.getElementById('sv-round').textContent='Runde '+round+'/'+MAX_ROUNDS;
  clearInterval(timerInt);
  timerInt=setInterval(()=>{
    timer--;
    document.getElementById('sv-timer').textContent=timer;
    if(timer<=5)document.getElementById('sv-timer').style.color='var(--error)';
    if(timer<=0){clearInterval(timerInt);showAnswer();}
  },1000);
}

function getSvHtml(lat,lng){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}html,body,#p{width:100%;height:100%;overflow:hidden;background:#0e0e0e}#s{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#c6c5d7;text-align:center;font-family:sans-serif}#s .e{font-size:48px;margin-bottom:16px}#s.hide{display:none}</style></head><body><div id="p"></div><div id="s"><div class="e">🔍</div><div>Lade...</div></div><script>function init(){var sv=new google.maps.StreetViewService();sv.getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){if(s===google.maps.StreetViewStatus.OK){document.getElementById('s').className='hide';new google.maps.StreetViewPanorama(document.getElementById('p'),{pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:1,addressControl:false,showRoadLabels:false,linksControl:true,panControl:false,zoomControl:true,fullscreenControl:false,motionTracking:false,motionTrackingControl:false,enableCloseButton:false,scrollwheel:true,clickToGo:true});}else{document.getElementById('s').innerHTML='<div class="e">📷</div><div>Kein Street View</div>';}});}window.gm_authFailure=function(){};<\/script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init"></script></body></html>`;
}

function showAnswer(){
  clearInterval(timerInt);
  if(mode==='map'){
    showScreen('mapscreen');
    document.getElementById('map-frame').srcdoc=getMapHtml();
  } else {
    showScreen('inputscreen');
    document.getElementById('city-input').value='';
    document.getElementById('city-input').focus();
  }
}

function getMapHtml(){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%}#c{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#bdc2ff,#3340ca);color:#000fa3;border:none;padding:16px 36px;border-radius:9999px;font-size:16px;font-weight:900;z-index:10;display:none;font-family:Space Grotesk;text-transform:uppercase;cursor:pointer}#h{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:rgba(14,14,14,.95);color:#e5e2e1;padding:10px 20px;border-radius:1rem;font-size:14px;z-index:10;font-family:Inter;backdrop-filter:blur(20px)}</style></head><body><div id="m"></div><div id="h">📍 Setze deinen Marker!</div><button id="c" onclick="submit()">✓ Bestätigen</button><script>var marker,cLat,cLng;function init(){var map=new google.maps.Map(document.getElementById('m'),{center:{lat:20,lng:0},zoom:2,mapTypeId:'roadmap',streetViewControl:false,mapTypeControl:false,fullscreenControl:false,zoomControl:true,styles:[{featureType:'all',elementType:'geometry',stylers:[{color:'#1b1b1c'}]},{featureType:'all',elementType:'labels.text.fill',stylers:[{color:'#c6c5d7'}]},{featureType:'water',elementType:'geometry',stylers:[{color:'#235684'}]},{featureType:'road',elementType:'geometry',stylers:[{color:'#454654'}]},{featureType:'landscape',elementType:'geometry',stylers:[{color:'#202020'}]}]});map.addListener('click',function(e){cLat=e.latLng.lat();cLng=e.latLng.lng();if(marker)marker.setMap(null);marker=new google.maps.Marker({position:e.latLng,map:map,animation:google.maps.Animation.DROP});document.getElementById('c').style.display='block';});}function submit(){if(cLat!==undefined){window.parent.postMessage({lat:cLat,lng:cLng},'*');}}window.gm_authFailure=function(){};<\/script><script async defer src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init"></script></body></html>`;
}

function submitInput(){
  const val=document.getElementById('city-input').value.toLowerCase().trim()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
  const match=LOCS.find(l=>l.city.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')===val);
  if(match)processResult({lat:match.lat,lng:match.lng});
  else processResult(null);
}

window.addEventListener('message',function(e){
  if(e.data&&e.data.lat!==undefined)processResult(e.data);
});

function processResult(answer){
  clearInterval(timerInt);
  let dist=20000;
  if(answer&&answer.lat!==undefined)dist=haversine(currentLoc.lat,currentLoc.lng,answer.lat,answer.lng);
  const pts=dist<100?3:dist<500?2:dist<2000?1:0;
  score+=pts;
  history.push({city:currentLoc.city,country:currentLoc.country,dist,pts});
  showResult(dist,pts);
}

function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDist(km){return km<1?Math.round(km*1000)+'m':km.toFixed(0)+' km'}

function showResult(dist,pts){
  showScreen('result');
  const perf=pts>=3,nah=pts>=1;
  document.getElementById('res-emoji').textContent=perf?'🎯':nah?'👍':'😅';
  const t=document.getElementById('res-title');
  t.textContent=perf?'SEHR NAH!':nah?'NICHT SCHLECHT!':'SEHR WEIT!';
  t.style.color=perf?'var(--secondary)':nah?'var(--primary)':'var(--error)';
  document.getElementById('res-city').textContent=currentLoc.city+', '+currentLoc.country;
  document.getElementById('res-dist').textContent=fmtDist(dist);
  document.getElementById('res-pts').textContent='+'+pts;
  document.getElementById('score-text').textContent='Score: '+score+' / '+TARGET;
  document.getElementById('score-bar').style.width=Math.min(100,(score/TARGET)*100)+'%';
  document.getElementById('next-btn').textContent=round>=MAX_ROUNDS||score>=TARGET?'🏆 ERGEBNIS':'NÄCHSTE RUNDE →';
}

function nextRound(){
  if(round>=MAX_ROUNDS||score>=TARGET)showSummary();
  else{round++;pickCard();}
}

function showSummary(){
  showScreen('summary');
  document.getElementById('sum-title').textContent=score>=TARGET?'SIEG!':'NICHT GESCHAFFT';
  document.getElementById('sum-score').textContent=score;
  document.getElementById('sum-bar').style.width=Math.min(100,(score/TARGET)*100)+'%';
  document.getElementById('sum-xp').textContent='+'+(score*200)+' XP earned';
  const hist=document.getElementById('sum-history');
  hist.querySelectorAll('.lb-row').forEach(r=>r.remove());
  history.forEach((h,i)=>{
    const row=document.createElement('div');
    row.className='lb-row';
    row.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(143,143,160,.08)';
    row.innerHTML=`<span style="color:${i===0?'var(--primary)':'var(--outline)'};font-size:18px;font-weight:900;font-family:Space Grotesk;font-style:italic;width:32px">#${i+1}</span>
      <span style="color:var(--on-surface);font-size:15px;font-weight:700;font-family:Space Grotesk;flex:1">${h.city}, ${h.country}</span>
      <span style="color:var(--on-surface-variant);font-size:11px;font-family:Inter;width:70px;text-align:right">${fmtDist(h.dist)}</span>
      <span style="color:var(--secondary);font-size:15px;font-weight:900;font-family:Space Grotesk;width:45px;text-align:right">+${h.pts}</span>`;
    hist.appendChild(row);
  });
}
