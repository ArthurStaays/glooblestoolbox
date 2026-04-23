/* === WHATSAPP FORMATTER === */

function wafFormat(type){
  const ta=document.getElementById('waf-input');
  const start=ta.selectionStart,end=ta.selectionEnd;
  const selected=ta.value.substring(start,end);
  const before=ta.value.substring(0,start);
  const after=ta.value.substring(end);
  let result='';
  const toggleInline=(marker)=>{
    const m=marker,ml=m.length;
    if(selected.startsWith(m)&&selected.endsWith(m)&&selected.length>ml*2)return selected.slice(ml,-ml);
    return `${m}${selected||'text'}${m}`;
  };
  const toggleLinePrefix=(prefix)=>{
    const lines=selected.split('\n');
    const allHave=lines.every(l=>l.startsWith(prefix));
    return lines.map(l=>allHave?l.substring(prefix.length):`${prefix}${l}`).join('\n');
  };
  const toggleCurrentLine=(prefix)=>{
    const ls=before.lastIndexOf('\n')+1,le=ta.value.indexOf('\n',ls);
    const line=ta.value.substring(ls,le===-1?undefined:le);
    const toggled=line.startsWith(prefix)?line.substring(prefix.length):`${prefix}${line}`;
    ta.value=ta.value.substring(0,ls)+toggled+(le===-1?'':ta.value.substring(le));
    ta.focus();wafPreview();
  };
  if(type==='bold')result=toggleInline('*');
  else if(type==='italic')result=toggleInline('_');
  else if(type==='strike')result=toggleInline('~');
  else if(type==='quote'){
    if(selected){result=toggleLinePrefix('> ');}
    else{toggleCurrentLine('> ');return;}
  }
  else if(type==='bullet'){
    if(selected){result=toggleLinePrefix('- ');}
    else{toggleCurrentLine('- ');return;}
  }
  else if(type==='numbered'){
    if(selected){
      const lines=selected.split('\n');
      const allNum=lines.every(l=>/^\d+\. /.test(l));
      result=allNum?lines.map(l=>l.replace(/^\d+\. /,'')).join('\n'):lines.map((l,i)=>/^\d+\. /.test(l)?l:`${i+1}. ${l}`).join('\n');
    } else {
      const ls=before.lastIndexOf('\n')+1,le=ta.value.indexOf('\n',ls);
      const line=ta.value.substring(ls,le===-1?undefined:le);
      if(/^\d+\. /.test(line)){ta.value=ta.value.substring(0,ls)+line.replace(/^\d+\. /,'')+(le===-1?'':ta.value.substring(le));}
      else{const m=[...before.split('\n')].reverse().find(l=>/^\d+\./.test(l));const n=m?+m.match(/\d+/)[0]+1:1;ta.value=ta.value.substring(0,ls)+`${n}. `+ta.value.substring(ls);}
      ta.focus();wafPreview();return;
    }
  }
  ta.value=before+result+after;
  ta.selectionStart=start;ta.selectionEnd=start+result.length;
  ta.focus();wafPreview();
}

function wafPreview(){
  const raw=document.getElementById('waf-input').value;
  if(!raw){document.getElementById('waf-bubble').innerHTML='<span style="color:#aaa;font-size:11px;">Your message will appear here</span>';return;}
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt=s=>s
    .replace(/```(.*?)```/g,'<code>$1</code>')
    .replace(/\*([^*]+)\*/g,'<strong>$1</strong>')
    .replace(/_([^_]+)_/g,'<em>$1</em>')
    .replace(/~([^~]+)~/g,'<s>$1</s>');
  const html=raw.split('\n').map(line=>{
    if(line.startsWith('> ')) return `<div class="waf-quote">${fmt(esc(line.substring(2)))}</div>`;
    if(/^\d+\. /.test(line)){const m=line.match(/^(\d+\. )(.*)/);return m[1]+fmt(esc(m[2]));}
    if(line.startsWith('- ')) return '• '+fmt(esc(line.substring(2)));
    return fmt(esc(line));
  }).join('<br/>');
  document.getElementById('waf-bubble').innerHTML=html;
  const now=new Date();document.getElementById('waf-time').textContent=now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();
}

function wafCopy(){
  const text=document.getElementById('waf-input').value;
  if(!text)return;
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.querySelector('#view-waformat .gen-btn');
    const orig=btn.textContent;
    btn.textContent='Copied!';
    setTimeout(()=>btn.textContent=orig,1500);
  });
}
