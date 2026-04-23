/* === INVOICE GENERATOR === */

// === INVOICE GENERATOR ===
let invItems=[];
let invItemId=0;

function initInvoice(){
  const today=new Date();
  const due=new Date(today);
  due.setDate(due.getDate()+30);
  document.getElementById('inv-date-issue').value=today.toISOString().slice(0,10);
  document.getElementById('inv-date-due').value=due.toISOString().slice(0,10);
  addInvItem();
}

function fmtInvDate(str){
  if(!str)return'';
  const d=new Date(str+'T00:00:00');
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function fmtEur(n){const v=(n||0).toFixed(2);const[i,d]=v.split('.');return'\u20ac '+i.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+','+d;}

function rowAmt(item){return(parseFloat(item.qty)||0)*(parseFloat(item.price)||0);}

function addInvItem(desc='',qty=1,price=''){
  const id=++invItemId;
  invItems.push({id,desc,qty,price});
  renderInvItems();
}

function removeInvItem(id){
  invItems=invItems.filter(i=>i.id!==id);
  renderInvItems();
}

function renderInvItems(){
  document.getElementById('inv-items').innerHTML=invItems.map(item=>`
    <div class="inv-item-row" id="inv-row-${item.id}">
      <input type="text" placeholder="Description" value="${item.desc}" oninput="updateInvItem(${item.id},'desc',this.value)"/>
      <input type="number" placeholder="1" value="${item.qty===1&&item.desc===''?'':item.qty}" min="1" oninput="updateInvItem(${item.id},'qty',this.value)" style="text-align:center;"/>
      <input type="number" placeholder="0.00" value="${item.price}" step="0.01" oninput="updateInvItem(${item.id},'price',this.value)"/>
      <div class="inv-amt-cell" id="inv-amt-${item.id}">${fmtEur(rowAmt(item))}</div>
      <button class="delbtn" onclick="removeInvItem(${item.id})">×</button>
    </div>`).join('');
  calcInvTotal();
}

function updateInvItem(id,field,val){
  const item=invItems.find(i=>i.id===id);
  if(!item)return;
  item[field]=field==='qty'||field==='price'?parseFloat(val)||0:val;
  const el=document.getElementById(`inv-amt-${id}`);
  if(el)el.textContent=fmtEur(rowAmt(item));
  calcInvTotal();
}

function calcInvTotal(){
  const subtotal=invItems.reduce((s,i)=>s+rowAmt(i),0);
  const tax=parseFloat(document.getElementById('inv-tax-amount').value)||0;
  const taxLabel=document.getElementById('inv-tax-label').value||'Tax';
  document.getElementById('inv-subtotal').textContent=fmtEur(subtotal);
  document.getElementById('inv-tax-label-disp').textContent=taxLabel;
  document.getElementById('inv-tax-disp').textContent=fmtEur(tax);
  document.getElementById('inv-total-disp').textContent=fmtEur(subtotal+tax);
  invLivePreview();
}

function invLivePreview(){
  const num=document.getElementById('inv-num').value||'\u2014';
  const issue=fmtInvDate(document.getElementById('inv-date-issue').value);
  const due=fmtInvDate(document.getElementById('inv-date-due').value);
  const company=document.getElementById('inv-company').value;
  const addr1=document.getElementById('inv-addr1').value;
  const addr2=document.getElementById('inv-addr2').value;
  const country=document.getElementById('inv-country').value;
  const contact=document.getElementById('inv-contact').value;
  const email=document.getElementById('inv-email').value;
  const taxLabel=document.getElementById('inv-tax-label').value||'Tax';
  const tax=parseFloat(document.getElementById('inv-tax-amount').value)||0;
  const subtotal=invItems.reduce((s,i)=>s+rowAmt(i),0);
  const itemRows=invItems.map(i=>`
    <div class="prev-item-row">
      <span>${esc(i.desc)||'\u2014'}</span>
      <span style="text-align:center;">${parseFloat(i.qty)||1}</span>
      <span style="text-align:right;">${fmtEur(parseFloat(i.price)||0)}</span>
      <span style="text-align:right;font-weight:500;">${fmtEur(rowAmt(i))}</span>
    </div>`).join('');
  document.getElementById('inv-preview').innerHTML=`
    <div class="prev-header">
      <div class="prev-logo">gloobles</div>
      <div class="prev-meta">
        <div><strong>Stay confirmation n°</strong> ${num}</div>
        <div>Issued: ${issue||'\u2014'}</div>
        <div>Due: ${due||'\u2014'}</div>
      </div>
    </div>
    <div class="prev-parties">
      <div>
        <div class="prev-party-label">From</div>
        <div class="prev-party-name">gloobles b.v.</div>
        <div class="prev-party-addr">Prinsengracht 821<br/>1015 DZ Amsterdam<br/>Netherlands<br/>finance@gloobles.com</div>
      </div>
      <div>
        <div class="prev-party-label">To</div>
        <div class="prev-party-name">${esc(company)||'\u2014'}</div>
        <div class="prev-party-addr">${addr1?esc(addr1)+'<br/>':''}${addr2?esc(addr2)+'<br/>':''}${country?esc(country)+'<br/>':''}${contact?esc(contact)+'<br/>':''}${esc(email)||''}</div>
      </div>
    </div>
    <div class="prev-items-hdr">
      <span>Description</span><span>Qty</span><span style="text-align:right;">Unit price</span><span style="text-align:right;">Amount</span>
    </div>
    ${itemRows}
    <div class="prev-totals">
      <div class="prev-total-row"><span style="color:#888;">Subtotal</span><span>${fmtEur(subtotal)}</span></div>
      <div class="prev-total-row"><span style="color:#888;">${taxLabel}</span><span>${fmtEur(tax)}</span></div>
      <div class="prev-total-row grand"><span>Total</span><span>${fmtEur(subtotal+tax)}</span></div>
    </div>
    <div class="prev-rib">
      <div class="prev-rib-intro">Please address the payment to gloobles BV using :</div>
      <div class="prev-rib-cols">
        <div><strong>EUR account</strong><br/>IBAN: NL67 ABNA 0825 6779 04<br/>BIC: ABNANL2A</div>
        <div><strong>USD account</strong><br/>IBAN: NL49 ABNA 0142 6111 15<br/>BIC: ABNANL2A</div>
      </div>
    </div>
    <div class="prev-footer">gloobles b.v. — Prinsengracht 821, 1015 DZ Amsterdam — KVK 12345678 — VAT NL123456789B01</div>`;
}

function generateInvoicePDF(){
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const num=document.getElementById('inv-num').value||'DOC';
  const issue=fmtInvDate(document.getElementById('inv-date-issue').value);
  const due=fmtInvDate(document.getElementById('inv-date-due').value);
  const company=document.getElementById('inv-company').value;
  const addr1=document.getElementById('inv-addr1').value;
  const addr2=document.getElementById('inv-addr2').value;
  const country=document.getElementById('inv-country').value;
  const contact=document.getElementById('inv-contact').value;
  const email=document.getElementById('inv-email').value;
  const taxLabel=document.getElementById('inv-tax-label').value||'Tax';
  const tax=parseFloat(document.getElementById('inv-tax-amount').value)||0;
  const subtotal=invItems.reduce((s,i)=>s+rowAmt(i),0);
  const W=210,margin=20;
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(14,14,14);
  doc.text('gloobles',margin,24);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(120,120,120);
  doc.text(`Stay confirmation n° ${num}`,W-margin,18,{align:'right'});
  doc.text(`Issued: ${issue}`,W-margin,23,{align:'right'});
  doc.text(`Due: ${due}`,W-margin,28,{align:'right'});
  doc.setDrawColor(220,220,220);doc.line(margin,32,W-margin,32);
  let y=60;
  doc.setFontSize(8);doc.setTextColor(160,160,160);
  doc.text('FROM',margin,y);doc.text('TO',W/2,y);
  y+=5;
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(14,14,14);
  doc.text('gloobles b.v.',margin,y);
  if(company)doc.text(company,W/2,y);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(100,100,100);
  ['Prinsengracht 821','1015 DZ Amsterdam','Netherlands','finance@gloobles.com'].forEach((l,i)=>doc.text(l,margin,y+5+i*5));
  [addr1,addr2,country,contact,email].filter(Boolean).forEach((l,i)=>doc.text(l,W/2,y+5+i*5));
  y=100;
  doc.setDrawColor(220,220,220);doc.line(margin,y,W-margin,y);
  y+=6;doc.setFontSize(8);doc.setTextColor(160,160,160);
  doc.text('DESCRIPTION',margin,y);doc.text('QTY',130,y,{align:'right'});
  doc.text('UNIT PRICE',160,y,{align:'right'});doc.text('AMOUNT',W-margin,y,{align:'right'});
  doc.line(margin,y+3,W-margin,y+3);y+=10;
  doc.setFontSize(9);doc.setTextColor(14,14,14);
  invItems.forEach(item=>{
    doc.text(item.desc||'\u2014',margin,y);
    doc.text(String(parseFloat(item.qty)||1),130,y,{align:'right'});
    doc.text(fmtEur(parseFloat(item.price)||0),160,y,{align:'right'});
    doc.text(fmtEur(rowAmt(item)),W-margin,y,{align:'right'});
    doc.setDrawColor(240,240,240);doc.line(margin,y+3,W-margin,y+3);y+=9;
  });
  y+=6;const tX=140;
  doc.setFontSize(9);doc.setTextColor(120,120,120);
  doc.text('Subtotal',tX,y);doc.setTextColor(14,14,14);doc.text(fmtEur(subtotal),W-margin,y,{align:'right'});
  y+=7;doc.setTextColor(120,120,120);doc.text(taxLabel,tX,y);
  doc.setTextColor(14,14,14);doc.text(fmtEur(tax),W-margin,y,{align:'right'});
  y+=3;doc.setDrawColor(200,200,200);doc.line(tX,y,W-margin,y);y+=6;
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(14,14,14);
  doc.text('Total',tX,y);doc.text(fmtEur(subtotal+tax),W-margin,y,{align:'right'});
  const ribY=y+20;
  doc.setDrawColor(220,220,220);doc.line(margin,ribY,W-margin,ribY);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(120,120,120);
  doc.text('Please address the payment to gloobles BV using :',margin,ribY+8);
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(14,14,14);
  doc.text('EUR account',margin,ribY+16);
  doc.text('USD account',W/2,ribY+16);
  doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);
  doc.text('IBAN: NL67 ABNA 0825 6779 04',margin,ribY+22);
  doc.text('BIC: ABNANL2A',margin,ribY+27);
  doc.text('IBAN: NL49 ABNA 0142 6111 15',W/2,ribY+22);
  doc.text('BIC: ABNANL2A',W/2,ribY+27);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(180,180,180);
  doc.text('gloobles b.v. — Prinsengracht 821, 1015 DZ Amsterdam — KVK 12345678 — VAT NL123456789B01',W/2,280,{align:'center'});
  doc.save(`gloobles-${num}.pdf`);
}


