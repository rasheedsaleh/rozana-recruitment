const KEY="rozana_app_v2";
const SESSION_KEY="rozana_session";
const TELEGRAM_LOGIN_ENDPOINT="/api/telegram-login";
const WORKER_NATIONALITIES=["إثيوبيا","غانا","بوروندي","الفلبين","بنغلادش","نيبال","أوغندا","أخرى"];
const GUARANTOR_NATIONALITIES=["أردني","فلسطيني","سوري","عراقي","سعودي","كويتي","إماراتي","قطري","مصري","لبناني","أخرى"];

const initial={
 workers:[], guarantors:[], payments:[], expenses:[], followups:[],
 settings:{
  companyName:"روزنا الأردنية لاستخدام العاملين في المنازل", companyPhone:"",
  managerName:"المدير", managerEmail:"rasheedsaleh23@icloud.com",
  managerPassword:"Rasheed12345@", themeColor:"#1f7a5a", users:[]
 }
};

let db=JSON.parse(localStorage.getItem(KEY)||"null")||initial;
db={...initial,...db,settings:{...initial.settings,...(db.settings||{})}};
for(const k of ["workers","guarantors","payments","expenses","followups"]) if(!Array.isArray(db[k])) db[k]=[];
if(!Array.isArray(db.settings.users))db.settings.users=[];
delete db.contracts;
localStorage.setItem(KEY,JSON.stringify(db));

let currentUser=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>Number(n||0).toFixed(2)+" د.أ";
const save=()=>{localStorage.setItem(KEY,JSON.stringify(db));renderAll()};
const users=()=>db.settings.users||[];
const workerName=id=>db.workers.find(x=>x.id===id)?.name||"—";
const guarantorCount=name=>db.workers.filter(w=>w.guarantorName===name).length;

function renderAll(){
 $("workersCount").textContent=db.workers.length;
 $("activeCount").textContent=db.workers.filter(w=>w.status!=="غادرت").length;
 const pt=db.payments.reduce((a,p)=>a+Number(p.amount||0),0);
 const et=db.expenses.reduce((a,p)=>a+Number(p.amount||0),0);
 $("paymentsTotal").textContent=money(pt);$("expensesTotal").textContent=money(et);
 $("expensesPanelTotal").textContent=money(et);
 $("reportPayments").textContent=money(pt);$("reportExpenses").textContent=money(et);$("reportBalance").textContent=money(pt-et);
 $("companyName").value=db.settings.companyName||"";$("companyPhone").value=db.settings.companyPhone||"";
 $("managerName").value=db.settings.managerName||"";$("managerEmail").value=db.settings.managerEmail||"";
 $("headerManagerName").textContent=db.settings.managerName||"المدير";$("brandName").textContent=(db.settings.companyName||"روزنا").split(" ")[0]||"روزنا";
 $("themeColor").value=db.settings.themeColor||"#1f7a5a";
 document.documentElement.style.setProperty("--primary",db.settings.themeColor||"#1f7a5a");
 renderWorkers();renderGuarantors();renderPayments();renderExpenses();renderFollowups();renderUsers();fillWorkerSelects();
}
function renderWorkers(){
 const q=$("workerSearch").value.trim().toLowerCase(),st=$("workerStatus").value,n=$("workerNationality").value;
 const rows=db.workers.filter(w=>(!q||[w.name,w.passport,w.phone,w.guarantorName].join(" ").toLowerCase().includes(q))&&(!st||w.status===st)&&(!n||w.nationality===n));
 $("workersTable").innerHTML=rows.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.nationality)}</td><td>${esc(w.passport)}</td><td>${esc(w.guarantorName)}</td><td>${esc(w.status)}</td><td>${esc(w.created)}</td><td><button class="small-btn" onclick="editWorker('${w.id}')">تعديل</button><button class="small-btn danger" onclick="deleteWorker('${w.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="7">لا توجد بيانات</td></tr>';
}
function renderGuarantors(){
 const q=$("guarantorSearch").value.trim().toLowerCase(),n=$("guarantorNationalityFilter").value;
 const rows=db.guarantors.filter(g=>(!q||[g.name,g.phone].join(" ").toLowerCase().includes(q))&&(!n||g.nationality===n));
 $("guarantorsTable").innerHTML=rows.map(g=>`<tr><td>${esc(g.name)}</td><td>${esc(g.nationality)}</td><td>${esc(g.phone)}</td><td>${guarantorCount(g.name)}</td><td><button class="small-btn" onclick="editGuarantor('${g.id}')">تعديل</button><button class="small-btn danger" onclick="deleteGuarantor('${g.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="5">لا يوجد كفلاء</td></tr>';
}
function renderPayments(){
 $("paymentsTable").innerHTML=db.payments.map(p=>`<tr><td>${esc(workerName(p.workerId))}</td><td>${money(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.date)}</td><td>${esc(p.notes)}</td><td><button class="small-btn danger" onclick="deletePayment('${p.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="6">لا توجد دفعات</td></tr>';
}
function renderExpenses(){
 $("expensesTable").innerHTML=db.expenses.map(e=>`<tr><td>${esc(e.title)}</td><td>${money(e.amount)}</td><td>${esc(e.date)}</td><td>${esc(e.notes)}</td><td><button class="small-btn danger" onclick="deleteExpense('${e.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="5">لا توجد مصاريف</td></tr>';
}
function renderFollowups(){
 $("followupTable").innerHTML=db.followups.map(f=>`<tr><td>${esc(workerName(f.workerId))}</td><td>${esc(f.date)}</td><td>${esc(f.type)}</td><td>${esc(f.status)}</td><td>${esc(f.notes)}</td><td><button class="small-btn danger" onclick="deleteFollowup('${f.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="6">لا توجد متابعات</td></tr>';
}
function fillWorkerSelects(){
 for(const id of ["pWorker","fWorker"])$(id).innerHTML=db.workers.map(w=>`<option value="${w.id}">${esc(w.name)} — ${esc(w.passport)}</option>`).join("");
}
function applyPermissions(u){
 document.querySelectorAll(".tab").forEach(t=>t.style.display=(u.role==="manager"||(u.permissions||[]).includes(t.dataset.tab))?"":"none");
}
function findUser(email,pass){
 if(email===db.settings.managerEmail&&pass===db.settings.managerPassword)return {id:"manager",name:db.settings.managerName||"المدير",email,role:"manager",permissions:["workers","guarantors","payments","expenses","followup","reports","settings"]};
 return users().find(u=>u.email===email&&u.password===pass&&u.active!==false)||null;
}
function persistSession(u){localStorage.setItem(SESSION_KEY,JSON.stringify({email:u.email,role:u.role,name:u.name}))}
function showApp(u){
 currentUser=u;persistSession(u);$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");applyPermissions(u);renderAll();
}
async function notifyTelegramLogin(u){
 try{await fetch(TELEGRAM_LOGIN_ENDPOINT,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:u.name,email:u.email,role:u.role,time:new Date().toISOString()}),keepalive:true})}catch(_){}
}
$("loginBtn").onclick=()=>{const u=findUser($("email").value.trim(),$("password").value);if(u){$("loginError").textContent="";showApp(u);notifyTelegramLogin(u)}else $("loginError").textContent="البريد الإلكتروني أو كلمة المرور غير صحيحة."};
$("logoutBtn").onclick=()=>{localStorage.removeItem(SESSION_KEY);currentUser=null;$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");$("password").value=""};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
["workerSearch","workerStatus","workerNationality"].forEach(id=>$(id).addEventListener("input",renderWorkers));
["guarantorSearch","guarantorNationalityFilter"].forEach(id=>$(id).addEventListener("input",renderGuarantors));

$("addWorker").onclick=()=>{$("workerForm").reset();$("workerId").value="";$("workerDialogTitle").textContent="إضافة عاملة";$("workerDialog").showModal()};
$("workerForm").addEventListener("submit",e=>{e.preventDefault();const id=$("workerId").value,data={name:$("wName").value.trim(),nationality:$("wNationality").value,passport:$("wPassport").value.trim(),guarantorName:$("wGuarantorName").value.trim(),guarantorNationality:$("wGuarantorNationality").value,phone:$("wPhone").value.trim(),status:$("wStatus").value,dob:$("wDob").value,notes:$("wNotes").value,created:today()};if(id)Object.assign(db.workers.find(x=>x.id===id),data);else db.workers.push({id:uid(),...data});$("workerDialog").close();save()});
window.editWorker=id=>{const w=db.workers.find(x=>x.id===id);if(!w)return;$("workerId").value=id;$("wName").value=w.name;$("wNationality").value=w.nationality;$("wPassport").value=w.passport;$("wGuarantorName").value=w.guarantorName||"";$("wGuarantorNationality").value=w.guarantorNationality||"أردني";$("wPhone").value=w.phone||"";$("wStatus").value=w.status;$("wDob").value=w.dob||"";$("wNotes").value=w.notes||"";$("workerDialogTitle").textContent="تعديل ملف العاملة";$("workerDialog").showModal()};
window.deleteWorker=id=>{if(confirm("حذف ملف العاملة؟")){db.workers=db.workers.filter(x=>x.id!==id);db.payments=db.payments.filter(x=>x.workerId!==id);db.followups=db.followups.filter(x=>x.workerId!==id);save()}};

$("addGuarantor").onclick=()=>{$("guarantorForm").reset();$("gId").value="";$("guarantorDialog").showModal()};
$("guarantorForm").addEventListener("submit",e=>{e.preventDefault();const id=$("gId").value,data={name:$("gName").value.trim(),nationality:$("gNationality").value,phone:$("gPhone").value.trim(),notes:$("gNotes").value};if(id)Object.assign(db.guarantors.find(x=>x.id===id),data);else db.guarantors.push({id:uid(),...data});$("guarantorDialog").close();save()});
window.editGuarantor=id=>{const g=db.guarantors.find(x=>x.id===id);if(!g)return;$("gId").value=id;$("gName").value=g.name;$("gNationality").value=g.nationality;$("gPhone").value=g.phone;$("gNotes").value=g.notes||"";$("guarantorDialog").showModal()};
window.deleteGuarantor=id=>{if(confirm("حذف الكفيل؟")){db.guarantors=db.guarantors.filter(x=>x.id!==id);save()}};

$("addPayment").onclick=()=>{fillWorkerSelects();$("paymentForm").reset();$("pDate").value=today();$("paymentDialog").showModal()};
$("paymentForm").addEventListener("submit",e=>{e.preventDefault();db.payments.push({id:uid(),workerId:$("pWorker").value,amount:$("pAmount").value,method:$("pMethod").value,date:$("pDate").value,notes:$("pNotes").value});$("paymentDialog").close();save()});
window.deletePayment=id=>{if(confirm("حذف الدفعة؟")){db.payments=db.payments.filter(x=>x.id!==id);save()}};

$("addExpense").onclick=()=>{$("expenseForm").reset();$("eDate").value=today();$("expenseDialog").showModal()};
$("expenseForm").addEventListener("submit",e=>{e.preventDefault();db.expenses.push({id:uid(),title:$("eTitle").value,amount:$("eAmount").value,date:$("eDate").value,notes:$("eNotes").value});$("expenseDialog").close();save()});
window.deleteExpense=id=>{if(confirm("حذف المصروف؟")){db.expenses=db.expenses.filter(x=>x.id!==id);save()}};

$("addFollowup").onclick=()=>{fillWorkerSelects();$("followupForm").reset();$("fDate").value=today();$("followupDialog").showModal()};
$("followupForm").addEventListener("submit",e=>{e.preventDefault();db.followups.push({id:uid(),workerId:$("fWorker").value,date:$("fDate").value,type:$("fType").value,status:$("fStatus").value,notes:$("fNotes").value});$("followupDialog").close();save()});
window.deleteFollowup=id=>{if(confirm("حذف المتابعة؟")){db.followups=db.followups.filter(x=>x.id!==id);save()}};

$("saveSettings").onclick=()=>{db.settings.companyName=$("companyName").value;db.settings.companyPhone=$("companyPhone").value;save();alert("تم الحفظ")};
$("saveManager").onclick=()=>{const email=$("managerEmail").value.trim();if(!email)return alert("البريد مطلوب");db.settings.managerName=$("managerName").value.trim()||"المدير";db.settings.managerEmail=email;save();alert("تم حفظ بيانات المدير")};
$("addUser").onclick=()=>{const name=$("newUserName").value.trim(),email=$("newUserEmail").value.trim(),password=$("newUserPassword").value,role=$("newUserRole").value,permissions=[...document.querySelectorAll(".perm:checked")].map(x=>x.value);if(!name||!email||password.length<6)return alert("أدخل الاسم والبريد وكلمة مرور من 6 أحرف على الأقل");if(email.toLowerCase()===db.settings.managerEmail.toLowerCase()||users().some(u=>u.email.toLowerCase()===email.toLowerCase()))return alert("البريد مستخدم مسبقًا");db.settings.users.push({id:uid(),name,email,password,role,permissions,active:true});save();$("newUserName").value="";$("newUserEmail").value="";$("newUserPassword").value="";alert("تمت إضافة الموظف")};
function renderUsers(){$("usersTable").innerHTML=users().map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role==="accounting"?"حسابات":u.role==="viewer"?"مشاهد":"موظف"}</td><td class="user-perm">${(u.permissions||[]).join("، ")}</td><td><button class="small-btn" onclick="editUser('${u.id}')">تعديل</button><button class="small-btn danger" onclick="deleteUser('${u.id}')">حذف</button></td></tr>`).join("")||'<tr><td colspan="5">لا يوجد موظفون</td></tr>'}
window.editUser=id=>{const u=users().find(x=>x.id===id);if(!u)return;const n=prompt("اسم الموظف",u.name),e=prompt("البريد الإلكتروني",u.email);if(n===null||e===null)return;const r=prompt("الدور: employee / accounting / viewer",u.role)||u.role,p=prompt("الصلاحيات: workers,guarantors,payments,expenses,followup,reports,settings",(u.permissions||[]).join(","));if(!n.trim()||!e.trim())return;if(users().some(x=>x.id!==id&&x.email.toLowerCase()===e.trim().toLowerCase())||e.trim().toLowerCase()===db.settings.managerEmail.toLowerCase())return alert("البريد مستخدم مسبقًا");u.name=n.trim();u.email=e.trim();u.role=["employee","accounting","viewer"].includes(r)?r:"employee";u.permissions=(p||"").split(",").map(x=>x.trim()).filter(Boolean);const pw=prompt("كلمة مرور جديدة؟ اتركها فارغة للإبقاء على الحالية","");if(pw){if(pw.length<6)return alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");u.password=pw}save()};
window.deleteUser=id=>{if(confirm("حذف الموظف؟")){db.settings.users=users().filter(x=>x.id!==id);save()}};
$("changePassword").onclick=()=>{if(currentUser?.role!=="manager")return alert("تغيير كلمة المرور متاح للمدير فقط");if($("currentPassword").value!==db.settings.managerPassword)return alert("كلمة المرور الحالية غير صحيحة");if($("newPassword").value.length<6||$("newPassword").value!==$("confirmPassword").value)return alert("كلمة المرور الجديدة غير صحيحة");db.settings.managerPassword=$("newPassword").value;save();alert("تم تغيير كلمة المرور")};
$("saveTheme").onclick=()=>{db.settings.themeColor=$("themeColor").value;save();alert("تم حفظ اللون")};

$("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozana-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$("importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);db={...initial,...x,settings:{...initial.settings,...(x.settings||{})}};for(const k of ["workers","guarantors","payments","expenses","followups"])if(!Array.isArray(db[k]))db[k]=[];delete db.contracts;save();alert("تم الاستيراد")}catch{alert("الملف غير صالح")}};r.readAsText(f)};

function report(type){
 let html="",company=esc(db.settings.companyName);
 if(type==="workers"||type==="all")html+=`<h2>العاملات</h2><table><tr><th>الاسم</th><th>الجنسية</th><th>الجواز</th><th>الكفيل</th><th>الحالة</th></tr>${db.workers.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.nationality)}</td><td>${esc(w.passport)}</td><td>${esc(w.guarantorName)}</td><td>${esc(w.status)}</td></tr>`).join("")}</table>`;
 if(type==="payments"||type==="all")html+=`<h2>الدفعات</h2><table><tr><th>العاملة</th><th>المبلغ</th><th>الطريقة</th><th>التاريخ</th></tr>${db.payments.map(p=>`<tr><td>${esc(workerName(p.workerId))}</td><td>${money(p.amount)}</td><td>${esc(p.method)}</td><td>${esc(p.date)}</td></tr>`).join("")}</table>`;
 if(type==="expenses"||type==="all")html+=`<h2>المصاريف</h2><table><tr><th>البيان</th><th>المبلغ</th><th>التاريخ</th><th>ملاحظات</th></tr>${db.expenses.map(e=>`<tr><td>${esc(e.title)}</td><td>${money(e.amount)}</td><td>${esc(e.date)}</td><td>${esc(e.notes)}</td></tr>`).join("")}</table>`;
 const w=window.open("","_blank");if(!w)return alert("المتصفح منع فتح صفحة التقرير");w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>تقرير روزنا</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse;margin:12px 0 25px}th,td{border:1px solid #bbb;padding:8px;text-align:right}th{background:#eee}.print{padding:10px 16px}@media print{.print{display:none}}</style></head><body><button class="print" onclick="print()">طباعة / حفظ PDF</button><h1>${company}</h1><div>تاريخ التقرير: ${today()}</div>${html}</body></html>`);w.document.close();
}
document.querySelectorAll(".report-card").forEach(b=>b.onclick=()=>report(b.dataset.report));

const session=localStorage.getItem(SESSION_KEY);
if(session)try{const s=JSON.parse(session),u=s.role==="manager"?{email:db.settings.managerEmail,name:db.settings.managerName,role:"manager",permissions:["workers","guarantors","payments","expenses","followup","reports","settings"]}:users().find(x=>x.email===s.email);if(u)showApp(u);else localStorage.removeItem(SESSION_KEY)}catch{localStorage.removeItem(SESSION_KEY)}
