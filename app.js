/* =============================================================================
   GLOOBLES TOOL BOX — app.js
   Navigation core + shared event handlers + auth.
   Tool logic lives in tools/ (calc, offer, confirm, invoice, whatsapp, presb).
   ============================================================================= */

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// --- VIEW SWITCHING ---
const toolLabels={offer:'offer builder',price:'price calculator',confirm:'booking confirmation',invoice:'invoice generator',waformat:'whatsapp formatter',presb:'presentation builder'};
let openTabs=['home'];
let navHistory=[];
let currentView='home';
let cfInited=false;
let quickStartOpen=false;

const quickStartTools=['offer','price','confirm'];

function renderTabs(){
  const bar=document.getElementById('tabs-bar');
  const dynamicTabs=openTabs.map(name=>{
    const active=name===currentView?' active':'';
    const dot=name!=='home'?'<span class="tab-dot"></span>':'';
    const close=name!=='home'?`<span class="tab-close" onclick="closeTab('${name}',event)">✕</span>`:'';
    const label=name==='home'?'home':toolLabels[name];
    return `<button class="tab${active}" onclick="showView('${name}')">${dot}${label}${close}</button>`;
  }).join('');
  const dropdownItems=quickStartTools.map(name=>`
    <button class="qs-item" onclick="openTool('${name}');closeQuickStart()">
      <span class="tab-dot"></span>${toolLabels[name]}
    </button>`).join('');
  const qs=`<div class="qs-wrap" id="qs-wrap">
    <button class="tab qs-tab${quickStartOpen?' qs-open':''}" onclick="toggleQuickStart(event)">quick start ▾</button>
    <div class="qs-menu${quickStartOpen?' open':''}">
      ${dropdownItems}
    </div>
  </div>`;
  bar.innerHTML=dynamicTabs+qs;
}
function toggleQuickStart(e){
  e.stopPropagation();
  quickStartOpen=!quickStartOpen;
  renderTabs();
}
function closeQuickStart(){
  quickStartOpen=false;
  renderTabs();
}
function openTool(name){
  if(!openTabs.includes(name)) openTabs.push(name);
  showView(name);
}
function closeTab(name,e){
  e.stopPropagation();
  openTabs=openTabs.filter(t=>t!==name);
  if(currentView===name){
    const fallback=[...navHistory].reverse().find(h=>openTabs.includes(h))||'home';
    showView(fallback,true);
  } else {
    renderTabs();
  }
}
function showView(name,fromBack=false){
  if(!fromBack&&name!==currentView) navHistory.push(currentView);
  currentView=name;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  if(name!=='home'&&!openTabs.includes(name)) openTabs.push(name);
  renderTabs();
  if(name==='price'&&!fxRates)fetchFX();
  if(name==='confirm'&&!cfInited){cfInited=true;initConfirm();}
  if(name==='presb'&&!pbInited){pbInited=true;setTimeout(pbInit,60);}
}
function goBack(){
  if(navHistory.length>0){
    const prev=navHistory.pop();
    showView(prev,true);
  } else {
    showView('home',true);
  }
}
renderTabs();
document.documentElement.style.setProperty('--nav-h', document.querySelector('nav').offsetHeight+'px');

document.addEventListener('click',e=>{
  if(!e.target.closest('.cal-wrap'))document.querySelectorAll('.cal-pop').forEach(p=>p.classList.remove('open'));
  hotels.forEach(h=>{if(!e.target.closest('#hdr-'+h.id))closeSug(h.id);});
  if(!e.target.closest('.qs-wrap')&&quickStartOpen)closeQuickStart();
  if(!e.target.closest('.pb-add-wrap'))document.getElementById('pb-add-menu')?.classList.remove('open');
});

document.addEventListener('DOMContentLoaded',()=>{
  initInvoice();initConfirm();
  if(sessionStorage.getItem('gl-auth')==='1')document.getElementById('pw-gate').style.display='none';
});

async function checkPw(){
  const input=document.getElementById('pw-input');
  const enc=new TextEncoder().encode(input.value);
  const buf=await crypto.subtle.digest('SHA-256',enc);
  const hash=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash==='1f45f47829b9eccbadcab615759b4dd5a03b1bb20a5dd43daf712898d437ad0b'){
    sessionStorage.setItem('gl-auth','1');
    document.getElementById('pw-gate').style.display='none';
  } else {
    document.getElementById('pw-error').style.display='block';
    input.value='';input.focus();
  }
}
