const KEY="rozana_app_v1";
const WORKER_NATIONALITIES=["إثيوبيا","غانا","بروندي","الفلبين","بنغلادش","نيبال","أوغندا","أخرى"];
const initial = {workers:[],payments:[],settings:{companyName:"روزنا الأردنية لاستخدام العاملين في المنازل",companyPhone:""}};
let db = JSON.parse(localStorage.getItem(KEY) || "null") || initial;
if (!Array.isArray(db.workers)) db.workers=[];
if (!Array.isArray(db.payments)) db.payments=[];
if (!db.settings) db.settings=initial.settings;
delete db.contracts;

function save(){localStorage.setItem(KEY,JSON.stringify(db)); renderAll();}
function $(id){return document.getElementById(id)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function today(){return new Date().toISOString().slice(0,10)}
function workerName(id){return db.workers.find(w=>w.id===id)?.name || "—"}

function renderAll(){
  $("workersCount").textContent=db.workers.length;
  $("activeCount").textContent=db.workers.filter(w=>w.status!=="غادرت").length;
  $("paymentsTotal").textContent=db.payments.reduce((a,p)=>a+Number(p.amount||0),0).toFixed(2)+" د.أ";
  renderWorkers(); renderPayments(); fillWorkerSelects();
  $("companyName").value=db.settings.companyName||"";
  $("companyPhone").value=db.settings.companyPhone||"";
}

function renderWorkers(){
 const q=$("workerSearch").value.trim().toLowerCase(), st=$("workerStatus").value, nat=$("workerNationality").value;
 const rows=db.workers.filter(w=>(!q||[w.name,w.passport,w.phone].join(" ").toLowerCase().includes(q))&&(!st||w.status===st)&&(!nat||w.nationality===nat));
 $("workersTable").innerHTML=rows.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.nationality)}</td><td>${esc(w.passport)}</td><td>${esc(w.status)}</td><td>${esc(w.created)}</td><td><button class="small-btn" onclick="editWorker('${w.id}')">تعديل</button><button class="small-btn danger" onclick="deleteWorker('${w.id}')">حذف</button></td></tr>`).join("") || `<tr><td colspan="6">لا توجد بيانات</td></tr>`;
}
function renderPayments(){
 $("paymentsTable").innerHTML=db.payments.map(p=>`<tr><td>${esc(workerName(p.workerId))}</td><td>${esc(p.amount)} د.أ</td><td>${esc(p.method)}</td><td>${esc(p.date)}</td><td>${esc(p.notes)}</td><td><button class="small-btn danger" onclick="deletePayment('${p.id}')">حذف</button></td></tr>`).join("")||`<tr><td colspan="6">لا توجد دفعات</td></tr>`;
}
function fillWorkerSelects(){
 for(const id of ["pWorker"]){$(id).innerHTML=db.workers.map(w=>`<option value="${w.id}">${esc(w.name)} — ${esc(w.passport)}</option>`).join("")}
}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random()}

$("loginBtn").onclick=()=>{
  const email=$("email").value.trim();
  const pass=$("password").value;
  const saved=localStorage.getItem("rozana_login");

  if(!email || pass.length<6){
    $("loginError").textContent="أدخل البريد الإلكتروني وكلمة مرور من 6 أحرف على الأقل.";
    return;
  }

  if(!saved){
    localStorage.setItem(
      "rozana_login",
      JSON.stringify({email,pass})
    );
    showApp();
    return;
  }

  try{
    const c=JSON.parse(saved);

    if(email===c.email && pass===c.pass){
      showApp();
    }else{
      $("loginError").textContent="البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
  }catch(e){
    localStorage.removeItem("rozana_login");
    $("loginError").textContent="تمت إعادة ضبط بيانات الدخول. أدخل البيانات مرة أخرى.";
  }
};

const resetLoginBtn=document.createElement("button");
resetLoginBtn.type="button";
resetLoginBtn.textContent="إعادة ضبط بيانات الدخول";
resetLoginBtn.style.cssText=
  "margin-top:14px;background:transparent;border:0;color:#16805c;font-size:14px;cursor:pointer;width:100%;";

resetLoginBtn.onclick=()=>{
  if(confirm("هل تريد إعادة ضبط بيانات الدخول لهذا الجهاز؟")){
    localStorage.removeItem("rozana_login");
    $("email").value="";
    $("password").value="";
    $("loginError").textContent="تمت إعادة ضبط بيانات الدخول. أدخل بريدك وكلمة المرور الجديدة.";
  }
};

$("loginBtn").parentElement.appendChild(resetLoginBtn);
};
function showApp(){$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");renderAll()}
$("logoutBtn").onclick=()=>{$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");$("password").value=""}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
["workerSearch","workerStatus","workerNationality"].forEach(id=>$(id).addEventListener("input",renderWorkers));

$("addWorker").onclick=()=>{ $("workerForm").reset(); $("workerId").value=""; $("workerDialogTitle").textContent="إضافة عاملة"; $("workerDialog").showModal() };
window.editWorker=id=>{const w=db.workers.find(x=>x.id===id); if(!w)return; $("workerId").value=w.id;$("wName").value=w.name;$("wNationality").value=w.nationality;$("wPassport").value=w.passport;$("wGuarantorName").value=w.guarantorName||"";$("wGuarantorNationality").value=w.guarantorNationality||"أردني";$("wPhone").value=w.phone;$("wStatus").value=w.status;$("wDob").value=w.dob||"";$("wNotes").value=w.notes||"";$("workerDialogTitle").textContent="تعديل ملف العاملة";$("workerDialog").showModal()};
window.deleteWorker=id=>{if(confirm("حذف ملف العاملة؟")){db.workers=db.workers.filter(x=>x.id!==id);db.payments=db.payments.filter(x=>x.workerId!==id);save()}};
$("workerForm").addEventListener("submit",e=>{e.preventDefault();const id=$("workerId").value;const data={name:$("wName").value,nationality:$("wNationality").value,passport:$("wPassport").value,guarantorName:$("wGuarantorName").value,guarantorNationality:$("wGuarantorNationality").value,phone:$("wPhone").value,status:$("wStatus").value,dob:$("wDob").value,notes:$("wNotes").value,created:today()};if(id){Object.assign(db.workers.find(x=>x.id===id),data)}else{db.workers.push({id:uid(),...data})}$("workerDialog").close();save()});


$("addPayment").onclick=()=>{fillWorkerSelects();$("paymentForm").reset();$("pDate").value=today();$("paymentDialog").showModal()};
$("paymentForm").addEventListener("submit",e=>{e.preventDefault();db.payments.push({id:uid(),workerId:$("pWorker").value,amount:$("pAmount").value,method:$("pMethod").value,date:$("pDate").value,notes:$("pNotes").value});$("paymentDialog").close();save()});
window.deletePayment=id=>{if(confirm("حذف الدفعة؟")){db.payments=db.payments.filter(x=>x.id!==id);save()}};

$("saveSettings").onclick=()=>{db.settings.companyName=$("companyName").value;db.settings.companyPhone=$("companyPhone").value;save();alert("تم الحفظ")};

$("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozana-backup.json";a.click();URL.revokeObjectURL(a.href)};
$("importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();alert("تم الاستيراد")}catch{alert("الملف غير صالح")}};r.readAsText(f)};

function report(type){
 let title="تقرير روزنا", html="";
 const company=esc(db.settings.companyName);
 if(type==="workers"||type==="all"){html+=`<h2>العاملات</h2><table><tr><th>الاسم</th><th>الجنسية</th><th>الجواز</th><th>الحالة</th></tr>${db.workers.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.nationality)}</td><td>${esc(w.passport)}</td><td>${esc(w.status)}</td></tr>`).join("")}</table>`}</td><td>${esc(c.employer)}</td><td>${esc(c.date)}</td><td>${esc(c.salary)}</td><td>${esc(c.status)}</td></tr>`).join("")}</table>`}
 if(type==="payments"||type==="all"){html+=`<h2>الدفعات</h2><table><tr><th>العاملة</th><th>المبلغ</th><th>الطريقة</th><th>التاريخ</th></tr>${db.payments.map(p=>`<tr><td>${esc(workerName(p.workerId))}</td><td>${esc(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.date)}</td></tr>`).join("")}</table>`}
 const w=window.open("","_blank");w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;padding:30px}h1{margin-bottom:4px}h2{margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #bbb;padding:8px;text-align:right}th{background:#eee}.print{margin-bottom:20px}@media print{.print{display:none}}</style></head><body><button class="print" onclick="print()">طباعة / حفظ PDF</button><h1>${company}</h1><div>تقرير صادر بتاريخ ${today()}</div>${html}</body></html>`);w.document.close();
}
document.querySelectorAll(".report-card").forEach(b=>b.onclick=()=>report(b.dataset.report));

if(localStorage.getItem("rozana_login")){$("loginError").textContent="تم إعداد تسجيل الدخول لهذا الجهاز. أدخل بياناتك للدخول."}
