/* === OFFER BUILDER === */

// --- CALENDAR ---
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MSHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DNAMES=['Su','Mo','Tu','We','Th','Fr','Sa'];
let cals={ci:{y:2026,m:3},co:{y:2026,m:3}};
let picked={ci:null,co:null};
let inp={ci:'d-in',co:'d-out'};

function tc(id){
  const pop=document.getElementById(id);
  const was=pop.classList.contains('open');
  document.querySelectorAll('.cal-pop').forEach(p=>p.classList.remove('open'));
  if(!was){rc(id);pop.classList.add('open');}
}
function rc(id){
  const{y,m}=cals[id];
  const first=new Date(y,m,1).getDay();
  const dim=new Date(y,m+1,0).getDate();
  const td=new Date();
  const s=picked[id];
  let h=`<div class="cal-nav"><button onclick="cn(event,'${id}',-1)">‹</button><span>${MONTHS[m]} ${y}</span><button onclick="cn(event,'${id}',1)">›</button></div><div class="cal-grid">`;
  DNAMES.forEach(d=>h+=`<div class="cdn">${d}</div>`);
  for(let i=0;i<first;i++)h+=`<div class="cd em"></div>`;
  for(let d=1;d<=dim;d++){
    const it=d===td.getDate()&&m===td.getMonth()&&y===td.getFullYear();
    const is=s&&s.d===d&&s.m===m&&s.y===y;
    h+=`<div class="cd${it?' td':''}${is?' sel':''}" onclick="pd('${id}',${y},${m},${d})">${d}</div>`;
  }
  h+=`</div>`;
  document.getElementById(id).innerHTML=h;
}
function cn(e,id,dir){
  e.stopPropagation();
  let{y,m}=cals[id];m+=dir;
  if(m<0){m=11;y--;}if(m>11){m=0;y++;}
  cals[id]={y,m};rc(id);
}
function pd(id,y,m,d){
  picked[id]={y,m,d};
  document.getElementById(inp[id]).value=`${d} ${MSHORT[m]}`;
  document.getElementById(id).classList.remove('open');
  if(id==='ci'){cals.co={y,m};rc('co');}
}

// --- HOTELS ---
let hc=0,hotels=[],cxlMode='all',priceMode='total';

function setPriceMode(mode){
  priceMode=mode;
  document.getElementById('price-tog-total').classList.toggle('active',mode==='total');
  document.getElementById('price-tog-night').classList.toggle('active',mode==='night');
}
function setCxlMode(mode){
  cxlMode=mode;
  document.getElementById('cxl-tog-all').classList.toggle('active',mode==='all');
  document.getElementById('cxl-tog-per').classList.toggle('active',mode==='per');
  document.getElementById('cxl-global').classList.toggle('show',mode==='all');
  document.getElementById('cxl-per').classList.toggle('show',mode==='per');
  if(mode==='per')renderCxlPer();
}
function renderCxlPer(){
  const c=document.getElementById('cxl-per-list');
  if(!c)return;
  c.innerHTML=hotels.map(h=>`<div class="cxl-hotel-row"><span class="cxl-hotel-name" title="${esc(h.name)||'Hotel'}">${esc(h.name)||'Hotel'}</span><textarea placeholder="Cancellation policy..." oninput="sh(${h.id},'cxl',this.value)">${esc(h.cxl||'')}</textarea></div>`).join('')||'<div style="font-size:12px;color:var(--text2)">Add hotels above first</div>';
}
function addHotel(){
  const id=hc++;
  hotels.push({id,name:'',rooms:[],note:'',cxl:''});
  rh();addRoom(id);
  if(cxlMode==='per')renderCxlPer();
}
function delHotel(id){hotels=hotels.filter(h=>h.id!==id);rh();if(cxlMode==='per')renderCxlPer();}
function addRoom(hid){const h=hotels.find(h=>h.id===hid);if(h)h.rooms.push({name:'',price:''});rh();}
function delRoom(hid,ri){const h=hotels.find(h=>h.id===hid);if(h)h.rooms.splice(ri,1);rh();}
function sh(id,f,v){const h=hotels.find(h=>h.id===id);if(h){h[f]=v;if(f==='name'&&cxlMode==='per')renderCxlPer();}}
function sr(hid,ri,f,v){const h=hotels.find(h=>h.id===hid);if(h&&h.rooms[ri])h.rooms[ri][f]=v;}

function rh(){
  document.getElementById('hotels').innerHTML=hotels.map(h=>`
    <div class="hotel-block">
      <div class="hotel-hdr" id="hdr-${h.id}">
        <input type="text" placeholder="Hotel name" value="${esc(h.name)}" oninput="sh(${h.id},'name',this.value)" autocomplete="off"/>
        <button class="delbtn" onclick="delHotel(${h.id})">×</button>
      </div>
      <div class="hotel-body">
        <div class="col-hds"><span class="col-h">Room / option name</span><span class="col-h">Price (€)</span><span></span></div>
        ${h.rooms.map((r,ri)=>`<div class="room-row">
          <input type="text" placeholder="Deluxe room" value="${r.name}" oninput="sr(${h.id},${ri},'name',this.value)"/>
          <input type="number" placeholder="2032" value="${r.price}" oninput="sr(${h.id},${ri},'price',this.value)"/>
          <button class="delbtn" onclick="delRoom(${h.id},${ri})">×</button>
        </div>`).join('')}
        <button class="add-room" onclick="addRoom(${h.id})">+ room option</button>
        <textarea placeholder="Add a note / comment..." style="margin-top:8px;font-size:12px;min-height:44px;width:100%;padding:5px 8px;border:0.5px solid #ccc;border-radius:4px;font-family:inherit;color:var(--text);background:#fff;resize:vertical" oninput="sh(${h.id},'note',this.value)">${h.note||''}</textarea>
      </div>
    </div>`).join('');
}

// Autocomplete stubs (disabled — no API key)
function closeSug(hid){}

// Pre-fill
addHotel();
document.getElementById('client').value='Sophie';
document.getElementById('opener').value="I hope you're well!";
document.getElementById('dest').value='Paris';
document.getElementById('nights').value='2';
document.getElementById('agent').value='The gloobles Team';
pd('ci',2026,3,16);
pd('co',2026,3,18);
hotels[0].name='Le Bristol Paris';
hotels[0].rooms[0].name='Chambre Supérieure';
hotels[0].rooms[0].price='2308';
hotels[0].note='Breakfast included';
hotels[0].cxl='Free cancellation up to 7 days before check-in';
hotels[0].rooms.push({name:'Suite Royale',price:'4800'});
addHotel();
hotels[1].name='Maison Barrière Vendôme';
hotels[1].rooms[0].name='Chambre Deluxe';
hotels[1].rooms[0].price='1666';
hotels[1].note='';
hotels[1].cxl='Non-refundable';
hotels[1].rooms.push({name:'Suite Prestige',price:'2900'});
rh();

function fmtDateRange(){
  const ci=picked.ci,co=picked.co;
  if(!ci&&!co)return'';
  if(ci&&co){if(ci.m===co.m)return`${MSHORT[ci.m]} ${ci.d}–${co.d}`;return`${MSHORT[ci.m]} ${ci.d} – ${MSHORT[co.m]} ${co.d}`;}
  if(ci)return`${MSHORT[ci.m]} ${ci.d}`;
  return`${MSHORT[co.m]} ${co.d}`;
}

let lastMsg='';
function gen(){
  const client=document.getElementById('client').value.trim()||'there';
  const dest=document.getElementById('dest').value.trim()||'your destination';
  const nights=document.getElementById('nights').value||'2';
  const opener=document.getElementById('opener').value.trim();
  const agent=document.getElementById('agent').value.trim()||'The gloobles Team';
  const dateRange=fmtDateRange();
  const nightWord=nights==='1'?'night':'nights';
  let hotelLines='';
  hotels.forEach(h=>{
    const name=h.name||'Hotel';
    hotelLines+=`\n*${name}*\n`;
    h.rooms.forEach(r=>{
      const rname=r.name?`${r.name}: `:'';
      let price='';
      if(r.price){
        const total=Number(r.price);
        if(priceMode==='total'){price=`€${total.toLocaleString('fr-FR',{maximumFractionDigits:0})} for ${nights} ${nightWord}`;}
        else{price=`€${total.toLocaleString('fr-FR',{maximumFractionDigits:0})} per night`;}
      }
      hotelLines+=`• ${rname}${price}\n`;
    });
    if(h.note&&h.note.trim())hotelLines+=`_${h.note.trim()}_\n`;
    if(cxlMode==='per'&&h.cxl&&h.cxl.trim())hotelLines+=`_Cancellation: ${h.cxl.trim()}_\n`;
  });
  if(!hotelLines.trim())hotelLines='\n• (no hotels added)\n';
  const cxlAllText=document.getElementById('cxl-all-text').value.trim();
  const cxlBlock=(cxlMode==='all'&&cxlAllText)?`\n*Cancellation policy*\n${cxlAllText}\n`:'';
  const intro=opener?`${opener}\n\n`:'';
  const datePart=dateRange?`, *${dateRange}*`:'';
  const msg=`Dear ${client},\n\n${intro}I'm pleased to share some options for your ${nights} ${nightWord} in *${dest}*${datePart}. Thank you so much for trusting me with this request.\n${hotelLines}${cxlBlock}\nAt gloobles, we always work hard to ensure you have the very best experience wherever you go.\n\nCurious what that looks like?\n• A delicious daily breakfast, on the house.\n• A room upgrade, whenever we can swing it.\n• Check-in and check-out at times that suit you.\n• Some extra spending credit.\n• Special welcome present & note.\n\nDo let us know your thoughts at your soonest convenience and don't hesitate if you have any questions. We look forward to hearing from you!\n\nWarm regards,\n${agent}`;
  lastMsg=msg;
  const now=new Date();
  const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  document.getElementById('preview').innerHTML=`<div class="wa-bubble">${fmtWa(msg)}<div class="wa-time">${t} ✓✓</div></div>`;
  document.getElementById('copybtn').style.display='block';
}
function copyIt(){
  if(!lastMsg)return;
  navigator.clipboard.writeText(lastMsg).then(()=>{
    const btn=document.getElementById('copybtn');
    const orig=btn.textContent;
    btn.textContent='Copied!';
    setTimeout(()=>btn.textContent=orig,2000);
  });
}
function fmtWa(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*([^*]+)\*/g,'<strong>$1</strong>')
    .replace(/_([^_]+)_/g,'<em>$1</em>')
    .replace(/\n/g,'<br>');
}
