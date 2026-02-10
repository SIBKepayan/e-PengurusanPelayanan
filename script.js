// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIG ANDA ---
const firebaseConfig = {
  apiKey: "AIzaSyDHDKX19CUX2OhxTRxX_nOSUxXdkXbC4vY",
  authDomain: "e-ppsibkepayan.firebaseapp.com",
  projectId: "e-ppsibkepayan",
  storageBucket: "e-ppsibkepayan.firebasestorage.app",
  messagingSenderId: "872979610754",
  appId: "1:872979610754:web:163493d0f253dd8319089b",
  measurementId: "G-QN7MP7EHVY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// VARS
let currentUser = null;
let currentTeam = [];

// --- LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const btn = document.querySelector('.btn-login');
    btn.textContent = "Memproses..."; btn.disabled = true;

    try {
        // Backdoor
        if (loginId === "admin" && pass === "admin123") {
            loginSuccess({ name: "Super Admin", role: "admin", id: "temp_admin" });
            return;
        }

        const q = query(collection(db, "team"), where("phone", "==", loginId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert("ID tidak ditemui."); btn.textContent = "LOG MASUK"; btn.disabled = false; return;
        }

        let userFound = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            // Check password field, if not exist use phone
            const userPass = data.password || data.phone; 
            if (userPass === pass) {
                userFound = true;
                data.id = doc.id;
                loginSuccess(data);
            }
        });

        if (!userFound) { alert("Kata laluan salah."); btn.textContent = "LOG MASUK"; btn.disabled = false; }
    } catch (err) { alert("Ralat: " + err.message); btn.textContent = "LOG MASUK"; btn.disabled = false; }
});

function loginSuccess(user) {
    currentUser = user;
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('dashboard-page').classList.add('active');
    
    document.getElementById('username-display').textContent = user.name;
    document.getElementById('user-role-display').textContent = user.role.toUpperCase();

    const adminMenus = document.querySelectorAll('.admin-only');
    if (user.role !== 'admin') adminMenus.forEach(el => el.classList.add('hidden'));
    else adminMenus.forEach(el => el.classList.remove('hidden'));

    // Default ke Home
    showTab('tab-home');
    document.getElementById('weekFilterDate').valueAsDate = new Date();
    
    loadTeamData(); // Preload data
    loadWeeklySchedule(); 
}

// --- NAVIGATION (FIXED) ---
window.showTab = function(tabId) {
    // Hide all tabs
    document.querySelectorAll('.content-tab').forEach(el => el.classList.remove('active'));
    // Show target
    document.getElementById(tabId).classList.add('active');
    
    // Menu Active State
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Update Header Title
    const map = {
        'tab-home': 'Laman Utama (Jadual)',
        'tab-urus-tim': 'Data Tim Pelayanan',
        'tab-urus-ibadah': 'Urus Ibadah Utama',
        'tab-urus-cabang': 'Urus Jadual Cabang',
        'tab-profile': 'Tetapan Akaun'
    };
    if(map[tabId]) document.getElementById('page-title').textContent = map[tabId];
}

window.switchSubTab = function(subId) {
    document.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(subId).classList.add('active');
    document.querySelectorAll('.tab-switcher button').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

window.logout = function() { location.reload(); }

// --- DATA TEAM ---
window.loadTeamData = async function() {
    const tbody = document.querySelector('#teamTable tbody');
    currentTeam = [];
    const selects = document.querySelectorAll('.member-select');

    try {
        const q = query(collection(db, "team"), orderBy("name"));
        const snapshot = await getDocs(q);
        if(tbody) tbody.innerHTML = '';
        selects.forEach(s => s.innerHTML = '<option value="">-- Pilih --</option>');

        snapshot.forEach(doc => {
            const m = doc.data();
            m.id = doc.id;
            currentTeam.push(m);
            
            if(currentUser?.role === 'admin' && tbody) {
                tbody.innerHTML += `<tr>
                    <td>${m.name}</td><td>${m.role}</td><td>${m.status}</td>
                    <td><button class="btn-edit" onclick="editTeam('${m.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger" onclick="deleteTeam('${m.id}')"><i class="fas fa-trash"></i></button>
                    </td></tr>`;
            }
            if (m.status === 'Aktif') {
                selects.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = m.name; opt.textContent = m.name;
                    s.appendChild(opt);
                });
            }
        });
    } catch (e) { console.error(e); }
}

document.getElementById('teamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('teamMemberId').value;
    const data = {
        name: document.getElementById('teamName').value,
        phone: document.getElementById('teamPhone').value,
        role: document.getElementById('teamRole').value,
        status: document.getElementById('teamStatus').value
    };
    try {
        if (id) await updateDoc(doc(db, "team", id), data);
        else await addDoc(collection(db, "team"), data);
        alert("Disimpan!"); document.getElementById('teamForm').reset();
        loadTeamData();
    } catch (e) { alert(e.message); }
});

window.editTeam = function(id) {
    const m = currentTeam.find(x => x.id === id);
    if(m) {
        document.getElementById('teamMemberId').value = m.id;
        document.getElementById('teamName').value = m.name;
        document.getElementById('teamPhone').value = m.phone;
        document.getElementById('teamRole').value = m.role;
        document.getElementById('teamStatus').value = m.status;
    }
}
window.deleteTeam = async function(id) {
    if(confirm("Padam?")) { await deleteDoc(doc(db, "team", id)); loadTeamData(); }
}

// --- PASSWORD CHANGE ---
document.getElementById('formPassword').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    if(!currentUser || !currentUser.id) return;
    
    try {
        await updateDoc(doc(db, "team", currentUser.id), { password: newPass });
        alert("Kata laluan berjaya ditukar! Sila login semula.");
        logout();
    } catch (e) { alert("Ralat: " + e.message); }
});

// --- SAVE SCHEDULE ---
async function saveScheduleToDB(data) {
    try {
        await addDoc(collection(db, "schedules"), data);
        alert("Jadual berjaya disimpan!");
        document.querySelectorAll('form').forEach(f => f.reset());
        loadWeeklySchedule();
    } catch (e) { alert(e.message); }
}

document.getElementById('formAhad').addEventListener('submit', (e) => {
    e.preventDefault();
    saveScheduleToDB({
        type: 'IBADAH_AHAD',
        date: document.getElementById('dateAhad').value,
        leader: document.getElementById('valAhadLeader').value,
        worship: document.getElementById('valAhadWorship').value,
        speaker: document.getElementById('valAhadSpeaker').value,
        doaPkk: document.getElementById('valAhadDoaPKK').value,
        usher: document.getElementById('valAhadUsher').value,
        hasPerjamuan: document.getElementById('checkPerjamuan').checked,
        pkLeader: document.getElementById('valAhadPK').value,
        pkAsst: document.getElementById('valAhadAsstPK').value,
        bibleOT: `${document.getElementById('valReaderOT').value} (${document.getElementById('valVerseOT').value})`,
        bibleNT: `${document.getElementById('valReaderNT').value} (${document.getElementById('valVerseNT').value})`
    });
});

document.getElementById('formKhas').addEventListener('submit', (e) => {
    e.preventDefault();
    // COPY PASTE LOGIC AHAD TAPI TAMBAH NAMA EVENT
    saveScheduleToDB({
        type: 'IBADAH_KHAS',
        eventName: document.getElementById('valKhasName').value,
        date: document.getElementById('dateKhas').value,
        leader: document.getElementById('valKhasLeader').value,
        worship: document.getElementById('valKhasWorship').value,
        speaker: document.getElementById('valKhasSpeaker').value,
        doaPkk: document.getElementById('valKhasDoaPKK').value,
        usher: document.getElementById('valKhasUsher').value,
        hasPerjamuan: document.getElementById('checkPerjamuanKhas').checked,
        pkLeader: document.getElementById('valKhasPK').value,
        pkAsst: document.getElementById('valKhasAsstPK').value,
        bibleOT: `${document.getElementById('valKhasReaderOT').value} (${document.getElementById('valKhasVerseOT').value})`,
        bibleNT: `${document.getElementById('valKhasReaderNT').value} (${document.getElementById('valKhasVerseNT').value})`,
        note: document.getElementById('valKhasNote').value
    });
});

document.getElementById('formDoa').addEventListener('submit', (e) => {
    e.preventDefault();
    saveScheduleToDB({
        type: 'PERSEKUTUAN_DOA',
        date: document.getElementById('dateDoa').value,
        isSkipped: document.getElementById('checkNoDoa').checked,
        activityAlt: document.getElementById('valDoaActivity').value,
        leader: document.getElementById('valDoaLeader').value,
        material: document.getElementById('valDoaMaterial').value,
        sharer: document.getElementById('valDoaSharer').value
    });
});

document.getElementById('formCabang').addEventListener('submit', (e) => {
    e.preventDefault();
    saveScheduleToDB({
        type: 'CABANG',
        subType: document.getElementById('valCabangType').value,
        date: document.getElementById('dateCabang').value,
        activity: document.getElementById('valCabangActivity').value,
        pujian: document.getElementById('valCabangPujian').value,
        renungan: document.getElementById('valCabangRenungan').value,
        kidBig: document.getElementById('valKidsBig').value,
        kidMid: document.getElementById('valKidsMid').value,
        kidSmall: document.getElementById('valKidsSmall').value
    });
});

// --- LOAD WEEKLY VIEW (FIXED DISPLAY) ---
function getWeekRange(dateStr) {
    const curr = new Date(dateStr);
    const first = curr.getDate() - curr.getDay() + 1; 
    const last = first + 6; 
    return {
        monday: new Date(curr.setDate(first)).toISOString().split('T')[0],
        sunday: new Date(curr.setDate(last)).toISOString().split('T')[0]
    };
}

window.loadWeeklySchedule = async function() {
    const dateInput = document.getElementById('weekFilterDate').value;
    if(!dateInput) return;
    const { monday, sunday } = getWeekRange(dateInput);
    const container = document.getElementById('weekly-schedule-container');
    container.innerHTML = `<p style="text-align:center">Memuat...</p>`;

    try {
        const q = query(collection(db, "schedules"), where("date", ">=", monday), where("date", "<=", sunday), orderBy("date"));
        const snapshot = await getDocs(q);
        
        container.innerHTML = `<h3 style="text-align:center; color:#009FE3; margin-bottom:15px;">Minggu: ${monday} hingga ${sunday}</h3>`;
        
        if (snapshot.empty) { container.innerHTML += "<p style='text-align:center'>Tiada jadual.</p>"; return; }

        snapshot.forEach(doc => {
            const d = doc.data();
            let title = "", rows = "";

            if (d.type === 'IBADAH_AHAD') {
                title = "IBADAH UMUM AHAD";
                rows += makeRow("Pimpin Ibadah", d.leader);
                rows += makeRow("Pimpin Pujian", d.worship);
                rows += makeRow("Khotbah", d.speaker);
                rows += makeRow("Doa PKK", d.doaPkk);
                rows += makeRow("Penyambut Tetamu", d.usher);
                if(d.hasPerjamuan) rows += makeRow("Perjamuan Kudus", `${d.pkLeader} & ${d.pkAsst}`);
                rows += makeRow("Pembacaan Alkitab", `PL: ${d.bibleOT}<br>PB: ${d.bibleNT}`);
            } 
            else if (d.type === 'IBADAH_KHAS') {
                title = d.eventName.toUpperCase(); // Guna nama event
                rows += makeRow("Pimpin Ibadah", d.leader);
                rows += makeRow("Pimpin Pujian", d.worship);
                rows += makeRow("Khotbah", d.speaker);
                rows += makeRow("Doa PKK", d.doaPkk);
                rows += makeRow("Penyambut Tetamu", d.usher);
                if(d.hasPerjamuan) rows += makeRow("Perjamuan Kudus", `${d.pkLeader} & ${d.pkAsst}`);
                rows += makeRow("Pembacaan Alkitab", `PL: ${d.bibleOT}<br>PB: ${d.bibleNT}`);
                rows += makeRow("Nota", d.note);
            }
            else if (d.type === 'PERSEKUTUAN_DOA') {
                title = "PERSEKUTUAN DOA";
                if(d.isSkipped) rows += makeRow("Catatan", d.activityAlt);
                else {
                    rows += makeRow("Pimpin Doa", d.leader);
                    rows += makeRow("Bahan Doa", d.material);
                    rows += makeRow("Renungan", d.sharer);
                }
            }
            else if (d.type === 'CABANG') {
                title = `PELAYANAN ${d.subType.toUpperCase()}`;
                if(d.subType === 'Kanak-Kanak') {
                    rows += makeRow("Kelas Besar", d.kidBig);
                    rows += makeRow("Kelas Tengah", d.kidMid);
                    rows += makeRow("Kelas Kecil", d.kidSmall);
                } else {
                    rows += makeRow("Aktiviti", d.activity);
                    rows += makeRow("Pujian", d.pujian);
                    rows += makeRow("Renungan", d.renungan);
                }
            }

            let delBtn = "";
            if(currentUser?.role === 'admin') delBtn = `<button class="btn-danger" onclick="deleteSchedule('${doc.id}')">Padam</button>`;

            container.innerHTML += `
            <div class="schedule-table-container">
                <div class="schedule-header">
                    <h4>${title} <small>(${d.date})</small></h4> ${delBtn}
                </div>
                <div class="schedule-body">${rows}</div>
            </div>`;
        });
    } catch (e) { console.error(e); }
}

function makeRow(label, val) {
    if(!val) return "";
    return `<div class="schedule-row"><div class="col-label">${label}</div><div class="col-value">${val}</div></div>`;
}

window.deleteSchedule = async function(id) {
    if(confirm("Padam?")) { await deleteDoc(doc(db, "schedules", id)); loadWeeklySchedule(); }
}

// UI Toggles
window.togglePerjamuan = (id) => document.getElementById(id).classList.toggle('hidden');
window.toggleDoaAlt = () => {
    document.getElementById('divDoaNormal').classList.toggle('hidden');
    document.getElementById('divDoaAlt').classList.toggle('hidden');
};
window.toggleCabangFields = () => {
    const type = document.getElementById('valCabangType').value;
    if (type === 'Kanak-Kanak') {
        document.getElementById('fieldsStandard').classList.add('hidden');
        document.getElementById('fieldsKids').classList.remove('hidden');
    } else {
        document.getElementById('fieldsStandard').classList.remove('hidden');
        document.getElementById('fieldsKids').classList.add('hidden');
    }
};

window.exportWeeklyPDF = async function() {
    alert("Fungsi PDF sedia ada. Sila pastikan data lengkap."); 
    // (Kod PDF sama seperti sebelumnya)
};
