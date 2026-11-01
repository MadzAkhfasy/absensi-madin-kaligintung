import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// GANTI konfigurasi di bawah dengan konfigurasi aplikasi Firebase milik Madin.
const firebaseConfig = {
  apiKey: "AIzaSyCpZa_NnbTRGL1GxWS3ti6AKibBLs4rzcU",
  authDomain: "absensi-madin-kaligintung.firebaseapp.com",
  projectId: "absensi-madin-kaligintung",
  storageBucket: "absensi-madin-kaligintung.firebasestorage.app",
  messagingSenderId: "571440839483",
  appId: "1:571440839483:web:520afd3af143184e3e151e"
};
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const $ = id => document.getElementById(id);
const CLASS_NAMES = ["Kelas Jilid Pemula","Kelas Jilid 1","Kelas Jilid 2","Kelas Jilid 3","Kelas Jilid 4","Kelas Jilid 5"];
const STATUSES = ["Hadir","Izin","Sakit","Alpa"];
let currentUser=null, profile=null, classes=[], students=[], reportRows=[], reportMonthValue="", reportClassValue="";
const today = new Date().toLocaleDateString("sv-SE");
$("attendanceDate").value=today; $("todayLabel").textContent=new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
for(let i=0;i<12;i++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const v=d.toLocaleDateString("sv-SE").slice(0,7);const o=document.createElement("option");o.value=v;o.textContent=d.toLocaleDateString("id-ID",{month:"long",year:"numeric"});$("reportMonth").append(o);}
const msg=(id,t,err=false)=>{$(id).textContent=t;$(id).classList.toggle("error",err)};
const clsName=id=>classes.find(c=>c.id===id)?.name||"Belum ditetapkan";
const isAdmin=()=>profile?.role==="admin";
const myClass=()=>profile?.assignedClass||"";

$("loginBtn").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value)}catch(e){msg("authMsg",friendly(e),true)}};
$("logoutBtn").onclick=()=>signOut(auth);
function friendly(e){return ({ "auth/invalid-credential":"Email atau kata sandi salah.","auth/email-already-in-use":"Email sudah terdaftar.","auth/weak-password":"Kata sandi minimal 6 karakter.","auth/invalid-email":"Format email tidak valid."})[e.code]||e.message;}

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){$("authView").classList.remove("hidden");$("appView").classList.add("hidden");$("logoutBtn").classList.add("hidden");return;}
 try{
  const p=await getDoc(doc(db,"users",user.uid));
  if(!p.exists()){await signOut(auth);msg("authMsg","Profil belum dibuat. Hubungi admin.",true);return;}
  profile=p.data(); await loadClasses();
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  $("hello").textContent="Halo, "+(profile.name||user.email);$("roleInfo").textContent=isAdmin()?"Admin/Pengurus":"Pengajar · "+clsName(myClass());
  document.querySelectorAll(".admin-only").forEach(x=>x.classList.toggle("hidden",!isAdmin()));
  $("studentAdminForm").classList.toggle("hidden",!isAdmin());
  $("attendanceClassWrap").classList.toggle("hidden",!isAdmin());
  $("reportClassWrap").classList.toggle("hidden",!isAdmin());
  if(!isAdmin()&&!myClass()){$("attendanceList").innerHTML='<p class="muted">Akun Anda belum diberi kelas. Hubungi admin Madin.</p>';$("saveAttendanceBtn").classList.add("hidden");}
  await fillClassSelects();await loadStudents();await renderAttendance();await renderDashboard();
 }catch(e){console.error(e);alert("Gagal memuat data: "+e.message);}
});

async function loadClasses(){
 const snap=await getDocs(collection(db,"classes"));classes=snap.docs.map(d=>({id:d.id,...d.data()}));
 if(isAdmin()&&classes.length===0){for(let i=0;i<CLASS_NAMES.length;i++)await setDoc(doc(db,"classes","kelas"+(i+1)),{name:CLASS_NAMES[i],order:i+1});const s=await getDocs(collection(db,"classes"));classes=s.docs.map(d=>({id:d.id,...d.data()}));}
 classes.sort((a,b)=>(a.order||0)-(b.order||0));
}
async function fillClassSelects(){
 for(const id of ["attendanceClass","studentClass","reportClass"]){const el=$(id);el.innerHTML="";classes.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=c.name;el.append(o);});}
 if(!isAdmin()&&myClass()){$("attendanceClassName").textContent=clsName(myClass());}
}
function selectedClass(){return isAdmin()?$("attendanceClass").value:myClass();}
async function loadStudents(){
 let qy=isAdmin()?collection(db,"students"):query(collection(db,"students"),where("classId","==",myClass()));
 const snap=await getDocs(qy);students=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name));
 renderStudentList();
}
function renderStudentList(){
 $("studentList").innerHTML=students.length?"":"<p class='muted'>Belum ada data santri.</p>";
 students.forEach(s=>{const r=document.createElement("div");r.className="list-row";r.innerHTML=`<div class="grow"><strong>${esc(s.name)}</strong><small>${esc(clsName(s.classId))}</small></div>${isAdmin()?'<button class="secondary">Hapus</button>':''}`;if(isAdmin())r.querySelector("button").onclick=async()=>{if(confirm("Hapus data "+s.name+"?")){await importDeleteStudent(s.id);}};$("studentList").append(r);});
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function importDeleteStudent(id){const {deleteDoc}=await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js");await deleteDoc(doc(db,"students",id));await loadStudents();}
$("addStudentBtn").onclick=async()=>{const name=$("studentName").value.trim(),classId=$("studentClass").value;if(!name)return msg("studentMsg","Masukkan nama santri.",true);try{await addDoc(collection(db,"students"),{name,classId,createdAt:serverTimestamp()});$("studentName").value="";msg("studentMsg","Santri berhasil ditambahkan.");await loadStudents();}catch(e){msg("studentMsg",e.message,true)}};

$("attendanceDate").onchange=renderAttendance;$("attendanceClass").onchange=renderAttendance;
async function renderAttendance(){
 if(!currentUser||(!isAdmin()&&!myClass()))return;
 const classId=selectedClass();if(!classId)return;
 const list=students.filter(s=>s.classId===classId);
 $("attendanceClassName").textContent=clsName(classId);
 const date=$("attendanceDate").value;
 const snap=await getDocs(query(collection(db,"attendance"),where("classId","==",classId),where("date","==",date)));
 const old=new Map(snap.docs.map(d=>[d.data().studentId,d.data().status]));
 $("attendanceList").innerHTML="";
 if(!list.length){$("attendanceList").innerHTML="<p class='muted'>Belum ada santri di kelas ini.</p>";$("saveAttendanceBtn").classList.add("hidden");return;}
 list.forEach(s=>{const row=document.createElement("div");row.className="list-row";row.innerHTML=`<div class="grow"><strong>${esc(s.name)}</strong></div><select class="status-select" data-id="${s.id}">${STATUSES.map(st=>`<option ${((old.get(s.id)||"Hadir")===st)?"selected":""}>${st}</option>`).join("")}</select>`;$("attendanceList").append(row);});
 $("saveAttendanceBtn").classList.remove("hidden");
}
$("saveAttendanceBtn").onclick=async()=>{
 const classId=selectedClass(),date=$("attendanceDate").value;if(!date)return;
 try{const btn=$("saveAttendanceBtn");btn.disabled=true;
  for(const el of document.querySelectorAll("#attendanceList select")){const id=el.dataset.id,docId=`${date}_${id}`;await setDoc(doc(db,"attendance",docId),{studentId:id,classId,date,status:el.value,markedBy:currentUser.uid,updatedAt:serverTimestamp()},{merge:true});}
  msg("attendanceMsg","Absensi berhasil disimpan.");btn.disabled=false;
 }catch(e){$("saveAttendanceBtn").disabled=false;msg("attendanceMsg",e.message,true);}
};

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("hidden",x.id!==b.dataset.tab));if(b.dataset.tab==="studentsPanel")loadStudents();});
$("loadReportBtn").onclick=loadReport;
async function loadReport(){
 const month=$("reportMonth").value,classId=isAdmin()?$("reportClass").value:myClass();if(!classId)return msg("reportMsg","Akun belum memiliki kelas.",true);
 const start=month+"-01",end=month+"-31";
 try{
  const [ss,aa]=await Promise.all([getDocs(query(collection(db,"students"),where("classId","==",classId))),getDocs(query(collection(db,"attendance"),where("classId","==",classId),where("date",">=",start),where("date","<=",end)))]);
  const att=aa.docs.map(d=>d.data());
  const meetingCount=new Set(att.map(a=>a.date)).size;
  const counts=Object.fromEntries(STATUSES.map(s=>[s,att.filter(a=>a.status===s).length]));
  $("reportSummary").innerHTML=STATUSES.map(s=>`<div class="stat"><strong>${counts[s]}</strong><span>${s}</span></div>`).join("")+`<div class="stat"><strong>${meetingCount}</strong><span>Hari pertemuan</span></div>`;
  const rows=ss.docs.map(d=>{
   const s=d.data(),mine=att.filter(a=>a.studentId===d.id);
   const Hadir=mine.filter(a=>a.status==="Hadir").length;
   const Izin=mine.filter(a=>a.status==="Izin").length;
   const Sakit=mine.filter(a=>a.status==="Sakit").length;
   const Alpa=mine.filter(a=>a.status==="Alpa").length;
   const total=Hadir+Izin+Sakit+Alpa;
   const persen=meetingCount?Math.round(Hadir/meetingCount*100):0;
   return {name:s.name,Hadir,Izin,Sakit,Alpa,total,Persentase:persen};
  }).sort((a,b)=>a.name.localeCompare(b.name));
  reportRows=rows;reportMonthValue=month;reportClassValue=clsName(classId);
  $("reportTable").innerHTML=`<table><thead><tr><th>Nama santri</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpa</th><th>Total tercatat</th><th>Kehadiran</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.Hadir}</td><td>${r.Izin}</td><td>${r.Sakit}</td><td>${r.Alpa}</td><td>${r.total}</td><td><strong>${r.Persentase}%</strong></td></tr>`).join("")}</tbody></table><p class="muted">Persentase = jumlah Hadir ÷ jumlah hari absensi yang tersimpan (${meetingCount} hari) × 100%.</p>`;
  $("exportBtn").classList.remove("hidden");msg("reportMsg",`Rekap ${month} · ${clsName(classId)} berhasil dimuat. ${meetingCount} hari absensi tercatat.`);
 }catch(e){msg("reportMsg",e.message,true)}
}
$("exportBtn").onclick=()=>{const csv=["Nama Santri,Hadir,Izin,Sakit,Alpa,Total Tercatat,Persentase Kehadiran",...reportRows.map(r=>[r.name,r.Hadir,r.Izin,r.Sakit,r.Alpa,r.total,r.Persentase+"%"].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(","))].join("\r\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rekap-absensi-madin.csv";a.click();URL.revokeObjectURL(a.href);};
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn);


// Cetak laporan bulanan; pada Android pengguna dapat memilih "Save as PDF".
$("printReportBtn").onclick=()=>{
 if(!reportRows.length){msg("reportMsg","Tampilkan rekap terlebih dahulu sebelum mencetak.",true);return;}
 const title="Laporan Absensi Bulanan";
 const totals=Object.fromEntries(STATUSES.map(st=>[st,reportRows.reduce((n,r)=>n+r[st],0)]));
 const rows=reportRows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.Hadir}</td><td>${r.Izin}</td><td>${r.Sakit}</td><td>${r.Alpa}</td><td>${r.total}</td><td>${r.Persentase}%</td></tr>`).join("");
 const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} - ${esc(reportClassValue)}</title><style>body{font-family:Arial,sans-serif;color:#17251d;margin:24px}h1{text-align:center;font-size:20px;margin:0 0 4px}.sub{text-align:center;margin:0 0 22px;font-size:13px}.meta{margin:12px 0 18px;font-size:13px}.stats{display:flex;gap:8px;margin-bottom:18px}.stat{border:1px solid #999;padding:9px 12px;flex:1;text-align:center}.stat b{display:block;font-size:18px}.stat span{font-size:11px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #777;padding:8px;text-align:center}th{background:#eee}td:nth-child(2),th:nth-child(2){text-align:left}.sign{display:flex;justify-content:space-between;margin-top:55px;text-align:center;font-size:12px}.sign div{width:40%}.sign strong{display:block;margin-top:65px;text-decoration:underline}.note{font-size:10px;margin-top:24px;color:#555}@media print{body{margin:12mm}@page{size:A4 portrait;margin:12mm}.no-print{display:none}}</style></head><body><h1>MADRASAH DINIYAH KALIGINTUNG</h1><p class="sub">LAPORAN ABSENSI SANTRI</p><div class="meta"><b>Kelas:</b> ${esc(reportClassValue)}<br><b>Bulan:</b> ${esc(reportMonthValue)}</div><div class="stats">${STATUSES.map(st=>`<div class="stat"><b>${totals[st]}</b><span>${st}</span></div>`).join("")}</div><table><thead><tr><th>No.</th><th>Nama Santri</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpa</th><th>Total</th><th>Kehadiran</th></tr></thead><tbody>${rows}</tbody></table><div class="sign"><div>Mengetahui,<br>Pengurus Madin<strong>(__________________)</strong></div><div>Kaligintung, ....................<br>Admin Absensi<strong>(__________________)</strong></div></div><p class="note">Dicetak dari Aplikasi Absensi Madin Kaligintung.</p><script>window.onload=()=>setTimeout(()=>window.print(),400);</script></body></html>`;
 const w=window.open("","_blank");if(!w){msg("reportMsg","Jendela cetak diblokir. Izinkan pop-up untuk situs ini, lalu coba lagi.",true);return;}w.document.open();w.document.write(html);w.document.close();
};// FITUR IMPOR DATA SANTRI CSV
const importButton = document.createElement("button");
importButton.textContent = "Impor Data Santri (CSV)";
importButton.className = "secondary full";

const importFile = document.createElement("input");
importFile.type = "file";
importFile.accept = ".csv";
importFile.style.display = "none";

$("studentAdminForm").append(importButton, importFile);

importButton.onclick = () => {
  if (isAdmin()) importFile.click();
};

importFile.onchange = async () => {
  if (!isAdmin()) return;

  const file = importFile.files[0];
  if (!file) return;

  try {
    const content = await file.text();
    const lines = content.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    const existing = new Set(
      students.map(s => s.name.trim().toLowerCase() + "|" + s.classId)
    );

    let added = 0;
    let skipped = 0;

    for (const line of lines.slice(1)) {
      const [nameRaw, classRaw] = line.split(",");
      const name = nameRaw?.trim();
      const className = classRaw?.trim();

      const kelas = classes.find(c => c.name === "Kelas " + className);

      if (!name || !kelas) {
        skipped++;
        continue;
      }

      const key = name.toLowerCase() + "|" + kelas.id;

      if (existing.has(key)) {
        skipped++;
        continue;
      }

      await addDoc(collection(db, "students"), {
        name,
        classId: kelas.id,
        createdAt: serverTimestamp()
      });

      existing.add(key);
      added++;
    }// DASHBOARD MADIN
async function renderDashboard() {
  if (!currentUser || !profile) return;

  $("dashTotalStudents").textContent = students.length;
  $("dashTotalClasses").textContent = isAdmin() ? classes.length : 1;

  const classStats = isAdmin()
    ? classes
    : classes.filter(c => c.id === myClass());

  $("dashClassStats").innerHTML = classStats.map(c => {
    const total = students.filter(s => s.classId === c.id).length;
    return `
      <div class="list-item">
        <span>${esc(c.name)}</span>
        <strong>${total} santri</strong>
      </div>
    `;
  }).join("");

  const attendanceSnap = await getDocs(
    query(
      collection(db, "attendance"),
      where("date", "==", today)
    )
  );

  const records = attendanceSnap.docs
    .map(d => d.data())
    .filter(r => isAdmin() || r.classId === myClass());

  $("dashHadir").textContent =
    records.filter(r => r.status === "Hadir").length;
  $("dashIzin").textContent =
    records.filter(r => r.status === "Izin").length;
  $("dashSakit").textContent =
    records.filter(r => r.status === "Sakit").length;
  $("dashAlpa").textContent =
    records.filter(r => r.status === "Alpa").length;
}

    await loadStudents();
    msg("studentMsg", `Impor selesai: ${added} ditambahkan, ${skipped} dilewati.`);
  } catch (e) {
    msg("studentMsg", "Impor gagal: " + e.message, true);
  }

  importFile.value = "";
};// DASHBOARD MADIN
async function renderDashboard() {
  if (!currentUser || !profile) return;

  $("dashTotalStudents").textContent = students.length;
  $("dashTotalClasses").textContent = isAdmin() ? classes.length : 1;

  const classStats = isAdmin()
    ? classes
    : classes.filter(c => c.id === myClass());

  $("dashClassStats").innerHTML = classStats.map(c => {
    const total = students.filter(s => s.classId === c.id).length;
    return `
      <div class="list-item">
        <span>${esc(c.name)}</span>
        <strong>${total} santri</strong>
      </div>
    `;
  }).join("");

  const attendanceSnap = await getDocs(
    query(
      collection(db, "attendance"),
      where("date", "==", today)
    )
  );

  const records = attendanceSnap.docs
    .map(d => d.data())
    .filter(r => isAdmin() || r.classId === myClass());

  $("dashHadir").textContent =
    records.filter(r => r.status === "Hadir").length;
  $("dashIzin").textContent =
    records.filter(r => r.status === "Izin").length;
  $("dashSakit").textContent =
    records.filter(r => r.status === "Sakit").length;
  $("dashAlpa").textContent =
    records.filter(r => r.status === "Alpa").length;
}
