/* === CONCIERGE FEE ANALYSIS === */

const CXG_LABELS = {
  restaurant:'Restaurant reservation', transfer:'Private transfer / chauffeur',
  flight:'Flight (change, upgrade, private)', activity:'Activity / experience',
  museum:'Museum / pass / tickets', spa:'Spa & wellness', yacht:'Yacht / boat charter',
  shopping:'Shopping / personal stylist', childcare:'Childcare / kids activity',
  photo:'Photography / videography', medical:'Medical / health assistance',
  visa:'Visa / travel document', occasion:'Special occasion arrangement',
  multi:'Multi-service coordination'
};

const CXG_COMMISSIONED = new Set(['Private transfer / chauffeur']);
let cxgCats = [];
let cxgHourlyRate = 80;
let cxgSyncUrl = localStorage.getItem('cxg-sync-url') || '';

// --- STORAGE ---
function cxgSave(report) {
  const all = cxgLoad(); all.push(report);
  localStorage.setItem('cxg-reports', JSON.stringify(all));
}
function cxgLoad() {
  try { return JSON.parse(localStorage.getItem('cxg-reports') || '[]'); } catch { return []; }
}
function cxgFmtMin(mins) {
  if (!mins) return '—';
  if (mins < 60) return Math.round(mins) + 'min';
  const h = Math.floor(mins/60), m = Math.round(mins%60);
  return m > 0 ? h+'h '+m+'min' : h+'h';
}
function cxgFmtEur(n) { return '€'+Math.round(n); }
function cxgToMin(val, unit) {
  const n = parseFloat(val)||0;
  return unit==='hours' ? n*60 : n;
}
function cxgUpdateTabCount() {
  const badge = document.getElementById('cxg-tab-count');
  if (badge) { const n=cxgLoad().length; badge.textContent = n>0?n:''; }
}

// --- AUTH ---
function cxgCheckResultsPw() {
  const pw = document.getElementById('cxg-res-pw').value;
  if (pw === atob('c3RhYXlz')) {
    sessionStorage.setItem('cxg-auth','1');
    document.getElementById('cxg-pw-gate').style.display = 'none';
    document.getElementById('cxg-results-inner').style.display = 'block';
    cxgRenderDashboard();
  } else {
    document.getElementById('cxg-pw-err').style.display = 'block';
    document.getElementById('cxg-res-pw').value = '';
    document.getElementById('cxg-res-pw').focus();
  }
}

// --- TABS ---
function cxgShowTab(tab) {
  document.getElementById('cxg-tab-form').classList.toggle('active', tab==='form');
  document.getElementById('cxg-tab-results').classList.toggle('active', tab==='results');
  document.getElementById('cxg-form-section').style.display = tab==='form' ? 'block' : 'none';
  document.getElementById('cxg-results-section').style.display = tab==='results' ? 'block' : 'none';
  if (tab==='results') {
    if (sessionStorage.getItem('cxg-auth')==='1') {
      document.getElementById('cxg-pw-gate').style.display = 'none';
      document.getElementById('cxg-results-inner').style.display = 'block';
      cxgRenderDashboard();
    } else {
      document.getElementById('cxg-pw-gate').style.display = 'block';
      document.getElementById('cxg-results-inner').style.display = 'none';
      setTimeout(()=>document.getElementById('cxg-res-pw')?.focus(),100);
    }
  }
}

// --- FORM ---
const CXG_PALETTE = [
  {val:'restaurant', label:'Restaurant reservation'},
  {val:'transfer',   label:'Private transfer / chauffeur'},
  {val:'flight',     label:'Flight (change, upgrade, private)'},
  {val:'activity',   label:'Activity / experience'},
  {val:'museum',     label:'Museum / pass / tickets'},
  {val:'spa',        label:'Spa & wellness'},
  {val:'yacht',      label:'Yacht / boat charter'},
  {val:'shopping',   label:'Shopping / personal stylist'},
  {val:'childcare',  label:'Childcare / kids activity'},
  {val:'photo',      label:'Photography / videography'},
  {val:'medical',    label:'Medical / health assistance'},
  {val:'visa',       label:'Visa / travel document'},
  {val:'occasion',   label:'Special occasion arrangement'},
  {val:'multi',      label:'Multi-service coordination'},
  {val:'__other__',  label:'Other…'}
];
function cxgRenderPalette() {
  const palette = document.getElementById('cxg-cat-palette');
  if (!palette) return;
  palette.innerHTML = CXG_PALETTE.map(p => {
    const active = cxgCats.find(c=>c.val===p.val) ? ' active' : '';
    return `<button class="cxg-palette-tag${active}" onclick="cxgToggleCategory('${p.val}')">${esc(p.label)}</button>`;
  }).join('');
}
function cxgToggleCategory(val) {
  if (val === '__other__') {
    const wrap = document.getElementById('cxg-other-wrap');
    const input = document.getElementById('cxg-cat-other-input');
    wrap.style.display = wrap.style.display==='none' ? 'flex' : 'none';
    if (wrap.style.display==='flex') input.focus();
    return;
  }
  const existing = cxgCats.findIndex(c=>c.val===val);
  if (existing >= 0) {
    cxgCats.splice(existing, 1);
  } else {
    const label = CXG_LABELS[val] || val;
    const safe = val.replace(/[^a-z0-9_]/gi,'_');
    cxgCats.push({val, label, safe, timeVal:'', timeUnit:'min', timeMin:0});
  }
  cxgRenderPalette(); cxgRenderCatTimes(); cxgRenderSubfields(); cxgUpdateSummary();
}
function cxgAddOther() {
  const input = document.getElementById('cxg-cat-other-input');
  const label = input.value.trim();
  if (!label) { input.focus(); return; }
  const val = '__custom__:'+label;
  if (!cxgCats.find(c=>c.val===val)) {
    const safe = val.replace(/[^a-z0-9_]/gi,'_');
    cxgCats.push({val, label, safe, timeVal:'', timeUnit:'min', timeMin:0});
  }
  input.value = '';
  document.getElementById('cxg-other-wrap').style.display = 'none';
  cxgRenderPalette(); cxgRenderCatTimes(); cxgRenderSubfields(); cxgUpdateSummary();
}
function cxgRemoveCategory(val) {
  cxgCats = cxgCats.filter(c=>c.val!==val);
  cxgRenderPalette(); cxgRenderCatTimes(); cxgRenderSubfields(); cxgUpdateSummary();
}
function cxgToggleOther(sel, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.style.display = sel.value==='__other__' ? 'block' : 'none';
  if (sel.value!=='__other__') input.value = '';
}
function cxgGetVal(selId, otherId) {
  const sel = document.getElementById(selId);
  if (!sel) return '—';
  if (sel.value==='__other__') {
    const oth = document.getElementById(otherId);
    return oth&&oth.value.trim() ? oth.value.trim() : '(other)';
  }
  return sel.value||'—';
}
function cxgUpdateCatTime(safe, field, value) {
  const cat = cxgCats.find(c=>c.safe===safe);
  if (!cat) return;
  if (field==='val') cat.timeVal = value;
  else cat.timeUnit = value;
  cat.timeMin = cxgToMin(cat.timeVal||0, cat.timeUnit||'min');
  cxgUpdateSummary();
}
function cxgRenderCatTimes() {
  const container = document.getElementById('cxg-cat-times');
  if (!container) return;
  if (cxgCats.length===0) { container.innerHTML=''; return; }
  container.innerHTML = `
    <div class="cxg-cat-times-wrap">
      <div class="lbl" style="margin-bottom:8px;">Time spent per category</div>
      ${cxgCats.map(c=>`
        <div class="cxg-cat-time-row">
          <span class="cxg-cat-time-lbl">${esc(c.label)}</span>
          <input type="number" placeholder="0" min="0" value="${esc(c.timeVal)}"
            oninput="cxgUpdateCatTime('${c.safe}','val',this.value)" />
          <select onchange="cxgUpdateCatTime('${c.safe}','unit',this.value)">
            <option value="min"${c.timeUnit!=='hours'?' selected':''}>min</option>
            <option value="hours"${c.timeUnit==='hours'?' selected':''}>hours</option>
          </select>
        </div>`).join('')}
    </div>`;
}
function cxgRenderSubfields() {
  const container = document.getElementById('cxg-subfields-container');
  const withDetails = ['restaurant','transfer','flight','activity','museum'];
  const relevant = cxgCats.filter(c=>withDetails.includes(c.val));
  if (relevant.length===0) { container.innerHTML=''; return; }
  container.innerHTML = relevant.map(cat=>`
    <div class="cxg-subblock" id="cxgsub_${cat.safe}">
      <p class="cxg-subblock-title">${esc(cat.label)} — details</p>
      ${cxgBuildSubfieldInner(cat)}
    </div>`).join('');
}
function cxgBuildSubfieldInner(cat) {
  const s=cat.safe;
  if (cat.val==='restaurant') return `<div class="cxg-grid-3">
    <div><label class="cxg-sublabel">Restaurants tried</label><input type="number" id="sf_${s}_tried" min="0" placeholder="e.g. 3"/></div>
    <div><label class="cxg-sublabel">No. of covers</label><input type="number" id="sf_${s}_covers" min="0" placeholder="e.g. 4"/></div>
    <div><label class="cxg-sublabel">Level</label>
      <select id="sf_${s}_level" onchange="cxgToggleOther(this,'sf_${s}_level_other')">
        <option value="">Select…</option><option>Casual</option><option>Fine dining</option><option>Starred / trophy</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_level_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div></div>`;
  if (cat.val==='transfer') return `<div class="cxg-grid-3">
    <div><label class="cxg-sublabel">No. of transfers</label><input type="number" id="sf_${s}_count" min="0" placeholder="e.g. 2"/></div>
    <div><label class="cxg-sublabel">Type</label>
      <select id="sf_${s}_type" onchange="cxgToggleOther(this,'sf_${s}_type_other')">
        <option value="">Select…</option><option>Airport / station pickup</option><option>Intercity / scenic</option><option>Day hire / disposal</option><option>Helicopter</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_type_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div>
    <div><label class="cxg-sublabel">Suppliers tried</label><input type="number" id="sf_${s}_suppliers" min="0" placeholder="e.g. 2"/></div></div>`;
  if (cat.val==='flight') return `<div class="cxg-grid-2">
    <div><label class="cxg-sublabel">Request type</label>
      <select id="sf_${s}_type" onchange="cxgToggleOther(this,'sf_${s}_type_other')">
        <option value="">Select…</option><option>Seat upgrade</option><option>Flight change / rebooking</option><option>Private jet quote</option><option>Additional baggage</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_type_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div>
    <div><label class="cxg-sublabel">No. of passengers</label><input type="number" id="sf_${s}_pax" min="0" placeholder="e.g. 2"/></div></div>`;
  if (cat.val==='activity') return `<div class="cxg-grid-3">
    <div><label class="cxg-sublabel">Type</label>
      <select id="sf_${s}_type" onchange="cxgToggleOther(this,'sf_${s}_type_other')">
        <option value="">Select…</option><option>Private guide / tour</option><option>Water sport / dive</option><option>Safari / wildlife</option><option>Cooking class</option><option>Adventure / extreme</option><option>Cultural immersion</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_type_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div>
    <div><label class="cxg-sublabel">Participants</label><input type="number" id="sf_${s}_pax" min="0" placeholder="e.g. 4"/></div>
    <div><label class="cxg-sublabel">Private or shared?</label>
      <select id="sf_${s}_priv" onchange="cxgToggleOther(this,'sf_${s}_priv_other')">
        <option value="">Select…</option><option>Private</option><option>Shared / group</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_priv_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div></div>`;
  if (cat.val==='museum') return `<div class="cxg-grid-3">
    <div><label class="cxg-sublabel">Type</label>
      <select id="sf_${s}_type" onchange="cxgToggleOther(this,'sf_${s}_type_other')">
        <option value="">Select…</option><option>Museum / gallery</option><option>City pass / attraction</option><option>Concert / show</option><option>Sporting event</option><option>Theme park</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_type_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div>
    <div><label class="cxg-sublabel">No. of tickets</label><input type="number" id="sf_${s}_qty" min="0" placeholder="e.g. 2"/></div>
    <div><label class="cxg-sublabel">Skip-the-line / VIP?</label>
      <select id="sf_${s}_vip" onchange="cxgToggleOther(this,'sf_${s}_vip_other')">
        <option value="">Select…</option><option>Yes</option><option>No — standard entry</option><option value="__other__">Other…</option>
      </select><input type="text" id="sf_${s}_vip_other" placeholder="Specify…" style="display:none;margin-top:6px;"/>
    </div></div>`;
  return '';
}
function cxgGetSubfieldSummary() {
  return cxgCats.map(cat=>{
    const s=cat.safe; let detail='';
    if (cat.val==='restaurant') detail=`tried: ${document.getElementById('sf_'+s+'_tried')?.value||'—'}, covers: ${document.getElementById('sf_'+s+'_covers')?.value||'—'}`;
    else if (cat.val==='transfer') detail=`type: ${cxgGetVal('sf_'+s+'_type','sf_'+s+'_type_other')}`;
    else if (cat.val==='flight') detail=`type: ${cxgGetVal('sf_'+s+'_type','sf_'+s+'_type_other')}, pax: ${document.getElementById('sf_'+s+'_pax')?.value||'—'}`;
    return `• ${cat.label}${detail?' ('+detail+')':''}`;
  }).join('\n');
}
function cxgUpdateSummary() {
  const totalMin = cxgCats.reduce((s,c)=>s+(c.timeMin||0),0);
  const f = parseFloat(document.getElementById('cxg-suggested-fee')?.value)||0;
  const d = document.getElementById('cxg-days-span')?.value;
  const bar = document.getElementById('cxg-summary-bar');
  const hasData = totalMin>0||f>0||cxgCats.length>0||d;
  if (bar) bar.style.display = hasData ? 'flex' : 'none';
  const st = document.getElementById('cxg-sum-time');
  const sd = document.getElementById('cxg-sum-days');
  const sf = document.getElementById('cxg-sum-fee');
  const sc = document.getElementById('cxg-sum-cats');
  if (st) st.textContent = totalMin>0 ? cxgFmtMin(totalMin) : '—';
  if (sd) sd.textContent = d ? d+(parseInt(d)===1?' day':' days') : '—';
  if (sf) sf.textContent = f>0 ? '€'+f.toFixed(0) : '€—';
  if (sc) sc.textContent = cxgCats.length>0 ? cxgCats.length+' cat.' : '—';
}

// --- SYNC ---
function cxgSaveEndpoint() {
  const input = document.getElementById('cxg-sync-url-input');
  cxgSyncUrl = (input.value || '').trim();
  localStorage.setItem('cxg-sync-url', cxgSyncUrl);
  const status = document.getElementById('cxg-sync-config-status');
  if (status) { status.textContent = cxgSyncUrl ? '✓ Saved' : 'Cleared'; setTimeout(()=>{status.textContent='';}, 2000); }
  if (cxgSyncUrl) cxgRenderDashboard();
}
async function cxgFetchRemote() {
  try {
    const res = await fetch(cxgSyncUrl);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch(e) { return null; }
}

// --- SUBMIT ---
async function cxgSubmitReport() {
  const designer = document.getElementById('cxg-designer').value.trim();
  const ref = document.getElementById('cxg-booking-ref').value.trim();
  if (!designer||!ref) { alert('Please fill in your name and booking reference.'); return; }
  if (cxgCats.length===0) { alert('Please add at least one request category.'); return; }
  const report = {
    designer, bookingRef: ref,
    tripType: cxgGetVal('cxg-trip-type','cxg-trip-type-other'),
    destination: document.getElementById('cxg-destination').value,
    categoryList: cxgCats.map(c=>c.label),
    categoryTimes: cxgCats.map(c=>({label:c.label, timeMin:c.timeMin||0})),
    timeMinutes: cxgCats.reduce((s,c)=>s+(c.timeMin||0),0),
    categories: cxgGetSubfieldSummary(),
    channel: cxgGetVal('cxg-channel','cxg-channel-other'),
    description: document.getElementById('cxg-description').value,
    daysOpen: document.getElementById('cxg-days-span').value,
    suppliers: document.getElementById('cxg-suppliers').value,
    complexity: cxgGetVal('cxg-complexity','cxg-complexity-other'),
    outcome: cxgGetVal('cxg-outcome','cxg-outcome-other'),
    lastMinute: cxgGetVal('cxg-last-minute','cxg-last-minute-other'),
    perceivedValue: cxgGetVal('cxg-perceived-value','cxg-perceived-value-other'),
    suggestedFee: document.getElementById('cxg-suggested-fee').value,
    feeModel: cxgGetVal('cxg-fee-model','cxg-fee-model-other'),
    notes: document.getElementById('cxg-notes').value,
    submittedAt: new Date().toISOString()
  };
  cxgSave(report);
  cxgUpdateTabCount();
  document.getElementById('cxg-form-body').style.display = 'none';
  document.getElementById('cxg-success-banner').style.display = 'block';
  if (cxgSyncUrl) {
    const s = document.getElementById('cxg-sync-status');
    if (s) s.innerHTML = '<span style="color:var(--text2)">↑ Syncing to Google Sheets…</span>';
    try {
      await fetch(cxgSyncUrl, {method:'POST', headers:{'Content-Type':'text/plain'}, body:JSON.stringify(report)});
      if (s) s.innerHTML = '<span style="color:#3b6d11">✓ Synced to Google Sheets</span>';
    } catch(e) {
      if (s) s.innerHTML = '<span style="color:#c0392b">⚠ Saved locally — sync failed</span>';
    }
  }
}
function cxgResetForm() {
  cxgCats = [];
  document.querySelectorAll('#cxg-form-body input:not([type="file"]), #cxg-form-body textarea').forEach(el=>el.value='');
  document.querySelectorAll('#cxg-form-body select').forEach(el=>el.selectedIndex=0);
  cxgRenderPalette(); cxgRenderCatTimes(); cxgRenderSubfields(); cxgUpdateSummary();
  document.getElementById('cxg-success-banner').style.display = 'none';
  document.getElementById('cxg-form-body').style.display = 'block';
}

// --- EXPORT / IMPORT ---
function cxgExportData() {
  const reports = cxgLoad();
  if (!reports.length) { alert('No reports to export.'); return; }
  const blob = new Blob([JSON.stringify(reports, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cxg-reports-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
}
function cxgImportData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error();
      const existing = cxgLoad();
      const existingKeys = new Set(existing.map(r=>r.bookingRef+'|'+r.submittedAt));
      const newOnes = imported.filter(r=>!existingKeys.has(r.bookingRef+'|'+r.submittedAt));
      localStorage.setItem('cxg-reports', JSON.stringify([...existing,...newOnes]));
      cxgUpdateTabCount();
      alert(`✓ Imported ${newOnes.length} new report(s). ${imported.length-newOnes.length} duplicate(s) skipped.`);
      cxgRenderDashboard();
    } catch { alert('Invalid file. Make sure it is a valid .json export from this tool.'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// --- DASHBOARD ---
function cxgSetRate(val) {
  cxgHourlyRate = parseFloat(val)||80;
  cxgRenderDashboard();
}
function cxgToggleCat(key) {
  const d=document.getElementById('cxg-catd-'+key), a=document.getElementById('cxg-cata-'+key);
  if (!d) return;
  const open=d.style.display!=='none';
  d.style.display=open?'none':'table-row-group';
  if (a) a.textContent=open?'▼':'▲';
}
function cxgToggleCase(idx) {
  const d=document.getElementById('cxg-cased-'+idx), a=document.getElementById('cxg-casea-'+idx);
  if (!d) return;
  const open=d.style.display!=='none';
  d.style.display=open?'none':'table-row-group';
  if (a) a.textContent=open?'▼':'▲';
}

async function cxgRenderDashboard() {
  const el = document.getElementById('cxg-dashboard');
  if (!el) return;
  let reports, syncError = false;
  if (cxgSyncUrl) {
    el.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text2);font-size:12px;">↓ Loading from Google Sheets…</div>';
    const remote = await cxgFetchRemote();
    if (remote !== null) { reports = remote; }
    else { reports = cxgLoad(); syncError = true; }
  } else {
    reports = cxgLoad();
  }
  if (!reports || reports.length===0) {
    el.innerHTML='<div style="text-align:center;padding:56px 0;color:var(--text2);font-size:13px;">No reports yet — submit your first case.</div>';
    return;
  }
  const syncWarn = syncError ? '<div style="color:#c0392b;font-size:11px;padding:6px 0 10px;">⚠ Could not reach Google Sheets — showing local data.</div>' : '';

  const total = reports.length;
  const feesAll = reports.map(r=>parseFloat(r.suggestedFee)||0);
  const feesPos = feesAll.filter(f=>f>0);
  const avgFee = feesPos.length ? feesPos.reduce((a,b)=>a+b,0)/feesPos.length : 0;
  const totalFee = feesPos.reduce((a,b)=>a+b,0);
  const totalTime = reports.reduce((s,r)=>s+(r.timeMinutes||0),0);
  const timesPos = reports.map(r=>r.timeMinutes||0).filter(t=>t>0);
  const avgTime = timesPos.length ? totalTime/timesPos.length : 0;
  const estTotalCost = totalTime/60*cxgHourlyRate;
  const revenueGap = totalFee - estTotalCost;

  // Per-category stats using categoryTimes (accurate per-cat time)
  const catMap = {};
  reports.forEach(r=>{
    (r.categoryTimes||r.categoryList?.map(l=>({label:l,timeMin:0}))||[]).forEach(ct=>{
      if (!catMap[ct.label]) catMap[ct.label]={label:ct.label,times:[],fees:[],cases:[]};
      catMap[ct.label].times.push(ct.timeMin||0);
      catMap[ct.label].fees.push(parseFloat(r.suggestedFee)||0);
      catMap[ct.label].cases.push(r);
    });
  });
  const catList = Object.values(catMap).sort((a,b)=>b.times.reduce((s,t)=>s+t,0)-a.times.reduce((s,t)=>s+t,0));

  // Complexity
  const cx={simple:0,medium:0,complex:0}, cxTime={simple:0,medium:0,complex:0};
  reports.forEach(r=>{
    const c=(r.complexity||'').toLowerCase();
    const t=r.timeMinutes||0;
    if(c.startsWith('simple')){cx.simple++;cxTime.simple+=t;}
    else if(c.startsWith('medium')){cx.medium++;cxTime.medium+=t;}
    else if(c.startsWith('complex')){cx.complex++;cxTime.complex+=t;}
  });

  // Last-minute
  const lm=reports.filter(r=>(r.lastMinute||'').startsWith('Yes'));
  const lmTime=lm.reduce((s,r)=>s+(r.timeMinutes||0),0);

  // --- KPIs ---
  const metricsHtml=`<div class="cxg-metrics-row">
    <div class="cxg-metric"><div class="cxg-metric-val">${total}</div><div class="cxg-metric-lbl">Cases</div></div>
    <div class="cxg-metric"><div class="cxg-metric-val">${cxgFmtMin(totalTime)}</div><div class="cxg-metric-lbl">Total time</div></div>
    <div class="cxg-metric"><div class="cxg-metric-val">${cxgFmtMin(Math.round(avgTime))}</div><div class="cxg-metric-lbl">Avg / case</div></div>
    <div class="cxg-metric"><div class="cxg-metric-val">${avgFee>0?cxgFmtEur(avgFee):'—'}</div><div class="cxg-metric-lbl">Avg fee suggested</div></div>
    <div class="cxg-metric"><div class="cxg-metric-val">${cxgFmtEur(estTotalCost)}</div><div class="cxg-metric-lbl">Est. time cost</div></div>
    <div class="cxg-metric ${revenueGap>=0?'cxg-metric-pos':'cxg-metric-neg'}">
      <div class="cxg-metric-val">${revenueGap>=0?'+':''}${cxgFmtEur(revenueGap)}</div>
      <div class="cxg-metric-lbl">Revenue gap</div>
    </div>
  </div>`;

  // --- RATE BAR ---
  const rateHtml=`<div class="cxg-rate-bar">
    <span class="cxg-rate-lbl">Hourly cost</span>
    <div class="cxg-rate-input-wrap"><span>€</span><input type="number" value="${cxgHourlyRate}" min="1" oninput="cxgSetRate(this.value)"/></div>
    <span class="cxg-rate-hint">/hr — re-calculates all estimates below</span>
  </div>`;

  // --- CATEGORY TABLE ---
  const catRows=catList.map(cat=>{
    const catTotal=cat.cases.length;
    const catTotalTime=cat.times.reduce((a,b)=>a+b,0);
    const catAvgTime=cat.times.length?catTotalTime/cat.times.length:0;
    const catFeesPos=cat.fees.filter(f=>f>0);
    const catAvgFee=catFeesPos.length?catFeesPos.reduce((a,b)=>a+b,0)/catFeesPos.length:0;
    const estCost=catAvgTime/60*cxgHourlyRate;
    const gap=catAvgFee>0?catAvgFee-estCost:null;
    const commissioned=CXG_COMMISSIONED.has(cat.label);
    const key=cat.label.replace(/[^a-z0-9]/gi,'_');

    const gapCell=gap!==null
      ?`<span class="${gap>=0?'cxg-gap-pos':'cxg-gap-neg'}">${gap>=0?'+':''}${cxgFmtEur(gap)}</span>`
      :`<span class="cxg-gap-none">no fee set (cost: ${estCost>0?cxgFmtEur(estCost):'—'})</span>`;

    const commBadge=commissioned
      ?`<span class="cxg-badge cxg-badge-comm">commissioned</span>`
      :`<span class="cxg-badge cxg-badge-nc">no commission</span>`;

    const subRows=cat.cases.map((r,i)=>{
      const catEntry=(r.categoryTimes||[]).find(ct=>ct.label===cat.label);
      const caseTime=catEntry?catEntry.timeMin:0;
      return `<tr class="cxg-sub-tr">
        <td>${esc(r.bookingRef)}</td>
        <td>${esc(r.designer)}</td>
        <td>${esc(r.destination)||'—'}</td>
        <td class="cxg-num">${caseTime?cxgFmtMin(caseTime):'—'}</td>
        <td class="cxg-num">${r.suggestedFee?'€'+r.suggestedFee:'—'}</td>
        <td style="font-size:11px;color:var(--text2);">${esc((r.complexity||'—').split('—')[0].trim())}</td>
        <td style="font-size:11px;color:var(--text2);">${(r.lastMinute||'').startsWith('Yes')?'⚡':''}</td>
      </tr>`;
    }).join('');

    return `<tbody>
      <tr class="cxg-cat-row" onclick="cxgToggleCat('${key}')">
        <td><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">${esc(cat.label)}${commBadge}</div></td>
        <td class="cxg-num">${catTotal}</td>
        <td class="cxg-num">${catTotalTime?cxgFmtMin(catTotalTime):'—'}</td>
        <td class="cxg-num">${catAvgTime?cxgFmtMin(Math.round(catAvgTime)):'—'}</td>
        <td class="cxg-num">${catAvgFee>0?cxgFmtEur(catAvgFee):'—'}</td>
        <td class="cxg-num">${estCost>0?cxgFmtEur(estCost):'—'}</td>
        <td class="cxg-num">${gapCell}</td>
        <td class="cxg-num" id="cxg-cata-${key}" style="color:var(--text2);font-size:11px;">▼</td>
      </tr>
    </tbody>
    <tbody id="cxg-catd-${key}" style="display:none;">
      <tr><td colspan="8" style="padding:0;">
        <table class="cxg-sub-table">
          <thead><tr><th>Ref</th><th>Designer</th><th>Destination</th><th class="cxg-num">Time on this</th><th class="cxg-num">Fee</th><th>Complexity</th><th></th></tr></thead>
          ${subRows}
        </table>
      </td></tr>
    </tbody>`;
  }).join('');

  const catTableHtml=`<div class="panel" style="margin-bottom:10px;">
    <div class="ptitle">Time & fee by category <span style="font-size:11px;font-weight:400;color:var(--text2);margin-left:6px;">— time = actual time logged per category · click to expand cases</span></div>
    <div style="overflow-x:auto;">
      <table class="cxg-cat-table">
        <thead><tr>
          <th>Category</th>
          <th class="cxg-num">Cases</th>
          <th class="cxg-num">Total time</th>
          <th class="cxg-num">Avg time</th>
          <th class="cxg-num">Avg fee</th>
          <th class="cxg-num">Est. cost<br><span style="font-size:9px;font-weight:400;">@€${cxgHourlyRate}/hr</span></th>
          <th class="cxg-num">Gap</th>
          <th></th>
        </tr></thead>
        ${catRows}
      </table>
    </div>
  </div>`;

  // --- COMPLEXITY + LAST-MINUTE ---
  const cxMax=Math.max(cxTime.simple,cxTime.medium,cxTime.complex,1);
  const twoColHtml=`<div class="cxg-grid-2" style="margin-bottom:10px;">
    <div class="panel">
      <div class="ptitle">Complexity breakdown</div>
      ${[['Simple',cx.simple,cxTime.simple,'#3b6d11'],['Medium',cx.medium,cxTime.medium,'#856404'],['Complex',cx.complex,cxTime.complex,'#c0392b']].map(([lbl,n,t,color])=>`
        <div class="cxg-bar-row" style="margin-bottom:10px;">
          <span class="cxg-bar-label" style="min-width:72px;">${lbl}</span>
          <div class="cxg-bar-track" style="flex:1;"><div class="cxg-bar-fill" style="width:${Math.round(t/cxMax*100)}%;background:${color};"></div></div>
          <span style="font-size:12px;color:var(--text2);min-width:90px;text-align:right;">${n} case${n!==1?'s':''} · ${cxgFmtMin(t)||'0min'}</span>
        </div>`).join('')}
      <div style="font-size:11px;color:var(--text2);margin-top:2px;">Bar = total time per complexity level</div>
    </div>
    <div class="panel">
      <div class="ptitle">Last-minute requests</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">
        <span style="font-size:28px;font-weight:700;color:${lm.length/total>0.4?'#c0392b':'var(--black)'};">${lm.length}</span>
        <span style="font-size:13px;color:var(--text2);">/ ${total} cases (${total?Math.round(lm.length/total*100):0}%)</span>
      </div>
      <div class="cxg-bar-row">
        <div class="cxg-bar-track" style="flex:1;"><div class="cxg-bar-fill" style="width:${total?Math.round(lm.length/total*100):0}%;background:#e74c3c;"></div></div>
      </div>
      ${lm.length>0?`<div style="font-size:12px;color:var(--text2);margin-top:10px;">Avg time on last-minute cases: <strong>${cxgFmtMin(Math.round(lmTime/lm.length))}</strong></div>`:''}
      ${lm.length>0&&avgTime>0&&lmTime/lm.length>avgTime?`<div style="font-size:11px;color:#c0392b;margin-top:4px;">⚡ +${cxgFmtMin(Math.round(lmTime/lm.length-avgTime))} vs average case</div>`:''}
    </div>
  </div>`;

  // --- CASES TABLE ---
  const caseRows=reports.map((r,idx)=>{
    const isLm=(r.lastMinute||'').startsWith('Yes');
    const cx2=(r.complexity||'—').split('—')[0].trim()||'—';
    return `<tbody>
      <tr class="cxg-cat-row" onclick="cxgToggleCase(${idx})">
        <td><strong>${esc(r.bookingRef)}</strong>${isLm?'<span class="cxg-badge" style="background:#fef3cd;color:#856404;margin-left:6px;">⚡ urgent</span>':''}</td>
        <td>${esc(r.designer)}</td>
        <td>${esc(r.destination)||'—'}</td>
        <td style="font-size:11px;">${(r.categoryList||[]).map(c=>esc(c)).join(', ')||'—'}</td>
        <td class="cxg-num">${r.timeMinutes?cxgFmtMin(r.timeMinutes):'—'}</td>
        <td class="cxg-num">${r.suggestedFee?'<strong>€'+r.suggestedFee+'</strong>':'—'}</td>
        <td class="cxg-num" id="cxg-casea-${idx}" style="color:var(--text2);font-size:11px;">▼</td>
      </tr>
    </tbody>
    <tbody id="cxg-cased-${idx}" style="display:none;"><tr><td colspan="7" style="padding:0;">
      <div class="cxg-case-detail">
        <div class="cxg-case-detail-grid">
          <div><span class="cxg-dl">Trip type</span>${esc(r.tripType||'—')}</div>
          <div><span class="cxg-dl">Channel</span>${esc(r.channel||'—')}</div>
          <div><span class="cxg-dl">Complexity</span>${esc(cx2)}</div>
          <div><span class="cxg-dl">Outcome</span>${esc(r.outcome||'—')}</div>
          <div><span class="cxg-dl">Perceived value</span>${esc(r.perceivedValue||'—')}</div>
          <div><span class="cxg-dl">Suppliers</span>${r.suppliers||'—'}</div>
          <div><span class="cxg-dl">Days open</span>${r.daysOpen||'—'}</div>
          <div><span class="cxg-dl">Fee model</span>${esc(r.feeModel||'—')}</div>
          <div><span class="cxg-dl">Submitted</span>${new Date(r.submittedAt).toLocaleDateString('en-GB')}</div>
        </div>
        ${(r.categoryTimes||[]).some(ct=>ct.timeMin>0)?`<div style="margin-top:8px;"><span class="cxg-dl">Time per category</span><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">${(r.categoryTimes||[]).map(ct=>`<span style="font-size:12px;"><strong>${cxgFmtMin(ct.timeMin)}</strong> — ${esc(ct.label)}</span>`).join('')}</div></div>`:''}
        ${r.description?`<div style="margin-top:8px;"><span class="cxg-dl">Description</span><p style="font-size:12px;margin-top:2px;color:var(--text);">${esc(r.description)}</p></div>`:''}
        ${r.notes?`<div style="margin-top:6px;"><span class="cxg-dl">Notes</span><p style="font-size:12px;margin-top:2px;color:var(--text);">${esc(r.notes)}</p></div>`:''}
      </div>
    </td></tr></tbody>`;
  }).join('');

  const casesHtml=`<div class="panel" style="margin-bottom:10px;">
    <div class="ptitle">All cases</div>
    <div style="overflow-x:auto;"><table class="cxg-cat-table">
      <thead><tr><th>Ref</th><th>Designer</th><th>Destination</th><th>Categories</th><th class="cxg-num">Total time</th><th class="cxg-num">Fee</th><th></th></tr></thead>
      ${caseRows}
    </table></div>
  </div>`;

  const actionsHtml=`<div style="display:flex;gap:8px;margin-bottom:20px;">
    <button class="gen-btn" onclick="cxgExportPDF()">Export PDF</button>
    ${cxgSyncUrl?`<button class="add-room" onclick="cxgRenderDashboard()">↻ Refresh</button>`:''}
    <button class="add-room" style="color:#c0392b;border-color:#c0392b;" onclick="cxgClearAll()">Clear local data</button>
  </div>`;

  el.innerHTML = syncWarn + rateHtml + metricsHtml + catTableHtml + twoColHtml + casesHtml + actionsHtml;
}

function cxgClearAll() {
  if (confirm('Delete all submitted reports? This cannot be undone.')) {
    localStorage.removeItem('cxg-reports');
    cxgUpdateTabCount();
    cxgRenderDashboard();
  }
}

// --- PDF EXPORT ---
function cxgExportPDF() {
  const {jsPDF}=window.jspdf;
  const reports=cxgLoad();
  if (!reports.length) return;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,M=20; let y=20;

  const total=reports.length;
  const feesPos=reports.map(r=>parseFloat(r.suggestedFee)||0).filter(f=>f>0);
  const avgFee=feesPos.length?feesPos.reduce((a,b)=>a+b,0)/feesPos.length:0;
  const totalFee=feesPos.reduce((a,b)=>a+b,0);
  const totalTime=reports.reduce((s,r)=>s+(r.timeMinutes||0),0);
  const timesPos=reports.map(r=>r.timeMinutes||0).filter(t=>t>0);
  const avgTime=timesPos.length?totalTime/timesPos.length:0;
  const estCost=totalTime/60*cxgHourlyRate;
  const gap=totalFee-estCost;

  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(14,14,14);
  doc.text('gloobles',M,y);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(120,120,120);
  doc.text('Concierge Fee Analysis',W-M,y-3,{align:'right'});
  doc.text(new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),W-M,y+3,{align:'right'});
  y+=8;doc.setDrawColor(220,220,220);doc.line(M,y,W-M,y);y+=8;

  const bw=(W-M*2-15)/6;
  [{v:String(total),l:'Cases'},{v:cxgFmtMin(totalTime),l:'Total time'},{v:cxgFmtMin(Math.round(avgTime)),l:'Avg/case'},{v:avgFee>0?'€'+Math.round(avgFee):'—',l:'Avg fee'},{v:'€'+Math.round(estCost),l:'Est. cost'},{v:(gap>=0?'+':'')+'€'+Math.round(Math.abs(gap)),l:'Gap',color:gap>=0?[40,167,69]:[192,57,43]}].forEach((k,i)=>{
    const x=M+i*(bw+3);
    doc.setFillColor(247,247,245);doc.setDrawColor(220,220,220);doc.roundedRect(x,y,bw,16,1.5,1.5,'FD');
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...(k.color||[14,14,14]));
    doc.text(k.v,x+bw/2,y+7,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(120,120,120);
    doc.text(k.l,x+bw/2,y+12,{align:'center'});
  });
  y+=22;

  const catMap={};
  reports.forEach(r=>(r.categoryTimes||r.categoryList?.map(l=>({label:l,timeMin:0}))||[]).forEach(ct=>{
    if(!catMap[ct.label])catMap[ct.label]={times:[],fees:[]};
    catMap[ct.label].times.push(ct.timeMin||0);
    catMap[ct.label].fees.push(parseFloat(r.suggestedFee)||0);
  }));
  const catList=Object.entries(catMap).sort((a,b)=>b[1].times.reduce((s,t)=>s+t,0)-a[1].times.reduce((s,t)=>s+t,0));

  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(80,80,80);doc.text('TIME & FEE BY CATEGORY',M,y);y+=4;
  doc.setDrawColor(220,220,220);doc.line(M,y,W-M,y);y+=4;
  const ch=['Category','Cases','Avg time','Avg fee','Est. cost','Gap','Comm.'];
  const cw=[52,14,18,16,18,16,12];
  let x=M;
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(120,120,120);
  ch.forEach((c,i)=>{doc.text(c,x+(i>0?cw[i]:0),y,i>0?{align:'right'}:{});x+=cw[i];});
  y+=3;doc.line(M,y,W-M,y);y+=4;
  doc.setFont('helvetica','normal');doc.setFontSize(8);
  catList.forEach(([label,data])=>{
    if(y>265){doc.addPage();y=20;}
    const ct=data.times.length;
    const catAvgTime=ct?data.times.reduce((a,b)=>a+b,0)/ct:0;
    const fp=data.fees.filter(f=>f>0);
    const catAvgFee=fp.length?fp.reduce((a,b)=>a+b,0)/fp.length:0;
    const ec=catAvgTime/60*cxgHourlyRate;
    const gp=catAvgFee>0?catAvgFee-ec:null;
    const comm=CXG_COMMISSIONED.has(label);
    x=M;
    const vals=[label,String(ct),catAvgTime?cxgFmtMin(Math.round(catAvgTime)):'—',catAvgFee>0?'€'+Math.round(catAvgFee):'—',ec>0?'€'+Math.round(ec):'—',gp!==null?(gp>=0?'+':'')+'€'+Math.round(Math.abs(gp)):'-',comm?'✓':'✗'];
    vals.forEach((v,i)=>{
      if(i===5&&gp!==null)doc.setTextColor(gp>=0?40:192,gp>=0?167:57,gp>=0?69:43);
      else if(i===6)doc.setTextColor(comm?40:160,comm?167:160,comm?69:160);
      else doc.setTextColor(14,14,14);
      doc.text(doc.splitTextToSize(v,cw[i]-2)[0],x+(i>0?cw[i]:0),y,i>0?{align:'right'}:{});x+=cw[i];
    });
    doc.setDrawColor(240,240,240);doc.line(M,y+2,W-M,y+2);y+=7;
  });
  y+=4;

  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(80,80,80);doc.text('ALL CASES',M,y);y+=4;
  doc.setDrawColor(220,220,220);doc.line(M,y,W-M,y);y+=4;
  const ch2=['Ref','Designer','Destination','Categories','Total time','Fee'];
  const cw2=[20,20,22,68,18,18];
  x=M;
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(120,120,120);
  ch2.forEach((c,i)=>{doc.text(c,x,y);x+=cw2[i];});
  y+=3;doc.line(M,y,W-M,y);y+=4;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(14,14,14);
  reports.forEach(r=>{
    if(y>272){doc.addPage();y=20;}
    x=M;
    const v=[r.bookingRef,r.designer,r.destination||'—',(r.categoryList||[]).join(', ')||'—',r.timeMinutes?cxgFmtMin(r.timeMinutes):'—',r.suggestedFee?'€'+r.suggestedFee:'—'];
    v.forEach((val,i)=>{doc.text(doc.splitTextToSize(String(val),cw2[i]-2)[0],x,y);x+=cw2[i];});
    doc.setDrawColor(240,240,240);doc.line(M,y+2,W-M,y+2);y+=7;
  });

  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(180,180,180);
  doc.text('gloobles b.v. — Concierge Fee Analysis — confidential',W/2,285,{align:'center'});
  doc.save('gloobles-concierge-analysis.pdf');
}

cxgRenderPalette();
cxgUpdateTabCount();
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('cxg-sync-url-input');
  if (inp && cxgSyncUrl) inp.value = cxgSyncUrl;
});
