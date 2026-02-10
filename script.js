// --- IMPORT & CONFIG ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let currentUser = null;
let currentTeam = [];

// --- LOGIN ---
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
            alert("ID tiada. Admin sila guna: admin / admin123");
            btn.textContent = "LOG MASUK"; btn.disabled = false;
            return;
        }

        let userFound = false;
        snapshot.forEach(doc => {
            const data = doc.data();
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
    const dashboard = document.getElementById('dashboard-page');
    dashboard.classList.remove('hidden');
    dashboard.classList.add('active');
    
    document.getElementById('username-display').textContent = user.name;
    document.getElementById('user-role-display').textContent = user.role.toUpperCase();

    const adminMenus = document.querySelectorAll('.admin-only');
    if (user.role !== 'admin') adminMenus.forEach(el => el.classList.add('hidden'));
    else adminMenus.forEach(el => el.classList.remove('hidden'));

    showTab('tab-home'); // Terus ke Home
    document.getElementById('weekFilterDate').valueAsDate = new Date();
    loadTeamData();
    loadWeeklySchedule();
}

window.logout = function() { location.reload(); }

// --- NAV ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const titles = { 'tab-home':'Jadual Mingguan', 'tab-urus-tim':'Data Tim', 'tab-urus-ibadah':'Urus Ibadah', 'tab-urus-cabang':'Urus Cabang', 'tab-profile':'Tetapan' };
    if(titles[tabId]) document.getElementById('page-title').textContent = titles[tabId];
}

window.switchSubTab = function(subId) {
    document.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(subId).classList.add('active');
    document.querySelectorAll('.tab-switcher button').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

// --- TEAM & PASSWORD ---
window.loadTeamData = async function() {
    const tbody = document.querySelector('#teamTable tbody');
    const selects = document.querySelectorAll('.member-select');
    currentTeam = [];
    try {
        const q = query(collection(db, "team"), orderBy("name"));
        const snapshot = await getDocs(q);
        if(tbody) tbody.innerHTML = '';
        selects.forEach(s => s.innerHTML = '<option value="">-- Pilih --</option>');

        snapshot.forEach(doc => {
            const m = doc.data(); m.id = doc.id; currentTeam.push(m);
            if(currentUser?.role === 'admin' && tbody) {
                tbody.innerHTML += `<tr><td>${m.name}</td><td>${m.role}</td><td>${m.status}</td>
                <td><button class="btn-edit" onclick="editTeam('${m.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-danger" onclick="deleteTeam('${m.id}')"><i class="fas fa-trash"></i></button></td></tr>`;
            }
            if(m.status === 'Aktif') {
                selects.forEach(s => {
                    const opt = document.createElement('option'); opt.value=m.name; opt.textContent=m.name; s.appendChild(opt);
                });
            }
        });
    } catch(e){}
}

document.getElementById('teamForm').addEventListener('submit', async(e)=>{
    e.preventDefault();
    const id = document.getElementById('teamMemberId').value;
    const data = { name: document.getElementById('teamName').value, phone: document.getElementById('teamPhone').value, role: document.getElementById('teamRole').value, status: document.getElementById('teamStatus').value };
    try {
        if(id) await updateDoc(doc(db,"team",id),data); else await addDoc(collection(db,"team"),data);
        alert("Disimpan!"); document.getElementById('teamForm').reset(); loadTeamData();
    } catch(e){alert(e.message)}
});

document.getElementById('formPassword').addEventListener('submit', async(e)=>{
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    if(!currentUser.id) return;
    try {
        await updateDoc(doc(db,"team",currentUser.id), { password: newPass });
        alert("Kata laluan ditukar! Sila login semula."); logout();
    } catch(e){alert(e.message)}
});

window.editTeam = function(id) {
    const m = currentTeam.find(x=>x.id===id);
    if(m) {
        document.getElementById('teamMemberId').value=m.id; document.getElementById('teamName').value=m.name;
        document.getElementById('teamPhone').value=m.phone; document.getElementById('teamRole').value=m.role;
        document.getElementById('teamStatus').value=m.status;
    }
}
window.deleteTeam = async function(id) { if(confirm("Padam?")) { await deleteDoc(doc(db,"team",id)); loadTeamData(); } }

// --- SAVE SCHEDULE ---
async function saveSch(data) {
    try { await addDoc(collection(db,"schedules"),data); alert("Disimpan!"); document.querySelectorAll('form').forEach(f=>f.reset()); loadWeeklySchedule(); }
    catch(e){alert(e.message)}
}

document.getElementById('formAhad').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'IBADAH_AHAD', date:document.getElementById('dateAhad').value,
    leader:document.getElementById('valAhadLeader').value, worship:document.getElementById('valAhadWorship').value,
    speaker:document.getElementById('valAhadSpeaker').value, doaPkk:document.getElementById('valAhadDoaPKK').value,
    usher:document.getElementById('valAhadUsher').value, hasPerjamuan:document.getElementById('checkPerjamuan').checked,
    pkLeader:document.getElementById('valAhadPK').value, pkAsst:document.getElementById('valAhadAsstPK').value,
    bibleOT:`${document.getElementById('valReaderOT').value} (${document.getElementById('valVerseOT').value})`,
    bibleNT:`${document.getElementById('valReaderNT').value} (${document.getElementById('valVerseNT').value})`
})});

document.getElementById('formKhas').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'IBADAH_KHAS', eventName:document.getElementById('valKhasName').value, date:document.getElementById('dateKhas').value,
    leader:document.getElementById('valKhasLeader').value, worship:document.getElementById('valKhasWorship').value,
    speaker:document.getElementById('valKhasSpeaker').value, doaPkk:document.getElementById('valKhasDoaPKK').value,
    usher:document.getElementById('valKhasUsher').value, hasPerjamuan:document.getElementById('checkPerjamuanKhas').checked,
    pkLeader:document.getElementById('valKhasPK').value, pkAsst:document.getElementById('valKhasAsstPK').value,
    bibleOT:`${document.getElementById('valKhasReaderOT').value} (${document.getElementById('valKhasVerseOT').value})`,
    bibleNT:`${document.getElementById('valKhasReaderNT').value} (${document.getElementById('valKhasVerseNT').value})`,
    note:document.getElementById('valKhasNote').value
})});

document.getElementById('formDoa').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'PERSEKUTUAN_DOA', date:document.getElementById('dateDoa').value, isSkipped:document.getElementById('checkNoDoa').checked,
    activityAlt:document.getElementById('valDoaActivity').value, leader:document.getElementById('valDoaLeader').value,
    material:document.getElementById('valDoaMaterial').value, sharer:document.getElementById('valDoaSharer').value
})});

document.getElementById('formCabang').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'CABANG', subType:document.getElementById('valCabangType').value, date:document.getElementById('dateCabang').value,
    activity:document.getElementById('valCabangActivity').value, pujian:document.getElementById('valCabangPujian').value,
    renungan:document.getElementById('valCabangRenungan').value, kidBig:document.getElementById('valKidsBig').value,
    kidMid:document.getElementById('valKidsMid').value, kidSmall:document.getElementById('valKidsSmall').value
})});

// --- LOAD VIEW ---
function getWeekRange(d) {
    const c=new Date(d); const f=c.getDate()-c.getDay()+1; const l=f+6;
    return { mon:new Date(c.setDate(f)).toISOString().split('T')[0], sun:new Date(c.setDate(l)).toISOString().split('T')[0] };
}

window.loadWeeklySchedule = async function() {
    const inp = document.getElementById('weekFilterDate').value; if(!inp) return;
    const {mon, sun} = getWeekRange(inp);
    const div = document.getElementById('weekly-schedule-container');
    div.innerHTML = `<p style="text-align:center">Memuat...</p>`;

    try {
        const q = query(collection(db,"schedules"), where("date",">=",mon), where("date","<=",sun), orderBy("date"));
        const snap = await getDocs(q);
        div.innerHTML = `<h3 style="text-align:center; color:#009FE3; margin-bottom:15px">Minggu: ${mon} - ${sun}</h3>`;
        
        if(snap.empty) { div.innerHTML += "<p style='text-align:center'>Tiada jadual.</p>"; return; }

        snap.forEach(doc => {
            const d = doc.data();
            let title="", rows="";
            
            if(d.type==='IBADAH_AHAD') {
                title="IBADAH UMUM AHAD";
                rows += mkRow("Pimpin Ibadah",d.leader) + mkRow("Pujian",d.worship) + mkRow("Khotbah",d.speaker) + mkRow("Doa PKK",d.doaPkk) + mkRow("Usher",d.usher);
                if(d.hasPerjamuan) rows += mkRow("Perjamuan", `${d.pkLeader} / ${d.pkAsst}`);
                rows += mkRow("Alkitab", `PL: ${d.bibleOT}<br>PB: ${d.bibleNT}`);
            } else if(d.type==='IBADAH_KHAS') {
                title=d.eventName.toUpperCase();
                rows += mkRow("Pimpin",d.leader) + mkRow("Pujian",d.worship) + mkRow("Khotbah",d.speaker) + mkRow("Usher",d.usher) + mkRow("Nota",d.note);
            } else if(d.type==='PERSEKUTUAN_DOA') {
                title="PERSEKUTUAN DOA";
                rows += d.isSkipped ? mkRow("Catatan",d.activityAlt) : (mkRow("Pimpin",d.leader)+mkRow("Bahan",d.material)+mkRow("Renungan",d.sharer));
            } else if(d.type==='CABANG') {
                title=d.subType.toUpperCase();
                if(d.subType==='Kanak-Kanak') rows += mkRow("Kelas Besar",d.kidBig)+mkRow("Tengah",d.kidMid)+mkRow("Kecil",d.kidSmall);
                else rows += mkRow("Aktiviti",d.activity)+mkRow("Pujian",d.pujian)+mkRow("Renungan",d.renungan);
            }

            let btn=""; if(currentUser?.role==='admin') btn=`<button class="btn-danger" style="margin-left:auto" onclick="deleteSchedule('${doc.id}')">Padam</button>`;
            div.innerHTML += `<div class="schedule-table-container"><div class="schedule-header"><h4>${title} (${d.date})</h4>${btn}</div><div class="schedule-body">${rows}</div></div>`;
        });
    } catch(e){console.error(e)}
}

function mkRow(l,v){ if(!v)return""; return `<div class="schedule-row"><div class="col-label">${l}</div><div class="col-value">${v}</div></div>`; }
window.deleteSchedule = async function(id) { if(confirm("Padam?")) { await deleteDoc(doc(db,"schedules",id)); loadWeeklySchedule(); } }

// UI Toggles
window.togglePerjamuan = (id) => document.getElementById(id).classList.toggle('hidden');
window.toggleDoaAlt = () => { document.getElementById('divDoaNormal').classList.toggle('hidden'); document.getElementById('divDoaAlt').classList.toggle('hidden'); };
window.toggleCabangFields = () => {
    const t = document.getElementById('valCabangType').value;
    const isKid = t==='Kanak-Kanak';
    document.getElementById('fieldsStandard').classList.toggle('hidden', isKid);
    document.getElementById('fieldsKids').classList.toggle('hidden', !isKid);
};
window.exportWeeklyPDF = async function() { alert("Sila pastikan data lengkap."); };
