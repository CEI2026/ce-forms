/* ============================================================
   ESCO Qualification Form — Catholic Energies
   Posts a JSON payload to the CE middleware, which writes one
   record to the CE_ESCO_Application__c object for manual review
   in Salesforce. No scoring is performed.
   ============================================================ */

const ENDPOINT = "https://ce-vendor-middleware-3d2986cb1da9.herokuapp.com/esco-submit";

const VENDOR_TYPES = ["ESCO / Energy Services Company","Energy Efficiency Contractor","Mechanical / HVAC Contractor","Building Controls / BMS Provider","Electrical Contractor","Lighting Contractor","Commissioning / Retro-Commissioning Provider","Measurement & Verification (M&V) Provider","Distributed Energy / Storage / Microgrid Provider","Operations & Maintenance Provider","Design-Build / EPC","Other"];
const CERTS = ["CEM","CMVP","PE","NABCEP","LEED","BPI","NEBB / AABC","OSHA training","Manufacturer certifications","Other"];
const SERVICES = ["Energy audits","ASHRAE Level I / II / III audits","Engineering / design","Procurement","Construction / installation","Commissioning","Retro-commissioning","Controls optimization","M&V","Utility incentive management","Financing support","O&M / service agreements","Training","Other"];
const FIN_STRUCTURES = ["ESA","Lease","Loan","PACE","Utility tariff / on-bill","Performance contract","Third-party ownership","Other"];
const SOURCING = ["Financing not provided","Committed capital","Lending partners","Ad hoc sourcing"];
const FIN_ACTIVE = ["Committed capital","Lending partners","Ad hoc sourcing"];
const STATE_CODES=["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

const STEPS = [
  { title:"Step 1 \u2014 Company Information", desc:"Vendor identification and service category.", label:"Company",
    fields:[
      {key:"Vendor_Type",label:"Vendor Type",hint:"Select all categories that apply.",type:"multiselect",required:true,options:VENDOR_TYPES},
      {type:"divider",label:"Company Details"},
      {key:"Company_Legal_Name",label:"Company Legal Name",type:"text",required:true,autocomplete:"organization",placeholder:"e.g. SunPath Energy LLC"},
      {key:"Company_Website",label:"Company Website",type:"url",required:true,autocomplete:"url",placeholder:"e.g. https://www.sunpath.com"},
      {key:"DBA_Name",label:"DBA Name",hint:"If applicable.",type:"text",required:false},
      {key:"Primary_Contact_Name",label:"Primary Contact Name",type:"text",required:true,autocomplete:"name",placeholder:"e.g. Jane Smith"},
      {key:"Primary_Contact_Title",label:"Primary Contact Title",type:"text",required:true,autocomplete:"organization-title",placeholder:"e.g. VP, Business Development"},
      {key:"Primary_Contact_Email",label:"Primary Contact Email",type:"email",required:true,autocomplete:"email",placeholder:"e.g. jane@sunpath.com"},
      {key:"Primary_Contact_Phone",label:"Primary Contact Phone",type:"phone",required:true,autocomplete:"tel",placeholder:"e.g. (202) 555-0142"},
      {key:"HQ_City_State",label:"Headquarters City / State",type:"text",required:true,placeholder:"e.g. Austin, TX"},
      {key:"Year_Founded",label:"Year Founded",type:"number",required:true,min:1800,max:2026,placeholder:"e.g. 2012"},
      {key:"Total_W2_Employees",label:"Total W-2 Employees",type:"number",required:true,min:0,placeholder:"e.g. 85"},
      {key:"Core_Self_Performed_Functions",label:"Core Self-Performed Trades / Functions",type:"textarea",required:true,placeholder:"e.g. HVAC installation, controls programming, commissioning"},
      {key:"Company_Overview",label:"Brief Company Overview",hint:"150 words max.",type:"textarea",required:true,maxwords:150,placeholder:"Describe your focus areas, scale, and what differentiates your firm."},
      {type:"divider",label:"Licensing & Certifications"},
      {key:"License_Numbers_States",label:"Contractor License Numbers and States Held",type:"textarea",required:true,placeholder:"e.g. TX #TACLA00123C; CA #987654; NY #12345"},
      {key:"Relevant_Certifications",label:"Relevant Certifications Held",hint:"Select all that apply.",type:"multiselect",required:true,options:CERTS},
      {key:"Provide_License_Copies",label:"Can you provide copies of all active licenses / certifications upon request?",type:"yesno",required:true},
    ]},
  { title:"Step 2 \u2014 Geographic Coverage & Services", desc:"Where you work and what you deliver.", label:"Coverage",
    fields:[
      {key:"Active_States_Count",label:"Number of U.S. States Where You Actively Deliver Projects",type:"number",required:true,min:0,max:51,placeholder:"e.g. 12"},
      {key:"Active_States",label:"States You Work In",hint:"Tap every state where your organization actively delivers projects.",type:"stategrid",required:true},
      {key:"Self_Perform_All_States",label:"Do you self-perform work in all selected states?",type:"yesno",required:true},
      {key:"Partner_Subcontractor_States",label:"If no, identify states where partner / subcontractor delivery is used",type:"textarea",required:false,placeholder:"e.g. states served via local partners",dependsOn:{field:"Self_Perform_All_States",value:"No"}},
      {type:"divider",label:"Project Profile"},
      {key:"Typical_Project_Size_Range",label:"Typical Project Size Range",hint:"e.g. $500K \u2013 $5M.",type:"text",required:true,placeholder:"e.g. $500K \u2013 $5M"},
      {key:"Minimum_Project_Size",label:"Minimum Project Size You Pursue",type:"currency",required:true,placeholder:"e.g. 250000"},
      {key:"Maximum_Project_Size",label:"Maximum Project Size You Can Manage",type:"currency",required:true,placeholder:"e.g. 5000000"},
      {key:"Services_Provided",label:"Which Services Do You Provide?",hint:"Select all that apply.",type:"multiselect",required:true,options:SERVICES},
    ]},
  { title:"Step 3 \u2014 Track Record & Sector Experience", desc:"Volume, scale, and mission-market experience.", label:"Track Record",
    fields:[
      {key:"Completed_Projects_3yr",label:"Total Completed Projects in the Last 3 Years",type:"number",required:true,min:0,placeholder:"e.g. 40"},
      {key:"Largest_Completed_Project",label:"Largest Completed Project",type:"currency",required:true,placeholder:"e.g. 2500000"},
      {key:"Nonprofit_FaithBased_Projects",label:"Nonprofit / Faith-Based Projects Completed in the Last 3 Years",type:"number",required:true,min:0,placeholder:"e.g. 12"},
      {key:"Can_Provide_3_References",label:"Can you provide at least 3 relevant references upon request?",type:"yesno",required:true},
      {key:"Can_Provide_2_Case_Studies",label:"Can you provide 2 case studies showing verified savings?",type:"yesno",required:true},
    ]},
  { title:"Step 4 \u2014 Delivery, Technical Capability & Quality Control", desc:"How you deliver and assure quality.", label:"Delivery",
    fields:[
      {key:"Self_Perform_Installation",label:"Do you self-perform construction / installation in-house?",type:"yesno",required:true},
      {key:"Subcontracted_Scopes",label:"If partially outsourced, what scopes are subcontracted?",type:"textarea",required:false,placeholder:"e.g. electrical, roofing, structural",dependsOn:{field:"Self_Perform_Installation",value:"No"}},
      {key:"Provide_Subcontractor_List",label:"Can you provide a list of key subcontractors and sample subcontract terms upon request?",type:"yesno",required:true},
      {key:"Turnkey_Delivery",label:"Do you provide turnkey delivery from audit through installation and closeout?",type:"yesno",required:true},
      {key:"Post_Install_OM",label:"Do you provide post-installation O&M or service agreements?",type:"yesno",required:true},
      {type:"divider",label:"Technical Capability & QC"},
      {key:"ASHRAE_Audits_In_House",label:"Do you perform ASHRAE-grade audits in-house?",type:"yesno",required:true},
      {key:"Provide_Stamped_Drawings",label:"Do you provide stamped engineering drawings when required?",type:"yesno",required:true},
      {key:"Commissioning_Functional_Testing",label:"Do you perform commissioning / functional testing at project closeout?",type:"yesno",required:true},
      {key:"Occupied_Facility_Delivery",label:"Can you deliver projects in occupied facilities with phased work planning?",type:"yesno",required:true},
    ]},
  { title:"Step 5 \u2014 Financing, Incentives, Insurance & Legal", desc:"Financing capability, coverage, and disclosures.", label:"Financing",
    fields:[
      {key:"Financing_Sourcing_Model",label:"How is client financing provided?",hint:"If financing is not provided, select the first option \u2014 the follow-up financing questions will be skipped.",type:"singleselect",required:true,options:SOURCING},
      {key:"Financing_Structures_Supported",label:"Financing Structures Supported",hint:"Select all that apply.",type:"multiselect",required:false,options:FIN_STRUCTURES,dependsOn:{field:"Financing_Sourcing_Model",in:FIN_ACTIVE}},
      {key:"Provide_Financing_References",label:"Can you provide lender / financing partner references upon request?",type:"yesno",required:true,dependsOn:{field:"Financing_Sourcing_Model",in:FIN_ACTIVE}},
      {type:"divider",label:"Performance & Incentives"},
      {key:"Guarantee_Energy_Savings",label:"Are you able to guarantee energy savings?",type:"yesno",required:true},
      {key:"Guaranteed_Savings_Project_Count",label:"If yes, on how many past projects have you done so?",type:"number",required:false,min:0,placeholder:"e.g. 8",dependsOn:{field:"Guarantee_Energy_Savings",value:"Yes"}},
      {key:"Manage_Utility_Incentives",label:"Do you identify and manage utility rebates / incentives for clients?",type:"yesno",required:true},
      {type:"divider",label:"Insurance, Legal & Disclosures"},
      {key:"GL_Coverage_1M_2M",label:"Do you carry at least $1M / $2M general liability coverage?",type:"yesno",required:true},
      {key:"Active_Litigation",label:"Any active litigation, arbitration, or regulatory action?",type:"yesno",required:true},
      {key:"Bankruptcy_10yr",label:"Any bankruptcy, insolvency, or workout in the last 10 years?",type:"yesno",required:true},
      {key:"License_Safety_Violations_5yr",label:"Any license suspensions, safety violations, or debarments in the last 5 years?",type:"yesno",required:true},
      {key:"Provide_Audited_Financials",label:"Can you provide audited financials or a bank reference letter upon request?",type:"yesno",required:true},
    ]},
  { title:"Step 6 \u2014 Commercial Terms, Attestation & Submission", desc:"Review your answers, attest, and submit.", label:"Review",
    fields:[
      {key:"Execute_MSA_NDA",label:"Are you willing to execute a master services agreement and NDA if selected?",type:"yesno",required:true},
      {key:"Attest_Accuracy",label:"I attest that the information provided is accurate and can be substantiated upon request.",type:"yesno",required:true},
      {key:"Authorized_Signer_Name",label:"Authorized Signer Name",type:"text",required:true,autocomplete:"name",placeholder:"e.g. Jane Smith"},
      {key:"Authorized_Signer_Title",label:"Authorized Signer Title",type:"text",required:true,placeholder:"e.g. Chief Executive Officer"},
      {key:"Submission_Date",label:"Date",type:"date",required:true},
    ]},
];

const stepsEl=document.getElementById("steps");
const stepperEl=document.getElementById("stepper");
const pfill=document.getElementById("pfill");
const backBtn=document.getElementById("back");
const nextBtn=document.getElementById("next");
let current=0;
const check='<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.2 4.7 9 10 3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const stepCheck='<svg viewBox="0 0 14 14" width="13" height="13" fill="none"><path d="M2.5 7.5 6 11 11.5 3.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- embed support (Squarespace iframe) ---------- */
const isEmbedded = (() => { try { return window.parent !== window; } catch (e) { return true; } })();
function postHeight(){
  if(!isEmbedded)return;
  try{ parent.postMessage({ceEscoHeight: document.documentElement.scrollHeight}, "*"); }catch(e){}
}
function requestParentScroll(){
  if(!isEmbedded)return;
  try{ parent.postMessage({ceEscoScroll: true}, "*"); }catch(e){}
}

/* stepper */
STEPS.forEach((s,i)=>{
  if(i>0){const ln=document.createElement("div");ln.className="stp-line";stepperEl.appendChild(ln);}
  const st=document.createElement("div");st.className="stp";st.dataset.i=i;
  st.innerHTML=`<span class="num">${i+1}</span><span class="lbl">${s.label}</span>`;
  stepperEl.appendChild(st);
});

/* steps */
STEPS.forEach((s,i)=>{
  const wrap=document.createElement("section");
  wrap.className="step";wrap.dataset.step=i;
  wrap.innerHTML=`<div class="step-head"><h2>${s.title}</h2><p>${s.desc}</p></div>`;
  s.fields.forEach(f=>wrap.appendChild(renderField(f)));
  if(i===STEPS.length-1){
    const rv=document.createElement("div");rv.className="field review";
    rv.innerHTML=`<span class="flabel">Review Your Submission</span><div id="reviewBody" class="fhelp">Complete the fields above; a summary will appear here before you submit.</div>`;
    wrap.appendChild(rv);
  }
  stepsEl.appendChild(wrap);
});

function renderField(f){
  if(f.type==="divider"){
    const d=document.createElement("div");d.className="divider";d.textContent=f.label;return d;
  }
  const el=document.createElement("div");
  el.className="field";el.dataset.key=f.key;
  if(f.dependsOn)el.style.display="none";
  const star=f.required?' <span class="req">*</span>':'';
  const hint=f.hint?`<span class="fhelp">${f.hint}</span>`:'';
  let control="";

  if(f.type==="multiselect"){
    control=`<div class="opts">`+f.options.map((o,idx)=>{
      const id=`${f.key}_${idx}`;
      return `<div class="opt"><input type="checkbox" id="${id}" name="${f.key}" value="${o}"/><label for="${id}"><span class="box">${check}</span>${o}</label></div>`;
    }).join("")+`</div>`;
  }else if(f.type==="stategrid"){
    control=`<div class="stategrid">`+STATE_CODES.map(c=>`<button type="button" class="stchip" data-code="${c}">${c}</button>`).join("")+`</div><div class="stcount"><b>0</b> states selected</div>`;
  }else if(f.type==="singleselect"){
    control=`<select name="${f.key}"><option value="">Select\u2026</option>`+f.options.map(o=>`<option value="${o}">${o}</option>`).join("")+`</select>`;
  }else if(f.type==="yesno"){
    control=`<div class="yn">
      <input type="radio" id="${f.key}_y" name="${f.key}" value="Yes"/><label for="${f.key}_y">Yes</label>
      <input type="radio" id="${f.key}_n" name="${f.key}" value="No"/><label for="${f.key}_n">No</label></div>`;
  }else if(f.type==="textarea"){
    control=`<textarea name="${f.key}" ${f.maxwords?`data-maxwords="${f.maxwords}"`:''} ${f.placeholder?`placeholder="${f.placeholder}"`:''}></textarea>`;
  }else if(f.type==="currency"){
    control=`<div class="money"><input type="number" min="0" step="1000" name="${f.key}" ${f.placeholder?`placeholder="${f.placeholder}"`:''}/></div>`;
  }else{
    const t={text:"text",email:"email",phone:"tel",number:"number",url:"url",date:"date"}[f.type]||"text";
    const attrs=[f.placeholder?`placeholder="${f.placeholder}"`:'',f.autocomplete?`autocomplete="${f.autocomplete}"`:'',f.min!=null?`min="${f.min}"`:'',f.max!=null?`max="${f.max}"`:''].join(" ");
    control=`<input type="${t}" name="${f.key}" ${attrs}/>`;
  }
  el.innerHTML=`<span class="flabel">${f.label}${star}</span>${f.hint?hint:''}${control}<div class="err-msg">This field is required.</div>`;
  return el;
}

/* ---------- conditional visibility (supports value + in[]) ---------- */
function depSatisfied(dep){
  const v=getVal(dep.field);
  if(dep.in)return dep.in.includes(v);
  if(dep.value!=null)return v===dep.value;
  return false;
}
function refreshConditionals(){
  STEPS.flatMap(s=>s.fields).forEach(f=>{
    if(!f.key||!f.dependsOn)return;
    const wrap=document.querySelector(`.field[data-key="${f.key}"]`);
    if(!wrap)return;
    const on=depSatisfied(f.dependsOn);
    wrap.style.display=on?"":"none";
    if(!on)clearField(f.key);
  });
}
stepsEl.addEventListener("change",refreshConditionals);

/* ---------- value helpers ---------- */
function fieldByKey(k){return STEPS.flatMap(s=>s.fields).find(f=>f.key===k);}
function getVal(key){
  const f=fieldByKey(key);if(!f)return "";
  if(f.type==="multiselect")return [...document.querySelectorAll(`input[name="${key}"]:checked`)].map(i=>i.value).join(";");
  if(f.type==="stategrid")return [...document.querySelectorAll(`.field[data-key="${key}"] .stchip.on`)].map(b=>b.dataset.code).join(";");
  if(f.type==="yesno"){const c=document.querySelector(`input[name="${key}"]:checked`);return c?c.value:"";}
  const el=document.querySelector(`[name="${key}"]`);return el?el.value.trim():"";
}
function clearField(key){
  document.querySelectorAll(`[name="${key}"]`).forEach(el=>{
    if(el.type==="checkbox"||el.type==="radio")el.checked=false;else el.value="";
  });
  document.querySelectorAll(`.field[data-key="${key}"] .stchip.on`).forEach(b=>b.classList.remove("on"));
  const c=document.querySelector(`.field[data-key="${key}"] .stcount b`);if(c)c.textContent="0";
}
function isVisible(el){return el.style.display!=="none";}

/* ---------- state-chip toggle ---------- */
stepsEl.addEventListener("click",e=>{
  const chip=e.target.closest(".stchip");if(!chip)return;
  chip.classList.toggle("on");
  const grid=chip.closest(".field");
  const n=grid.querySelectorAll(".stchip.on").length;
  const c=grid.querySelector(".stcount b");if(c)c.textContent=n;
  if(n>0)grid.classList.remove("invalid");
});

/* ---------- validation ---------- */
function validateStep(i){
  let ok=true;
  STEPS[i].fields.forEach(f=>{
    if(!f.key)return;
    const wrap=document.querySelector(`.step[data-step="${i}"] .field[data-key="${f.key}"]`);
    if(!wrap||!isVisible(wrap))return;
    wrap.classList.remove("invalid");
    wrap.querySelector(".err-msg").textContent="This field is required.";
    if(f.required && !getVal(f.key)){wrap.classList.add("invalid");ok=false;}
    if(f.type==="email"&&getVal(f.key)&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(getVal(f.key))){
      wrap.classList.add("invalid");wrap.querySelector(".err-msg").textContent="Enter a valid email address.";ok=false;
    }
    if(f.maxwords){
      const w=getVal(f.key).split(/\s+/).filter(Boolean).length;
      if(w>f.maxwords){wrap.classList.add("invalid");wrap.querySelector(".err-msg").textContent=`Please keep to ${f.maxwords} words (currently ${w}).`;ok=false;}
    }
  });
  return ok;
}

/* ---------- review ---------- */
function buildReview(){
  const body=document.getElementById("reviewBody");body.className="";body.innerHTML="";
  STEPS.slice(0,5).forEach(s=>{
    let dl="";
    s.fields.forEach(f=>{if(!f.key)return;const v=getVal(f.key);if(!v)return;dl+=`<dt>${f.label}</dt><dd>${v.replace(/;/g,", ")}</dd>`;});
    const grp=document.createElement("div");grp.className="review-grp";
    grp.innerHTML=`<h4>${s.label}</h4><dl>${dl||'<dd class="fhelp">No entries</dd>'}</dl>`;
    body.appendChild(grp);
  });
}

/* ---------- navigation ---------- */
function show(i){
  document.querySelectorAll(".step").forEach(s=>s.classList.toggle("active",+s.dataset.step===i));
  document.querySelectorAll(".stp").forEach((p,idx)=>{
    const done=idx<i;
    p.classList.toggle("active",idx===i);p.classList.toggle("done",done);
    p.querySelector(".num").innerHTML=done?stepCheck:(idx+1);
  });
  pfill.style.width=(((i+1)/STEPS.length)*100)+"%";
  backBtn.style.visibility=i===0?"hidden":"visible";
  backBtn.innerHTML="\u2190 Back";
  nextBtn.innerHTML=i===STEPS.length-1?"Submit application":`Continue \u2014 ${STEPS[i+1].label} \u2192`;
  if(i===STEPS.length-1)buildReview();
  window.scrollTo({top:0,behavior:"smooth"});
  requestParentScroll();
  postHeight();
}
backBtn.onclick=()=>{if(current>0){current--;show(current);}};
nextBtn.onclick=()=>{
  if(!validateStep(current)){
    const bad=document.querySelector(`.step[data-step="${current}"] .field.invalid`);
    if(bad)bad.scrollIntoView({behavior:"smooth",block:"center"});
    postHeight();
    return;
  }
  if(current<STEPS.length-1){current++;show(current);}else submit();
};

/* ---------- submit ---------- */
async function submit(){
  const payload={};
  STEPS.flatMap(s=>s.fields).filter(f=>f.key).forEach(f=>{payload[f.key]=getVal(f.key);});
  payload.Source_Form="ce-esco";payload.Submitted_At=new Date().toISOString();
  nextBtn.disabled=true;nextBtn.textContent="Submitting\u2026";
  try{
    const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!res.ok)throw new Error("Submission rejected with status "+res.status);
    renderDone();
  }catch(err){
    nextBtn.disabled=false;nextBtn.textContent="Submit application";
    alert("We couldn\u2019t submit your application just now. Please check your connection and try again, or email info@catholicenergies.org.");
  }
}
function renderDone(){
  document.querySelector(".card").innerHTML=`<div class="done">
    <div class="ring"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 12.5 10 18 20 6" stroke="var(--orange-dk)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <h2>Application received</h2>
    <p>Thank you. Your ESCO qualification has been submitted to Catholic Energies for review. A member of the Catholic Energies team will follow up with next steps.</p></div>`;
  document.querySelectorAll(".stp").forEach(p=>{p.classList.remove("active");p.classList.add("done");p.querySelector(".num").innerHTML=stepCheck;});
  pfill.style.width="100%";
  requestParentScroll();
  postHeight();
}

/* ---------- phone auto-format (US) ---------- */
function fmtPhone(v){const d=v.replace(/\D/g,'').slice(0,10);if(d.length<4)return d;if(d.length<7)return `(${d.slice(0,3)}) ${d.slice(3)}`;return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;}
document.querySelectorAll('input[type="tel"]').forEach(inp=>{inp.addEventListener('blur',()=>{if(inp.value.trim())inp.value=fmtPhone(inp.value);});});

refreshConditionals();
show(0);

/* ---------- keep parent iframe sized to content ---------- */
if(isEmbedded && "ResizeObserver" in window){
  new ResizeObserver(postHeight).observe(document.body);
}
window.addEventListener("load",postHeight);
