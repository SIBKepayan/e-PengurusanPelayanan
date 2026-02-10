// --- IMPORT FIREBASE (WAJIB UNTUK BROWSER) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIG FIREBASE ANDA ---
const firebaseConfig = {
  apiKey: "AIzaSyDHDKX19CUX2OhxTRxX_nOSUxXdkXbC4vY",
  authDomain: "e-ppsibkepayan.firebaseapp.com",
  projectId: "e-ppsibkepayan",
  storageBucket: "e-ppsibkepayan.firebasestorage.app",
  messagingSenderId: "872979610754",
  appId: "1:872979610754:web:163493d0f253dd8319089b",
  measurementId: "G-QN7MP7EHVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// GLOBAL VARS
let currentUser = null;
let currentTeam = [];

// --- AUTH LOGIC (LOGIN) ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const btn = document.querySelector('.btn-login');

    btn.textContent = "Sedang Memproses...";
    btn.disabled = true;

    try {
        // 1. BACKDOOR (ID SEMENTARA) - Jika Database Kosong
        if (loginId === "admin" && pass === "admin123") {
            loginSuccess({ name: "Super Admin", role: "admin" });
            return;
        }

        // 2. CHECK DATABASE
        const q = query(collection(db, "team"), where("phone", "==", loginId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert("ID tidak ditemui. Sila guna ID: admin / Pass: admin123 untuk kali pertama.");
            btn.textContent = "LOG MASUK";
            btn.disabled = false;
            return;
        }

        let userFound = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            // Default Password ialah No. Telefon
            if (data.phone === pass) {
                userFound = true;
                data.id = doc.id;
                loginSuccess(data);
            }
        });

        if (!userFound) {
            alert("Kata laluan salah.");
            btn.textContent = "LOG MASUK";
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert("Ralat Login: " + err.message);
        btn.textContent = "LOG MASUK";
        btn.disabled = false;
    }
});

function loginSuccess(user) {
    currentUser = user;
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('username-display').textContent = user.name;
    document.getElementById('user-role-display').textContent = user.role.toUpperCase();

    // Show/Hide Admin menus
    const adminMenus = document.querySelectorAll('.admin-only');
    if (user.role !== 'admin') {
        adminMenus.forEach(el => el.classList.add('hidden'));
    } else {
        adminMenus.forEach(el => el.classList.remove('hidden'));
    }

    // Load Data
    document.getElementById('weekFilterDate').valueAsDate = new Date();
    loadTeamData();
}

window.logout = function() {
    location.reload();
}

// --- NAVIGATION ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Title Updates
    const titles = {
        'tab-jadual-mingguan': 'Lihat Jadual Mingguan',
        'tab-urus-tim': 'Data Tim Pelayanan',
        'tab-urus-ibadah': 'Urus Ibadah Utama',
        'tab-urus-cabang': 'Urus Jadual Cabang'
    };
    if(titles[tabId]) document.getElementById('page-title').textContent = titles[tabId];
}

window.switchSubTab = function(subId) {
    document.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(subId).classList.add('active');
    document.querySelectorAll('.tab-switcher button').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

// --- MODULE 1: TEAM DATA ---
window.loadTeamData = async function() {
    const tbody = document.querySelector('#teamTable tbody');
    if(tbody) tbody.innerHTML = '<tr><td colspan="4">Sedang memuat...</td></tr>';
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
            
            // Table Row
            if(currentUser && currentUser.role === 'admin' && tbody) {
                const row = `<tr>
                    <td>${m.name}</td>
                    <td>${m.role}</td>
                    <td>${m.status}</td>
                    <td>
                        <button class="btn-edit" onclick="editTeam('${m.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger" onclick="deleteTeam('${m.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
                tbody.innerHTML += row;
            }

            // Dropdowns (Active Only)
            if (m.status === 'Aktif') {
                selects.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = m.name;
                    opt.textContent = m.name;
                    s.appendChild(opt);
                });
            }
        });
        if(snapshot.empty && tbody) tbody.innerHTML = '<tr><td colspan="4">Tiada data.</td></tr>';
    } catch (err) {
        console.error(err);
    }
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
    const btn = document.getElementById('btnSaveTeam');
    btn.disabled = true;

    try {
        if (id) {
            await updateDoc(doc(db, "team", id), data);
            alert("Dikemaskini!");
        } else {
            await addDoc(collection(db, "team"), data);
            alert("Ditambah!");
        }
        resetTeamForm();
        loadTeamData();
    } catch (err) {
        alert("Ralat: " + err.message);
    }
    btn.disabled = false;
});

window.editTeam = function(id) {
    const m = currentTeam.find(x => x.id === id);
    if(m) {
        document.getElementById('teamMemberId').value = m.id;
        document.getElementById('teamName').value = m.name;
        document.getElementById('teamPhone').value = m.phone;
        document.getElementById('teamRole').value = m.role;
        document.getElementById('teamStatus').value = m.status;
        document.getElementById('btnSaveTeam').textContent = "Kemaskini";
    }
}

window.deleteTeam = async function(id) {
    if(confirm("Padam ahli ini?")) {
        await deleteDoc(doc(db, "team", id));
        loadTeamData();
    }
}

window.resetTeamForm = function() {
    document.getElementById('teamForm').reset();
    document.getElementById('teamMemberId').value = '';
    document.getElementById('btnSaveTeam').textContent = "Simpan";
}

// --- MODULE 2: SCHEDULES ---
async function saveScheduleToDB(data) {
    try {
        await addDoc(collection(db, "schedules"), data);
        alert("Jadual berjaya disimpan!");
        document.querySelectorAll('form').forEach(f => f.reset());
        loadWeeklySchedule();
    } catch (e) {
        alert("Ralat: " + e.message);
    }
}

document.getElementById('formAhad').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
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
    };
    saveScheduleToDB(data);
});

document.getElementById('formDoa').addEventListener('submit', (e) => {
    e.preventDefault();
    const isSkipped = document.getElementById('checkNoDoa').checked;
    const data = {
        type: 'PERSEKUTUAN_DOA',
        date: document.getElementById('dateDoa').value,
        isSkipped: isSkipped,
        activityAlt: document.getElementById('valDoaActivity').value,
        leader: document.getElementById('valDoaLeader').value,
        material: document.getElementById('valDoaMaterial').value,
        sharer: document.getElementById('valDoaSharer').value
    };
    saveScheduleToDB(data);
});

document.getElementById('formKhas').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        type: 'IBADAH_KHAS',
        eventName: document.getElementById('valKhasName').value,
        date: document.getElementById('dateKhas').value,
        leader: document.getElementById('valKhasLeader').value,
        worship: document.getElementById('valKhasWorship').value,
        speaker: document.getElementById('valKhasSpeaker').value,
        doaPkk: document.getElementById('valKhasDoaPKK').value,
        note: document.getElementById('valKhasNote').value
    };
    saveScheduleToDB(data);
});

document.getElementById('formCabang').addEventListener('submit', (e) => {
    e.preventDefault();
    const cType = document.getElementById('valCabangType').value;
    const data = {
        type: 'CABANG',
        subType: cType,
        date: document.getElementById('dateCabang').value,
        activity: document.getElementById('valCabangActivity').value,
        pujian: document.getElementById('valCabangPujian').value,
        renungan: document.getElementById('valCabangRenungan').value,
        kidBig: document.getElementById('valKidsBig').value,
        kidMid: document.getElementById('valKidsMid').value,
        kidSmall: document.getElementById('valKidsSmall').value
    };
    saveScheduleToDB(data);
});

// --- MODULE 3: WEEKLY VIEW & PDF ---
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
    container.innerHTML = `<p style="text-align:center">Memuat jadual...</p>`;

    try {
        const q = query(collection(db, "schedules"), where("date", ">=", monday), where("date", "<=", sunday), orderBy("date"));
        const snapshot = await getDocs(q);
        
        container.innerHTML = `<h3 style="text-align:center; margin-bottom:20px; color:#0056b3">Minggu: ${monday} hingga ${sunday}</h3>`;
        
        if (snapshot.empty) {
            container.innerHTML += '<p style="text-align:center">Tiada jadual.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const d = doc.data();
            let html = `<div class="schedule-block">`;
            if(currentUser && currentUser.role === 'admin') {
                html += `<div class="actions"><button class="btn-danger" onclick="deleteSchedule('${doc.id}')"><i class="fas fa-trash"></i></button></div>`;
            }
            
            let title = d.type.replace('_', ' ');
            if (d.type === 'IBADAH_KHAS') title = d.eventName;
            if (d.type === 'CABANG') title = `PELAYANAN ${d.subType}`;
            
            html += `<h4>${title.toUpperCase()} <span style="float:right; font-size:0.9rem">${d.date}</span></h4>`;

            // Display Logic
            if(d.type === 'IBADAH_AHAD') {
                html += rowHtml("Pimpin", d.leader);
                html += rowHtml("Khotbah", d.speaker);
                if(d.hasPerjamuan) html += rowHtml("Perjamuan", "Ada");
            } else if(d.type === 'CABANG') {
                html += rowHtml("Aktiviti", d.activity);
            }
            // (Tambah logic display lain jika perlu ringkas)

            html += `</div>`;
            container.innerHTML += html;
        });
    } catch (e) {
        container.innerHTML = `<p style="color:red">Ralat: ${e.message}</p>`;
    }
}

function rowHtml(label, value) {
    if(!value) return '';
    return `<div class="detail-row"><div class="detail-label">${label}</div><div class="detail-value">${value}</div></div>`;
}

window.deleteSchedule = async function(id) {
    if(confirm("Padam?")) {
        await deleteDoc(doc(db, "schedules", id));
        loadWeeklySchedule();
    }
}

// UI Toggles
window.togglePerjamuan = () => document.getElementById('divPerjamuan').classList.toggle('hidden');
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
    alert("Fungsi PDF sedia ada. Sila pastikan data jadual lengkap.");
    // (Kod PDF boleh ditambah penuh jika perlu)
};
