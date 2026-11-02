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
function showToast(text) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.style.cssText = "position:fixed;bottom:25px;left:50%;transform:translateX(-50%);background:#198754;color:white;padding:12px 20px;border-radius:10px;box-shadow:0 3px 12px #0003;z-index:99999;font-size:14px;text-align:center;";
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}
const clsName=id=>classes.find(c=>c.id===id)?.name||"Belum ditetapkan";
const isAdmin=()=>profile?.role==="admin";
const canAccessAllClasses=()=>isAdmin()||profile?.role==="petugas";
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
  $("hello").textContent="Halo, "+(profile.name||user.email);$("roleInfo").textContent=isAdmin()?"Admin/Pengurus":profile?.role==="petugas"?"Admin Absensi · Semua Kelas":"Pengajar · "+clsName(myClass());
  document.querySelectorAll(".admin-only").forEach(x=>x.classList.toggle("hidden",!isAdmin()));
  $("studentAdminForm").classList.toggle("hidden",!isAdmin());
  $("attendanceClassWrap").classList.toggle("hidden",!canAccessAllClasses());
$("reportClassWrap").classList.toggle("hidden",!canAccessAllClasses());
  if(!canAccessAllClasses()&&!myClass()){$("attendanceList").innerHTML='<p class="muted">Akun Anda belum diberi kelas. Hubungi admin Madin.</p>';$("saveAttendanceBtn").classList.add("hidden");}
  await fillClassSelects();await loadStudents();await renderAttendance();await renderDashboard();
 }catch(e){console.error(e);alert("Gagal memuat data: "+e.message);}
});

async function loadClasses(){
 const snap=await getDocs(collection(db,"classes"));classes=snap.docs.map(d=>({id:d.id,...d.data()}));
 if(isAdmin()&&classes.length===0){for(let i=0;i<CLASS_NAMES.length;i++)await setDoc(doc(db,"classes","kelas"+(i+1)),{name:CLASS_NAMES[i],order:i+1});const s=await getDocs(collection(db,"classes"));classes=s.docs.map(d=>({id:d.id,...d.data()}));}
 classes.sort((a,b)=>(a.order||0)-(b.order||0));
}
async function fillClassSelects() {
  for (const id of ["attendanceClass", "studentClass", "reportClass"]) {
    const el = $(id);
    el.innerHTML = "";

    if (id === "reportClass" && canAccessAllClasses()) {
      const all = document.createElement("option");
      all.value = "__all__";
      all.textContent = "Semua Kelas";
      el.append(all);
    }

    classes.forEach(c => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.name;
      el.append(o);
    });
  }
const filter = $("studentFilterClass");

if (filter) {
  filter.innerHTML = '<option value="">Semua Kelas</option>';

  classes.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    filter.append(option);
  });
}
  if (!canAccessAllClasses() && myClass()) {
    $("attendanceClassName").textContent = clsName(myClass());
  }
}

function selectedClass(){return canAccessAllClasses()?$("attendanceClass").value:myClass();}
async function loadStudents(){
 let qy=canAccessAllClasses()?collection(db,"students"):query(collection(db,"students"),where("classId","==",myClass()));
 const snap=await getDocs(qy);students=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name));
 renderStudentList();}
function renderStudentList() {
  const keyword = $("studentSearch")?.value
    .trim()
    .toLowerCase() || "";

  const filterClass = canAccessAllClasses()
    ? $("studentFilterClass")?.value || ""
    : myClass();

  const filtered = students.filter(s => {
    const matchName = s.name.toLowerCase().includes(keyword);
    const matchClass = !filterClass || s.classId === filterClass;
    return matchName && matchClass;
  });

  $("studentList").innerHTML = filtered.length
    ? ""
    : "<p class='muted'>Santri tidak ditemukan.</p>";

  filtered.forEach(s => {
    const r = document.createElement("div");
    r.className = "list-row";

   r.innerHTML = `
  <div class="grow">
    <strong>${esc(s.name)}</strong>
    <small>${esc(clsName(s.classId))}</small>
  </div>

  <button type="button" class="secondary history-btn">
    Riwayat
  </button>

  ${isAdmin() ? `
    <button type="button" class="secondary edit-btn">Edit</button>
    <button type="button" class="secondary delete-btn">Hapus</button>
  ` : ""}
`;
    if (isAdmin()) {
      r.querySelector(".edit-btn").onclick = () => {
        r.innerHTML = `
          <div style="width:100%">
            <label>Nama Santri</label>
            <input class="edit-name" value="${esc(s.name)}">

            <label>Kelas</label>
            <select class="edit-class">
              ${classes.map(c => `
                <option value="${c.id}" ${c.id === s.classId ? "selected" : ""}>
                  ${esc(c.name)}
                </option>
              `).join("")}
            </select>

            <button class="edit-save">Simpan</button>
            <button class="secondary edit-cancel">Batal</button>
          </div>
        `;

        r.querySelector(".edit-cancel").onclick = renderStudentList;

        r.querySelector(".edit-save").onclick = async () => {
          const name = r.querySelector(".edit-name").value.trim();
          const classId = r.querySelector(".edit-class").value;

          if (!name) {
            showToast("Nama santri tidak boleh kosong.");
            return;
          }

          try {
            await updateDoc(doc(db, "students", s.id), {
              name,
              classId
            });

            showToast("Data santri berhasil diperbarui.");
            await loadStudents();
          } catch (e) {
            showToast("Gagal memperbarui data: " + e.message);
          }
        };
      };

      r.querySelector(".delete-btn").onclick = async () => {
        if (confirm("Hapus data " + s.name + "?")) {
          await importDeleteStudent(s.id);
        }
      };
    }

    $("studentList").append(r);
  });
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function importDeleteStudent(id){const {deleteDoc}=await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js");await deleteDoc(doc(db,"students",id));await loadStudents();}
$("studentSearch").addEventListener("input", renderStudentList);

$("studentFilterClass").addEventListener("change", renderStudentList);
$("addStudentBtn").onclick=async()=>{const name=$("studentName").value.trim(),classId=$("studentClass").value;if(!name)return msg("studentMsg","Masukkan nama santri.",true);try{await addDoc(collection(db,"students"),{name,classId,createdAt:serverTimestamp()});$("studentName").value="";msg("studentMsg","Santri berhasil ditambahkan.");await loadStudents();}catch(e){msg("studentMsg",e.message,true)}};

$("attendanceDate").onchange=renderAttendance;$("attendanceClass").onchange=renderAttendance;
async function renderAttendance(){
 if(!currentUser||(!canAccessAllClasses()&&!myClass()))return;
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
async function loadReport() {
  const month = $("reportMonth").value;
  const selected = canAccessAllClasses()
    ? $("reportClass").value
    : myClass();

  const allClasses = canAccessAllClasses() && selected === "__all__";
  const classId = allClasses ? null : selected;

  if (!allClasses && !classId) {
    return msg("reportMsg", "Akun belum memiliki kelas.", true);
  }

  const start = month + "-01";
  const end = month + "-31";

  try {
    const studentQuery = allClasses
      ? getDocs(collection(db, "students"))
      : getDocs(query(
          collection(db, "students"),
          where("classId", "==", classId)
        ));

    const attendanceQuery = allClasses
      ? getDocs(query(
          collection(db, "attendance"),
          where("date", ">=", start),
          where("date", "<=", end)
        ))
      : getDocs(query(
          collection(db, "attendance"),
          where("classId", "==", classId),
          where("date", ">=", start),
          where("date", "<=", end)
        ));

    const [ss, aa] = await Promise.all([
      studentQuery,
      attendanceQuery
    ]);

    const att = aa.docs.map(d => d.data());

    const meetingCount = allClasses
      ? new Set(att.map(a => a.classId + "|" + a.date)).size
      : new Set(att.map(a => a.date)).size;

    const counts = Object.fromEntries(
      STATUSES.map(st => [
        st,
        att.filter(a => a.status === st).length
      ])
    );

    $("reportSummary").innerHTML =
      STATUSES.map(st => `
        <div class="stat">
          <strong>${counts[st]}</strong>
          <span>${st}</span>
        </div>
      `).join("") + `
        <div class="stat">
          <strong>${meetingCount}</strong>
          <span>Hari pertemuan</span>
        </div>
      `;

    const rows = ss.docs.map(d => {
      const s = d.data();

      const mine = att.filter(a => a.studentId === d.id);

      const Hadir = mine.filter(a => a.status === "Hadir").length;
      const Izin = mine.filter(a => a.status === "Izin").length;
      const Sakit = mine.filter(a => a.status === "Sakit").length;
      const Alpa = mine.filter(a => a.status === "Alpa").length;

      const total = Hadir + Izin + Sakit + Alpa;

      const studentMeetingCount = allClasses
        ? new Set(
            att
              .filter(a => a.classId === s.classId)
              .map(a => a.date)
          ).size
        : meetingCount;

      const persen = studentMeetingCount
        ? Math.round(Hadir / studentMeetingCount * 100)
        : 0;

      return {
        name: s.name,
        className: clsName(s.classId),
        Hadir,
        Izin,
        Sakit,
        Alpa,
        total,
        Persentase: persen
      };

    }).sort((a, b) =>
      a.className.localeCompare(b.className) ||
      a.name.localeCompare(b.name)
    );

    reportRows = rows;
    reportMonthValue = month;
    reportClassValue = allClasses
      ? "Semua Kelas"
      : clsName(classId);

    $("reportTable").innerHTML = `
      <table>
        <thead>
          <tr>
            ${allClasses ? "<th>Kelas</th>" : ""}
            <th>Nama Santri</th>
            <th>Hadir</th>
            <th>Izin</th>
            <th>Sakit</th>
            <th>Alpa</th>
            <th>Total</th>
            <th>Kehadiran</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              ${allClasses
                ? `<td>${esc(r.className)}</td>`
                : ""}
              <td>${esc(r.name)}</td>
              <td>${r.Hadir}</td>
              <td>${r.Izin}</td>
              <td>${r.Sakit}</td>
              <td>${r.Alpa}</td>
              <td>${r.total}</td>
              <td><strong>${r.Persentase}%</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <p class="muted">
        Persentase dihitung berdasarkan hari absensi
        yang tercatat pada kelas masing-masing.
      </p>
    `;

    $("exportBtn").classList.remove("hidden");

    msg(
      "reportMsg",
      `Rekap ${month} · ${reportClassValue} berhasil dimuat. ${rows.length} santri.`
    );

  } catch (e) {
    msg("reportMsg", e.message, true);
  }
} 
$("exportBtn").onclick = () => {
  const csv = [
    [
      "Kelas",
      "Nama Santri",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpa",
      "Total Tercatat",
      "Persentase Kehadiran"
    ],

    ...reportRows.map(r => [
      r.className,
      r.name,
      r.Hadir,
      r.Izin,
      r.Sakit,
      r.Alpa,
      r.total,
      r.Persentase + "%"
    ])

  ].map(row =>
    row.map(v =>
      '"' + String(v).replaceAll('"', '""') + '"'
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    { type: "text/csv;charset=utf-8" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rekap-absensi-madin-semua-kelas.csv";
  a.click();

  URL.revokeObjectURL(a.href);
};


// Cetak laporan bulanan; pada Android pengguna dapat memilih "Save as PDF".
$("printReportBtn").onclick = () => {
  if (!reportRows.length) {
    msg("reportMsg", "Tampilkan rekap terlebih dahulu sebelum mencetak.", true);
    return;
  }

  const title = "Laporan Absensi Bulanan";

  const totals = Object.fromEntries(
    STATUSES.map(st => [
      st,
      reportRows.reduce((n, r) => n + r[st], 0)
    ])
  );

  // Menentukan apakah laporan menampilkan semua kelas.
  const allClasses = canAccessAllClasses() && $("reportClass").value === "__all__";
  // Membuat isi tabel PDF.
  const rows = reportRows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      ${allClasses ? `<td class="class-col">${esc(r.className)}</td>` : ""}
      <td class="name-col">${esc(r.name)}</td>
      <td>${r.Hadir}</td>
      <td>${r.Izin}</td>
      <td>${r.Sakit}</td>
      <td>${r.Alpa}</td>
      <td>${r.total}</td>
      <td>${r.Persentase}%</td>
    </tr>
  `).join("");

  // Membuat judul kolom PDF.
  const html = `
    <!doctype html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${title} - ${esc(reportClassValue)}</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          color: #17251d;
          margin: 24px;
        }

        h1 {
          text-align: center;
          font-size: 20px;
          margin: 0 0 4px;
        }

        .sub {
          text-align: center;
          margin: 0 0 22px;
          font-size: 13px;
        }

        .meta {
          margin: 12px 0 18px;
          font-size: 13px;
        }

        .stats {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }

        .stat {
          border: 1px solid #999;
          padding: 9px 12px;
          flex: 1;
          text-align: center;
        }

        .stat b {
          display: block;
          font-size: 18px;
        }

        .stat span {
          font-size: 11px;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 12px;
        }

        th, td {
          border: 1px solid #777;
          padding: 8px;
          text-align: center;
        }

        th {
          background: #eee;
        }

        .class-col,
        .name-col {
          text-align: left;
        }

        .sign {
          display: flex;
          justify-content: space-between;
          margin-top: 55px;
          text-align: center;
          font-size: 12px;
        }

        .sign div {
          width: 40%;
        }

        .sign strong {
          display: block;
          margin-top: 65px;
          text-decoration: underline;
        }

        .note {
          font-size: 10px;
          margin-top: 24px;
          color: #555;
        }

        @media print {
          body {
            margin: 12mm;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          .no-print {
            display: none;
          }
        }
      </style>
    </head>

    <body>
      <h1>MADRASAH DINIYAH KALIGINTUNG</h1>

      <p class="sub">LAPORAN ABSENSI SANTRI</p>

      <div class="meta">
        <b>Kelas:</b> ${esc(reportClassValue)}
        <br>
        <b>Bulan:</b> ${esc(reportMonthValue)}
      </div>

      <div class="stats">
        ${STATUSES.map(st => `
          <div class="stat">
            <b>${totals[st]}</b>
            <span>${st}</span>
          </div>
        `).join("")}
      </div>

      <table>
        <thead>
          <tr>
            <th>No.</th>
            ${allClasses ? "<th>Kelas</th>" : ""}
            <th>Nama Santri</th>
            <th>Hadir</th>
            <th>Izin</th>
            <th>Sakit</th>
            <th>Alpa</th>
            <th>Total</th>
            <th>Kehadiran</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="sign">
        <div>
          Mengetahui,<br>
          Pengurus Madin
          <strong>(__________________)</strong>
        </div>

        <div>
          Kaligintung, ....................<br>
          Admin Absensi
          <strong>(__________________)</strong>
        </div>
      </div>

      <p class="note">
        Dicetak dari Aplikasi Absensi Madin Kaligintung.
      </p>

      <script>
        window.onload = () => setTimeout(() => window.print(), 400);
      </script>
    </body>
    </html>
  `;

  const w = window.open("", "_blank");

  if (!w) {
    msg(
      "reportMsg",
      "Jendela cetak diblokir. Izinkan pop-up untuk situs ini, lalu coba lagi.",
      true
    );
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();
};
// FITUR IMPOR DATA SANTRI CSV
// Format CSV: Nama Santri,Kelas
const importButton = document.createElement("button");
importButton.textContent = "Impor Banyak Santri (CSV)";
importButton.className = "secondary full";

const importFile = document.createElement("input");
importFile.type = "file";
importFile.accept = ".csv,text/csv";
importFile.style.display = "none";

$("studentAdminForm").append(importButton, importFile);

importButton.onclick = () => {
  if (isAdmin()) importFile.click();
};

function parseStudentCSV(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '"' && quoted && input[i + 1] === '"') {
      value += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(value.trim());
      if (row.some(cell => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }

  row.push(value.trim());
  if (row.some(cell => cell !== "")) rows.push(row);
  return rows;
}

importFile.onchange = async () => {
  if (!isAdmin()) return;

  const file = importFile.files[0];
  if (!file) return;

  importButton.disabled = true;
  msg("studentMsg", "Sedang membaca dan memasukkan data...");

  try {
    const rows = parseStudentCSV(await file.text());

    if (rows.length < 2) {
      throw new Error("CSV belum berisi data santri.");
    }

    const headers = rows[0].map(h =>
      h.toLowerCase().replace(/\s+/g, " ")
    );

    const nameIndex = headers.findIndex(h =>
      ["nama santri", "nama"].includes(h)
    );

    const classIndex = headers.findIndex(h =>
      ["kelas", "nama kelas"].includes(h)
    );

    if (nameIndex < 0 || classIndex < 0) {
      throw new Error('Kolom CSV harus bernama "Nama Santri" dan "Kelas".');
    }

    const existing = new Set(
      students.map(s =>
        s.name.trim().toLocaleLowerCase("id") + "|" + s.classId
      )
    );

    let added = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const name = (rows[i][nameIndex] || "").trim();
      const className = (rows[i][classIndex] || "").trim();

      if (!name || !className) {
        skipped++;
        continue;
      }

      const kelas = classes.find(c =>
        c.name.trim().toLocaleLowerCase("id") ===
        className.toLocaleLowerCase("id")
      );

      if (!kelas) {
        errors.push(
          'Baris ' + (i + 1) + ': kelas "' + className + '" tidak dikenal'
        );
        skipped++;
        continue;
      }

      const key =
        name.toLocaleLowerCase("id") + "|" + kelas.id;

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
    }

    await loadStudents();
    await renderDashboard();

    const detail = errors.length
      ? " Periksa: " + errors.slice(0, 3).join("; ")
      : "";

    msg(
      "studentMsg",
      "Impor selesai: " + added +
      " santri ditambahkan, " + skipped +
      " dilewati." + detail,
      errors.length > 0
    );

  } catch (e) {
    msg("studentMsg", "Impor gagal: " + e.message, true);
  } finally {
    importButton.disabled = false;
    importFile.value = "";
  }
};

  // DASHBOARD MADIN
async function renderDashboard() {
  if (!currentUser || !profile) return;

  $("dashTotalStudents").textContent = students.length;
$("dashTotalClasses").textContent = canAccessAllClasses() ? classes.length : 1;
  const classStats = canAccessAllClasses()
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
    query(collection(db, "attendance"), where("date", "==", today))
  );

  const records = attendanceSnap.docs
    .map(d => d.data())
    .filter(r => canAccessAllClasses() || r.classId === myClass());
  $("dashHadir").textContent = records.filter(r => r.status === "Hadir").length;
  $("dashIzin").textContent = records.filter(r => r.status === "Izin").length;
  $("dashSakit").textContent = records.filter(r => r.status === "Sakit").length;
  $("dashAlpa").textContent = records.filter(r => r.status === "Alpa").length;
}
