const P=[...P0,...P1,...P2,...P3,...P4];
// posts: [[x, y, account, ts, likes, comments, story_id|null, followers, shortcode, caption], ...]


const C={"10045":"Entertainment","10063":"Personal Posts","10048":"Trump Administration","10056":"Climate & Weather","10047":"White House Events","10043":"White House Security","10052":"Social Media","10058":"Political Opposition","10051":"Immigration Policy","10055":"Iran War","10065":"Politics & Leadership","10044":"Healthcare Policy","10046":"Immigration Enforcement","10059":"Tax Policy","10054":"Business & Economy","10049":"Trump Legal Issues","10066":"Mental Health","10050":"Voting Rights","10057":"Middle East Conflict","10061":"Healthcare Access","10064":"NYC Politics","10053":"Iran Conflict","10067":"Disease Outbreaks","10062":"Elections","10060":"Social Media"};


const AM=(function(){const al={};for(const p of P){if(!al[p[2]])al[p[2]]=[];al[p[2]].push(p[4])}const r={};for(const[a,lks]of Object.entries(al)){lks.sort((x,y)=>x-y);r[a]=lks[Math.floor(lks.length/2)]}return r})();
function medianMult(indices){const ms=[];for(const i of indices){const p=P[i];const am=AM[p[2]];if(am>0)ms.push(p[4]/am)}if(!ms.length)return 0;ms.sort((a,b)=>a-b);return ms[Math.floor(ms.length/2)]}
function medianRate(indices){const rs=[];for(const i of indices){const p=P[i];if(p[7]>0)rs.push(p[4]/p[7])}if(!rs.length)return 0;rs.sort((a,b)=>a-b);return rs[Math.floor(rs.length/2)]}

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

const af=document.getElementById('af');
A.forEach(a=>{const o=document.createElement('option');o.value=a;o.text='@'+a;af.add(o)});

const tfSel=document.getElementById('tf');
const d0=document.getElementById('d0');
const d1=document.getElementById('d1');
const dsep=document.getElementById('dsep');

tfSel.addEventListener('change',()=>{
  const custom=tfSel.value==='custom';
  d0.style.display=custom?'':'none';
  d1.style.display=custom?'':'none';
  dsep.style.display=custom?'':'none';
  if(custom&&!d0.value){
    const now=new Date();
    d1.value=now.toISOString().slice(0,10);
    const week=new Date(now-7*86400000);
    d0.value=week.toISOString().slice(0,10);
  }
  render();
});
d0.addEventListener('change',render);
d1.addEventListener('change',render);

let lastBubs=[];
let lastBg=[];
let sortField='lk';
let sortAsc=false;

function getFiltered(){
  const mode=tfSel.value;
  const acct=af.value;
  const now=Math.floor(Date.now()/1000);
  let cutFrom=0,cutTo=0;
  if(mode==='custom'){
    if(d0.value)cutFrom=Math.floor(new Date(d0.value+'T00:00:00').getTime()/1000);
    if(d1.value)cutTo=Math.floor(new Date(d1.value+'T23:59:59').getTime()/1000);
  }else{
    const days=+mode;
    if(days>0)cutFrom=now-days*86400;
  }
  const fg=[],bg=[];
  for(let i=0;i<P.length;i++){
    const p=P[i];
    if(cutFrom&&p[3]<cutFrom)continue;
    if(cutTo&&p[3]>cutTo)continue;
    if(acct&&p[2]!==acct)continue;
    bg.push(i);
    if(p[6]!=null)fg.push(i);
  }
  return {fg,bg};
}

function aggregateBubs(fg){
  const st={};
  for(const i of fg){
    const p=P[i];
    const sid=p[6];
    if(!st[sid])st[sid]={sx:0,sy:0,n:0,lk:0,accts:new Set(),rates:[]};
    const s=st[sid];
    s.sx+=p[0];s.sy+=p[1];s.n++;s.lk+=p[4];s.accts.add(p[2]);
    if(p[7]>0)s.rates.push(p[4]/p[7]);
  }
  const bubs=[];
  for(const[sid,s]of Object.entries(st)){
    if(s.n<2)continue;
    const avgRate=s.rates.length>0?s.rates.reduce((a,b)=>a+b,0)/s.rates.length:0;
    bubs.push({
      sid:sid,
      x:s.sx/s.n, y:s.sy/s.n,
      n:s.n, lk:s.lk, na:s.accts.size,
      avg:s.lk/s.n,
      rate:avgRate,
      info:S[sid],
      label:S[sid]&&S[sid].l?S[sid].l:'Story',
      cat:S[sid]&&S[sid].c?S[sid].c:''
    });
  }
  return bubs;
}

function renderPostCard(p){
  const date=p[3]?new Date(p[3]*1000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
  const url=p[8]?'https://instagram.com/p/'+p[8]:'';
  return '<div class="post-card">'+
    '<div class="pc-top"><span class="pc-acct">@'+esc(p[2])+'</span><span class="pc-date">'+date+'</span></div>'+
    (p[9]?'<div class="pc-cap">'+esc(p[9])+'</div>':'')+
    '<div class="pc-stats">'+
    '<span>&#x2764;&#xfe0f; '+p[4].toLocaleString()+'</span>'+
    '<span>&#x1f4ac; '+p[5].toLocaleString()+'</span>'+
    (p[7]>0?'<span>Rate: '+(p[4]/p[7]*100).toFixed(2)+'%</span>':'')+
    (url?'<a href="'+url+'" target="_blank" rel="noopener">View on IG</a>':'')+
    '</div></div>';
}

function buildTimelineSVG(sorted){
  if(sorted.length<2)return '';
  const t0=sorted[0][3];
  const tEnd=sorted[sorted.length-1][3];
  const span=Math.max(tEnd-t0,3600);
  const W=388,H=80,padL=10,padR=10,padT=16,padB=20;
  const plotW=W-padL-padR,plotH=H-padT-padB;
  function tx(ts){return padL+(ts-t0)/span*plotW}
  const accts=[...new Set(sorted.map(p=>p[2]))];
  const colors=['#58a6ff','#3fb950','#d29922','#f85149','#bc8cff','#f0883e','#39d353','#db61a2'];
  const acctColor={};
  accts.forEach((a,i)=>acctColor[a]=colors[i%colors.length]);
  let svg='<svg width="'+W+'" height="'+H+'" xmlns="http://www.w3.org/2000/svg">';
  const wx1=tx(t0);
  const wx2=tx(Math.min(t0+6*3600,t0+span));
  svg+='<rect class="tl-window" x="'+wx1+'" y="'+padT+'" width="'+(wx2-wx1)+'" height="'+plotH+'" rx="3"/>';
  svg+='<text class="tl-label" x="'+(wx1+2)+'" y="'+(padT-4)+'" font-size="9" fill="rgba(63,185,80,0.6)">6h window</text>';
  svg+='<line x1="'+padL+'" y1="'+(padT+plotH)+'" x2="'+(padL+plotW)+'" y2="'+(padT+plotH)+'" stroke="#30363d" stroke-width="1"/>';
  const dur=(tEnd-t0)/3600;
  let labels;
  if(dur<=24)labels=[0,6,12,24].filter(h=>h*3600<=span);
  else if(dur<=168){const s=24;labels=[];for(let h=0;h*3600<=span;h+=s)labels.push(h)}
  else{const s=Math.ceil(dur/5/24)*24;labels=[];for(let h=0;h*3600<=span;h+=s)labels.push(h)}
  for(const h of labels){
    const x=tx(t0+h*3600);
    const lbl=h<24?(h+'h'):(Math.round(h/24)+'d');
    svg+='<text class="tl-label" x="'+x+'" y="'+(H-2)+'" text-anchor="middle">'+lbl+'</text>';
    svg+='<line x1="'+x+'" y1="'+padT+'" x2="'+x+'" y2="'+(padT+plotH)+'" stroke="#21262d" stroke-width="1"/>';
  }
  const yMid=padT+plotH/2;
  for(const p of sorted){
    const cx=tx(p[3]);
    const col=acctColor[p[2]];
    const r=Math.max(3,Math.min(7,Math.sqrt(p[4]/1000)*2+3));
    svg+='<circle cx="'+cx+'" cy="'+yMid+'" r="'+r+'" fill="'+col+'" opacity="0.85">';
    svg+='<title>@'+p[2]+' \u00b7 '+p[4].toLocaleString()+' likes</title></circle>';
  }
  if(accts.length<=6){
    let lx=padL;
    for(const a of accts){
      svg+='<circle cx="'+lx+'" cy="8" r="4" fill="'+acctColor[a]+'"/>';
      svg+='<text x="'+(lx+7)+'" y="11" font-size="9" fill="#8b949e">@'+a+'</text>';
      lx+=a.length*5.5+20;
      if(lx>W-20)break;
    }
  }
  svg+='</svg>';
  return svg;
}

function renderTimeline(posts,sid){
  const el=document.getElementById('sb-timeline');
  const storyEvents=E.filter(ev=>String(ev.sid)===String(sid));
  if(storyEvents.length>0){
    storyEvents.sort((a,b)=>b.t0-a.t0);
    let html='';
    const shown=storyEvents.slice(0,5);
    for(const ev of shown){
      const evPosts=ev.pi.map(i=>P[i]).filter(p=>p&&p[3]>0);
      evPosts.sort((a,b)=>a[3]-b[3]);
      if(evPosts.length<2)continue;
      const d=new Date(ev.t0*1000);
      const label=d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+
        ' \u00b7 '+ev.n+' posts \u00b7 '+ev.na+' accts';
      html+='<div style="margin-bottom:8px"><div style="font-size:11px;color:#8b949e;margin-bottom:2px">'+label+'</div>';
      html+=buildTimelineSVG(evPosts);
      html+='</div>';
    }
    if(storyEvents.length>5)html+='<div style="font-size:11px;color:#484f58">+'+(storyEvents.length-5)+' more events</div>';
    el.innerHTML=html||'';
  }else{
    const sorted=[...posts].filter(p=>p[3]>0).sort((a,b)=>a[3]-b[3]);
    el.innerHTML=buildTimelineSVG(sorted);
  }
}

function openSidebar(sid){
  const story=S[sid];
  const posts=P.filter(p=>String(p[6])===String(sid));
  posts.sort((a,b)=>b[4]-a[4]);

  document.getElementById('sb-title').textContent=story&&story.l?story.l:'Story';
  const accts=new Set(posts.map(p=>p[2]));
  const totalLk=posts.reduce((s,p)=>s+p[4],0);
  document.getElementById('sb-meta').innerHTML=
    (story&&story.c?'<b>Category:</b> '+esc(story.c)+'&nbsp;&nbsp;':'')+
    '<b>Posts:</b> '+posts.length+'&nbsp;&nbsp;'+
    '<b>Accounts:</b> '+accts.size+'&nbsp;&nbsp;'+
    '<b>Total likes:</b> '+totalLk.toLocaleString();

  document.getElementById('sb-posts').innerHTML=posts.map(p=>renderPostCard(p)).join('');
  renderTimeline(posts,sid);

  const sb=document.getElementById('sidebar');
  sb.style.display='block';
  sb.scrollTop=0;
  adjustLayout();
}

function openSinglePost(postIndex){
  const p=P[postIndex];
  if(!p)return;
  const title=p[9]?p[9].slice(0,50):'Post by @'+p[2];
  document.getElementById('sb-title').textContent=title;
  const nearCat=p[10]||'Unclustered';
  document.getElementById('sb-meta').innerHTML=
    '<b>Account:</b> @'+esc(p[2])+'&nbsp;&nbsp;'+
    '<b>Likes:</b> '+p[4].toLocaleString()+'&nbsp;&nbsp;'+
    (p[7]>0?'<b>Eng rate:</b> '+(p[4]/p[7]*100).toFixed(2)+'%&nbsp;&nbsp;':'')+
    '<b>Category:</b> <span style="color:#f0883e">'+esc(nearCat)+'</span>';
  document.getElementById('sb-posts').innerHTML=renderPostCard(p);
  document.getElementById('sb-timeline').innerHTML='';
  const sb=document.getElementById('sidebar');
  sb.style.display='block';
  sb.scrollTop=0;
  adjustLayout();
}

function closeSidebar(){
  document.getElementById('sidebar').style.display='none';
  adjustLayout();
}

function adjustLayout(){
  const open=document.getElementById('sidebar').style.display==='block';
  const w=open?'calc(100vw - 420px)':'100vw';
  document.getElementById('chart').style.width=w;
  document.getElementById('rankings').style.width=w;
  document.getElementById('trending').style.width=w;
  if(document.getElementById('chart').style.display!=='none'){
    Plotly.Plots.resize(document.getElementById('chart'));
  }
}

document.getElementById('sb-close').addEventListener('click',closeSidebar);

let lastUnclustered=[];

function renderRankings(bubs,unclustered){
  const rows=[];
  for(const b of bubs){
    rows.push({label:b.label,cat:b.cat,n:b.n,na:b.na,lk:b.lk,rate:b.rate,sid:b.sid,pi:null});
  }
  for(const u of unclustered){
    rows.push({label:u.label,cat:u.cat,n:1,na:1,lk:u.lk,rate:u.rate,sid:null,pi:u.pi});
  }
  const cmp=(a,b)=>{
    let va,vb;
    switch(sortField){
      case 'label':va=a.label.toLowerCase();vb=b.label.toLowerCase();return sortAsc?va.localeCompare(vb):vb.localeCompare(va);
      case 'cat':va=a.cat.toLowerCase();vb=b.cat.toLowerCase();return sortAsc?va.localeCompare(vb):vb.localeCompare(va);
      case 'n':va=a.n;vb=b.n;break;
      case 'na':va=a.na;vb=b.na;break;
      case 'rate':va=a.rate;vb=b.rate;break;
      default:va=a.lk;vb=b.lk;
    }
    return sortAsc?va-vb:vb-va;
  };
  rows.sort(cmp);
  const tbody=document.getElementById('rank-body');
  tbody.innerHTML=rows.map((r,i)=>{
    const rateStr=r.rate>0?(r.rate*100).toFixed(2)+'%':'N/A';
    const catStyle=r.sid?'color:#8b949e':'color:#f0883e;font-style:italic';
    const attr=r.sid?'data-sid="'+r.sid+'"':'data-pi="'+r.pi+'"';
    return '<tr '+attr+'>'+
      '<td style="color:#8b949e">'+(i+1)+'</td>'+
      '<td>'+esc(r.label)+'</td>'+
      '<td style="'+catStyle+'">'+esc(r.cat)+'</td>'+
      '<td>'+r.n+'</td>'+
      '<td>'+r.na+'</td>'+
      '<td>'+r.lk.toLocaleString()+'</td>'+
      '<td>'+rateStr+'</td></tr>';
  }).join('');
  tbody.querySelectorAll('tr').forEach(tr=>{
    tr.addEventListener('click',()=>{
      if(tr.dataset.sid)openSidebar(tr.dataset.sid);
      else if(tr.dataset.pi!==undefined)openSinglePost(parseInt(tr.dataset.pi));
    });
  });
}

document.querySelectorAll('#rank-table th[data-sort]').forEach(th=>{
  th.addEventListener('click',()=>{
    const f=th.dataset.sort;
    if(f==='rank')return;
    if(sortField===f)sortAsc=!sortAsc;
    else{sortField=f;sortAsc=false}
    document.querySelectorAll('#rank-table th').forEach(h=>h.textContent=h.textContent.replace(/ [\u2191\u2193]/g,''));
    th.textContent=th.textContent+(sortAsc?' \u2191':' \u2193');
    renderRankings(lastBubs,lastUnclustered);
  });
});

function renderTrending(){
  const now=Math.floor(Date.now()/1000);
  const acct=af.value;
  const items=[];
  const inEvent=new Set();
  for(const ev of E){for(const i of ev.pi)inEvent.add(i)}
  for(const ev of E){
    if(acct){const pa=ev.pi.map(i=>P[i][2]);if(!pa.includes(acct))continue}
    const mult=medianMult(ev.pi);
    const rate=medianRate(ev.pi);
    const story=S[ev.sid];
    items.push({type:'event',t:ev.t0,sid:ev.sid,
      label:story&&story.l?story.l:'Story',
      cat:story&&story.c?story.c:'',
      n:ev.n,na:ev.na,v:ev.v,lk:ev.lk,mult:mult,rate:rate,pi:null});
  }
  const singles=[];
  for(let i=0;i<P.length;i++){
    if(inEvent.has(i))continue;
    const p=P[i];
    if(!p[3])continue;
    if(acct&&p[2]!==acct)continue;
    const am=AM[p[2]];
    const mult=am>0?p[4]/am:0;
    const rate=p[7]>0?p[4]/p[7]:0;
    const sid=p[6];
    const story=sid!=null?S[sid]:null;
    const label=story&&story.l?story.l:(p[9]?p[9].slice(0,50):'Post by @'+p[2]);
    const cat=story&&story.c?story.c:(p[10]||'');
    singles.push({type:'single',t:p[3],sid:sid,
      label:label,cat:cat,n:1,na:1,v:0,lk:p[4],mult:mult,rate:rate,pi:i});
  }
  singles.sort((a,b)=>b.t-a.t);
  for(const s of singles.slice(0,200))items.push(s);
  items.sort((a,b)=>b.t-a.t);
  const tbody=document.getElementById('trend-body');
  const rows=[];
  for(const it of items){
    const age=(now-it.t)/3600;
    let wClass,wLabel;
    if(age<6){wClass='window-green';wLabel='<6h'}
    else if(age<24){wClass='window-yellow';wLabel='<24h'}
    else if(age<48){wClass='window-red';wLabel='<48h'}
    else{wClass='window-gray';wLabel='>48h'}
    let started;
    if(age<1)started=Math.round(age*60)+'m ago';
    else if(age<24)started=Math.round(age)+'h ago';
    else if(age<168)started=Math.round(age/24)+'d ago';
    else{const d=new Date(it.t*1000);started=d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}
    const vel=it.v>0?it.v.toFixed(1)+'/h':'\u2014';
    const multStr=it.mult>0?it.mult.toFixed(1)+'x':'\u2014';
    const multCol=it.mult>=1.5?'#3fb950':it.mult>=1?'#e6edf3':'#f85149';
    const rateStr=it.rate>0?(it.rate*100).toFixed(2)+'%':'\u2014';
    const rowStyle=it.type==='single'?'opacity:0.7':'';
    const tag=it.type==='single'?'<span style="color:#484f58;font-size:11px;margin-left:6px">early</span>':'';
    let clickAttr='';
    if(it.sid!=null)clickAttr='data-sid="'+it.sid+'"';
    else if(it.pi!=null)clickAttr='data-pi="'+it.pi+'"';
    rows.push('<tr '+clickAttr+' style="'+rowStyle+'">'+
      '<td><span class="window-badge '+wClass+'" title="'+wLabel+'"></span>'+wLabel+'</td>'+
      '<td>'+esc(it.label)+tag+'</td>'+
      '<td style="color:#8b949e">'+esc(it.cat)+'</td>'+
      '<td>'+started+'</td>'+
      '<td>'+it.n+' / '+it.na+'</td>'+
      '<td>'+vel+'</td>'+
      '<td style="color:'+multCol+'">'+multStr+'</td>'+
      '<td>'+it.lk.toLocaleString()+'</td>'+
      '<td>'+rateStr+'</td></tr>');
  }
  tbody.innerHTML=rows.join('');
  tbody.querySelectorAll('tr').forEach(tr=>{
    tr.addEventListener('click',()=>{
      if(tr.dataset.sid)openSidebar(tr.dataset.sid);
      else if(tr.dataset.pi!==undefined)openSinglePost(parseInt(tr.dataset.pi));
    });
  });
}

function renderAccountProfile(acct){
  const el=document.getElementById('acct-profile');
  if(!acct){el.style.display='none';return}
  const myPosts=P.filter(p=>p[2]===acct&&p[7]>0);
  if(myPosts.length<3){el.style.display='none';return}
  const rates=myPosts.map(p=>p[4]/p[7]);
  rates.sort((a,b)=>a-b);
  const medianRate=rates[Math.floor(rates.length/2)];
  if(medianRate<=0){el.style.display='none';return}
  const cats={};
  for(const p of myPosts){
    let cat=null;
    if(p[6]!=null&&S[p[6]]&&S[p[6]].c)cat=S[p[6]].c;
    else if(p[10])cat=p[10];
    if(!cat)continue;
    if(!cats[cat])cats[cat]={rates:[],n:0};
    cats[cat].rates.push(p[4]/p[7]);
    cats[cat].n++;
  }
  const bars=[];
  for(const[cat,d]of Object.entries(cats)){
    if(d.n<2)continue;
    const r=d.rates.slice().sort((a,b)=>a-b);
    const m=r[Math.floor(r.length/2)];
    bars.push({cat:cat,mult:m/medianRate,n:d.n});
  }
  if(bars.length<2){el.style.display='none';return}
  bars.sort((a,b)=>b.mult-a.mult);
  const maxMult=Math.max(...bars.map(b=>b.mult),2);
  let html='<h4>@'+esc(acct)+' category profile</h4>';
  for(const b of bars){
    const pct=Math.min(b.mult/maxMult*100,100);
    const col=b.mult>=1?'#3fb950':'#f85149';
    html+='<div class="prof-bar">'+
      '<span class="prof-bar-label" title="'+esc(b.cat)+'">'+esc(b.cat)+' ('+b.n+')</span>'+
      '<div style="flex:1;background:#21262d;border-radius:2px;height:12px">'+
      '<div class="prof-bar-fill" style="width:'+pct.toFixed(1)+'%;background:'+col+'"></div></div>'+
      '<span class="prof-bar-val">'+b.mult.toFixed(1)+'x</span></div>';
  }
  el.innerHTML=html;
  el.style.display='block';
}

function render(){
  const {fg,bg}=getFiltered();
  const bubs=aggregateBubs(fg);
  lastBubs=bubs;
  lastBg=bg;

  const fgSet=new Set(fg);
  const unc=[];
  for(let i=0;i<bg.length;i++){
    const idx=bg[i];
    if(!fgSet.has(idx)){
      const p=P[idx];
      const rate=p[7]>0?p[4]/p[7]:0;
      unc.push({
        label:p[9]?p[9].slice(0,60):'Post by @'+p[2],
        cat:p[10]||'Unclustered',
        lk:p[4],rate:rate,pi:idx
      });
    }
  }
  lastUnclustered=unc;

  const colorMode=document.getElementById('cf').value;
  const viewMode=document.getElementById('vf').value;

  document.getElementById('stats').textContent=
    bg.length.toLocaleString()+' posts \u00b7 '+
    bubs.length+' stories \u00b7 '+
    fg.length.toLocaleString()+' clustered \u00b7 '+
    unc.length.toLocaleString()+' unclustered';

  document.getElementById('chart').style.display='none';
  document.getElementById('rankings').style.display='none';
  document.getElementById('trending').style.display='none';

  if(viewMode==='rank'){
    document.getElementById('rankings').style.display='block';
    renderRankings(bubs,unc);
    return;
  }
  if(viewMode==='trend'){
    document.getElementById('trending').style.display='block';
    renderTrending();
    return;
  }

  document.getElementById('chart').style.display='block';

  const bx=new Float32Array(bg.length);
  const by=new Float32Array(bg.length);
  const bgHover=[];
  for(let i=0;i<bg.length;i++){
    bx[i]=P[bg[i]][0];by[i]=P[bg[i]][1];
    const p=P[bg[i]];
    if(p[4]>=10000||p[9]){
      let h='@'+p[2]+' \u00b7 '+p[4].toLocaleString()+' likes';
      if(p[9])h+='<br>'+esc(p[9].slice(0,120));
      bgHover.push(h);
    }else{
      bgHover.push('');
    }
  }

  bubs.sort((a,b)=>b.n-a.n);

  const vals=bubs.map(b=>colorMode==='rate'?b.rate:b.avg).sort((a,b)=>a-b);
  function pct(v){
    if(vals.length<2)return 0.5;
    let lo=0,hi=vals.length-1;
    while(lo<hi){const m=(lo+hi)>>1;vals[m]<v?lo=m+1:hi=m}
    return lo/(vals.length-1);
  }

  const bxA=[],byA=[],szA=[],clA=[],txA=[],sidA=[];
  for(const b of bubs){
    bxA.push(b.x);byA.push(b.y);
    szA.push(Math.max(10,Math.min(70,Math.sqrt(b.n)*4.5)));
    const v=colorMode==='rate'?b.rate:b.avg;
    const s=30+70*pct(v);
    const l=65-20*pct(v);
    clA.push('hsl(215,'+s.toFixed(0)+'%,'+l.toFixed(0)+'%)');
    sidA.push(b.sid);
    const rateStr=b.rate>0?(b.rate*100).toFixed(2)+'%':'N/A';
    txA.push(
      '<b>'+esc(b.label)+'</b><br>'+
      (b.cat?'Category: '+esc(b.cat)+'<br>':'')+
      'Posts: '+b.n+'<br>'+
      'Accounts: '+b.na+'<br>'+
      'Total likes: '+b.lk.toLocaleString()+'<br>'+
      'Avg likes: '+Math.round(b.avg).toLocaleString()+'<br>'+
      'Eng rate: '+rateStr
    );
  }

  const catCentroids={};
  for(const b of bubs){
    if(!b.cat)continue;
    if(!catCentroids[b.cat])catCentroids[b.cat]={sx:0,sy:0,n:0};
    catCentroids[b.cat].sx+=b.x*b.n;
    catCentroids[b.cat].sy+=b.y*b.n;
    catCentroids[b.cat].n+=b.n;
  }
  const annotations=[];
  for(const[cat,c]of Object.entries(catCentroids)){
    if(c.n<3||!cat)continue;
    annotations.push({
      x:c.sx/c.n, y:c.sy/c.n,
      text:cat,
      showarrow:false,
      font:{size:14,color:'rgba(139,148,158,0.6)',family:'-apple-system,system-ui,sans-serif'},
      xanchor:'center',yanchor:'middle'
    });
  }

  Plotly.react('chart',[
    {
      x:bx,y:by,mode:'markers',type:'scattergl',
      marker:{size:2,color:'#21262d',opacity:0.6},
      hoverinfo:'text',hovertext:bgHover,
      hoverlabel:{bgcolor:'#161b22',bordercolor:'#30363d',
        font:{color:'#e6edf3',size:12}},
      showlegend:false
    },
    {
      x:bxA,y:byA,mode:'markers',type:'scatter',
      marker:{
        size:szA,color:clA,
        line:{width:1,color:'rgba(255,255,255,0.12)'}
      },
      hovertext:txA,hoverinfo:'text',
      hoverlabel:{bgcolor:'#161b22',bordercolor:'#30363d',
        font:{color:'#e6edf3',size:13}},
      showlegend:false,
      customdata:sidA
    }
  ],{
    paper_bgcolor:'#0d1117',plot_bgcolor:'#0d1117',
    xaxis:{visible:false,fixedrange:false},
    yaxis:{visible:false,fixedrange:false,scaleanchor:'x'},
    margin:{l:0,r:0,t:0,b:0},
    hovermode:'closest',
    dragmode:'pan',
    annotations:annotations
  },{
    responsive:true,
    scrollZoom:true,
    displaylogo:false,
    modeBarButtonsToRemove:['select2d','lasso2d','autoScale2d']
  });
}

af.addEventListener('change',()=>{render();renderAccountProfile(af.value)});
document.getElementById('cf').addEventListener('change',render);
document.getElementById('vf').addEventListener('change',()=>{closeSidebar();render()});
render();
renderAccountProfile(af.value);

const chartEl=document.getElementById('chart');
chartEl.on('plotly_click',function(data){
  if(!data||!data.points||!data.points.length)return;
  const pt=data.points[0];
  if(pt.curveNumber===1){
    const sid=pt.customdata;
    if(sid)openSidebar(sid);
  }else if(pt.curveNumber===0){
    const postIndex=lastBg[pt.pointIndex];
    if(postIndex!==undefined)openSinglePost(postIndex);
  }
});