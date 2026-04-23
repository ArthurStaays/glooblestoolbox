/* === PRICE & FX CALCULATORS === */

// --- CALCULATORS ---
function fmt(n){return'€'+n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});}

let commMode='ht';
function setCommMode(mode){
  commMode=mode;
  document.getElementById('comm-tog-gross').classList.toggle('active',mode==='gross');
  document.getElementById('comm-tog-ht').classList.toggle('active',mode==='ht');
  calcComm();
}

function getVat(){
  const sel=document.getElementById('c-country').value;
  if(sel==='custom') return parseFloat(document.getElementById('c-vat-custom').value)||0;
  return parseFloat(sel)||0;
}

const cCountry=document.getElementById('c-country');
if(cCountry) cCountry.addEventListener('change',function(){
  document.getElementById('c-vat-custom').style.display=this.value==='custom'?'block':'none';
  calcComm();
});

function calcComm(){
  const gross=parseFloat(document.getElementById('c-gross').value);
  const pct=parseFloat(document.getElementById('c-pct').value);
  if(isNaN(gross)||isNaN(pct)){
    document.getElementById('c-result').textContent='—';
    document.getElementById('c-net').textContent='—';
    document.getElementById('c-ht').textContent='—';
    return;
  }
  const vat=getVat();
  const ht=gross/(1+vat/100);
  document.getElementById('c-ht').textContent=fmt(ht);
  const base=commMode==='ht'?ht:gross;
  const comm=base*pct/100;
  document.getElementById('c-result').textContent=fmt(comm);
  document.getElementById('c-net').textContent=fmt(ht-comm);
}

function calcTopup(){
  const n=parseFloat(document.getElementById('t-net').value);
  const p=parseFloat(document.getElementById('t-pct').value);
  if(isNaN(n)||isNaN(p)){
    document.getElementById('t-net-display').textContent='—';
    document.getElementById('t-margin').textContent='—';
    document.getElementById('t-result').textContent='—';
    return;
  }
  const client=n/(1-p/100);
  document.getElementById('t-net-display').textContent=fmt(n);
  document.getElementById('t-margin').textContent=fmt(client-n);
  document.getElementById('t-result').textContent=fmt(client);
}

function sendToInvoice(){
  const n=parseFloat(document.getElementById('t-net').value);
  const p=parseFloat(document.getElementById('t-pct').value);
  if(!isNaN(n)&&!isNaN(p)){
    const total=n/(1-p/100);
    invItems=[];invItemId=0;
    addInvItem('',1,total);
    renderInvItems();
    calcInvTotal();
  }
  openTool('invoice');
}

function calcPct(){
  const a=parseFloat(document.getElementById('p-amount').value);
  const p=parseFloat(document.getElementById('p-pct').value);
  if(isNaN(a)||isNaN(p)){document.getElementById('p-result').textContent='—';document.getElementById('p-total').textContent='—';return;}
  const fee=a*p/100;
  document.getElementById('p-result').textContent=fee.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById('p-total').textContent=(a+fee).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
}

// FX
let fxRates=null;
async function fetchFX(){
  document.getElementById('fx-rate-label').textContent='Loading live rates...';
  try{
    const res=await fetch('https://open.er-api.com/v6/latest/EUR');
    const data=await res.json();
    if(data.result==='success'){
      fxRates=data.rates;
      const d=new Date(data.time_last_update_utc);
      document.getElementById('fx-rate-label').textContent=`Live rates · updated ${d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`;
      calcFX();
    }
  }catch(e){
    document.getElementById('fx-rate-label').textContent='Could not load rates — check connection';
  }
}

function calcFX(){
  if(!fxRates){document.getElementById('fx-result').textContent='—';return;}
  const amount=parseFloat(document.getElementById('fx-amount').value);
  const from=document.getElementById('fx-from').value;
  const to=document.getElementById('fx-to').value;
  if(isNaN(amount)){document.getElementById('fx-result').textContent='—';document.getElementById('fx-rate-display').textContent='—';return;}
  const inEur=amount/fxRates[from];
  const converted=inEur*fxRates[to];
  const rate=fxRates[to]/fxRates[from];
  document.getElementById('fx-result').textContent=converted.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+to;
  document.getElementById('fx-rate-display').textContent=rate.toFixed(4);
}

