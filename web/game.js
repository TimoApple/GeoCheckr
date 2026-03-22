// GeoCheckr — Polished Web Version
// Timo's 10 Locations, Sound Effects, Tutorial, Better UI
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
let ctx;

// Sound
function initAudio(){try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function beep(freq,dur,type){if(!ctx)return;try{var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=type||'sine';o.frequency.value=freq;g.gain.value=0.15;g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);o.start();o.stop(ctx.currentTime+dur);}catch(e){}}
function playTick(){beep(800,0.08,'square');}
function playFinal(){beep(1200,0.15,'square');}
function playSuccess(){beep(523,0.15);setTimeout(()=>beep(659,0.15),150);setTimeout(()=>beep(784,0.2),300);}
function playFail(){beep(200,0.4,'sawtooth');}
function playClick(){beep(1000,0.05,'square');}

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame(m){
  initAudio();playClick();
  document.getElementById('tutorial').style.display='none';
  mode=m;round=1;score=0;history=[];
  order=shuffle([...LOCS]);
  pickCard();
}

function pickCard(){
  currentLoc=order[round-1];timer=30;
  showScreen('streetview');
  document.getElementById('sv-frame').src='streetview.html?lat='+currentLoc.lat+'&lng='+currentLoc.lng;
  document.getElementById('sv-round').textContent='Runde '+round+'/'+MAX_ROUNDS;
  clearInterval(timerInt);
  timerInt=setInterval(()=>{
    timer--;
    const el=document.getElementById('sv-timer');
    el.textContent=timer;
    if(timer<=5){el.style.color='var(--error)';playTick();}
    if(timer<=0){clearInterval(timerInt);playFinal();showAnswer();}
  },1000);
}

function submitInput(){
  playClick();
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
  if(pts>=2)playSuccess();else playFail();
  showResult(dist,pts);
}

function haversine(a,b,c,d){const R=6371,dLat=(c-a)*Math.PI/180,dLon=(d-b)*Math.PI/180;const v=Math.sin(dLat/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));}
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
  playClick();
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
