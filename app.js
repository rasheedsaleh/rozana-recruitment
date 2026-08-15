const KEY="rozana_app_v1";
const WORKER_NATIONALITIES=["إثيوبيا","غانا","بروندي","الفلبين","بنغلادش","نيبال","أوغندا","أخرى"];
const initial = {
  workers:[], payments:[],
  settings:{
    companyName:"روزنا الأردنية لاستخدام العاملين في المنازل",
    companyPhone:"",
    managerName:"المدير",
    managerEmail:"rasheedsaleh23@icloud.com",
    managerPassword:"Rasheed12345@",
    themeColor:"#16805c",
    users:[]
  }
};
let db = JSON.parse(localStorage.getItem(KEY) || "null") || initial;
if (!Array.isArray(db.workers)) db.workers=[];
if (!Array.isArray(db.payments)) db.payments=[];
if (!db.settings) db.settings={...initial.settings};
db.settings={...initial.settings,...db.settings};
if(!Array.isArray(db.settings.users)) db.settings.users=[];
if(!db.settings.managerEmail) db.settings.managerEmail=initial.settings.managerEmail;
if(!db.settings.managerName) db.settings.managerName=initial.settings.managerName;
if(!db.settings.managerPassword) db.settings.managerPassword=initial.settings.managerPassword;
if(!db.settings.themeColor) db.settings.themeColor=initial.settings.themeColor;
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
  if($("managerName")) $("managerName").value=db.settings.managerName||"";
  if($("managerEmail")) $("managerEmail").value=db.settings.managerEmail||"";
  if($("headerManagerName")) $("headerManagerName").textContent=db.settings.managerName||"المدير";
  if($("themeColor")) $("themeColor").value=db.settings.themeColor||"#16805c";
  document.documentElement.style.setProperty("--primary",db.settings.themeColor||"#16805c");
  renderUsers();
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

const ROZANA_LOGIN_EMAIL="rasheedsaleh23@icloud.com";
let currentUser=null;

function getUsers(){return Array.isArray(db.settings.users)?db.settings.users:[]}
function findUser(email,pass){
  if(email===db.settings.managerEmail && pass===db.settings.managerPassword)
    return {id:"manager",name:db.settings.managerName||"المدير",email:db.settings.managerEmail,role:"manager",permissions:["workers","payments","reports","settings"]};
  return getUsers().find(u=>u.email===email&&u.password===pass&&u.active!==false)||null;
}
function applyPermissions(user){
  document.querySelectorAll(".tab").forEach(tab=>{
    const ok=user.role==="manager"||(user.permissions||[]).includes(tab.dataset.tab);
    tab.style.display=ok?"":"none";
  });
}
function showApp(user){
  currentUser=user||currentUser||{role:"manager",name:db.settings.managerName||"المدير",email:db.settings.managerEmail,permissions:["workers","payments","reports","settings"]};
  localStorage.setItem("rozana_session",JSON.stringify({email:currentUser.email,role:currentUser.role,name:currentUser.name}));
  $("loginView").classList.add("hidden");$("appView").classList.remove("hidden");
  applyPermissions(currentUser);renderAll();
}
$("loginBtn").onclick=()=>{
  const email=$("email").value.trim(),pass=$("password").value,user=findUser(email,pass);
  if(user){$("loginError").textContent="";showApp(user)}
  else $("loginError").textContent="البريد الإلكتروني أو كلمة المرور غير صحيحة.";
};
$("logoutBtn").onclick=()=>{localStorage.removeItem("rozana_session");currentUser=null;$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");$("password").value=""}

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

function renderUsers(){
  const body=$("usersTable");if(!body)return;
  body.innerHTML=getUsers().map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role==="accounting"?"حسابات":u.role==="viewer"?"مشاهد":"موظف"}</td><td class="user-perm">${(u.permissions||[]).join("، ")}</td><td><button class="small-btn danger" onclick="deleteUser('${u.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="5">لا يوجد موظفون</td></tr>';
}
window.deleteUser=id=>{if(confirm("حذف الموظف؟")){db.settings.users=getUsers().filter(u=>u.id!==id);save()}};
$("saveManager").onclick=()=>{db.settings.managerName=$("managerName").value.trim()||"المدير";db.settings.managerEmail=$("managerEmail").value.trim()||ROZANA_LOGIN_EMAIL;save();alert("تم حفظ بيانات المدير")};
$("addUser").onclick=()=>{
  const name=$("newUserName").value.trim(),email=$("newUserEmail").value.trim(),password=$("newUserPassword").value,role=$("newUserRole").value;
  const permissions=[...document.querySelectorAll(".perm:checked")].map(x=>x.value);
  if(!name||!email||password.length<6){alert("أدخل اسم الموظف والبريد وكلمة مرور من 6 أحرف على الأقل");return}
  if(email===db.settings.managerEmail||getUsers().some(u=>u.email===email)){alert("البريد مستخدم مسبقًا");return}
  db.settings.users.push({id:uid(),name,email,password,role,permissions,active:true});save();
  $("newUserName").value="";$("newUserEmail").value="";$("newUserPassword").value="";
  alert("تمت إضافة الموظف");
};
$("changePassword").onclick=()=>{
  const cur=$("currentPassword").value,nw=$("newPassword").value,cf=$("confirmPassword").value;
  if(currentUser?.role!=="manager"){alert("تغيير كلمة المرور متاح للمدير فقط");return}
  if(cur!==db.settings.managerPassword){alert("كلمة المرور الحالية غير صحيحة");return}
  if(nw.length<6||nw!==cf){alert("كلمة المرور الجديدة يجب أن تتطابق وأن تكون 6 أحرف على الأقل");return}
  db.settings.managerPassword=nw;save();$("currentPassword").value="";$("newPassword").value="";$("confirmPassword").value="";alert("تم تغيير كلمة المرور");
};
$("saveTheme").onclick=()=>{db.settings.themeColor=$("themeColor").value;document.documentElement.style.setProperty("--primary",db.settings.themeColor);save();alert("تم حفظ لون النظام")};

$("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozana-backup.json";a.click();URL.revokeObjectURL(a.href)};
$("importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();alert("تم الاستيراد")}catch{alert("الملف غير صالح")}};r.readAsText(f)};

function report(type){
  let title="تقرير روزنا",html="";
  const company=esc(db.settings.companyName);
  if(type==="workers"||type==="all"){
    html+=`<h2>العاملات</h2><table><tr><th>الاسم</th><th>الجنسية</th><th>الجواز</th><th>الحالة</th></tr>${db.workers.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.nationality)}</td><td>${esc(w.passport)}</td><td>${esc(w.status)}</td></tr>`).join("")}</table>`;
  }
  if(type==="payments"||type==="all"){
    html+=`<h2>الدفعات</h2><table><tr><th>العاملة</th><th>المبلغ</th><th>الطريقة</th><th>التاريخ</th></tr>${db.payments.map(p=>`<tr><td>${esc(workerName(p.workerId))}</td><td>${esc(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.date)}</td></tr>`).join("")}</table>`;
  }
  const w=window.open("","_blank");
  w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #bbb;padding:8px;text-align:right}th{background:#eee}@media print{.print{display:none}}</style></head><body><button class="print" onclick="print()">طباعة / حفظ PDF</button><h1>${company}</h1><div>تقرير صادر بتاريخ ${today()}</div>${html}</body></html>`);
  w.document.close();
}
document.querySelectorAll(".report-card").forEach(b=>b.onclick=()=>report(b.dataset.report));

const session=localStorage.getItem("rozana_session");
if(session){
  try{
    const s=JSON.parse(session);
    const u=s.role==="manager"
      ? {email:db.settings.managerEmail,name:db.settings.managerName,role:"manager",permissions:["workers","payments","reports","settings"]}
      : getUsers().find(x=>x.email===s.email);
    if(u) showApp(u); else localStorage.removeItem("rozana_session");
  }catch{localStorage.removeItem("rozana_session")}
}
