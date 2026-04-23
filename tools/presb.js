/* === PRESENTATION BUILDER === */

// ===== PRESENTATION BUILDER =====
let pbInited=false,pbPages=[],pbSelected=0,pbIdCtr=0,pbCropper=null,pbCropTarget=null;
const PB_TEAM=[
  {name:'Lea Duyck',role:'Travel Designer',phone:'+33 6 43 82 67 52',email:'lea@gloobles.com',ini:'LD'},
  {name:'Arthur Navereau',role:'Director of Sales',phone:'+33 7 82 85 57 87',email:'arthur@gloobles.com',ini:'AN'},
  {name:'Stephanie van Rappard',role:'Co-Founder & Chief Strategy Officer',phone:'+31 6 11 85 12 85',email:'stephanie@gloobles.com',ini:'SR'},
  {name:'Anthony Renaud',role:'Co-Founder & CEO',phone:'+33 6 32 68 18 89',email:'anthony@gloobles.com',ini:'AR'},
];
function pbInit(){
  pbPages=[];pbIdCtr=0;pbSelected=0;
  pbAddPage('cover',true);
  pbRenderAll();
  window.removeEventListener('resize',pbOnResize);
  window.addEventListener('resize',pbOnResize);
}
function pbOnResize(){if(currentView==='presb')pbRenderPreview();}
function pbNewPage(type){
  const yr=new Date().getFullYear().toString();
  const base={id:pbIdCtr++,type,photos:[null,null,null,null]};
  if(type==='cover')return{...base,client:'',year:yr};
  if(type==='brief')return{...base,title:'THE BRIEF',body:''};
  if(type==='destination')return{...base,title:'',location:'',airport:'',status:'available',price:'',dates:'',rooms:'',note:'',year:yr};
  return{...base};
}
function pbAddPage(type,silent){
  const p=pbNewPage(type);pbPages.push(p);
  if(!silent){pbSelected=pbPages.length-1;pbRenderAll();}
  document.getElementById('pb-add-menu')?.classList.remove('open');
}
function pbDeletePage(idx){
  if(pbPages.length<=1)return;
  pbPages.splice(idx,1);
  if(pbSelected>=pbPages.length)pbSelected=pbPages.length-1;
  pbRenderAll();
}
function pbMovePage(idx,dir){
  const n=idx+dir;if(n<0||n>=pbPages.length)return;
  [pbPages[idx],pbPages[n]]=[pbPages[n],pbPages[idx]];
  pbSelected=n;pbRenderAll();
}
function pbSelectPage(idx){pbSelected=idx;pbRenderAll();}
function pbNav(dir){const n=pbSelected+dir;if(n>=0&&n<pbPages.length)pbSelectPage(n);}
function pbToggleAdd(){document.getElementById('pb-add-menu')?.classList.toggle('open');}
function pbUpdate(field,value){
  const p=pbPages[pbSelected];if(!p)return;
  p[field]=value;pbRenderPreview();pbRenderList();
}
function pbRenderAll(){pbRenderList();pbRenderPreview();pbRenderEditForm();}
function pbEsc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function pbAttr(s){return(s||'').replace(/"/g,'&quot;');}
function pbNl(s){return pbEsc(s||'').replace(/\n\n/g,'</p><p style="margin-top:10px;">').replace(/\n/g,'<br>');}

function pbRenderList(){
  const el=document.getElementById('pb-page-list');if(!el)return;
  const TYPE={cover:'Cover',brief:'Brief',destination:'Destination',team:'Team'};
  el.innerHTML=pbPages.map((p,i)=>`
    <div class="pb-pi${i===pbSelected?' pb-pi-sel':''}" onclick="pbSelectPage(${i})">
      <div class="pb-pi-thumb pb-t-${p.type}">${pbThumb(p)}</div>
      <div class="pb-pi-info">
        <div class="pb-pi-type">${TYPE[p.type]||p.type}</div>
        <div class="pb-pi-label">${pbLabel(p)}</div>
      </div>
      <div class="pb-pi-btns">
        <button onclick="event.stopPropagation();pbMovePage(${i},-1)" title="Up">↑</button>
        <button onclick="event.stopPropagation();pbMovePage(${i},1)" title="Down">↓</button>
        <button onclick="event.stopPropagation();pbDeletePage(${i})" title="Delete">×</button>
      </div>
    </div>`).join('');
}
function pbThumb(p){
  if(p.type==='cover')return'<span style="font-family:GTSuper,serif;font-size:7px;color:#0e0e0e;font-weight:500;">gloobles</span>';
  if(p.type==='brief')return'<span style="font-size:6px;color:rgba(255,255,255,.8);letter-spacing:.06em;">BRIEF</span>';
  if(p.type==='destination')return(p.photos&&p.photos[0])?`<img src="${p.photos[0]}" style="width:100%;height:100%;object-fit:cover;display:block;">`:'<span style="font-size:7px;color:#aaa;">dest.</span>';
  if(p.type==='team')return'<span style="font-size:7px;color:#888;">team</span>';
  return'';
}
function pbLabel(p){
  if(p.type==='cover')return p.client||'(no client)';
  if(p.type==='brief')return p.title||'THE BRIEF';
  if(p.type==='destination')return p.title||'(untitled)';
  return'your travel team';
}

function pbRenderPreview(){
  const container=document.getElementById('pb-preview-slide');
  const scaleWrap=document.getElementById('pb-preview-scale');
  const clip=document.getElementById('pb-preview-clip');
  const outer=document.getElementById('pb-preview-outer');
  if(!container||!scaleWrap||!clip||!outer)return;
  const page=pbPages[pbSelected];
  if(!page){container.innerHTML='';return;}
  container.innerHTML='';container.appendChild(pbBuildSlide(page));
  const ow=outer.clientWidth-32,oh=outer.clientHeight-32;
  const s=Math.min(ow>10?ow/1440:0.42,oh>10?oh/810:0.42,0.58);
  clip.style.cssText='width:'+Math.round(1440*s)+'px;height:'+Math.round(810*s)+'px;overflow:hidden;flex-shrink:0;';
  scaleWrap.style.cssText='transform:scale('+s+');transform-origin:top left;width:1440px;height:810px;';
  const ct=document.getElementById('pb-page-num');
  if(ct)ct.textContent=(pbSelected+1)+' / '+pbPages.length;
}

function pbBuildSlide(page){
  const d=document.createElement('div');
  d.style.cssText='width:1440px;height:810px;position:relative;overflow:hidden;flex-shrink:0;box-sizing:border-box;';
  if(page.type==='cover')d.innerHTML=pbCoverHtml(page);
  else if(page.type==='brief')d.innerHTML=pbBriefHtml(page);
  else if(page.type==='destination')d.innerHTML=pbDestHtml(page);
  else if(page.type==='team')d.innerHTML=pbTeamHtml(page);
  return d;
}

function pbCoverHtml(p){
  return`<div style="width:100%;height:100%;background:#fff;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="height:0.5px;background:#d0cec9;flex-shrink:0;"></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;">
      <div style="font-family:GTSuper,serif;font-size:58px;font-weight:500;color:#0e0e0e;letter-spacing:0;line-height:1;">gloobles</div>
      ${p.client?`<div style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:14px;color:#0e0e0e;letter-spacing:.03em;">prepared for ${pbEsc(p.client)}</div>`:''}
    </div>
    <div style="height:0.5px;background:#d0cec9;flex-shrink:0;"></div>
  </div>`;
}

function pbBriefHtml(p){
  return`<div style="width:100%;height:100%;background:#12173d;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="height:0.5px;background:rgba(255,255,255,.16);flex-shrink:0;"></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:60px 200px;text-align:center;">
      <div style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:12px;color:#ffffff;letter-spacing:.2em;text-transform:uppercase;">${pbEsc(p.title||'THE BRIEF')}</div>
      <div style="font-family:GTAmerica,'DM Mono',monospace;font-size:19px;color:rgba(255,255,255,.84);line-height:1.72;font-style:italic;">${pbNl(p.body||'')}</div>
    </div>
    <div style="height:0.5px;background:rgba(255,255,255,.16);flex-shrink:0;"></div>
  </div>`;
}

function pbMetaCell(label,val,last){
  return`<div style="flex:1;padding:9px 12px 9px 0;${last?'':'border-right:0.5px solid #e0ddd8;padding-right:12px;'}">
    <div style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:8px;color:#888580;letter-spacing:.05em;margin-bottom:4px;">${label}</div>
    <div style="font-family:GTAmerica,'DM Mono',monospace;font-size:11px;color:#0e0e0e;line-height:1.4;">${pbEsc(val||'')}</div>
  </div>`;
}

function pbDestHtml(p){
  const photos=(p.photos||[null,null,null,null]);
  const photosHtml=photos.map((url,i)=>`
    <div style="overflow:hidden;background:#e8e6e2;display:flex;align-items:center;justify-content:center;min-height:0;">
      ${url?`<img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;">`
            :`<div style="font-size:10px;color:#bbb;font-family:'DM Mono',monospace;">photo ${i+1}</div>`}
    </div>`).join('');
  return`<div style="width:100%;height:100%;background:#fff;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 48px;border-bottom:0.5px solid #e0ddd8;flex-shrink:0;">
      <span style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:11px;color:#0e0e0e;letter-spacing:.03em;">gloobles</span>
      <span style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:11px;color:#0e0e0e;letter-spacing:.03em;">${pbEsc(p.year||new Date().getFullYear())}</span>
    </div>
    <div style="flex:1;display:flex;min-height:0;">
      <div style="width:43%;padding:38px 44px;display:flex;flex-direction:column;overflow:hidden;">
        <div style="font-family:GTSuper,serif;font-size:42px;font-weight:500;color:#0e0e0e;line-height:1.15;margin-bottom:20px;">${pbEsc(p.title||'')}</div>
        <div style="border-top:0.5px solid #e0ddd8;margin-bottom:20px;">
          <div style="display:flex;border-bottom:0.5px solid #e0ddd8;">
            ${pbMetaCell('location',p.location)}${pbMetaCell('nearest airport',p.airport)}${pbMetaCell('trip status',p.status,'last')}
          </div>
          <div style="display:flex;border-bottom:0.5px solid #e0ddd8;">
            ${pbMetaCell('price',p.price)}${pbMetaCell('dates',p.dates)}${pbMetaCell('number of rooms',p.rooms,'last')}
          </div>
        </div>
        <div style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:8.5px;color:#888580;letter-spacing:.06em;margin-bottom:9px;">Editor's note</div>
        <div style="font-family:GTAmerica,'DM Mono',monospace;font-size:11.5px;color:#0e0e0e;line-height:1.72;overflow:hidden;flex:1;"><p style="margin:0;">${pbNl(p.note||'')}</p></div>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3px;min-width:0;">
        ${photosHtml}
      </div>
    </div>
    <div style="height:36px;border-top:0.5px solid #e0ddd8;flex-shrink:0;"></div>
  </div>`;
}

function pbTeamHtml(){
  const members=PB_TEAM.map(m=>`
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;width:176px;">
      <div style="width:92px;height:92px;border-radius:50%;border:0.5px solid #ccc;background:#e8e6e2;display:flex;align-items:center;justify-content:center;font-family:GTSuper,serif;font-size:26px;color:#888;flex-shrink:0;">${m.ini}</div>
      <div style="font-family:GTSuper,serif;font-size:14px;color:#0e0e0e;">${pbEsc(m.name)}</div>
      <div style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:9px;color:#888580;margin-top:-5px;line-height:1.55;">${pbEsc(m.role)}</div>
      <div style="font-family:GTAmericaMono,'DM Mono',monospace;font-size:9.5px;color:#0e0e0e;line-height:1.9;">${pbEsc(m.phone)}<br>${pbEsc(m.email)}</div>
    </div>`).join('');
  return`<div style="width:100%;height:100%;background:#f5f4f0;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="height:0.5px;background:#e0ddd8;flex-shrink:0;"></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;padding:48px;">
      <div style="font-family:GTSuper,serif;font-size:42px;font-weight:500;color:#0e0e0e;line-height:1;">your travel team</div>
      <div style="display:flex;gap:100px;font-family:GTAmericaMono,'DM Mono',monospace;font-size:12px;color:#0e0e0e;margin-top:-16px;">
        <span>gloobles.com</span><span>@gloobles</span>
      </div>
      <div style="display:flex;gap:52px;align-items:flex-start;justify-content:center;">${members}</div>
    </div>
    <div style="height:0.5px;background:#e0ddd8;flex-shrink:0;"></div>
  </div>`;
}

function pbRenderEditForm(){
  const form=document.getElementById('pb-edit-form');if(!form)return;
  const p=pbPages[pbSelected];if(!p){form.innerHTML='';return;}
  const yr=p.year||new Date().getFullYear();
  if(p.type==='cover'){
    form.innerHTML=`<div class="pb-field"><label>CLIENT NAME</label>
      <input type="text" value="${pbAttr(p.client||'')}" placeholder="Dymfy & Adriaan" oninput="pbUpdate('client',this.value)"/>
    </div>`;
  } else if(p.type==='brief'){
    form.innerHTML=`
      <div class="pb-field"><label>TITLE</label>
        <input type="text" value="${pbAttr(p.title||'THE BRIEF')}" placeholder="THE BRIEF" oninput="pbUpdate('title',this.value)"/>
      </div>
      <div class="pb-field"><label>DESCRIPTION</label>
        <textarea style="min-height:130px;" placeholder="Describe the brief in a few compelling sentences..." oninput="pbUpdate('body',this.value)">${pbEsc(p.body||'')}</textarea>
      </div>`;
  } else if(p.type==='destination'){
    const statusOpts=['available','pending availability','on request','booked'].map(s=>`<option value="${s}"${p.status===s?' selected':''}>${s}</option>`).join('');
    const photoSlots=[0,1,2,3].map(i=>`
      <div class="pb-ps" onclick="pbOpenPhoto(${p.id},${i})">
        ${p.photos[i]
          ?`<img src="${p.photos[i]}"/><button class="pb-ps-clear" onclick="event.stopPropagation();pbClearPhoto(${p.id},${i})">×</button>`
          :`<div class="pb-ps-ph">+ ${i+1}</div>`}
      </div>`).join('');
    form.innerHTML=`
      <div class="pb-field"><label>TITLE</label>
        <input type="text" value="${pbAttr(p.title||'')}" placeholder="Private Nile cruise – Luxor to Aswan" oninput="pbUpdate('title',this.value)"/>
      </div>
      <div class="pb-field"><label>LOCATION</label>
        <input type="text" value="${pbAttr(p.location||'')}" placeholder="Luxor, Egypt" oninput="pbUpdate('location',this.value)"/>
      </div>
      <div class="pb-field"><label>NEAREST AIRPORT</label>
        <input type="text" value="${pbAttr(p.airport||'')}" placeholder="Luxor International (LXR)" oninput="pbUpdate('airport',this.value)"/>
      </div>
      <div class="pb-field"><label>TRIP STATUS</label>
        <select onchange="pbUpdate('status',this.value)">${statusOpts}</select>
      </div>
      <div class="pb-2col">
        <div class="pb-field"><label>PRICE</label>
          <input type="text" value="${pbAttr(p.price||'')}" placeholder="€90,000 for 5 nights" oninput="pbUpdate('price',this.value)"/>
        </div>
        <div class="pb-field"><label>DATES</label>
          <input type="text" value="${pbAttr(p.dates||'')}" placeholder="Mid March" oninput="pbUpdate('dates',this.value)"/>
        </div>
      </div>
      <div class="pb-2col">
        <div class="pb-field"><label>ROOMS / GUESTS</label>
          <input type="text" value="${pbAttr(p.rooms||'')}" placeholder="12" oninput="pbUpdate('rooms',this.value)"/>
        </div>
        <div class="pb-field"><label>YEAR</label>
          <input type="text" value="${pbAttr(yr)}" placeholder="${new Date().getFullYear()}" oninput="pbUpdate('year',this.value)"/>
        </div>
      </div>
      <div class="pb-field"><label>EDITOR'S NOTE</label>
        <textarea style="min-height:100px;" placeholder="Describe this destination or experience..." oninput="pbUpdate('note',this.value)">${pbEsc(p.note||'')}</textarea>
      </div>
      <div class="pb-field">
        <label>PHOTOS <span style="color:#bbb;font-weight:400;font-size:9px;">(click to upload · crop 1:1)</span></label>
        <div class="pb-photos-grid">${photoSlots}</div>
        <input type="file" id="pb-file-input" accept="image/*" style="display:none" onchange="pbFileSelected(this)"/>
      </div>
      <div class="pb-hr"></div>
      <button class="pb-del-btn" onclick="pbDeletePage(${pbSelected})">Delete this page</button>`;
  } else if(p.type==='team'){
    form.innerHTML=`<div style="font-size:12px;color:#888580;line-height:1.7;font-family:var(--mono);">The team page shows the Gloobles team automatically — no edits needed.</div>
      <div class="pb-hr"></div>
      <button class="pb-del-btn" onclick="pbDeletePage(${pbSelected})">Delete this page</button>`;
  }
}

function pbOpenPhoto(pageId,slot){
  const inp=document.getElementById('pb-file-input');if(!inp)return;
  pbCropTarget={pageId,slot};inp.value='';inp.click();
}
function pbFileSelected(inp){
  const file=inp.files[0];if(!file||!pbCropTarget)return;
  const reader=new FileReader();
  reader.onload=e=>pbOpenCropModal(e.target.result);
  reader.readAsDataURL(file);
}
function pbOpenCropModal(dataUrl){
  const modal=document.getElementById('pb-crop-modal');
  const img=document.getElementById('pb-crop-img');
  if(!modal||!img)return;
  if(pbCropper){pbCropper.destroy();pbCropper=null;}
  modal.classList.add('open');img.src=dataUrl;
  const init=()=>{if(pbCropper)return;pbCropper=new Cropper(img,{aspectRatio:1,viewMode:1,autoCropArea:0.9});};
  if(typeof img.decode==='function'){img.decode().then(()=>requestAnimationFrame(init)).catch(init);}
  else{img.onload=init;if(img.complete&&img.naturalWidth>0)init();}
}
function pbApplyCrop(){
  if(!pbCropper||!pbCropTarget)return;
  const canvas=pbCropper.getCroppedCanvas({width:900,height:900});
  const url=canvas.toDataURL('image/jpeg',0.93);
  const page=pbPages.find(pg=>pg.id===pbCropTarget.pageId);
  if(page){if(!page.photos)page.photos=[null,null,null,null];page.photos[pbCropTarget.slot]=url;}
  pbCloseCropModal();pbRenderPreview();pbRenderEditForm();pbRenderList();pbCropTarget=null;
}
function pbCancelCrop(){pbCloseCropModal();pbCropTarget=null;}
function pbCloseCropModal(){
  if(pbCropper){pbCropper.destroy();pbCropper=null;}
  document.getElementById('pb-crop-modal')?.classList.remove('open');
}
function pbClearPhoto(pageId,slot){
  const p=pbPages.find(pg=>pg.id===pageId);
  if(p&&p.photos)p.photos[slot]=null;
  pbRenderPreview();pbRenderEditForm();pbRenderList();
}

async function pbExport(){
  if(!pbPages.length)return;
  const btn=document.querySelector('.pb-export-btn');
  if(btn){btn.textContent='Exporting...';btn.disabled=true;}
  const area=document.getElementById('pb-export-area');
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  await document.fonts.ready;
  for(let i=0;i<pbPages.length;i++){
    const page=pbPages[i];
    const slide=pbBuildSlide(page);
    area.innerHTML='';area.style.cssText='position:fixed;left:-2000px;top:0;width:1440px;height:810px;overflow:hidden;';
    area.appendChild(slide);
    await new Promise(r=>setTimeout(r,120));
    const bgCol=page.type==='brief'?'#12173d':page.type==='team'?'#f5f4f0':'#ffffff';
    const canvas=await html2canvas(slide,{scale:2,useCORS:true,allowTaint:true,logging:false,backgroundColor:bgCol,width:1440,height:810});
    const img=canvas.toDataURL('image/jpeg',0.96);
    if(i>0)doc.addPage([297,210],'landscape');
    doc.addImage(img,'JPEG',0,0,297,210);
  }
  area.innerHTML='';area.style.cssText='position:fixed;left:-9999px;top:-9999px;';
  const client=(pbPages.find(pg=>pg.type==='cover')?.client||'gloobles').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  doc.save(`${client||'gloobles'}-presentation-${new Date().getFullYear()}.pdf`);
  if(btn){btn.textContent='↓ Export PDF';btn.disabled=false;}
}
