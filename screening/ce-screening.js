// ce-forms/screening/ce-screening.js
// Catholic Energies · Energy Screening (public) · v1.0 · 2026-09-21
//
// Public front-end for the Energy Screening (Desk Audit Design Revision 2,
// ratified 2026-09-21). Forked from the Solar Assessment Form: same
// middleware, same ZIP → institution lookup, same buildings list and
// Add-a-Building, same per-building loop and bill upload, same embed
// handshake as the ESCO/community forms (ceEscoHeight / ceEscoScroll).
//
// Posts one JSON payload to POST /screening-request. Success is shown
// only on res.ok (the ce-esco lesson). Nothing is scored here; CE staff
// run the screen in Freddie AI after the request lands in Salesforce.
//
// County square footage is REFERENCE ONLY unless the client ticks "the
// county figure is correct". Annual spend or bills - at least one per
// building - is required.

'use strict';

var MIDDLEWARE = "https://ce-solar-middleware-c282cb05db3f.herokuapp.com";
var SUBMIT_URL = MIDDLEWARE + "/screening-request";
var MAX_FILES = 12, MAX_FILE_BYTES = 5 * 1024 * 1024;

// ── embed handshake (identical to ce-esco.js) ────────────────────────
var isEmbedded = (function(){ try { return window.parent !== window; } catch (e) { return true; } })();
if (isEmbedded) document.body.classList.add('embedded');
function postHeight(){ if(!isEmbedded) return; try{ parent.postMessage({ceEscoHeight: document.documentElement.scrollHeight}, "*"); }catch(e){} }
function requestParentScroll(){ if(!isEmbedded) return; try{ parent.postMessage({ceEscoScroll: true}, "*"); }catch(e){} }
if (isEmbedded && "ResizeObserver" in window) new ResizeObserver(postHeight).observe(document.body);
window.addEventListener("load", postHeight);

// ── state ────────────────────────────────────────────────────────────
var selAcct = null, buildings = [], customBuildings = {}, customCounter = 0, selIds = {};
var bldData = [], curIdx = 0, curFiles = [];
var regInstitutions = [], regSelInstitution = null, newAccountsEnabled = false;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function fmtNum(n){ return (n==null||isNaN(n))?'':Number(n).toLocaleString('en-US'); }
function fmtMoney(n){ return (n==null||n===''||isNaN(n))?'\u2014':'$'+Number(n).toLocaleString('en-US'); }
function show(id,on){ document.getElementById(id).style.display=on?'block':'none'; }
function err(id,on){ document.getElementById(id).style.display=on?'block':'none'; return on; }

// ── screens ──────────────────────────────────────────────────────────
var screens = ['s1','s2','s3','s4','s5'];
function goToScreen(n){
  screens.forEach(function(id,i){ document.getElementById(id).style.display=(i+1===n)?'block':'none'; });
  for(var i=1;i<=5;i++){
    var item=document.getElementById('tn'+i), dot=document.getElementById('tnd'+i), line=document.getElementById('tnl'+i);
    item.className='tn-item'+(i===n?' active':i<n?' done':''); dot.textContent=i<n?'\u2713':i;
    if(line) line.className='tn-line'+(i<n?' done':'');
  }
  document.getElementById('progress-fill').style.width=Math.round(n/5*100)+'%';
  if(isEmbedded) requestParentScroll(); else window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(postHeight, 50);
}

// ── step 1: ZIP lookup (SAF) ─────────────────────────────────────────
async function doZipLookup(){
  var zip=document.getElementById('zip').value.trim();
  ['acct-results','acct-banner','reg-form'].forEach(function(id){ show(id,false); });
  err('e-zip',false); err('e-no-acct',false); selAcct=null; document.getElementById('btn-s1').disabled=true;
  if(!/^\d{5}$/.test(zip)){ err('e-zip',true); return; }
  var btn=document.getElementById('zip-btn'); btn.innerHTML='<span class="spin"></span>'; btn.disabled=true;
  try{
    var resp=await fetch(MIDDLEWARE+'/accounts?zip='+zip);
    if(!resp.ok) throw new Error('Server error '+resp.status);
    var data=await resp.json(); var accounts=data.accounts||[];
    var list=document.getElementById('acct-list'); list.innerHTML=''; show('acct-results',true);
    if(!accounts.length){
      document.getElementById('e-no-acct').textContent='\u26a0 No institutions found for this ZIP. Try a nearby ZIP, or register yours below.'; err('e-no-acct',true);
    } else {
      accounts.forEach(function(acc){
        var el=document.createElement('div'); el.className='item';
        el.innerHTML='<div><div class="nm">'+esc(acc.name)+'</div><div class="meta">'+esc(acc.address||'')+'</div></div>';
        el.onclick=function(){ doPickAccount(acc,el); }; list.appendChild(el);
      });
    }
    show('reg-cta', newAccountsEnabled);
  }catch(e){
    console.error('Account lookup failed:',e); show('acct-results',true);
    document.getElementById('e-no-acct').textContent='\u26a0 Could not reach Catholic Energies. Please try again in a moment.'; err('e-no-acct',true);
  } finally { btn.innerHTML='Look Up'; btn.disabled=false; postHeight(); }
}
document.getElementById('zip').addEventListener('keydown',function(e){ if(e.key==='Enter') doZipLookup(); });

(async function initFlag(){
  try{ var r=await fetch(MIDDLEWARE+'/'); var d=await r.json(); newAccountsEnabled=(d&&d.newAccounts==='enabled'); }catch(e){ newAccountsEnabled=false; }
})();

function doPickAccount(acc,el){
  selAcct=acc;
  document.querySelectorAll('#acct-list .item').forEach(function(i){ i.classList.remove('sel'); }); el.classList.add('sel');
  document.getElementById('b-acct-name').textContent=acc.name; document.getElementById('b-acct-addr').textContent=acc.address||'';
  show('acct-results',false); show('reg-form',false); show('acct-banner',true);
  document.getElementById('btn-s1').disabled=false; postHeight();
}
function doChangeAccount(){ selAcct=null; show('acct-banner',false); show('acct-results',true); document.getElementById('btn-s1').disabled=true; postHeight(); }

// ── step 1b: register (SAF v7 path, Catholic-only variant) ──────────
function doShowRegister(){
  show('reg-form',true); show('acct-banner',false);
  var z=document.getElementById('zip').value.trim();
  if(/^\d{5}$/.test(z)&&!document.getElementById('reg-zip').value) document.getElementById('reg-zip').value=z;
  loadInstitutions(); document.getElementById('reg-name').focus(); postHeight();
}
function doHideRegister(){ show('reg-form',false); postHeight(); }
async function loadInstitutions(){
  if(regInstitutions.length) return regInstitutions;
  try{ var resp=await fetch(MIDDLEWARE+'/institutions'); if(!resp.ok) throw new Error(resp.status); regInstitutions=(await resp.json()).institutions||[]; }
  catch(e){ console.error('Institution load failed:',e); regInstitutions=[]; }
  return regInstitutions;
}
function filterInstitutions(q){
  var box=document.getElementById('reg-ei-results'); q=(q||'').trim().toLowerCase();
  if(!q){ box.style.display='none'; box.innerHTML=''; return; }
  var m=regInstitutions.filter(function(i){ return i.name.toLowerCase().indexOf(q)>=0; }).slice(0,20);
  box.innerHTML = m.length ? m.map(function(i){ return '<div class="item" onclick="pickInstitution(\''+esc(i.id)+'\')"><div><div class="nm">'+esc(i.name)+'</div><div class="meta">'+esc(i.type||'')+'</div></div></div>'; }).join('')
                           : '<div class="none">No matches \u2014 tick "Not sure" below</div>';
  box.style.display='block'; postHeight();
}
function pickInstitution(id){
  regSelInstitution=regInstitutions.find(function(i){ return i.id===id; })||null; if(!regSelInstitution) return;
  document.getElementById('reg-ei-search').value=regSelInstitution.name; document.getElementById('reg-ei-results').style.display='none';
  document.getElementById('reg-ei-unknown').checked=false;
  var pk=document.getElementById('reg-ei-picked'); pk.textContent='\u2713 '+regSelInstitution.name+(regSelInstitution.type?' \u00b7 '+regSelInstitution.type:''); pk.style.display='block';
}
function toggleEIUnknown(checked){
  var pk=document.getElementById('reg-ei-picked');
  if(checked){ regSelInstitution=null; document.getElementById('reg-ei-search').value=''; document.getElementById('reg-ei-results').style.display='none'; pk.textContent='Affiliation marked as unknown \u2014 a team member will verify.'; pk.style.display='block'; }
  else pk.style.display='none';
}
async function doRegisterAccount(){
  var f=function(id){ return document.getElementById(id).value.trim(); };
  var name=f('reg-name'), street=f('reg-street'), city=f('reg-city'), state=f('reg-state'), zip=f('reg-zip');
  var bad=false;
  bad=err('e-reg-name',!name)||bad; bad=err('e-reg-street',!street)||bad; bad=err('e-reg-city',!city)||bad; bad=err('e-reg-state',!state)||bad; bad=err('e-reg-zip',!/^\d{5}$/.test(zip))||bad;
  var ef=document.getElementById('e-reg-form'); ef.style.display='none';
  if(bad){ ef.textContent='\u26a0 Please fix the errors above.'; ef.style.display='block'; return; }
  var payload={ name:name, street:street, city:city, state:state, zip:zip, isCatholic:true, denomination:'',
    institutionId:regSelInstitution?regSelInstitution.id:'', institutionType:regSelInstitution?regSelInstitution.type:'' };
  var btn=document.getElementById('reg-submit-btn'), orig=btn.innerHTML; btn.innerHTML='<span class="spin"></span>'; btn.disabled=true;
  try{
    var resp=await fetch(MIDDLEWARE+'/accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    var data=await resp.json();
    if(!resp.ok||!data.success) throw new Error((data&&data.error)?(typeof data.error==='string'?data.error:JSON.stringify(data.error)):'Registration failed');
    selAcct={ id:data.id, name:data.name||name, address:data.address||[street,city,state,zip].filter(Boolean).join(', '), isNewAccount:true };
    show('reg-form',false); show('acct-results',false);
    document.getElementById('b-acct-name').textContent=selAcct.name; document.getElementById('b-acct-addr').textContent=selAcct.address||'';
    show('acct-banner',true); document.getElementById('btn-s1').disabled=false;
  }catch(e){ console.error('Registration failed:',e); ef.textContent='\u26a0 '+(e.message||'Registration failed. Please try again.'); ef.style.display='block'; }
  finally{ btn.innerHTML=orig; btn.disabled=false; postHeight(); }
}

// ── step 2: buildings + search + add (SAF pattern) ───────────────────
async function goToBuildings(){
  if(!selAcct) return;
  selIds={}; customBuildings={}; customCounter=0; buildings=[];
  document.getElementById('s2-sub').textContent=selAcct.name+' \u2014 select every building you want screened';
  document.getElementById('bsearch').value='';
  var list=document.getElementById('blist'); list.innerHTML='<div class="none">\u23f3 Loading buildings\u2026</div>';
  goToScreen(2);
  try{
    var resp=await fetch(MIDDLEWARE+'/buildings?accountId='+encodeURIComponent(selAcct.id));
    if(!resp.ok) throw new Error('Server error '+resp.status);
    var data=await resp.json();
    buildings=(data.buildings||[]).map(function(b){
      var sq=Number(b.sqft); if(!(sq>0)||sq>=1000000) sq=null;
      return { id:b.id, name:b.name||'', address:b.address||'', type:b.type||'', sqft_county:sq, sqft_county_source:(b.sqft_county?'county':'estimate') };
    });
  }catch(e){ console.error('Buildings load failed:',e); buildings=[]; }
  renderBuildings();
}
function allBuildings(){ return buildings.concat(Object.keys(customBuildings).map(function(k){ return customBuildings[k]; })); }
function renderBuildings(){
  var list=document.getElementById('blist'); list.innerHTML='';
  var all=allBuildings();
  if(!all.length) list.innerHTML='<div class="none">No buildings are on file for this institution yet. Use "Add a Building" below.</div>';
  all.forEach(function(b){
    var el=document.createElement('div'); el.className='item'+(selIds[b.id]?' sel':''); el.id='bi-'+b.id;
    el.setAttribute('data-search',((b.name||'')+' '+(b.address||'')+' '+(b.type||'')).toLowerCase());
    var meta=[]; if(b.address) meta.push(esc(b.address));
    if(b.sqft_county!=null) meta.push('County '+(b.sqft_county_source==='county'?'record':'estimate')+' '+fmtNum(b.sqft_county)+' sq ft (reference only)');
    if(b.type) meta.push(esc(b.type));
    el.innerHTML='<div class="check" id="bc-'+b.id+'">'+(selIds[b.id]?'\u2713':'')+'</div><div><div class="nm">'+esc(b.name)+(b.custom?'<span class="tag">MANUALLY ADDED</span>':'')+'</div><div class="meta">'+meta.join(' \u00b7 ')+'</div></div>';
    el.onclick=function(){ toggleBuilding(b.id); }; list.appendChild(el);
  });
  filterBuildings(document.getElementById('bsearch').value); postHeight();
}
function filterBuildings(q){
  q=(q||'').trim().toLowerCase(); var rows=document.querySelectorAll('#blist .item'), shown=0;
  rows.forEach(function(el){ var hit=!q||el.getAttribute('data-search').indexOf(q)>=0||el.classList.contains('sel'); el.classList.toggle('hid',!hit); if(hit) shown++; });
  var total=rows.length;
  document.getElementById('bsearch-meta').textContent = total ? (q ? shown+' of '+total+' match \u2014 selected buildings always stay visible' : total+' building'+(total!==1?'s':'')+' on file') : '';
  var none=document.getElementById('blist-none');
  if(q&&!shown){ if(!none){ none=document.createElement('div'); none.id='blist-none'; none.className='none'; document.getElementById('blist').appendChild(none); } none.textContent='No buildings match \u201c'+q+'\u201d. Try fewer letters, or add the building below.'; }
  else if(none) none.remove();
}
function toggleBuilding(id){
  if(selIds[id]) delete selIds[id]; else selIds[id]=true;
  var el=document.getElementById('bi-'+id), ck=document.getElementById('bc-'+id), on=!!selIds[id];
  el.className='item'+(on?' sel':'')+(el.classList.contains('hid')?' hid':''); ck.textContent=on?'\u2713':'';
  var n=Object.keys(selIds).length, sc=document.getElementById('sel-count');
  sc.style.display=n?'block':'none'; sc.textContent=n+' building'+(n!==1?'s':'')+' selected';
  document.getElementById('btn-s2').disabled=!n;
}
function selectedBuildings(){ return allBuildings().filter(function(b){ return selIds[b.id]; }); }
function toggleAddForm(){
  var form=document.getElementById('add-bld-form'), open=form.style.display==='block'; form.style.display=open?'none':'block';
  if(!open){ ['nb-name','nb-address'].forEach(function(id){ document.getElementById(id).value=''; }); document.getElementById('nb-type').value='';
    ['e-nb-name','e-nb-type','e-nb-address'].forEach(function(id){ err(id,false); }); document.getElementById('nb-name').focus(); }
  postHeight();
}
function addBuilding(){
  var name=document.getElementById('nb-name').value.trim(), type=document.getElementById('nb-type').value, address=document.getElementById('nb-address').value.trim();
  var bad=false; bad=err('e-nb-name',!name)||bad; bad=err('e-nb-type',!type)||bad; bad=err('e-nb-address',!address)||bad; if(bad) return;
  customCounter++; var b={ id:'NEW-'+customCounter, name:name, type:type, address:address, custom:true, sqft_county:null, sqft_county_source:null };
  customBuildings[b.id]=b; selIds[b.id]=true; document.getElementById('bsearch').value='';
  renderBuildings(); toggleBuilding(b.id); toggleBuilding(b.id); toggleAddForm();
  var row=document.getElementById('bi-'+b.id); if(row) row.scrollIntoView({block:'nearest'});
}

// ── step 3: per-building loop (SAF pattern) ──────────────────────────
function goToDetails(){
  var sel=selectedBuildings(); if(!sel.length) return;
  bldData=sel.map(function(b){ return { bld:b, answers:null, files:[] }; });
  curIdx=0; showBuilding(0); goToScreen(3);
}
function showBuilding(idx){
  curIdx=idx; var bd=bldData[idx], b=bd.bld, a=bd.answers||{};
  document.getElementById('s3-title').textContent=b.name;
  document.getElementById('s3-sub').textContent=(b.address?b.address+' \u00b7 ':'')+'Size and energy spend for this building';
  document.getElementById('bnav').textContent='Building '+(idx+1)+' of '+bldData.length;
  document.getElementById('f-sqft').value=a.sqft!=null?a.sqft:'';
  document.getElementById('f-elec').value=a.elec!=null?a.elec:''; document.getElementById('f-gas').value=a.gas!=null?a.gas:'';
  document.getElementById('f-shared').value=a.shared||''; document.getElementById('f-fuel').value=a.fuel||'';
  document.getElementById('f-occ').value=a.occ!=null?a.occ:''; document.getElementById('f-hvac').value=a.hvac||'';
  var ref=document.getElementById('sqft-ref'), wrap=document.getElementById('county-chk-wrap'), cb=document.getElementById('f-county-ok');
  if(b.sqft_county!=null){
    ref.textContent='County records show '+fmtNum(b.sqft_county)+' sq ft for this building. County figures are often approximate. Type your own number, or confirm the county figure if you know it is right.';
    wrap.style.display=(b.sqft_county_source==='county')?'flex':'none';
    cb.checked=!!a.confirmed;
  } else { ref.textContent='Enter the square footage of this building.'; wrap.style.display='none'; cb.checked=false; }
  ['e-sqft','e-spend','e-occ'].forEach(function(id){ err(id,false); });
  curFiles=bd.files.slice(); renderChips();
  document.getElementById('btn-prev').textContent=idx===0?'\u2190 Back':'\u2190 Previous building';
  document.getElementById('btn-next').textContent=idx===bldData.length-1?'Continue \u2192':'Next building \u2192';
  postHeight();
}
function onCountyConfirm(checked){ var b=bldData[curIdx].bld; if(checked&&b.sqft_county!=null) document.getElementById('f-sqft').value=Math.round(b.sqft_county); }
function onSqftInput(){ var b=bldData[curIdx].bld; if(b.sqft_county==null) return; var v=parseFloat(document.getElementById('f-sqft').value); if(Math.abs(v-b.sqft_county)>0.5) document.getElementById('f-county-ok').checked=false; }
function optNum(id){ var v=document.getElementById(id).value.trim(); return v===''?null:parseFloat(v); }
function collectBuilding(){
  var bad=false; var b=bldData[curIdx].bld;
  var sqft=parseFloat(document.getElementById('f-sqft').value); bad=err('e-sqft',!(sqft>0))||bad;
  var elec=optNum('f-elec'), gas=optNum('f-gas');
  var noSpend=(elec==null||isNaN(elec))&&(gas==null||isNaN(gas)); bad=err('e-spend',noSpend&&!curFiles.length)||bad;
  var occ=optNum('f-occ'); bad=err('e-occ',occ!=null&&!(occ>=0&&occ<=168))||bad;
  if(bad){ postHeight(); return false; }
  var confirmed=document.getElementById('f-county-ok').checked&&b.sqft_county!=null&&Math.abs(sqft-b.sqft_county)<=0.5;
  bldData[curIdx].answers={ sqft:sqft, confirmed:confirmed, elec:(elec==null||isNaN(elec))?null:elec, gas:(gas==null||isNaN(gas))?null:gas,
    shared:document.getElementById('f-shared').value.trim(), fuel:document.getElementById('f-fuel').value, occ:(occ==null||isNaN(occ))?null:occ, hvac:document.getElementById('f-hvac').value.trim() };
  bldData[curIdx].files=curFiles.slice(); return true;
}
function nextBuilding(){ if(!collectBuilding()) return; if(curIdx<bldData.length-1) showBuilding(curIdx+1); else goToScreen(4); }
function prevBuilding(){ collectBuildingSoft(); if(curIdx>0) showBuilding(curIdx-1); else goToScreen(2); }
function collectBuildingSoft(){ var sqft=optNum('f-sqft'), elec=optNum('f-elec'), gas=optNum('f-gas'), occ=optNum('f-occ'); var b=bldData[curIdx].bld;
  bldData[curIdx].answers={ sqft:sqft, confirmed:document.getElementById('f-county-ok').checked&&b.sqft_county!=null&&sqft!=null&&Math.abs(sqft-b.sqft_county)<=0.5, elec:elec, gas:gas,
    shared:document.getElementById('f-shared').value.trim(), fuel:document.getElementById('f-fuel').value, occ:occ, hvac:document.getElementById('f-hvac').value.trim() }; bldData[curIdx].files=curFiles.slice(); }
function backToDetails(){ showBuilding(bldData.length-1); goToScreen(3); }

// ── files (SAF) ──────────────────────────────────────────────────────
function addFiles(inp){
  Array.from(inp.files).forEach(function(f){
    if(!/\.(pdf|jpe?g|png)$/i.test(f.name)) return;
    if(f.size>MAX_FILE_BYTES){ alert(f.name+' is larger than 5 MB and was not added.'); return; }
    if(curFiles.length<MAX_FILES&&!curFiles.find(function(x){ return x.name===f.name; })) curFiles.push(f);
  });
  inp.value=''; renderChips();
}
function renderChips(){
  document.getElementById('fchips').innerHTML=curFiles.map(function(f,i){ var kb=f.size<1048576?Math.round(f.size/1024)+' KB':(f.size/1048576).toFixed(1)+' MB';
    return '<div class="fchip"><span class="fn">\ud83d\udcce '+esc(f.name)+'</span><span class="fs">'+kb+'</span><span class="fx" onclick="rmFile('+i+')">\u2715</span></div>'; }).join('');
  postHeight();
}
function rmFile(i){ curFiles.splice(i,1); renderChips(); }
var ua=document.getElementById('uarea');
ua.addEventListener('dragover',function(e){ e.preventDefault(); ua.classList.add('over'); });
ua.addEventListener('dragleave',function(){ ua.classList.remove('over'); });
ua.addEventListener('drop',function(e){ e.preventDefault(); ua.classList.remove('over'); addFiles({files:e.dataTransfer.files,value:''}); });
function fileToB64(file){ return new Promise(function(resolve,reject){ var r=new FileReader(); r.onload=function(){ resolve({name:file.name,type:file.type,data:r.result.split(',')[1]}); }; r.onerror=function(){ reject(new Error('Read failed')); }; r.readAsDataURL(file); }); }

// ── step 4/5: contact + review ───────────────────────────────────────
function contact(){ var f=function(id){ return document.getElementById(id).value.trim(); }; return { first_name:f('c-first'), last_name:f('c-last'), email:f('c-email'), phone:f('c-phone'), role:f('c-role') }; }
function goToReview(){
  var c=contact(); var bad=false;
  bad=err('e-c-first',!c.first_name)||bad; bad=err('e-c-last',!c.last_name)||bad; bad=err('e-c-email',!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))||bad;
  if(bad){ postHeight(); return; }
  var rows=['<div class="rev-row"><span class="rrk">Institution</span><span class="rrv">'+esc(selAcct.name)+'</span></div>',
            '<div class="rev-row"><span class="rrk">Contact</span><span class="rrv">'+esc(c.first_name+' '+c.last_name)+' \u00b7 '+esc(c.email)+'</span></div>'];
  bldData.forEach(function(bd){ var a=bd.answers||{};
    rows.push('<div class="rev-bld">'+esc(bd.bld.name)+(bd.bld.custom?' (added)':'')+'</div>');
    rows.push('<div class="rev-row"><span class="rrk">Square feet</span><span class="rrv">'+fmtNum(a.sqft)+(a.confirmed?' (county, confirmed)':'')+'</span></div>');
    rows.push('<div class="rev-row"><span class="rrk">Electric / gas spend</span><span class="rrv">'+fmtMoney(a.elec)+' / '+fmtMoney(a.gas)+'</span></div>');
    if(a.shared) rows.push('<div class="rev-row"><span class="rrk">Shared meter</span><span class="rrv">'+esc(a.shared)+'</span></div>');
    rows.push('<div class="rev-row"><span class="rrk">Bills</span><span class="rrv">'+(bd.files.length?bd.files.length+' file'+(bd.files.length!==1?'s':''):'None')+'</span></div>');
  });
  document.getElementById('rev-box').innerHTML=rows.join(''); goToScreen(5);
}

// ── submit: one payload to /screening-request, success only on res.ok ─
async function doSubmit(){
  var btn=document.getElementById('sub-btn'), status=document.getElementById('sub-status'), e=document.getElementById('e-submit');
  e.style.display='none'; btn.innerHTML='<span class="spin"></span> Sending\u2026'; btn.disabled=true; status.style.display='block'; status.textContent='Preparing your submission\u2026';
  try{
    var bl=[];
    for(var i=0;i<bldData.length;i++){
      var bd=bldData[i], a=bd.answers||{}, b=bd.bld, files=[];
      for(var j=0;j<bd.files.length;j++){ try{ files.push(await fileToB64(bd.files[j])); }catch(x){ console.warn('File read failed:',x); } }
      bl.push({ sf_building_id:b.custom?'NEW':b.id, manually_added:!!b.custom, building_name:b.name, building_type:b.type, building_address:b.address,
        county_sqft_reference:b.sqft_county, client_sqft:a.sqft, client_confirmed_county_sqft:!!a.confirmed,
        client_electric_spend:a.elec, client_gas_spend:a.gas, client_heating_fuel:a.fuel||'', client_occupancy_hours_week:a.occ,
        client_hvac_vintage:a.hvac||'', client_shared_meter_note:a.shared||'', bill_files:files });
    }
    var payload={ sf_account_id:selAcct.id, contact:contact(), submitted_at:new Date().toISOString(), source_form:'ce-screening', buildings:bl };
    status.textContent='Sending to Catholic Energies\u2026';
    var resp=await fetch(SUBMIT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    var data={}; try{ data=await resp.json(); }catch(x){}
    if(!resp.ok||!data.success){
      var msg=(data.errors&&data.errors.length)?data.errors.join(' '):(data.error||('Submission failed ('+resp.status+').'));
      throw new Error(msg);
    }
    document.getElementById('rev-wrap').style.display='none';
    document.getElementById('suc-msg').innerHTML='Your screening request for <strong>'+esc(selAcct.name)+'</strong> has been received. Catholic Energies will review it and send a one-page result to <strong>'+esc(contact().email)+'</strong> within a week.';
    document.getElementById('suc-screen').style.display='block';
    if(isEmbedded) requestParentScroll(); else window.scrollTo({top:0,behavior:'smooth'});
  }catch(x){
    console.error('Submission error:',x); btn.innerHTML='Submit to Catholic Energies'; btn.disabled=false; status.style.display='none';
    e.textContent='\u26a0 '+(x.message||'Submission failed. Please try again.'); e.style.display='block';
  }
  postHeight();
}
