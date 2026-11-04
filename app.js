import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
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
const PHOTO_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbyfKk9m9PNhv8qCjWh2iF4drHkYfWUufY7XJU59ful6tBLBnYWwwfOYb-D4fRDm8Vec/exec";

async function uploadStudentPhoto(file) {
  if (!file) return {};

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Foto harus JPG, PNG, atau WebP.");
  }

  // Baca foto
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca foto."));
    };

    img.src = url;
  });

  // Kompres foto menggunakan Canvas
  const canvas = document.createElement("canvas");
  const maxSize = 1280;
  let width = image.width;
  let height = image.height;

  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.85;
  let compressedImage = canvas.toDataURL("image/jpeg", quality);

  while (compressedImage.length > 1.9 * 1024 * 1024 && quality > 0.4) {
    quality -= 0.1;
    compressedImage = canvas.toDataURL("image/jpeg", quality);
  }

  const idToken = await currentUser.getIdToken();

  const response = await fetch(PHOTO_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      idToken,
      image: compressedImage,
      name: file.name.replace(/\.[^/.]+$/, "") + ".jpg"
    }),
    redirect: "follow"
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Unggah foto gagal.");
  }

  return {
    photoUrl: result.imageUrl,
    photoFileId: result.fileId
  };
}
const CLASS_NAMES = ["Kelas Jilid Pemula","Kelas Jilid 1","Kelas Jilid 2","Kelas Jilid 3","Kelas Jilid 4","Kelas Jilid 5"];
const STATUSES = ["Hadir","Izin","Sakit","Alpa"];
let currentUser=null, profile=null, classes=[], students=[], reportRows=[], reportMonthValue="", reportClassValue="";
const today = new Date().toLocaleDateString("sv-SE");
$("attendanceDate").value=today; $("todayLabel").textContent=new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
for(let i=0;i<12;i++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const v=d.toLocaleDateString("sv-SE").slice(0,7);const o=document.createElement("option");o.value=v;o.textContent=d.toLocaleDateString("id-ID",{month:"long",year:"numeric"});$("reportMonth").append(o);}
const msg=(id,t,err=false)=>{$(id).textContent=t;$(id).classList.toggle("error",err)};
function showToast(text, isError = false) {
  let toast = document.getElementById("appToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      padding: 14px 20px;
      border-radius: 10px;
      box-shadow: 0 3px 12px #0003;
      z-index: 99999;
      font-size: 14px;
      text-align: center;
      width: max-content;
      max-width: 90%;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.style.background = isError ? "#dc3545" : "#198754";
  toast.style.display = "block";

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
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
  profile=p.data(); await loadClasses(); fillStudentPdfClass();
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
$("hello").textContent="Halo, "+(profile.name||user.email);$("roleInfo").textContent=isAdmin()?"Admin/Pengurus":"Admin Absensi · Semua Kelas";
  document.querySelectorAll(".admin-only:not(.panel)").forEach(x=>x.classList.toggle("hidden",!isAdmin()));
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
async function loadPhotoStats() {
  try {
    $("photoStatsMsg").textContent = "Menghitung foto santri...";

    const snap = await getDocs(collection(db, "students"));
    const total = snap.size;

    const uploaded = snap.docs.filter(docSnap => {
      const data = docSnap.data();
      return data.photoUrl && data.photoUrl.trim() !== "";
    }).length;

    const missing = total - uploaded;
    const percentage = total > 0
      ? Math.round((uploaded / total) * 100)
      : 0;

    $("photoTotal").textContent = total;
    $("photoUploaded").textContent = uploaded;
    $("photoMissing").textContent = missing;
    $("photoPercentage").textContent = percentage + "%";

    $("photoStatsMsg").textContent = "Data berhasil diperbarui.";
  } catch (error) {
    console.error(error);
    $("photoStatsMsg").textContent =
      "Gagal menghitung foto: " + error.message;
  }
}

$("refreshPhotoStatsBtn").onclick = loadPhotoStats;
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
        ${s.photoUrl ? `<img src="${esc(s.photoUrl)}" alt="Foto ${esc(s.name)}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;margin-top:6px;">` : ""}
  </div>

  <div class="student-actions">

  <button type="button" class="secondary history-btn">
    Riwayat
  </button>

  <button type="button" class="secondary biodata-btn">
    Profil
  </button>

  ${isAdmin() ? `
    <button type="button" class="secondary edit-btn">
      Edit
    </button>

    <button type="button" class="secondary delete-btn">
      Hapus
    </button>
  ` : ""}

</div>
`;
r.querySelector(".history-btn").onclick = async () => {
  r.innerHTML = `
    <div style="width:100%;text-align:center;padding:15px;">
      <h3>Memuat Riwayat Absensi...</h3>
    </div>
  `;

  try {
    const snap = await getDocs(
      query(
        collection(db, "attendance"),
        where("studentId", "==", s.id)
      )
    );

    const records = snap.docs
      .map(d => d.data())
      .sort((a, b) => b.date.localeCompare(a.date));

    const count = Object.fromEntries(
      STATUSES.map(st => [
        st,
        records.filter(a => a.status === st).length
      ])
    );

    const total = records.length;
    const persen = total
      ? Math.round(count.Hadir / total * 100)
      : 0;

    const formatTanggal = date => {
      if (!date) return "-";
      return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    };

    const warna = {
      Hadir: "#15803d",
      Izin: "#2563eb",
      Sakit: "#d97706",
      Alpa: "#dc2626"
    };

    r.innerHTML = `
      <div style="width:100%;">

        <div style="text-align:center;padding:12px;">
          ${
            s.photoUrl
              ? `<img src="${esc(s.photoUrl)}"
                  style="width:85px;height:85px;object-fit:cover;border-radius:50%;">`
              : ""
          }
          <h3 style="margin:8px 0 3px;">${esc(s.name)}</h3>
          <span class="muted">${esc(clsName(s.classId))}</span>
        </div>

        <h3 style="margin:12px 0;">Ringkasan Kehadiran</h3>

        <div class="history-summary">
          ${STATUSES.map(st => `
            <div class="history-stat" style="border-top:4px solid ${warna[st]};">
              <strong>${count[st]}</strong>
              <span>${st}</span>
            </div>
          `).join("")}
        </div>

        <div class="history-percent">
          <strong>${persen}%</strong>
          <span>Persentase Kehadiran</span>
        </div>

        <h3 style="margin:18px 0 10px;">Riwayat Per Pertemuan</h3>

        ${
          records.length
            ? `<div class="history-list">
                ${records.map(a => `
                  <div class="history-item">
                    <div>
                      <strong>${formatTanggal(a.date)}</strong>
                    </div>
                    <span style="background:${warna[a.status] || "#64748b"};">
                      ${esc(a.status || "-")}
                    </span>
                  </div>
                `).join("")}
              </div>`
            : `<p class="muted" style="text-align:center;padding:20px;">
                Belum ada riwayat absensi.
              </p>`
        }

        <button type="button" class="secondary history-back"
          style="width:100%;margin-top:18px;">
          Kembali
        </button>

      </div>
    `;

    r.querySelector(".history-back").onclick = renderStudentList;

  } catch (e) {
    showToast("Gagal memuat riwayat: " + e.message);
    renderStudentList();
  }
};
    r.querySelector(".biodata-btn").onclick = () => {
      const tanggalLahir = s.birthdate
        ? new Date(s.birthdate + "T00:00:00").toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })
        : "-";

      r.classList.add("profile-open");
      r.innerHTML = `

<div class="student-profile-v2">  <!-- HEADER PROFIL -->  <div class="profile-v2-header"><div class="profile-v2-ornament">۞</div>

<div class="profile-v2-photo">
  ${
    s.photoUrl
      ? `<img src="${esc(s.photoUrl)}" alt="Foto ${esc(s.name)}">`
      : `<div class="profile-v2-placeholder">Foto Santri</div>`
  }
</div>

<h2 class="profile-v2-name">${esc(s.name)}</h2>

<div class="profile-v2-divider">
  <span></span>
  <b>✦</b>
  <span></span>
</div>

<div class="profile-v2-class">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 9l10-5 10 5-10 5-10-5z"/>
    <path d="M6 11v5c3 3 9 3 12 0v-5"/>
    <path d="M22 9v6"/>
  </svg>
  ${esc(clsName(s.classId))}
</div>

  </div>  <!-- BIODATA SANTRI -->  <div class="profile-v2-content">
    <div class="profile-v2-card">  <!-- NIS -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <circle cx="9" cy="10" r="2"/>
        <path d="M6 16c.5-2 5.5-2 6 0"/>
        <path d="M15 9h3M15 13h3"/>
      </svg>
    </div>
    <strong>NIS</strong>
    <span>${esc(s.nis || "-")}</span>
  </div>

  <!-- JENIS KELAMIN -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="8" cy="7" r="3"/>
        <circle cx="17" cy="7" r="3"/>
        <path d="M2.5 20v-3a5.5 5.5 0 0111 0v3z"/>
        <path d="M14 13a5 5 0 017.5 4v3h-6"/>
      </svg>
    </div>
    <strong>Jenis Kelamin</strong>
    <span>
      ${
        s.gender === "L" || s.gender === "Laki-laki"
          ? "Laki-Laki"
          : s.gender === "P" || s.gender === "Perempuan"
            ? "Perempuan"
            : "-"
      }
    </span>
  </div>

  <!-- TEMPAT LAHIR -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1116 0z"/>
        <circle cx="12" cy="10" r="2.5"/>
      </svg>
    </div>
    <strong>Tempat Lahir</strong>
    <span>${esc(s.birthplace || "-")}</span>
  </div>

  <!-- TANGGAL LAHIR -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M16 3v4M8 3v4M3 10h18"/>
        <path d="M8 14h2M14 14h2M8 17h2"/>
      </svg>
    </div>
    <strong>Tanggal Lahir</strong>
    <span>${tanggalLahir}</span>
  </div>

  <!-- ALAMAT -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11l9-8 9 8"/>
        <path d="M5 10v11h14V10"/>
        <path d="M9 21v-7h6v7"/>
      </svg>
    </div>
    <strong>Alamat</strong>
    <span>${esc(s.address || "-")}</span>
  </div>

  <!-- NAMA AYAH -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7" r="4"/>
        <path d="M4 21v-2a8 8 0 0116 0v2z"/>
        <path d="M9 13l3 3 3-3"/>
      </svg>
    </div>
    <strong>Nama Ayah</strong>
    <span>${esc(s.fatherName || "-")}</span>
  </div>

  <!-- NAMA IBU -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7" r="4"/>
        <path d="M4 21v-2a8 8 0 0116 0v2z"/>
        <path d="M9 13l3 3 3-3"/>
        <path d="M9 3l3-2 3 2"/>
      </svg>
    </div>
    <strong>Nama Ibu</strong>
    <span>${esc(s.motherName || "-")}</span>
  </div>

  <!-- NOMOR HP WALI -->
  <div class="profile-v2-item">
    <div class="profile-v2-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/>
        <path d="M9 5h6M10 18h4"/>
        <path d="M8 10c1 3 3 5 6 6l2-2-3-2-1 1c-1-.5-2-1.5-2.5-2.5l1-1-2-3-2 2z"/>
      </svg>
    </div>
    <strong>No. HP Wali</strong>
    <span>${esc(s.guardianPhone || "-")}</span>
  </div>

</div>

  </div>  <!-- TOMBOL KEMBALI -->  <button type="button" class="profile-v2-back">
    <span>←</span> Kembali
  </button>  </div>
`;r.querySelector(".profile-v2-back").onclick = renderStudentList;
    };

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

      <label>NIS</label>
      <input class="edit-nis" value="${esc(s.nis || "")}">

      <label>Jenis Kelamin</label>
      <select class="edit-gender">
        <option value="">Pilih jenis kelamin</option>
        <option value="L" ${s.gender === "L" ? "selected" : ""}>Laki-laki</option>
        <option value="P" ${s.gender === "P" ? "selected" : ""}>Perempuan</option>
      </select>

      <label>Tempat Lahir</label>
      <input class="edit-birthplace" value="${esc(s.birthplace || "")}">

      <label>Tanggal Lahir</label>
      <input type="date" class="edit-birthdate" value="${esc(s.birthdate || "")}">

      <label>Alamat</label>
      <textarea class="edit-address">${esc(s.address || "")}</textarea>

      <label>Nama Ayah</label>
      <input class="edit-father" value="${esc(s.fatherName || "")}">

      <label>Nama Ibu</label>
      <input class="edit-mother" value="${esc(s.motherName || "")}">

      <label>Nomor HP Wali</label>
      <input class="edit-phone" value="${esc(s.guardianPhone || "")}">

      <label>Ganti Foto Santri (opsional)</label>
      <input type="file" class="edit-photo" accept="image/jpeg,image/png,image/webp">

      ${s.photoUrl ? `<img src="${esc(s.photoUrl)}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">` : ""}

      <br><br>
      <button type="button" class="edit-save">Simpan Perubahan</button>
      <button type="button" class="secondary edit-cancel">Batal</button>
    </div>
  `;

  r.querySelector(".edit-cancel").onclick = renderStudentList;

  r.querySelector(".edit-save").onclick = async () => {
    const name = r.querySelector(".edit-name").value.trim();
    const classId = r.querySelector(".edit-class").value;

    if (!name || !classId) {
      showToast("Nama dan kelas wajib diisi.");
      return;
    }

    const button = r.querySelector(".edit-save");
    button.disabled = true;
    button.textContent = "Menyimpan...";

    try {
      const photoFile = r.querySelector(".edit-photo").files[0];
      const photoData = photoFile
        ? await uploadStudentPhoto(photoFile)
        : {};

      await updateDoc(doc(db, "students", s.id), {
        name,
        classId,
        nis: r.querySelector(".edit-nis").value.trim(),
        gender: r.querySelector(".edit-gender").value,
        birthplace: r.querySelector(".edit-birthplace").value.trim(),
        birthdate: r.querySelector(".edit-birthdate").value,
        address: r.querySelector(".edit-address").value.trim(),
        fatherName: r.querySelector(".edit-father").value.trim(),
        motherName: r.querySelector(".edit-mother").value.trim(),
        guardianPhone: r.querySelector(".edit-phone").value.trim(),
        ...photoData
      });

      showToast("Seluruh biodata santri berhasil diperbarui.");
      await loadStudents();
      await renderDashboard();

    } catch (e) {
      showToast("Gagal memperbarui data: " + e.message);
      button.disabled = false;
      button.textContent = "Simpan Perubahan";
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
async function importDeleteStudent(id){
  const {deleteDoc}=await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js");
  await deleteDoc(doc(db,"students",id));
  await loadStudents();
  await renderDashboard();
}
$("studentSearch").addEventListener("input", renderStudentList);

$("studentFilterClass").addEventListener("change", renderStudentList);
$("addStudentBtn").onclick=async()=>{
  const name=$("studentName").value.trim();
  const classId=$("studentClass").value;

  if(!name)return msg("studentMsg","Masukkan nama santri.",true);
  if(!classId)return msg("studentMsg","Pilih kelas santri.",true);

  try{
        const photoFile = $("studentPhoto")?.files?.[0];
    const photoData = photoFile ? await uploadStudentPhoto(photoFile) : {};
    
    await addDoc(collection(db,"students"),{
      name,
      classId,
      nis:$("studentNis").value.trim(),
      gender:$("studentGender").value,
      birthplace:$("studentBirthplace").value.trim(),
      birthdate:$("studentBirthdate").value,
      address:$("studentAddress").value.trim(),
      fatherName:$("studentFather").value.trim(),
      motherName:$("studentMother").value.trim(),
      guardianPhone:$("studentPhone").value.trim(),
      ...photoData,
      createdAt:serverTimestamp()
    });

    ["studentName","studentNis","studentBirthplace","studentBirthdate","studentAddress","studentFather","studentMother","studentPhone"].forEach(id=>$(id).value="");
    $("studentGender").value="";
    if($("studentPhoto")) $("studentPhoto").value="";
    msg("studentMsg", "");
showToast("✓ Biodata santri berhasil disimpan!");
await loadStudents();
    await renderDashboard();
  }catch(e){
    msg("studentMsg",e.message,true);
    showToast("✕ Gagal menyimpan: " + e.message, true);
  }
};

$("attendanceDate").onchange=renderAttendance;$("attendanceClass").onchange=renderAttendance;
async function renderAttendance(){
 if(!currentUser||(!canAccessAllClasses()&&!myClass()))return;
 const classId=selectedClass();if(!classId)return;
 const list=students.filter(s=>s.classId===classId);
 $("attendanceClassName").textContent=clsName(classId);
 const date=$("attendanceDate").value;
  if (new Date(date + "T00:00:00").getDay() === 0) {
  $("attendanceList").innerHTML =
    "<p style='text-align:center;padding:20px;color:#198754;font-weight:bold;'>HARI MINGGU – LIBUR NGAJI</p>";
  $("saveAttendanceBtn").classList.add("hidden");
  return;
  }
 const snap=await getDocs(query(collection(db,"attendance"),where("classId","==",classId),where("date","==",date)));
 const old=new Map(snap.docs.map(d=>[d.data().studentId,d.data().status]));
 $("attendanceList").innerHTML="";
 if(!list.length){$("attendanceList").innerHTML="<p class='muted'>Belum ada santri di kelas ini.</p>";$("saveAttendanceBtn").classList.add("hidden");return;}
 list.forEach(s=>{const row=document.createElement("div");row.className="list-row";row.innerHTML=`<div class="grow"><strong>${esc(s.name)}</strong></div><select class="status-select" data-id="${s.id}">${STATUSES.map(st=>`<option ${((old.get(s.id)||"Hadir")===st)?"selected":""}>${st}</option>`).join("")}</select>`;$("attendanceList").append(row);});
 $("saveAttendanceBtn").classList.remove("hidden");
}
$("saveAttendanceBtn").onclick = async () => {
  const classId = selectedClass();
  const date = $("attendanceDate").value;

  if (!date) return;

  if (new Date(date + "T00:00:00").getDay() === 0) {
    showToast("Hari Minggu adalah hari libur!", true);
    return;
  }

  const btn = $("saveAttendanceBtn");

  try {
    btn.disabled = true;

    // Periksa apakah absensi sudah pernah disimpan
    const existingSnap = await getDocs(
      query(
        collection(db, "attendance"),
        where("classId", "==", classId),
        where("date", "==", date)
      )
    );

    if (!existingSnap.empty) {
      const lanjut = confirm(
        "Absensi tanggal ini sudah pernah disimpan.\n\n" +
        "Apakah Anda yakin ingin mengubah data absensi tersebut?"
      );

      if (!lanjut) {
        btn.disabled = false;
        return;
      }
    }

    // Simpan atau perbarui absensi
    for (const el of document.querySelectorAll("#attendanceList select")) {
      const id = el.dataset.id;
      const docId = `${date}_${id}`;

      await setDoc(
        doc(db, "attendance", docId),
        {
          studentId: id,
          classId,
          date,
          status: el.value,
          markedBy: currentUser.uid,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }

    msg("attendanceMsg", "Absensi berhasil disimpan.");
  } catch (e) {
    console.error(e);
    msg("attendanceMsg", "Gagal menyimpan absensi: " + e.message, true);
  } finally {
    btn.disabled = false;
  }
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
$("shareImageBtn").classList.remove("hidden");
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

                .letterhead {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          margin: 0 0 22px;
        }

        .letterhead img {
          width: 92px;
          height: 92px;
          object-fit: contain;
          flex: 0 0 92px;
        }

        .letterhead-text {
          flex: 1;
          min-width: 0;
          text-align: center;
          color: #075b32;
        }

        .letterhead-text .organizer {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 3px;
        }

        .letterhead-text .school {
          font-size: 19px;
          line-height: 1.15;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .letterhead-text .address {
          color: #222;
          font-size: 10px;
          line-height: 1.35;
        }

        .report-title {
          text-align: center;
          font-size: 16px;
          margin: 0 0 16px;
          font-weight: 700;
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
      <div class="letterhead">
  <img src="https://madzakhfasy.github.io/absensi-madin-kaligintung/LOGO%20MADIN%20REMOVE%20BG.png" alt="Logo Madrasah Diniyah Kaligintung">
  <div class="letterhead-text">
    <div class="organizer">PENGURUS</div>
    <div class="school">MADRASAH DINIYAH KALIGINTUNG</div>
    <div class="address">Sekretariat: Dusun Kaligintung Rt. 05/ Rw. 03 Cilibang - Jeruklegi 53252</div>
  </div>
</div>

<h1 class="report-title">LAPORAN ABSENSI SANTRI</h1>

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

  
}// DROPDOWN CUSTOM MADIN
function enhanceCustomDropdown(select) {
  if (select.dataset.customized === "true") return;
  select.dataset.customized = "true";

  const wrap = document.createElement("div");
  wrap.className = "custom-select-wrap";
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add("native-select-hidden");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "custom-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  wrap.appendChild(trigger);

  const menu = document.createElement("div");
  menu.className = "custom-select-menu hidden";
  menu.setAttribute("role", "listbox");
  wrap.appendChild(menu);

  function refresh() {
    const chosen = select.options[select.selectedIndex];
    trigger.textContent = chosen ? chosen.textContent : "Pilih...";
    menu.innerHTML = "";

    Array.from(select.options).forEach((option, index) => {
      if (option.disabled) return;

      const item = document.createElement("button");
      item.type = "button";
      item.className = "custom-select-option" +
        (option.selected ? " selected" : "");
      item.textContent = option.textContent;

      if (option.selected) {
        const check = document.createElement("span");
        check.className = "custom-select-check";
        check.textContent = "✓";
        item.appendChild(check);
      }

      item.onclick = () => {
        select.selectedIndex = index;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        refresh();
        closeMenu();
      };

      menu.appendChild(item);
    });
  }

  function closeMenu() {
    menu.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
    wrap.classList.remove("is-open");
  }

  trigger.onclick = () => {
    const opening = menu.classList.contains("hidden");

    document.querySelectorAll(".custom-select-menu")
      .forEach(el => el.classList.add("hidden"));

    document.querySelectorAll(".custom-select-wrap")
      .forEach(el => el.classList.remove("is-open"));

    if (opening) {
      menu.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
      wrap.classList.add("is-open");
    } else {
      closeMenu();
    }
  };

  select.addEventListener("change", refresh);

  new MutationObserver(refresh).observe(select, {
    childList: true,
    subtree: true,
    attributes: true
  });

  refresh();
}

function initializeCustomDropdowns() {
  document.querySelectorAll("select:not([data-customized='true'])")
    .forEach(enhanceCustomDropdown);
}

initializeCustomDropdowns();

new MutationObserver(initializeCustomDropdowns).observe(document.body, {
  childList: true,
  subtree: true
});

document.addEventListener("click", event => {
  if (!event.target.closest(".custom-select-wrap")) {
    document.querySelectorAll(".custom-select-menu")
      .forEach(el => el.classList.add("hidden"));

    document.querySelectorAll(".custom-select-wrap")
      .forEach(el => el.classList.remove("is-open"));
  }
});
// CETAK DAFTAR SANTRI DAN PENGUMUMAN PEMBAGIAN KELAS
function fillStudentPdfClass() {
  const select = $("studentPdfClass");
  if (!select) return;

  select.innerHTML = '<option value="__all__">Semua Kelas</option>';

  classes.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    select.appendChild(option);
  });
}

$("studentPdfType").addEventListener("change", () => {
  $("announcementDateWrap").classList.toggle(
    "hidden",
    $("studentPdfType").value !== "announcement"
  );
});

$("studentPdfType").dispatchEvent(new Event("change"));

$("printStudentsPdfBtn").onclick = () => {
  try {
    if (!isAdmin()) {
      msg("studentPdfMsg", "Fitur ini hanya untuk admin.", true);
      return;
    }

    const type = $("studentPdfType").value;
    const selectedClass = $("studentPdfClass").value;
    const dateValue = $("studentPdfDate").value;

    if (type === "announcement" && !dateValue) {
      msg("studentPdfMsg", "Silakan isi tanggal pengumuman.", true);
      return;
    }

    const selectedStudents = students
      .filter(s => selectedClass === "__all__" || s.classId === selectedClass)
      .sort((a, b) => {
        const classA = clsName(a.classId);
        const classB = clsName(b.classId);
        return classA.localeCompare(classB) || a.name.localeCompare(b.name);
      });

    if (!selectedStudents.length) {
      msg("studentPdfMsg", "Tidak ada data santri untuk dicetak.", true);
      return;
    }

    const grouped = classes
      .filter(c => selectedClass === "__all__" || c.id === selectedClass)
      .map(c => ({
        name: c.name,
        students: selectedStudents.filter(s => s.classId === c.id)
      }))
      .filter(group => group.students.length);

    const rows = grouped.map(group => `
      <div class="class-group">
        <h3>${esc(group.name)}</h3>
        <table>
          <thead>
            <tr><th style="width:55px">No.</th><th>Nama Santri</th></tr>
          </thead>
          <tbody>
            ${group.students.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${esc(s.name)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `).join("");

    const title = type === "announcement"
      ? "PENGUMUMAN PEMBAGIAN KELAS"
      : "DAFTAR SANTRI PER KELAS";

    const dateText = dateValue
      ? new Date(dateValue + "T00:00:00").toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric"
        })
      : "";

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      msg("studentPdfMsg", "Popup diblokir. Izinkan pop-up lalu coba lagi.", true);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #222;
            margin: 25px;
          }
          .letterhead {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            border-bottom: 3px double #222;
            padding-bottom: 12px;
            margin-bottom: 25px;
            text-align: center;
          }
          .letterhead img { width: 75px; height: 75px; object-fit: contain; }
          .letterhead h2 { margin: 0; font-size: 19px; }
          .letterhead p { margin: 5px 0 0; font-size: 12px; }
          h3 { margin: 22px 0 8px; font-size: 15px; }
          .title { text-align: center; margin: 20px 0; }
          .date { text-align: right; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #555; padding: 7px; text-align: left; }
          th { background: #eee; }
          td:first-child { text-align: center; }
          .class-group { margin-bottom: 18px; }
          @media print {
            body { margin: 15mm; }
            .class-group { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <img src="https://madzakhfasy.github.io/absensi-madin-kaligintung/LOGO%20MADIN%20REMOVE%20BG.png">
          <div>
            <h2>MADRASAH DINIYAH KALIGINTUNG</h2>
            <p>Sekretariat: Dusun Kaligintung, Desa Cilibang</p>
          </div>
        </div>

        <h3 class="title">${title}</h3>

        ${type === "announcement" ? `
          <p>
            Diberitahukan kepada seluruh wali santri bahwa pembagian kelas
            santri Madrasah Diniyah Kaligintung adalah sebagai berikut:
          </p>
          <p class="date">Tanggal: ${dateText}</p>
        ` : ""}

        ${rows}

        <p style="margin-top:25px">
          Jumlah seluruh santri: <strong>${selectedStudents.length} santri</strong>
        </p>

        ${type === "announcement" ? `
          <p>Demikian pengumuman ini disampaikan. Terima kasih atas perhatian dan kerja samanya.</p>
        ` : ""}
        <script>
          window.onload = () => window.print();
        <\/script>
      </body>
      </html>
    `);

    printWindow.document.close();
    msg("studentPdfMsg", "Dokumen siap dicetak atau disimpan sebagai PDF.");
  } catch (error) {
    console.error(error);
    msg("studentPdfMsg", "Gagal membuat PDF: " + error.message, true);
  }
};

// ================= BACKUP DAN RESTORE DATA =================

function serializeBackupValue(value) {
  if (value instanceof Timestamp) {
    return {
      __backupType: "timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds
    };
  }

  if (value instanceof Date) {
    return {
      __backupType: "date",
      value: value.toISOString()
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeBackupValue);
  }

  if (value && typeof value === "object") {
    const result = {};
    Object.entries(value).forEach(([key, val]) => {
      result[key] = serializeBackupValue(val);
    });
    return result;
  }

  return value;
}

function restoreBackupValue(value) {
  if (Array.isArray(value)) {
    return value.map(restoreBackupValue);
  }

  if (value && typeof value === "object") {
    if (value.__backupType === "timestamp") {
      return new Timestamp(value.seconds, value.nanoseconds);
    }

    if (value.__backupType === "date") {
      return new Date(value.value);
    }

    const result = {};
    Object.entries(value).forEach(([key, val]) => {
      result[key] = restoreBackupValue(val);
    });
    return result;
  }

  return value;
}

// UNDUH BACKUP
$("backupDataBtn").onclick = async () => {
  if (!isAdmin()) {
    msg("backupMsg", "Fitur ini hanya untuk admin.", true);
    return;
  }

  try {
    msg("backupMsg", "Sedang membuat backup...");

    const backup = {
      app: "absensi-madin-kaligintung",
      version: 1,
      createdAt: new Date().toISOString(),
      collections: {}
    };

    let total = 0;

    for (const name of ["classes", "students", "attendance"]) {
      const snapshot = await getDocs(collection(db, name));

      backup.collections[name] = snapshot.docs.map(item => ({
        id: item.id,
        data: serializeBackupValue(item.data())
      }));

      total += snapshot.size;
    }

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `backup-absensi-madin-${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    msg("backupMsg", `Backup berhasil. ${total} data tersimpan.`);
  } catch (error) {
    console.error(error);
    msg("backupMsg", "Backup gagal: " + error.message, true);
  }
};

// PULIHKAN BACKUP
$("restoreDataBtn").onclick = async () => {
  if (!isAdmin()) {
    msg("backupMsg", "Fitur ini hanya untuk admin.", true);
    return;
  }

  const file = $("restoreFile").files[0];

  if (!file) {
    msg("backupMsg", "Pilih file backup terlebih dahulu.", true);
    return;
  }

  if (!confirm(
    "Restore akan menggabungkan data backup dengan data saat ini. Data yang ada tidak dihapus. Lanjutkan?"
  )) {
    return;
  }

  try {
    msg("backupMsg", "Memeriksa file backup...");

    const backup = JSON.parse(await file.text());

    if (
      backup.app !== "absensi-madin-kaligintung" ||
      backup.version !== 1 ||
      !backup.collections
    ) {
      throw new Error("File backup tidak valid atau tidak cocok.");
    }

    const allowedCollections = ["classes", "students", "attendance"];

    for (const name of allowedCollections) {
      if (!Array.isArray(backup.collections[name])) {
        throw new Error(`Data ${name} tidak ditemukan atau tidak valid.`);
      }
    }

    let restored = 0;

    for (const name of allowedCollections) {
      for (const item of backup.collections[name]) {
        if (
          !item ||
          typeof item.id !== "string" ||
          !item.id ||
          item.id.includes("/") ||
          !item.data ||
          typeof item.data !== "object" ||
          Array.isArray(item.data)
        ) {
          throw new Error(`Ada data ${name} yang tidak valid.`);
        }

        await setDoc(
          doc(db, name, item.id),
          restoreBackupValue(item.data),
          { merge: true }
        );

        restored++;
        msg("backupMsg", `Memulihkan data... ${restored} dokumen.`);
      }
    }

    msg(
      "backupMsg",
      `Restore berhasil. ${restored} dokumen telah dipulihkan. Halaman akan dimuat ulang.`
    );

    $("restoreFile").value = "";

    setTimeout(() => location.reload(), 2000);

  } catch (error) {
    console.error(error);
    msg("backupMsg", "Restore gagal: " + error.message, true);
  }
};
$("shareImageBtn").onclick = async () => {
  if (!reportRows.length) {
    return msg("reportMsg", "Tampilkan rekap terlebih dahulu.", true);
  }

  const btn = $("shareImageBtn");
  btn.disabled = true;
  btn.textContent = "Membuat gambar...";

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const W = 1200;
    const margin = 45;
    const tableWidth = W - margin * 2;

    canvas.width = W;

    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "https://madzakhfasy.github.io/absensi-madin-kaligintung/LOGO%20MADIN%20REMOVE%20BG.png";

    await new Promise((resolve, reject) => {
      logo.onload = resolve;
      logo.onerror = reject;
    });

    const nameWidth = 490;
    const fontName = "28px Arial";

    function wrapText(text, maxWidth, font) {
      ctx.font = font;
      const words = String(text || "").split(/\s+/);
      const lines = [];
      let line = "";

      words.forEach(word => {
        const test = line ? line + " " + word : word;

        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });

      if (line) lines.push(line);
      return lines.length ? lines : [""];
    }

    const preparedRows = reportRows.map((r, i) => {
      const lines = wrapText(r.name, nameWidth, fontName);
      return {
        ...r,
        no: i + 1,
        nameLines: lines,
        height: Math.max(76, lines.length * 34 + 28)
      };
    });

    const tableHeaderHeight = 90;
    const headerHeight = 420;
    const footerHeight = 180;

    const tableHeight = preparedRows.reduce(
      (sum, r) => sum + r.height,
      tableHeaderHeight
    );

    canvas.height = headerHeight + tableHeight + footerHeight;

    // Latar belakang
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, canvas.height);

    // Ornamen atas
    ctx.fillStyle = "#075b35";
    ctx.fillRect(0, 0, W, 18);

    ctx.strokeStyle = "#d8ad35";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(W, 28);
    ctx.stroke();

    // Logo asli
    ctx.drawImage(logo, 65, 65, 230, 230);

    // Kop laporan
ctx.textAlign = "center";

ctx.fillStyle = "#075b35";
ctx.font = "bold 42px Arial";
ctx.fillText("MADRASAH DINIYAH KALIGINTUNG", 732, 145);

ctx.fillStyle = "#075b35";
ctx.fillRect(325, 175, 815, 75);

ctx.fillStyle = "#ffffff";
ctx.font = "bold 38px Arial";
ctx.fillText("REKAP KEHADIRAN SANTRI", 732, 225);

ctx.fillStyle = "#075b35";
ctx.font = "italic 28px Arial";
ctx.fillText(
  "Belajar Bersama, Meraih Ridha Allah",
  732,
  300
);
    // Informasi laporan
    const infoY = 345;
    const infoH = 65;

    ctx.fillStyle = "#edf8e9";
    ctx.strokeStyle = "#176b45";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(margin, infoY, tableWidth, infoH, 18);
    ctx.fill();
    ctx.stroke();

    const totalHadir = reportRows.reduce((s, r) => s + r.Hadir, 0);
    const totalIzin = reportRows.reduce((s, r) => s + r.Izin, 0);
    const totalSakit = reportRows.reduce((s, r) => s + r.Sakit, 0);
    const totalAlpa = reportRows.reduce((s, r) => s + r.Alpa, 0);

    ctx.textAlign = "center";
    ctx.fillStyle = "#123c27";
    ctx.font = "bold 24px Arial";

    ctx.fillText(`${reportClassValue}`, 240, 385);
    ctx.fillText(`BULAN: ${reportMonthValue}`, 600, 385);
    ctx.fillText(`TOTAL SANTRI: ${reportRows.length}`, 970, 385);

    // Header tabel
    let y = headerHeight;

    const cols = [
      { label: "NO", x: 45, w: 75 },
      { label: "NAMA SANTRI", x: 120, w: 470 },
      { label: "H", x: 590, w: 110 },
      { label: "I", x: 700, w: 110 },
      { label: "S", x: 810, w: 110 },
      { label: "A", x: 920, w: 110 },
      { label: "%", x: 1050, w: 105 }
    ];

    ctx.fillStyle = "#075b35";
    ctx.fillRect(margin, y, tableWidth, tableHeaderHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 27px Arial";
    ctx.textAlign = "center";

    cols.forEach(c => {
      ctx.fillText(c.label, c.x + c.w / 2, y + 55);
    });

    y += tableHeaderHeight;

    // Isi tabel
    preparedRows.forEach((r, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#edf7ed" : "#ffffff";
      ctx.fillRect(margin, y, tableWidth, r.height);

      ctx.strokeStyle = "#a8c9ae";
      ctx.lineWidth = 2;
      ctx.strokeRect(margin, y, tableWidth, r.height);

      ctx.fillStyle = "#172b20";
      ctx.font = "26px Arial";
      ctx.textAlign = "center";

      const centerY = y + r.height / 2 + 9;

      ctx.fillText(r.no, 82, centerY);

      // Nama lengkap, otomatis turun baris
      ctx.textAlign = "left";
      ctx.font = fontName;

      r.nameLines.forEach((line, index) => {
        ctx.fillText(
          line,
          135,
          y + (r.height - r.nameLines.length * 34) / 2 + 27 + index * 34
        );
      });

      ctx.textAlign = "center";
      ctx.font = "bold 27px Arial";

      ctx.fillText(r.Hadir, 645, centerY);
      ctx.fillText(r.Izin, 755, centerY);
      ctx.fillText(r.Sakit, 865, centerY);
      ctx.fillText(r.Alpa, 975, centerY);

      ctx.fillStyle = "#075b35";
      ctx.fillText(`${r.Persentase}%`, 1100, centerY);

      y += r.height;
    });

    // Garis pemisah kolom
    ctx.strokeStyle = "#a8c9ae";
    ctx.lineWidth = 2;

    [120, 590, 700, 810, 920, 1050].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, headerHeight);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Footer statistik
    y += 35;

    ctx.fillStyle = "#075b35";
    ctx.beginPath();
    ctx.roundRect(margin, y, tableWidth, 65, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
      `HADIR ${totalHadir}  •  IZIN ${totalIzin}  •  SAKIT ${totalSakit}  •  ALPA ${totalAlpa}`,
      W / 2,
      y + 42
    );

    y += 105;

    ctx.fillStyle = "#075b35";
    ctx.font = "italic 27px Arial";
    ctx.fillText(
      "Semoga ilmu yang dipelajari menjadi bekal kebaikan.",
      W / 2,
      y
    );

    ctx.fillStyle = "#d8ad35";
    ctx.fillRect(0, canvas.height - 18, W, 18);

    // Buat file gambar
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) throw new Error("Gambar gagal dibuat.");

    const file = new File(
      [blob],
      `Rekap-${reportClassValue}-${reportMonthValue}.png`,
      { type: "image/png" }
    );

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Rekap Kehadiran Madin Kaligintung"
      });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 3000);
      msg("reportMsg", "Gambar rekap berhasil disimpan.");
    }

  } catch (e) {
    console.error(e);
    msg("reportMsg", "Gagal membuat gambar: " + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan Rekap sebagai Gambar";
  }
};
