import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, collection, doc, deleteDoc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
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

if (!response.ok) {
  throw new Error("Server foto memberikan respons: " + response.status);
}

if (!result.success) {
  throw new Error(result.error || "Unggah foto gagal.");
}

if (
  typeof result.imageUrl !== "string" ||
  !result.imageUrl.trim() ||
  typeof result.fileId !== "string" ||
  !result.fileId.trim()
) {
  throw new Error(
    "Foto berhasil diunggah, tetapi alamat foto atau ID file tidak diterima dari server."
  );
}

return {
  photoUrl: result.imageUrl.trim(),
  photoFileId: result.fileId.trim()
};
}
const CLASS_NAMES = ["Kelas Jilid Pemula","Kelas Jilid 1","Kelas Jilid 2","Kelas Jilid 3","Kelas Jilid 4","Kelas Jilid 5","Kelas Khusus"];
const STATUSES = ["Hadir","Izin","Sakit","Alpa"];
let currentUser=null, profile=null, classes=[], students=[], reportRows=[], reportMonthValue="", reportClassValue="";

// PENGATUR GRAFIK KEHADIRAN
let attendanceChartPeriod = "weekly";
let attendanceChartData = [];
let attendanceChartReady = false;
let weeklyDaysOff = {};
let specialHolidays = [];
const WEEK_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu"
];
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
// PEMILIH KONTAK WALI SANTRI
function attachGuardianContactPicker(input) {
  if (!input || input.dataset.contactPickerReady === "true") return;
  input.dataset.contactPickerReady = "true";

  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    display:flex;
    align-items:stretch;
    gap:8px;
    width:100%;
  `;

  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  input.style.flex = "1";
  input.style.minWidth = "0";

  const button = document.createElement("button");
  button.type = "button";
  button.title = "Pilih dari kontak HP";
  button.setAttribute("aria-label", "Pilih nomor dari kontak HP");
  button.style.cssText = `
    width:46px;
    min-width:46px;
    padding:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#176b45;
    color:white;
    border:1px solid #c9a64f;
    border-radius:10px;
  `;

  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="21" height="21"
      fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="3.5" y="3" width="17" height="18" rx="3"></rect>
      <circle cx="12" cy="9" r="2.5"></circle>
      <path d="M7.5 17c.8-2 2.3-3 4.5-3s3.7 1 4.5 3"></path>
    </svg>
  `;

  wrapper.appendChild(button);

  button.onclick = async () => {
    if (!navigator.contacts?.select) {
      showToast("Browser belum mendukung pemilih kontak.", true);
      return;
    }

    try {
      const contacts = await navigator.contacts.select(
        ["name", "tel"],
        { multiple: false }
      );

      if (contacts.length && contacts[0].tel?.length) {
        input.value = contacts[0].tel[0];
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Gagal membuka kontak HP.", true);
      }
    }
  };
}
attachGuardianContactPicker(document.getElementById("studentPhone"));
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
  profile=p.data();
await loadClasses();
await loadWeeklySchedule();
await loadHolidays();
fillStudentPdfClass();
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
$("hello").textContent="Halo, "+(profile.displayName || profile.name || user.email);
$("roleInfo").textContent=isAdmin()?"Admin/Pengurus":"Admin Absensi · Semua Kelas";

const profileName = profile.displayName || profile.name || user.email;
const profileRole = profile.displayRole || (isAdmin() ? "ADMIN MADIN" : "PETUGAS ABSENSI");

$("userProfilePhoto").src = profile.photoUrl ||
  "https://ui-avatars.com/api/?name=" + encodeURIComponent(profileName) +
  "&background=176b45&color=fff&size=160";

$("welcomeUserName").textContent = profileName;
$("welcomeUserRole").textContent = profileRole;
  document.querySelectorAll(".admin-only:not(.panel)").forEach(x=>x.classList.toggle("hidden",!isAdmin()));
  $("studentAdminForm").classList.toggle("hidden",!isAdmin());
  $("attendanceClassWrap").classList.toggle("hidden",!canAccessAllClasses());
$("reportClassWrap").classList.toggle("hidden",!canAccessAllClasses());
  if(!canAccessAllClasses()&&!myClass()){$("attendanceList").innerHTML='<p class="muted">Akun Anda belum diberi kelas. Hubungi admin Madin.</p>';$("saveAttendanceBtn").classList.add("hidden");}
  await fillClassSelects();await loadStudents();await renderAttendance();await renderDashboard();
 }catch(e){console.error(e);alert("Gagal memuat data: "+e.message);}
});

$("userProfilePhoto").onclick = () => {
  $("profilePhotoInput").click();
};

$("profilePhotoInput").onchange = async function() {
const file = this.files[0];
if (!file) return;

try {
const photoData = await uploadStudentPhoto(file);

await updateDoc(doc(db, "users", currentUser.uid), {
  photoUrl: photoData.photoUrl,
  photoFileId: photoData.photoFileId
});

profile.photoUrl = photoData.photoUrl;
profile.photoFileId = photoData.photoFileId;

$("userProfilePhoto").src = photoData.photoUrl;

showToast("Foto profil berhasil diperbarui.");

} catch (error) {
console.error(error);
showToast("Gagal mengganti foto: " + error.message, true);
} finally {
this.value = "";
}};

// KELOLA PROFIL PETUGAS OLEH ADMIN
let staffProfiles = [];

async function loadStaffProfiles() {
  if (!isAdmin()) return;

  const select = $("staffSelect");
  select.innerHTML = '<option value="">Memuat akun petugas...</option>';

  try {
    const snap = await getDocs(collection(db, "users"));

    staffProfiles = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.role === "petugas");

    select.innerHTML = '<option value="">Pilih akun petugas</option>';

    staffProfiles.forEach(u => {
      const option = document.createElement("option");
      option.value = u.id;
      option.textContent = u.displayName || u.name || u.email || u.id;
      select.appendChild(option);
    });

    if (!staffProfiles.length) {
      select.innerHTML = '<option value="">Belum ada akun petugas</option>';
    }

  } catch (error) {
    console.error(error);
    $("staffProfileMsg").textContent =
      "Gagal memuat akun petugas: " + error.message;
  }
}

$("staffSelect").onchange = function() {
  const staff = staffProfiles.find(u => u.id === this.value);
  if (!staff) return;

  $("staffNameInput").value = staff.displayName || staff.name || "";
  $("staffRoleInput").value = staff.displayRole || "PETUGAS ABSENSI";

  $("staffPhotoPreview").src = staff.photoUrl ||
    "https://ui-avatars.com/api/?name=Petugas&background=176b45&color=fff&size=160";
};

$("saveStaffProfileBtn").onclick = async function() {
  const uid = $("staffSelect").value;
  const name = $("staffNameInput").value.trim();
  const role = $("staffRoleInput").value.trim();
  const file = $("staffPhotoInput").files[0];

  if (!uid) {
    alert("Pilih akun petugas terlebih dahulu.");
    return;
  }

  if (!name || !role) {
    alert("Nama dan jabatan harus diisi.");
    return;
  }

  this.disabled = true;
  this.textContent = "Menyimpan...";

  try {
    let photoData = {};

    if (file) {
      photoData = await uploadStudentPhoto(file);
    }

    const updateData = {
      displayName: name,
      displayRole: role
    };

    if (file) {
      updateData.photoUrl = photoData.photoUrl;
      updateData.photoFileId = photoData.photoFileId;
    }

    await updateDoc(doc(db, "users", uid), updateData);

    const staff = staffProfiles.find(u => u.id === uid);
    Object.assign(staff, updateData);

    $("staffPhotoPreview").src = staff.photoUrl ||
      "https://ui-avatars.com/api/?name=Petugas&background=176b45&color=fff&size=160";

    $("staffProfileMsg").textContent = "Profil petugas berhasil diperbarui.";
    $("staffPhotoInput").value = "";

  } catch (error) {
    console.error(error);
    $("staffProfileMsg").textContent =
      "Gagal menyimpan profil: " + error.message;
  } finally {
    this.disabled = false;
    this.textContent = "Simpan Profil Petugas";
  }
};
async function loadClasses(){
 const snap=await getDocs(collection(db,"classes"));
 classes=snap.docs.map(d=>({id:d.id,...d.data()}));

 if(isAdmin()&&classes.length===0){
   for(let i=0;i<CLASS_NAMES.length;i++){
     await setDoc(doc(db,"classes","kelas"+(i+1)),{
       name:CLASS_NAMES[i],
       order:i+1
     });
   }
   const s=await getDocs(collection(db,"classes"));
   classes=s.docs.map(d=>({id:d.id,...d.data()}));
 }

 if(isAdmin()&&!classes.some(c=>c.name==="Kelas Khusus")){
   await addDoc(collection(db,"classes"),{
     name:"Kelas Khusus",
     order:7
   });

   const s=await getDocs(collection(db,"classes"));
   classes=s.docs.map(d=>({id:d.id,...d.data()}));
 }

 classes.sort((a,b)=>(a.order||0)-(b.order||0));
}
// MEMUAT JADWAL LIBUR MINGGUAN
async function loadWeeklySchedule() {
  try {
    const ref = doc(db, "calendarSettings", "weekly");
    const snap = await getDoc(ref);

    weeklyDaysOff = snap.exists()
      ? snap.data().classDaysOff || {}
      : {};

    renderWeeklySchedule();

  } catch (error) {
    console.error(error);
    msg("holidayMsg", "Gagal memuat jadwal libur: " + error.message, true);
  }
}

// ======================================
// PENGELOLAAN LIBUR TANGGAL TERTENTU
// ======================================

// Menampilkan pilihan kelas
function renderHolidayClassPicker() {
  const picker = $("holidayClassPicker");

  picker.innerHTML = classes.map(kelas => `
    <label style="display:flex;gap:8px;margin:8px 0;">
      <input
        type="checkbox"
        class="holiday-class-check"
        value="${esc(kelas.id)}"
        ${!isAdmin() ? "disabled" : ""}
      >
      ${esc(kelas.name)}
    </label>
  `).join("");

  picker.classList.toggle(
    "hidden",
    $("holidayClassScope").value !== "selected"
  );
}

// Memuat daftar libur dari Firestore
async function loadHolidays() {
  try {
    const snap = await getDocs(collection(db, "holidays"));

    const holidays = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
specialHolidays = holidays;
    holidays.sort((a, b) => a.date.localeCompare(b.date));

    renderHolidayList(holidays);

    renderHolidayClassPicker();

    $("holidayClassScope").disabled = !isAdmin();
    $("holidayDate").disabled = !isAdmin();
    $("holidayName").disabled = !isAdmin();

    $("saveHolidayBtn").classList.toggle("hidden", !isAdmin());

  } catch (error) {
    console.error(error);
    msg("holidayMsg", "Gagal memuat daftar libur: " + error.message, true);
  }
}

// Menampilkan daftar libur
function renderHolidayList(holidays) {
  const container = $("holidayList");

  if (!holidays.length) {
    container.innerHTML =
      '<p class="muted">Belum ada data hari libur.</p>';
    return;
  }

  container.innerHTML = holidays.map(h => {
    const cakupan = h.scope === "all"
      ? "Semua Kelas"
      : (h.classIds || [])
          .map(id => clsName(id))
          .join(", ");

    return `
      <div class="card" style="margin-bottom:10px;">
        <strong>${esc(h.name || "Hari Libur")}</strong>

        <p style="margin:6px 0;">
          Tanggal: ${esc(h.date)}
        </p>

        <p style="margin:6px 0;">
          Berlaku: ${esc(cakupan || "Belum ditentukan")}
        </p>

        ${isAdmin() ? `
          <button
            type="button"
            class="danger full delete-holiday-btn"
            data-id="${esc(h.id)}"
          >
            Hapus / Batalkan Libur
          </button>
        ` : ""}
      </div>
    `;
  }).join("");
}

// Menyimpan tanggal libur
async function saveHoliday() {
  try {
    const date = $("holidayDate").value;
    const name = $("holidayName").value.trim();
    const scope = $("holidayClassScope").value;

    if (!date || !name) {
      msg("holidayMsg", "Tanggal dan keterangan libur wajib diisi.", true);
      return;
    }

    let classIds = [];

    if (scope === "selected") {
      classIds = Array.from(
        document.querySelectorAll(".holiday-class-check:checked")
      ).map(el => el.value);

      if (!classIds.length) {
        msg("holidayMsg", "Pilih minimal satu kelas.", true);
        return;
      }
    }

    await addDoc(collection(db, "holidays"), {
      date,
      name,
      scope,
      classIds,
      createdAt: serverTimestamp()
    });

    $("holidayDate").value = "";
    $("holidayName").value = "";
    $("holidayClassScope").value = "all";

    renderHolidayClassPicker();

    await loadHolidays();

    msg("holidayMsg", "Tanggal libur berhasil disimpan.");

  } catch (error) {
    console.error(error);
    msg("holidayMsg", "Gagal menyimpan libur: " + error.message, true);
  }
}

// Menghapus atau membatalkan libur
async function deleteHoliday(id) {
  const yakin = confirm(
    "Apakah Anda yakin ingin menghapus atau membatalkan tanggal libur ini?"
  );

  if (!yakin) return;

  try {
    await deleteDoc(doc(db, "holidays", id));

    await loadHolidays();

    msg("holidayMsg", "Tanggal libur berhasil dibatalkan.");

  } catch (error) {
    console.error(error);
    msg("holidayMsg", "Gagal menghapus libur: " + error.message, true);
  }
}

// Menghubungkan tombol
$("holidayClassScope").onchange = renderHolidayClassPicker;

$("saveHolidayBtn").onclick = saveHoliday;

$("holidayList").onclick = event => {
  const button = event.target.closest(".delete-holiday-btn");

  if (button) {
    deleteHoliday(button.dataset.id);
  }
};
// MENAMPILKAN JADWAL LIBUR SETIAP KELAS
function renderWeeklySchedule() {
  const container = $("classScheduleSettings");
  if (!container) return;

  container.innerHTML = classes.map(kelas => {
    const selectedDays = weeklyDaysOff[kelas.id] ?? [0];

    const namaLibur = selectedDays.length
      ? selectedDays.map(index => WEEK_DAYS[index]).join(", ")
      : "Tidak ada";

    return `
      <details class="card" style="margin-bottom:10px;padding:12px;">
        <summary style="cursor:pointer;font-weight:bold;">
          ${esc(kelas.name)}
          <span style="float:right;font-weight:normal;color:#dc3545;">
  ${esc(namaLibur)} ✓
</span>
        </summary>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:15px;">
          ${WEEK_DAYS.map((hari, index) => `
            <label style="display:flex;align-items:center;gap:7px;">
              <input
                type="checkbox"
                class="weekly-day-check"
                data-class="${esc(kelas.id)}"
                value="${index}"
                ${selectedDays.includes(index) ? "checked" : ""}
                ${!isAdmin() ? "disabled" : ""}
              >
              ${hari}
            </label>
          `).join("")}
        </div>
      </details>
    `;
  }).join("");

  if (isAdmin()) {
    container.innerHTML += `
      <button id="saveWeeklyScheduleBtn" class="primary full" type="button">
        Simpan Jadwal Libur Mingguan
      </button>
    `;

    $("saveWeeklyScheduleBtn").onclick = saveWeeklySchedule;
  } else {
    container.innerHTML += `
      <p class="muted">
        Jadwal ini hanya dapat diubah oleh admin.
      </p>
    `;
  }
}


// MENYIMPAN JADWAL LIBUR MINGGUAN
async function saveWeeklySchedule() {
  try {
    const newSchedule = {};

    classes.forEach(kelas => {
      newSchedule[kelas.id] = Array.from(
        document.querySelectorAll(
          `.weekly-day-check[data-class="${kelas.id}"]:checked`
        )
      ).map(el => Number(el.value));
    });

    await setDoc(
      doc(db, "calendarSettings", "weekly"),
      {
        classDaysOff: newSchedule,
        updatedAt: serverTimestamp()
      }
    );

    weeklyDaysOff = newSchedule;

renderWeeklySchedule();

showToast("Jadwal libur mingguan berhasil disimpan.");

  } catch (error) {
    console.error(error);
    showToast("Gagal menyimpan jadwal: " + error.message, true);
  }
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
function isStudentBiodataComplete(s) {
  const requiredFields = [
    s.nis,
    s.name,
    s.classId,
    s.gender,
    s.birthplace,
    s.birthdate,
    s.fatherName,
    s.motherName,
    s.address
  ];

  return requiredFields.every(value =>
    String(value ?? "").trim() !== ""
  );
}
function renderStudentList() {
  document.querySelector("#studentsPanel .student-tools").style.display = "";
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

    const biodataComplete = isStudentBiodataComplete(s);

   r.innerHTML = `
  <div class="student-photo">
    ${studentPhotoUrl(s)
  ? `<img src="${esc(studentPhotoUrl(s))}" alt="Foto ${esc(s.name)}">`
  : `<div class="photo-placeholder">?</div>`
  
    }
  </div>

    <div class="student-info">
    <strong>${esc(s.name)}</strong>
    <small>${esc(clsName(s.classId))}</small>

    <span class="biodata-status ${biodataComplete ? "complete" : "incomplete"}">
      ${biodataComplete ? "Lengkap" : "Belum Lengkap"}
    </span>
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
    r.classList.add("student-detail-open");
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
      <div class="student-history-v1">

        <div style="text-align:center;padding:12px;">
${
  studentPhotoUrl(s)
    ? `<img src="${esc(studentPhotoUrl(s))}"
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
    <div class="student-profile-v3">

      <!-- KARTU IDENTITAS -->
      <div class="profile-v3-hero">

        <div class="profile-v3-photo">
          ${
            studentPhotoUrl(s)
  ? `<img src="${esc(studentPhotoUrl(s))}" alt="Foto ${esc(s.name)}">`
  : `<div class="profile-v3-placeholder">?</div>`
          }
        </div>

        <div class="profile-v3-identity">
          <span class="profile-v3-label">PROFIL SANTRI</span>
          <h2>${esc(s.name)}</h2>

          <div class="profile-v3-class">
            ${esc(clsName(s.classId))}
          </div>

          <div class="profile-v3-nis">
            NIS: ${esc(s.nis || "-")}
          </div>
        </div>

        <div class="profile-v3-decoration">۞</div>
      </div>

      <!-- INFORMASI PRIBADI -->
      <div class="profile-v3-section">

        <div class="profile-v3-heading">
          <span class="profile-v3-heading-icon">01</span>
          <div>
            <h3>Informasi Pribadi</h3>
            <p>Identitas dan data diri santri</p>
          </div>
        </div>

        <div class="profile-v3-card">

          <div class="profile-v3-row">
            <span>Jenis Kelamin</span>
            <strong>
              ${
                s.gender === "L" || s.gender === "Laki-laki"
                  ? "Laki-Laki"
                  : s.gender === "P" || s.gender === "Perempuan"
                    ? "Perempuan"
                    : "-"
              }
            </strong>
          </div>

          <div class="profile-v3-row">
            <span>Tempat Lahir</span>
            <strong>${esc(s.birthplace || "-")}</strong>
          </div>

          <div class="profile-v3-row">
            <span>Tanggal Lahir</span>
            <strong>${tanggalLahir}</strong>
          </div>

        </div>
      </div>

      <!-- INFORMASI KELUARGA -->
      <div class="profile-v3-section">

        <div class="profile-v3-heading">
          <span class="profile-v3-heading-icon">02</span>
          <div>
            <h3>Informasi Keluarga</h3>
            <p>Data orang tua dan wali santri</p>
          </div>
        </div>

        <div class="profile-v3-card">

          <div class="profile-v3-row">
            <span>Nama Ayah</span>
            <strong>${esc(s.fatherName || "-")}</strong>
          </div>

          <div class="profile-v3-row">
            <span>Nama Ibu</span>
            <strong>${esc(s.motherName || "-")}</strong>
          </div>

          <div class="profile-v3-row">
            <span>No. HP Wali</span>
            <strong>${esc(s.guardianPhone || "-")}</strong>
          </div>

        </div>
      </div>

      <!-- ALAMAT -->
      <div class="profile-v3-section">

        <div class="profile-v3-heading">
          <span class="profile-v3-heading-icon">03</span>
          <div>
            <h3>Alamat Santri</h3>
            <p>Tempat tinggal santri</p>
          </div>
        </div>

        <div class="profile-v3-address">
          ${esc(s.address || "Alamat belum diisi")}
        </div>

      </div>

      <!-- TOMBOL KEMBALI -->
      <button type="button" class="profile-v3-back">
        ← Kembali ke Data Santri
      </button>

    </div>
  `;

  r.querySelector(".profile-v3-back").onclick = renderStudentList;
};


    if (isAdmin()) {
      r.querySelector(".edit-btn").onclick = () => {
        document.querySelector("#studentsPanel .student-tools").style.display = "none";
          r.classList.add("student-detail-open");
  r.innerHTML = `
    <div class="student-edit-v1">
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

      ${studentPhotoUrl(s) ? `<img src="${esc(studentPhotoUrl(s))}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">` : ""}
${(s.photoUrl || s.photoFileId) ? `<br><button type="button" class="secondary edit-photo-delete">Hapus Foto</button>` : ""}
<br><br>
<button type="button" class="edit-save">Simpan Perubahan</button>
      <button type="button" class="secondary edit-cancel">Batal</button>
    </div>
  `;
        
attachGuardianContactPicker(r.querySelector(".edit-phone"));
  r.querySelector(".edit-cancel").onclick = renderStudentList;
const deletePhotoButton = r.querySelector(".edit-photo-delete");

if (deletePhotoButton) {
  deletePhotoButton.onclick = async () => {
    if (!confirm("Hapus foto santri dari aplikasi?")) return;

    deletePhotoButton.disabled = true;
    deletePhotoButton.textContent = "Menghapus...";

    try {
      await updateDoc(doc(db, "students", s.id), {
        photoUrl: "",
        photoFileId: ""
      });

      s.photoUrl = "";
      s.photoFileId = "";

      showToast("Foto berhasil dihapus dari aplikasi.");

      await loadStudents();
      await renderDashboard();

    } catch (e) {
      showToast("Gagal menghapus foto: " + e.message);
      deletePhotoButton.disabled = false;
      deletePhotoButton.textContent = "Hapus Foto";
    }
  };
}
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
            const nis = r.querySelector(".edit-nis").value.trim();

      if (await checkNisDuplicate(nis, s.id)) {
        showToast("NIS " + nis + " sudah digunakan santri lain.");
        button.disabled = false;
        button.textContent = "Simpan Perubahan";
        return;
      }
      const photoFile = r.querySelector(".edit-photo").files[0];
      const photoData = photoFile
        ? await uploadStudentPhoto(photoFile)
        : {};
showToast(`Pemeriksaan foto: URL=${!!photoData.photoUrl}, ID=${!!photoData.photoFileId}`);
      await updateDoc(doc(db, "students", s.id), {
        name,
        classId,
        nis,
        gender: r.querySelector(".edit-gender").value,
        birthplace: r.querySelector(".edit-birthplace").value.trim(),
        birthdate: r.querySelector(".edit-birthdate").value,
        address: r.querySelector(".edit-address").value.trim(),
        fatherName: r.querySelector(".edit-father").value.trim(),
        motherName: r.querySelector(".edit-mother").value.trim(),
        guardianPhone: r.querySelector(".edit-phone").value.trim(),
        ...photoData
      });

      showToast(`Data tersimpan. Foto: URL=${!!photoData.photoUrl}, ID=${!!photoData.photoFileId}`);
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
function studentPhotoUrl(s){
  if(s.photoUrl && s.photoUrl.trim()){
    const match = s.photoUrl.match(/[?&]id=([^&]+)/)
      || s.photoUrl.match(/\/d\/([^/?]+)/);

    if(match){
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }

    return s.photoUrl.trim();
  }

  const gender = String(s.gender || "").toLowerCase();

  if(gender === "l" || gender === "laki-laki"){
    return "avatar-santri-laki.jpg";
  }

  if(gender === "p" || gender === "perempuan"){
    return "avatar-santri-perempuan.jpg";
  }

  return "";
}
async function importDeleteStudent(id){
  const {deleteDoc}=await import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js");
  await deleteDoc(doc(db,"students",id));
  await loadStudents();
  await renderDashboard();
}
async function checkNisDuplicate(nis, excludeId = null) {
  const value = String(nis || "").trim();

  if (!value) return false;

  const result = await getDocs(
    query(
      collection(db, "students"),
      where("nis", "==", value)
    )
  );

  return result.docs.some(student => student.id !== excludeId);
}
function nextAvailableNis(usedValues) {
  const used = new Set(
    usedValues.map(value => String(value || "").trim()).filter(Boolean)
  );

  let number = 301;
  while (used.has(String(number).padStart(4, "0"))) {
    number++;
  }

  return String(number).padStart(4, "0");
}

$("generateNisBtn")?.addEventListener("click", async () => {
  if (!isAdmin()) return;

  const button = $("generateNisBtn");
  const input = $("studentNis");

  button.disabled = true;
  button.textContent = "Memproses...";

  try {
    const snapshot = await getDocs(collection(db, "students"));

    const usedNis = snapshot.docs.map(item =>
      item.data().nis || ""
    );

    const newNis = nextAvailableNis(usedNis);

    input.value = newNis;

    showToast("NIS otomatis berhasil dibuat: " + newNis);
  } catch (error) {
    showToast("Gagal membuat NIS: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "NIS Otomatis";
  }
});
$("studentSearch").addEventListener("input", renderStudentList);

$("studentFilterClass").addEventListener("change", renderStudentList);
$("addStudentBtn").onclick=async()=>{
  const name=$("studentName").value.trim();
  const classId=$("studentClass").value;

  if(!name)return msg("studentMsg","Masukkan nama santri.",true);
  if(!classId)return msg("studentMsg","Pilih kelas santri.",true);

  try{
        const nis = $("studentNis").value.trim() || nextAvailableNis(students.map(s => s.nis));

    if (await checkNisDuplicate(nis)) {
      return msg("studentMsg", "NIS " + nis + " sudah digunakan santri lain.", true);
    }
        const photoFile = $("studentPhoto")?.files?.[0];
    const photoData = photoFile ? await uploadStudentPhoto(photoFile) : {};
    
    await addDoc(collection(db,"students"),{
      name,
      classId,
      nis,
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

// MEMERIKSA APAKAH KELAS SEDANG LIBUR
function isWeeklyHoliday(classId, date) {
  if (!classId || !date) return false;

  const day = new Date(date + "T00:00:00").getDay();
  const daysOff = weeklyDaysOff[classId] ?? [0];

  return daysOff.includes(day);
}
// MEMERIKSA LIBUR TANGGAL TERTENTU
function isSpecialHoliday(classId, date) {
  if (!classId || !date) return null;

  return specialHolidays.find(h => {
    if (h.date !== date) return false;
    if (h.scope === "all") return true;
    return (h.classIds || []).includes(classId);
  }) || null;
}
$("attendanceDate").onchange=renderAttendance;$("attendanceClass").onchange=renderAttendance;
async function renderAttendance(){
 if(!currentUser||(!canAccessAllClasses()&&!myClass()))return;
 const classId=selectedClass();if(!classId)return;
 const list=students.filter(s=>s.classId===classId);
 $("attendanceClassName").textContent=clsName(classId);
 const date=$("attendanceDate").value;
  // Periksa libur tanggal tertentu
const specialHoliday = isSpecialHoliday(classId, date);

if (specialHoliday) {
  $("attendanceList").innerHTML =
    `<p style="text-align:center;padding:20px;color:#198754;font-weight:bold;">
      LIBUR NGAJI<br>${esc(specialHoliday.name || "Hari Libur")}
    </p>`;

  $("saveAttendanceBtn").classList.add("hidden");
  return;
}
  if (isWeeklyHoliday(classId, date)) {
  const namaHari = WEEK_DAYS[new Date(date + "T00:00:00").getDay()];

  $("attendanceList").innerHTML =
    `<p style="text-align:center;padding:20px;color:#198754;font-weight:bold;">
      HARI ${namaHari.toUpperCase()} – LIBUR NGAJI
    </p>`;

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
const specialHoliday = isSpecialHoliday(classId, date);

if (specialHoliday) {
  showToast("Tanggal tersebut libur: " + (specialHoliday.name || "Hari Libur"), true);
  return;
}
  if (isWeeklyHoliday(classId, date)) {
  showToast("Tanggal tersebut merupakan hari libur kelas ini!", true);
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

    // Simpan seluruh absensi menggunakan Firestore Batch
const attendanceInputs = [
  ...document.querySelectorAll("#attendanceList select")
];

if (attendanceInputs.length > 500) {
  throw new Error(
    "Jumlah santri melebihi batas 500 data dalam satu penyimpanan."
  );
}

const batch = writeBatch(db);

attendanceInputs.forEach(el => {
  const id = el.dataset.id;
  const docId = `${date}_${id}`;

  batch.set(
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
});

await batch.commit();

msg(
  "attendanceMsg",
  `Absensi berhasil disimpan untuk ${attendanceInputs.length} santri.`
);
  } catch (e) {
    console.error(e);
    msg("attendanceMsg", "Gagal menyimpan absensi: " + e.message, true);
  } finally {
    btn.disabled = false;
  }
};

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
  document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("hidden",x.id!==b.dataset.tab));

  if(b.dataset.tab==="studentsPanel") loadStudents();
  if(b.dataset.tab==="staffPanel") loadStaffProfiles();
});
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
const specialClass = classes.find(c => c.name === "Kelas Khusus");
const selectedSpecial = !allClasses && classId === specialClass?.id;

const studentQuery = allClasses
  ? getDocs(collection(db, "students"))
  : getDocs(query(
      collection(db, "students"),
      where("classId", "==", classId)
    ));

const attendanceQuery = allClasses || selectedSpecial
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

const eligibleStudentDocs = ss.docs.filter(d =>
  selectedSpecial
    ? d.data().classId === specialClass?.id
    : d.data().classId !== specialClass?.id
);

const eligibleStudentIds = new Set(
  eligibleStudentDocs.map(d => d.id)
);

const att = aa.docs
  .map(d => d.data())
  .filter(a => eligibleStudentIds.has(a.studentId));
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

    const rows = eligibleStudentDocs.map(d => {
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
  gap: 18px;
  width: 100%;
  margin: 0 0 26px;
  padding-bottom: 15px;
  border-bottom: 3px double #176b45;
}

.letterhead img {
  width: 115px;
  height: 115px;
  object-fit: contain;
  flex: 0 0 115px;
}

.letterhead-text {
  flex: 1;
  min-width: 0;
  text-align: center;
  color: #075b32;
}

.letterhead-text .arabic-title {
  font-family: "Noto Naskh Arabic", "Amiri", "Traditional Arabic", serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.5;
  direction: rtl;
  color: #075b32;
  margin-bottom: 4px;
}

.letterhead-text .organizer {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 5px;
}

.letterhead-text .school {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.letterhead-text .address {
  color: #222;
  font-size: 13px;
  line-height: 1.5;
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
  background: #176b45;
  color: #ffffff;
  font-weight: 700;
  padding: 10px 8px;
}

        .class-col,
        .name-col {
          text-align: left;
        }
        tbody tr:nth-child(even) {
  background: #f1f8f3;
}

tbody tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

        .sign {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  text-align: center;
  font-size: 12px;
}

.sign-box {
  width: 50%;
  text-align: center;
}

.sign strong {
  display: block;
  margin-top: 65px;
  text-decoration: none;
  font-weight: normal;
}

.sign span {
  display: block;
  margin-top: 4px;
}

        .note {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  margin: 0;
  font-size: 9px;
  color: #555;
  text-align: left;
}
        }

        @media print {
          body {
            margin: 12mm;
          }
          thead {
  display: table-header-group;
}

tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

.sign {
  break-inside: avoid;
  page-break-inside: avoid;
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
  <div class="arabic-title">المدرسة الدنية كالي ڮينتوڠ</div>
  <div class="organizer">PENGURUS</div>
    <div class="school">MADRASAH DINIYAH KALIGINTUNG</div>
    <div class="address">Sekretariat: Dusun Kaligintung Rt. 05/ Rw. 03 Cilibang - Jeruklegi 53252</div>
  </div>
</div>

<h1 class="report-title">LAPORAN ABSENSI SANTRI</h1>

      <div class="meta">
        ${esc(reportClassValue)}
        <br>
        <b>Bulan:</b> ${new Date(reportMonthValue + "-01T00:00:00").toLocaleDateString("id-ID", {
  month: "long",
  year: "numeric"
})}
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
  <div class="sign-box">
    Mengetahui,
    <strong>_____________________________</strong>
    <span>Pembimbing Kelas</span>
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
// PENGATUR PILIHAN KELAS DAN PERIODE GRAFIK
function setupAttendanceChartControls(visibleClasses) {
  const classSelect = $("attendanceChartClass");
  const periodButtons = document.querySelectorAll(".chart-period-btn");
  const detailSelect = $("attendanceDetailType");
  if (!classSelect) return;

  // Isi pilihan kelas tanpa Kelas Khusus
  const chartClasses = visibleClasses.filter(c =>
    c.name !== "Kelas Khusus"
  );

  const previousValue = classSelect.value || "all";

  classSelect.innerHTML =
    '<option value="all">Semua Kelas</option>' +
    chartClasses.map(c =>
      `<option value="${c.id}">${esc(c.name)}</option>`
    ).join("");

  if (
    previousValue === "all" ||
    chartClasses.some(c => c.id === previousValue)
  ) {
    classSelect.value = previousValue;
  } else {
    classSelect.value = "all";
  }

  // Simpan pilihan kelas
  classSelect.onchange = function() {
  renderAttendanceChart();
  };

    // GANTI JENIS ANALISIS DETAIL
  if (detailSelect) {
    detailSelect.onchange = function() {
      renderAttendanceChart();
    };
  }
  // Aktifkan pilihan periode
  periodButtons.forEach(button => {
    button.onclick = function() {
      attendanceChartPeriod = button.dataset.period;

      periodButtons.forEach(item =>
        item.classList.toggle("active", item === button)
      );

      const label = $("attendanceChartPeriodLabel");

      if (label) {
        const labels = {
          weekly: "Ringkasan kehadiran 7 hari terakhir",
          monthly: "Ringkasan kehadiran per minggu",
          yearly: "Ringkasan kehadiran per bulan"
        };

        label.textContent = labels[attendanceChartPeriod];
      }

      renderAttendanceChart();
    };
  });
}
// MENGOLAH DATA GRAFIK KEHADIRAN
function prepareAttendanceChartData(records) {
const classSelect = $("attendanceChartClass");
const selectedClass = classSelect ? classSelect.value : "all";

const filtered = records.filter(a =>
selectedClass === "all" || a.classId === selectedClass
);

const today = new Date();
const pad = n => String(n).padStart(2, "0");

const dateString = d =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const groups = [];

if (attendanceChartPeriod === "weekly") {
for (let i = 6; i >= 0; i--) {
const date = new Date(today);
date.setDate(today.getDate() - i);

  groups.push({
    key: dateString(date),
    label: date.toLocaleDateString("id-ID", {
      weekday: "short"
    })
  });
}

} else if (attendanceChartPeriod === "monthly") {
for (let i = 1; i <= 5; i++) {
groups.push({
key: String(i),
label: `Minggu ${i}`
});
}

} else {
// TAHUN AJARAN NOVEMBER - OKTOBER
const academicStartYear =
today.getMonth() >= 10
? today.getFullYear()
: today.getFullYear() - 1;

for (let i = 0; i < 12; i++) {
  const date = new Date(academicStartYear, 10 + i, 1);

  groups.push({
    key: dateString(date).slice(0, 7),
    label: date.toLocaleDateString("id-ID", {
      month: "short"
    })
  });
}

}
  const result = groups.map(group => ({
...group,
Hadir: 0,
Izin: 0,
Sakit: 0,
Alpa: 0
}));

filtered.forEach(a => {
if (!a.date || !STATUSES.includes(a.status)) return;

const date = new Date(a.date + "T00:00:00");
let index = -1;

if (attendanceChartPeriod === "weekly") {
  index = result.findIndex(g => g.key === a.date);

} else if (attendanceChartPeriod === "monthly") {
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  ) {
    index = Math.ceil(date.getDate() / 7) - 1;
  }

} else {
  const monthKey = a.date.slice(0, 7);
  index = result.findIndex(g => g.key === monthKey);
}

if (index >= 0 && result[index]) {
  result[index][a.status]++;
}

});

return result;
}

// MENAMPILKAN GRAFIK KEHADIRAN
function renderAttendanceChart() {
  const chartBox = $("attendanceChart");
  if (!chartBox) return;

  const data = prepareAttendanceChartData(attendanceChartData);

  const colors = {
    Hadir: "#176b45",
    Izin: "#c9a64f",
    Sakit: "#4b91c5",
    Alpa: "#d96b6b"
  };

  const totals = {
    Hadir: 0,
    Izin: 0,
    Sakit: 0,
    Alpa: 0
  };

  data.forEach(item => {
    STATUSES.forEach(status => {
      totals[status] += item[status];
    });
  });

  const totalAbsensi = Object.values(totals)
    .reduce((sum, value) => sum + value, 0);

  const rate = totalAbsensi
    ? Math.round(totals.Hadir / totalAbsensi * 100)
    : 0;
    // DIAGRAM DONAT KOMPOSISI KEHADIRAN
  const donutBox = $("attendanceDonutChart");

  if (donutBox) {
    if (!totalAbsensi) {
      donutBox.innerHTML =
        '<p class="muted">Belum ada data kehadiran.</p>';
    } else {
      const hadirDeg = totals.Hadir / totalAbsensi * 360;
      const izinDeg = hadirDeg +
        totals.Izin / totalAbsensi * 360;
      const sakitDeg = izinDeg +
        totals.Sakit / totalAbsensi * 360;

      donutBox.innerHTML = `
        <div style="
          width:190px;
          height:190px;
          margin:20px auto;
          border-radius:50%;
          background:conic-gradient(
            #176b45 0deg ${hadirDeg}deg,
            #c9a64f ${hadirDeg}deg ${izinDeg}deg,
            #4b91c5 ${izinDeg}deg ${sakitDeg}deg,
            #d96b6b ${sakitDeg}deg 360deg
          );
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <div style="
            width:125px;
            height:125px;
            border-radius:50%;
            background:white;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
          ">
            <strong style="font-size:30px;color:#176b45">
              ${rate}%
            </strong>
            <span style="font-size:12px;color:#68736c">
              Kehadiran
            </span>
          </div>
        </div>
      `;
    }
  }

    // DIAGRAM PERBANDINGAN STATUS
  const detailType = $("attendanceDetailType")?.value || "trend";

  if (detailType === "status") {
    const maxStatus = Math.max(1, ...STATUSES.map(
      status => totals[status]
    ));

    const statusChart = STATUSES.map(status => {
      const percent = totals[status] / maxStatus * 100;

      return `
        <div style="margin:18px 0">
          <div style="
            display:flex;
            justify-content:space-between;
            margin-bottom:7px;
            font-size:14px;
          ">
            <strong>${status}</strong>
            <strong>${totals[status]}</strong>
          </div>

          <div style="
            height:16px;
            background:#edf1ed;
            border-radius:20px;
            overflow:hidden;
          ">
            <div style="
              width:${percent}%;
              height:100%;
              background:${colors[status]};
              border-radius:20px;
            "></div>
          </div>
        </div>
      `;
    }).join("");

    chartBox.innerHTML = statusChart;

    $("chartHadir").textContent = totals.Hadir;
    $("chartIzin").textContent = totals.Izin;
    $("chartSakit").textContent = totals.Sakit;
    $("chartAlpa").textContent = totals.Alpa;
    $("chartAttendanceRate").textContent = rate + "%";

    attendanceChartReady = true;
    return;
  }
    // DIAGRAM KEHADIRAN PER KELAS
  if (detailType === "class") {
    const selectedClassId =
      $("attendanceChartClass")?.value || "all";

    const classRows = classes.filter(c =>
      c.name !== "Kelas Khusus" &&
      (
        selectedClassId === "all" ||
        c.id === selectedClassId
      )
    );

        const periodToday = new Date();
    periodToday.setHours(0, 0, 0, 0);

    const padDate = n => String(n).padStart(2, "0");

    const makeDateKey = d =>
      `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;

    let periodStart = new Date(periodToday);

    if (attendanceChartPeriod === "weekly") {
      periodStart.setDate(periodToday.getDate() - 6);
    } else if (attendanceChartPeriod === "monthly") {
      periodStart.setDate(1);
    } else {
      const startYear = periodToday.getMonth() >= 10
        ? periodToday.getFullYear()
        : periodToday.getFullYear() - 1;

      periodStart = new Date(startYear, 10, 1);
    }

    const startKey = makeDateKey(periodStart);
    const endKey = makeDateKey(periodToday);

    const classChart = classRows.map(c => {
      const records = attendanceChartData.filter(a =>
        a.classId === c.id &&
        a.date >= startKey &&
        a.date <= endKey &&
        STATUSES.includes(a.status)
      );

      const total = records.length;
      const hadir = records.filter(a =>
        a.status === "Hadir"
      ).length;

      const percent = total
        ? Math.round(hadir / total * 100)
        : 0;

      return `
        <div style="margin:18px 0">
          <div style="
            display:flex;
            justify-content:space-between;
            margin-bottom:7px;
            font-size:14px;
          ">
            <strong>${esc(c.name)}</strong>
            <strong>${percent}%</strong>
          </div>

          <div style="
            height:18px;
            background:#edf1ed;
            border-radius:20px;
            overflow:hidden;
          ">
            <div style="
              width:${percent}%;
              height:100%;
              background:#176b45;
              border-radius:20px;
            "></div>
          </div>
        </div>
      `;
    }).join("");

    chartBox.innerHTML = classChart ||
      '<p class="muted">Belum ada data kehadiran per kelas.</p>';

    attendanceChartReady = true;
    return;
  }
    // RIWAYAT KEHADIRAN MODEL HEATMAP
  if (detailType === "history") {
    const selectedClass =
      $("attendanceChartClass")?.value || "all";

    const records = attendanceChartData.filter(a =>
      (selectedClass === "all" ||
        a.classId === selectedClass) &&
      STATUSES.includes(a.status)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    if (attendanceChartPeriod === "weekly") {
      startDate.setDate(today.getDate() - 6);
    } else if (attendanceChartPeriod === "monthly") {
      startDate.setDate(1);
    } else {
      const year = today.getMonth() >= 10
        ? today.getFullYear()
        : today.getFullYear() - 1;

      startDate = new Date(year, 10, 1);
    }

    const days = [];

    for (
      let date = new Date(startDate);
      date <= today;
      date.setDate(date.getDate() + 1)
    ) {
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
      ].join("-");

      const dailyRecords = records.filter(a =>
        a.date === key
      );

      const total = dailyRecords.length;
      const hadir = dailyRecords.filter(a =>
        a.status === "Hadir"
      ).length;

      const percent = total
        ? Math.round(hadir / total * 100)
        : -1;

      const color = percent < 0
        ? "#edf0ed"
        : percent >= 80
          ? "#176b45"
          : percent >= 60
            ? "#70a989"
            : percent >= 40
              ? "#c9a64f"
              : "#d96b6b";

const namaHari = [
  "Min", "Sen", "Sel", "Rab",
  "Kam", "Jum", "Sab"
][date.getDay()];

days.push(`
  <div title="${namaHari}, ${key}: ${
    percent < 0
      ? "Belum ada data"
      : percent + "% kehadiran"
  }" style="
    aspect-ratio:1;
    min-width:0;
    border-radius:6px;
    background:${color};
    display:flex;
    align-items:center;
    justify-content:center;
    color:${percent < 0 ? "#64748b" : "#ffffff"};
    font-size:9px;
    font-weight:700;
  ">${namaHari}</div>
`);
    }

    chartBox.innerHTML = `
      <div style="
        display:grid;
        grid-template-columns:repeat(7, minmax(0, 1fr));
        gap:6px;
        margin:20px 0;
      ">
        ${days.join("")}
      </div>

      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        font-size:12px;
      ">
        <span>🟩 Tinggi</span>
        <span>🟢 Sedang</span>
        <span>🟨 Rendah</span>
        <span>🟥 Sangat rendah</span>
        <span>⬜ Belum ada data</span>
      </div>
    `;

    attendanceChartReady = true;
    return;
  }
  const maxValue = Math.max(
    1,
    ...data.map(item =>
      STATUSES.reduce(
        (sum, status) => sum + item[status], 0
      )
    )
  );

  const width = 700;
  const height = 300;
  const left = 45;
  const right = 20;
  const top = 25;
  const bottom = 50;

  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;

  const slotWidth = data.length > 1
    ? chartWidth / (data.length - 1)
    : chartWidth;

  let svg = `
    <svg viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="Grafik garis statistik kehadiran santri"
      style="width:100%;height:auto;display:block">
  `;

  // GARIS BANTU DAN ANGKA SUMBU
  for (let i = 0; i <= 4; i++) {
    const y = top + chartHeight -
      (chartHeight * i / 4);

    const value = Math.round(maxValue * i / 4);

    svg += `
      <line
        x1="${left}"
        y1="${y}"
        x2="${width - right}"
        y2="${y}"
        stroke="#dfe7e1"
        stroke-dasharray="4 4"
      />

      <text
        x="${left - 10}"
        y="${y + 5}"
        text-anchor="end"
        font-size="13"
        fill="#68736c"
      >${value}</text>
    `;
  }

  // MEMBUAT EMPAT GARIS STATUS
  STATUSES.forEach(status => {

    const points = data.map((item, index) => {

      const x = data.length > 1
        ? left + slotWidth * index
        : left + chartWidth / 2;

      const y = top + chartHeight -
        (item[status] / maxValue * chartHeight);

      return {
        x,
        y,
        value: item[status],
        label: item.label
      };
    });

    if (!points.length) return;

    // GARIS STATUS
    svg += `
      <polyline
        points="${points.map(p =>
          `${p.x},${p.y}`
        ).join(" ")}"
        fill="none"
        stroke="${colors[status]}"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    `;

    // TITIK PENANDA
    points.forEach(point => {
      svg += `
        <circle
          cx="${point.x}"
          cy="${point.y}"
          r="5"
          fill="${colors[status]}"
          stroke="#ffffff"
          stroke-width="2"
        >
          <title>
            ${status}: ${point.value} - ${point.label}
          </title>
        </circle>
      `;
    });
  });

  // LABEL HARI / PERIODE
  data.forEach((item, index) => {

    const x = data.length > 1
      ? left + slotWidth * index
      : left + chartWidth / 2;

    svg += `
      <text
        x="${x}"
        y="${height - 15}"
        text-anchor="middle"
        font-size="13"
        fill="#68736c"
      >${item.label}</text>
    `;
  });

  svg += "</svg>";

  if (!totalAbsensi) {
    chartBox.innerHTML =
      '<p class="muted">Belum ada data kehadiran pada periode ini.</p>';
  } else {
    chartBox.innerHTML = svg;
  }

  // MEMPERBARUI RINGKASAN KEHADIRAN
  const setValue = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  setValue("chartHadir", totals.Hadir);
  setValue("chartIzin", totals.Izin);
  setValue("chartSakit", totals.Sakit);
  setValue("chartAlpa", totals.Alpa);
  setValue("chartAttendanceRate", rate + "%");

  attendanceChartReady = true;
}

// DASHBOARD ANALITIK MADIN
async function renderDashboard() {
  if (!currentUser || !profile) return;

  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  try {
    setText("dashTotalStudents", students.length);

    const visibleClasses = canAccessAllClasses()
      ? classes
      : classes.filter(c => c.id === myClass());
    setupAttendanceChartControls(visibleClasses);

    setText("dashTotalClasses", visibleClasses.length);

    const pad = n => String(n).padStart(2, "0");

    const dateString = d =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const today = new Date();
    const todayStr = dateString(today);

    const start = new Date(today);
    start.setDate(start.getDate() - 29);

    const startStr = dateString(start);

    // AMBIL DATA ABSENSI 30 HARI
    const snap = await getDocs(query(
      collection(db, "attendance"),
      where("date", ">=", startStr),
      where("date", "<=", todayStr)
    ));

    const classIds = new Set(
      visibleClasses.map(c => c.id)
    );

    const activeStudentIds = new Set(
  students.map(s => s.id)
);

const attendance = snap.docs
  .map(d => d.data())
  .filter(a =>
    classIds.has(a.classId) &&
    activeStudentIds.has(a.studentId)
  );

    // AMBIL DATA ABSENSI UNTUK GRAFIK TAHUN AJARAN
const now = new Date();

const academicYearStart = new Date(
  now.getFullYear() - (now.getMonth() < 10 ? 1 : 0),
  10,
  1
);

const chartStartStr = dateString(academicYearStart);

const chartSnap = await getDocs(query(
  collection(db, "attendance"),
  where("date", ">=", chartStartStr),
  where("date", "<=", todayStr)
));

attendanceChartData = chartSnap.docs
  .map(d => d.data())
  .filter(a =>
    classIds.has(a.classId) &&
    activeStudentIds.has(a.studentId) &&
    a.classId !== classes.find(c => c.name === "Kelas Khusus")?.id
  );
    renderAttendanceChart();
    
    const todayData = attendance.filter(
      a => a.date === todayStr
    );

    const countStatus = (data, status) =>
      data.filter(a => a.status === status).length;

    // KEHADIRAN HARI INI
    setText("dashTodayHadir", countStatus(todayData, "Hadir"));
    setText("dashTodayIzin", countStatus(todayData, "Izin"));
    setText("dashTodaySakit", countStatus(todayData, "Sakit"));
    setText("dashTodayAlpa", countStatus(todayData, "Alpa"));

    // ANALISIS 30 HARI
    const total = attendance.length;
    const hadir = countStatus(attendance, "Hadir");
    const izin = countStatus(attendance, "Izin");
    const sakit = countStatus(attendance, "Sakit");
    const alpa = countStatus(attendance, "Alpa");

    const rate = total
      ? Math.round(hadir / total * 100)
      : 0;

    setText("dash30Rate", rate + "%");
    setText("dash30Total", total + " catatan absensi");

    const progress = $("dash30Progress");

    if (progress) {
      progress.style.width = rate + "%";
    }

    setText("dash30Hadir", hadir);
    setText("dash30Izin", izin);
    setText("dash30Sakit", sakit);
    setText("dash30Alpa", alpa);

        // KEHADIRAN PER KELAS + SANTRI TERJAIN
    const classBox = $("dashClassStats");

    if (classBox) {
      classBox.innerHTML = visibleClasses.map(c => {
        const data = attendance.filter(
          a => a.classId === c.id
        );

        const jumlah = data.length;

        const persentase = jumlah
          ? Math.round(
              countStatus(data, "Hadir") / jumlah * 100
            )
          : 0;

        // HITUNG SANTRI TERJAIN DI KELAS INI
        const ranked = students
          .filter(s => s.classId === c.id)
          .map(s => ({
            ...s,
            jumlahHadir: data.filter(a =>
              a.studentId === s.id &&
              a.status === "Hadir"
            ).length
          }));

        const tertinggi = Math.max(
          0,
          ...ranked.map(s => s.jumlahHadir)
        );

        const winners = ranked.filter(
          s => s.jumlahHadir === tertinggi &&
          tertinggi > 0
        );

        return `
          <details class="class-ranking-item">
            <summary class="class-ranking-summary">
              <span>${esc(c.name)}</span>
              <strong>${persentase}% (${jumlah} absensi)</strong>
            </summary>

            <div class="class-ranking-content">
              <strong>Santri Sregep</strong>
              ${
                winners.length
                  ? winners.map(s => `
                    <div class="class-ranking-student">
                      <span>${esc(s.name)}</span>
                      <strong>${s.jumlahHadir} kali hadir</strong>
                    </div>
                  `).join("")
                  : '<p class="muted">Belum ada data kehadiran.</p>'
              }
            </div>
          </details>
        `;
      }).join("") ||
      '<p class="muted">Belum ada data kelas.</p>';
    }

    // 5 RIWAYAT ABSENSI TERBARU
    const dates = [...new Set(
      attendance.map(a => a.date)
    )]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 5);

    const recentBox = $("dashRecentDays");

    if (recentBox) {
      recentBox.innerHTML = dates.map(date => {
        const jumlah = attendance.filter(
          a => a.date === date
        ).length;

        return `
          <div class="list-item">
            <span>${esc(date)}</span>
            <strong>${jumlah} catatan</strong>
          </div>
        `;
      }).join("") ||
      '<p class="muted">Belum ada riwayat absensi.</p>';
    }

  } catch (error) {
    console.error("Dashboard gagal dimuat:", error);

    [
      "dashClassStats",
      "dashTopStudents",
      "dashRecentDays"
    ].forEach(id => {
      const el = $(id);

      if (el) {
        el.innerHTML =
          '<p class="muted">Gagal memuat statistik.</p>';
      }
    });
  } 
}
// DROPDOWN CUSTOM MADIN
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

function fillStudentPdfStudent() {
  const select = $("studentPdfStudent");
  if (!select) return;

  const selectedClass = $("studentPdfClass").value;

  const filtered = students
    .filter(s =>
      selectedClass === "__all__" || s.classId === selectedClass
    )
    .sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "id")
    );

  select.innerHTML = '<option value="__all__">Semua Santri</option>';

  filtered.forEach(s => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });
}

$("studentPdfType").addEventListener("change", () => {
  const isBiodata = $("studentPdfType").value === "biodata";

  $("studentPdfStudentWrap").classList.toggle(
    "hidden",
    !isBiodata
  );

  fillStudentPdfStudent();
});

$("studentPdfClass").addEventListener("change", fillStudentPdfStudent);

function pdfDate(value) {
  if (!value) return "-";

  const date = new Date(value + "T00:00:00");

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

$("printStudentsPdfBtn").onclick = () => {
  try {
    if (!isAdmin()) {
      msg("studentPdfMsg", "Fitur ini hanya untuk admin.", true);
      return;
    }

    const type = $("studentPdfType").value;
const outputFormat = $("studentPdfFormat").value;
const selectedClass = $("studentPdfClass").value;
const selectedStudent = $("studentPdfStudent").value;
    const selectedStudents = students
      .filter(s =>
        selectedClass === "__all__" || s.classId === selectedClass
      )
      .filter(s =>
        type !== "biodata" ||
        selectedStudent === "__all__" ||
        s.id === selectedStudent
      )
      .sort((a, b) =>
        clsName(a.classId).localeCompare(clsName(b.classId), "id") ||
        String(a.name || "").localeCompare(String(b.name || ""), "id")
      );

    if (!selectedStudents.length) {
      msg("studentPdfMsg", "Tidak ada data santri untuk dicetak.", true);
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      msg(
        "studentPdfMsg",
        "Popup diblokir. Izinkan pop-up lalu coba lagi.",
        true
      );
      return;
    }

    const logo = "https://madzakhfasy.github.io/absensi-madin-kaligintung/LOGO%20MADIN%20REMOVE%20BG.png";

    const header = `
  <div class="letterhead">
    <img src="${logo}" alt="Logo Madin">

    <div class="letterhead-text">
      <div class="arabic-title">
        المدرسة الدنية كالي ڮينتوڠ
      </div>

      <div class="organizer">PENGURUS</div>

      <div class="school">
        MADRASAH DINIYAH KALIGINTUNG
      </div>

      <div class="address">
        Sekretariat: Dusun Kaligintung Rt. 05/ Rw. 03
        Cilibang - Jeruklegi 53252
      </div>
    </div>
  </div>
`;

    let content = "";
    let title = "";

    // CETAK DAFTAR NAMA
    if (type === "list") {
      title = "DAFTAR NAMA SANTRI";

      const grouped = classes
        .filter(c =>
          selectedClass === "__all__" || c.id === selectedClass
        )
        .map(c => ({
          name: c.name,
          students: selectedStudents.filter(s => s.classId === c.id)
        }))
        .filter(g => g.students.length);

      content = grouped.map(group => `
        <div class="class-group">
          <h3>${esc(group.name)}</h3>
          <table>
            <thead>
              <tr>
                <th width="60">No.</th>
                <th>Nama Santri</th>
              </tr>
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
    }

    // CETAK BIODATA PER SANTRI
    if (type === "biodata") {
      title = "BIODATA SANTRI";

      content = selectedStudents.map(s => `
        <div class="biodata-page">
          ${header}

          <h2 class="document-title">BIODATA SANTRI</h2>

          <div class="biodata-layout">
  <div class="photo-box">
    ${studentPhotoUrl(s)
      ? `<img src="${esc(studentPhotoUrl(s))}" alt="Foto Santri">`
      : `<span>FOTO<br>SANTRI</span>`
    }
  </div>

            <div class="biodata-details">
              <table>
                <tr><th>NIS</th><td>${esc(s.nis || "-")}</td></tr>
                <tr><th>Nama Lengkap</th><td>${esc(s.name || "-")}</td></tr>
                <tr><th>Kelas/Jilid</th><td>${esc(clsName(s.classId))}</td></tr>
                <tr><th>Jenis Kelamin</th><td>${esc(s.gender === "L" ? "Laki-laki" : s.gender === "P" ? "Perempuan" : s.gender || "-")}</td></tr>
                <tr><th>Tempat Lahir</th><td>${esc(s.birthplace || "-")}</td></tr>
                <tr><th>Tanggal Lahir</th><td>${esc(pdfDate(s.birthdate))}</td></tr>
                <tr><th>Nama Ayah</th><td>${esc(s.fatherName || "-")}</td></tr>
                <tr><th>Nama Ibu</th><td>${esc(s.motherName || "-")}</td></tr>
                <tr><th>Alamat</th><td>${esc(s.address || "-")}</td></tr>
                <tr><th>Nomor HP Wali</th><td>${esc(s.guardianPhone || "-")}</td></tr>
              </table>
            </div>
          </div>
        </div>
      `).join("");
    }

    // CETAK TABEL BIODATA
    if (type === "table") {
      title = "TABEL BIODATA SANTRI";

      const grouped = classes
        .filter(c =>
          selectedClass === "__all__" || c.id === selectedClass
        )
        .map(c => ({
          name: c.name,
          students: selectedStudents.filter(s => s.classId === c.id)
        }))
        .filter(g => g.students.length);

      content = grouped.map(group => `
        <div class="class-group">
          <h3>${esc(group.name)}</h3>

          <table class="biodata-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>NIS</th>
                <th>Nama Santri</th>
                <th>JK</th>
                <th>Tempat, Tanggal Lahir</th>
                <th>Nama Ayah</th>
                <th>Nama Ibu</th>
                <th>Alamat</th>
                <th>HP Wali</th>
              </tr>
            </thead>

            <tbody>
              ${group.students.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${esc(s.nis || "-")}</td>
                  <td>${esc(s.name || "-")}</td>
                  <td>${esc(s.gender === "L" ? "L" : s.gender === "P" ? "P" : "-")}</td>
                  <td>${esc([s.birthplace, pdfDate(s.birthdate)].filter(Boolean).join(", ") || "-")}</td>
                  <td>${esc(s.fatherName || "-")}</td>
                  <td>${esc(s.motherName || "-")}</td>
                  <td>${esc(s.address || "-")}</td>
                  <td>${esc(s.guardianPhone || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `).join("");
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #222;
            margin: 20px;
            font-size: 12px;
          }

          .letterhead {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  margin-bottom: 26px;
  padding-bottom: 15px;
  border-bottom: 3px double #176b45;
}

.letterhead img {
  width: 115px;
  height: 115px;
  object-fit: contain;
  flex: 0 0 115px;
}

.letterhead-text {
  flex: 1;
  min-width: 0;
  text-align: center;
  color: #075b32;
}

.arabic-title {
  font-family: "Noto Naskh Arabic", "Amiri", "Traditional Arabic", serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.5;
  direction: rtl;
  margin-bottom: 4px;
}

.organizer {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 5px;
}

.school {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
  margin-bottom: 8px;
}

.address {
  color: #222;
  font-size: 13px;
  line-height: 1.5;
}
          .document-title {
            text-align: center;
            margin: 25px 0;
          }

          h3 {
            margin: 18px 0 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #555;
            padding: 7px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #eee;
          }

          .class-group {
            margin-bottom: 20px;
          }

          .biodata-layout {
            display: flex;
            gap: 25px;
            align-items: flex-start;
          }

          .photo-box {
            width: 120px;
            height: 150px;
            border: 1px solid #777;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            flex-shrink: 0;
          }

          .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .biodata-details {
            flex: 1;
          }

          .biodata-details th {
            width: 145px;
          }

          .biodata-page {
            page-break-after: always;
            break-after: page;
          }

          .biodata-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          @media print {
            body {
              margin: 12mm;
            }

            @page {
              size: A4 portrait;
              margin: 12mm;
            }

            body:has(.biodata-table) {
              font-size: 9px;
            }

            body:has(.biodata-table) table {
              font-size: 8px;
            }

            body:has(.biodata-table) th,
            body:has(.biodata-table) td {
              padding: 4px;
            }
          }

          @page landscape {
            size: A4 landscape;
            margin: 10mm;
          }

          body:has(.biodata-table) {
            page: landscape;
          }
        </style>
      </head>

      <body>
        ${type === "biodata" ? "" : header}

        ${type !== "biodata" ? `
          <h2 class="document-title">${title}</h2>
        ` : ""}

        ${content}

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
window.onload = () => {
  setTimeout(async () => {

    if ("${outputFormat}" === "pdf") {
      window.print();
      return;
    }

    try {
      if (!window.html2canvas) {
        throw new Error("Library gambar gagal dimuat.");
      }

      await document.fonts.ready;

      const landscape =
        document.querySelector(".biodata-table") !== null;

      const pageWidth = landscape ? 1123 : 794;
      const pageHeight = landscape ? 794 : 1123;

      const sourceImages = Array.from(document.images);

      await Promise.all(sourceImages.map(img => {
        if (img.complete) return Promise.resolve();

        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const pages = [];

      function createPage() {
        const page = document.createElement("div");

        page.style.cssText =
  "width:" + pageWidth + "px;" +
  "height:" + pageHeight + "px;" +
  "padding:36px;" +
  "box-sizing:border-box;" +
  "background:white;" +
  "overflow:hidden;" +
  "position:fixed;" +
  "left:0;" +
  "top:0;" +
  "z-index:-1;" +
  "font-family:Arial,sans-serif;" +
  "color:#222;";

        document.body.appendChild(page);
        pages.push(page);

        return page;
      }

      function addDocumentHeader(page) {
        const header = document.querySelector(".letterhead");
        const title = document.querySelector(".document-title");

        if (header) page.appendChild(header.cloneNode(true));
        if (title) page.appendChild(title.cloneNode(true));
      }

      // BIODATA: SATU SANTRI SATU HALAMAN
      if ("${type}" === "biodata") {

        document.querySelectorAll(".biodata-page").forEach(item => {
          const page = createPage();

          page.appendChild(item.cloneNode(true));
        });

      } else {

        const groups = Array.from(
          document.querySelectorAll(".class-group")
        );

        let currentPage = null;
        let currentBody = null;
        let currentGroup = null;

        function startTablePage(group, table) {
          currentPage = createPage();

          addDocumentHeader(currentPage);

          currentGroup = group.querySelector("h3");

          if (currentGroup) {
            currentPage.appendChild(
              currentGroup.cloneNode(true)
            );
          }

          const newTable = table.cloneNode(false);

          const thead = table.querySelector("thead");

          if (thead) {
            newTable.appendChild(thead.cloneNode(true));
          }

          currentBody = document.createElement("tbody");
          newTable.appendChild(currentBody);

          currentPage.appendChild(newTable);
        }

        groups.forEach(group => {
          const table = group.querySelector("table");

          if (!table) return;

          startTablePage(group, table);

          const rows = Array.from(
            table.querySelectorAll("tbody tr")
          );

          rows.forEach(row => {
            const copy = row.cloneNode(true);

            currentBody.appendChild(copy);

            if (currentPage.scrollHeight > pageHeight) {
              currentBody.removeChild(copy);

              if (currentBody.children.length > 0) {
                startTablePage(group, table);
              }

              currentBody.appendChild(copy);
            }
          });
        });
      }

      // UNDUH SETIAP HALAMAN
      for (let i = 0; i < pages.length; i++) {

        const canvas = await html2canvas(pages[i], {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false
        });

        const link = document.createElement("a");

        link.download =
          "data-santri-halaman-" + (i + 1) + ".png";

        link.href = canvas.toDataURL("image/png");

        link.click();

        await new Promise(resolve =>
          setTimeout(resolve, 500)
        );
      }

      pages.forEach(page => page.remove());

      alert(
        pages.length + " halaman gambar berhasil dibuat."
      );

    } catch (error) {
      console.error(error);
      alert("Gagal membuat gambar: " + error.message);
    }

  }, 800);
};
<\/script>
      </body>
      </html>
    `);

    printWindow.document.close();

    msg("studentPdfMsg", "Dokumen berhasil disiapkan.");

  } catch (error) {
    console.error(error);
    msg("studentPdfMsg", "Gagal mencetak: " + error.message, true);
  }
};

// ================= AKHIR CETAK DATA SANTRI =================
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

// UNDUH BACKUP LENGKAP
$("backupDataBtn").onclick = async () => {
  if (!isAdmin()) {
    msg("backupMsg", "Fitur ini hanya untuk admin.", true);
    return;
  }

  const btn = $("backupDataBtn");
  btn.disabled = true;

  try {
    msg("backupMsg", "Sedang membuat backup lengkap...");

    const backup = {
      app: "absensi-madin-kaligintung",
      version: 1,
      createdAt: new Date().toISOString(),
      collections: {},
      summary: {}
    };

    let total = 0;

    // Semua koleksi data aplikasi
    const collectionNames = [
      "classes",
      "students",
      "attendance",
      "calendarSettings",
      "holidays"
    ];

    for (const name of collectionNames) {
      msg("backupMsg", `Mengamankan data ${name}...`);

      const snapshot = await getDocs(collection(db, name));

      backup.collections[name] = snapshot.docs.map(item => ({
        id: item.id,
        data: serializeBackupValue(item.data())
      }));

      backup.summary[name] = snapshot.size;
      total += snapshot.size;
    }

    backup.summary.total = total;

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const tanggal = new Date().toISOString()
      .slice(0, 10);

    link.href = url;
    link.download = `backup-lengkap-madin-${tanggal}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);

    msg(
      "backupMsg",
      `Backup lengkap berhasil dibuat. Total ${total} dokumen dari ${collectionNames.length} koleksi.`
    );

  } catch (error) {
    console.error(error);

    msg(
      "backupMsg",
      "Backup gagal: " + error.message,
      true
    );

  } finally {
    btn.disabled = false;
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

        const requiredCollections = ["classes", "students", "attendance"];

    const allowedCollections = [
      "classes",
      "students",
      "attendance",
      "calendarSettings",
      "holidays"
    ];

    for (const name of requiredCollections) {
      if (!Array.isArray(backup.collections[name])) {
        throw new Error(`Data ${name} tidak ditemukan atau tidak valid.`);
      }
    }

    for (const name of allowedCollections) {
      if (backup.collections[name] === undefined) continue;

      if (!Array.isArray(backup.collections[name])) {
        throw new Error(`Format koleksi ${name} tidak valid.`);
      }

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
      }
    }

    let restored = 0;

    for (const name of allowedCollections) {
      const items = backup.collections[name] || [];

      for (const item of items) {
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
// MEMERIKSA FILE BACKUP TANPA MENGUBAH DATABASE
$("checkBackupBtn").onclick = async () => {
  if (!isAdmin()) {
    msg("backupMsg", "Fitur ini hanya untuk admin.", true);
    return;
  }

  const file = $("restoreFile").files[0];

  if (!file) {
    msg("backupMsg", "Pilih file backup terlebih dahulu.", true);
    return;
  }

  const btn = $("checkBackupBtn");
  btn.disabled = true;

  try {
    msg("backupMsg", "Sedang memeriksa file backup...");

    const backup = JSON.parse(await file.text());

    if (
      backup.app !== "absensi-madin-kaligintung" ||
      backup.version !== 1 ||
      !backup.collections
    ) {
      throw new Error("File backup tidak valid atau tidak cocok.");
    }

    const requiredCollections = [
      "classes",
      "students",
      "attendance"
    ];

    const allowedCollections = [
      "classes",
      "students",
      "attendance",
      "calendarSettings",
      "holidays"
    ];

    for (const name of requiredCollections) {
      if (!Array.isArray(backup.collections[name])) {
        throw new Error(`Data ${name} tidak ditemukan.`);
      }
    }

    const counts = {};
    let total = 0;

    for (const name of allowedCollections) {
      if (backup.collections[name] === undefined) continue;

      if (!Array.isArray(backup.collections[name])) {
        throw new Error(`Format koleksi ${name} tidak valid.`);
      }

      const ids = new Set();

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

        if (ids.has(item.id)) {
          throw new Error(`Ada ID ganda pada koleksi ${name}.`);
        }

        ids.add(item.id);
      }

      counts[name] = backup.collections[name].length;
      total += backup.collections[name].length;
    }

    const detail = Object.entries(counts)
      .map(([name, count]) => `${name}: ${count}`)
      .join(" | ");

    msg(
      "backupMsg",
      `PEMERIKSAAN BERHASIL. ${detail}. Total ${total} dokumen. Database TIDAK diubah.`
    );

  } catch (error) {
    console.error(error);
    msg("backupMsg", "Pemeriksaan gagal: " + error.message, true);
  } finally {
    btn.disabled = false;
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
    const headerHeight = 450;
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

        // Kop surat baru
    ctx.textAlign = "center";

    // Logo di sebelah kiri
    ctx.drawImage(logo, 65, 65, 190, 190);

    // Tulisan Arab
    ctx.fillStyle = "#075b32";
    ctx.font = "bold 40px serif";
    ctx.direction = "rtl";
    ctx.fillText("المدرسة الدنية كالي ڮينتوڠ", 735, 90);
    ctx.direction = "ltr";

    // Pengurus
    ctx.fillStyle = "#075b32";
    ctx.font = "bold 30px Georgia";
    ctx.fillText("PENGURUS", 735, 140);

    // Nama madrasah
    ctx.font = "bold 38px Georgia";
    ctx.fillText("MADRASAH DINIYAH KALIGINTUNG", 735, 190);

    // Alamat sekretariat
    ctx.fillStyle = "#222222";
    ctx.font = "20px Arial";
    ctx.fillText(
      "Sekretariat: Dusun Kaligintung Rt. 05/ Rw. 03 Cilibang - Jeruklegi 53252",
      735,
      230
    );

    // Garis pembatas kop
    ctx.strokeStyle = "#176b45";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(55, 260);
    ctx.lineTo(1145, 260);
    ctx.stroke();

    // Judul laporan
    ctx.fillStyle = "#075b35";
    ctx.fillRect(325, 280, 815, 65);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText("REKAP KEHADIRAN SANTRI", 732, 323);

    // Informasi laporan
    const infoY = 365;
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
ctx.textBaseline = "middle";
ctx.fillStyle = "#123c27";
ctx.font = "bold 24px Arial";

const formattedMonth = new Date(
  reportMonthValue + "-01T00:00:00"
).toLocaleDateString("id-ID", {
  month: "long",
  year: "numeric"
});

ctx.fillText(`KELAS: ${reportClassValue}`, 240, 397);
ctx.fillText(`BULAN: ${formattedMonth}`, 600, 397);
ctx.fillText(`TOTAL SANTRI: ${reportRows.length}`, 970, 397);

ctx.textBaseline = "alphabetic";

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

    // Simpan gambar langsung ke perangkat
const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = file.name;

document.body.appendChild(link);
link.click();
link.remove();

setTimeout(() => URL.revokeObjectURL(url), 3000);

msg("reportMsg", "Gambar rekap berhasil disimpan.");

  } catch (e) {
    console.error(e);
    msg("reportMsg", "Gagal membuat gambar: " + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan Rekap sebagai Gambar";
  }
};
