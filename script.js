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

// AUTO LOGIN
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('sib_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initDashboard();
    }
});

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const btn = document.querySelector('.btn-login');
    btn.textContent = "Memproses..."; btn.disabled = true;

    try {
        if (loginId === "admin" && pass === "admin123") {
            performLogin({ name: "Super Admin", role: "admin", id: "temp_admin" });
            return;
        }
        const q = query(collection(db, "team"), where("phone", "==", loginId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { alert("ID tiada."); btn.textContent = "LOG MASUK"; btn.disabled = false; return; }

        let userFound = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            if ((data.password || data.phone) === pass) {
                userFound = true; data.id = doc.id; performLogin(data);
            }
        });
        if (!userFound) { alert("Salah kata laluan."); btn.textContent = "LOG MASUK"; btn.disabled = false; }
    } catch (e) { alert("Ralat: " + e.message); btn.textContent = "LOG MASUK"; btn.disabled = false; }
});

function performLogin(user) {
    currentUser = user;
    localStorage.setItem('sib_user', JSON.stringify(user));
    initDashboard();
}

function initDashboard() {
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('dashboard-page').classList.add('active');
    
    document.getElementById('username-display').textContent = currentUser.name;
    document.getElementById('user-role-display').textContent = currentUser.role.toUpperCase();

    const adminMenus = document.querySelectorAll('.admin-only');
    if (currentUser.role !== 'admin') adminMenus.forEach(el => el.classList.add('hidden'));
    else adminMenus.forEach(el => el.classList.remove('hidden'));

    showTab('tab-home'); 
    document.getElementById('weekFilterDate').valueAsDate = new Date();
    loadTeamData();
    loadWeeklySchedule();
}

window.logout = function() { localStorage.removeItem('sib_user'); location.reload(); }

// NAV FIX (PISAHKAN PAGE)
window.showTab = function(tabId) {
    // Sembunyikan SEMUA page
    document.querySelectorAll('.content-tab').forEach(el => {
        el.classList.remove('active');
    });
    
    // Tunjuk HANYA page yang dipilih
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');

    // Menu Highlight
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

// TEAM DATA
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
    try { if(id) await updateDoc(doc(db,"team",id),data); else await addDoc(collection(db,"team"),data); alert("Disimpan!"); document.getElementById('teamForm').reset(); loadTeamData(); } catch(e){alert(e.message)}
});
window.editTeam = function(id) { const m = currentTeam.find(x=>x.id===id); if(m){ document.getElementById('teamMemberId').value=m.id; document.getElementById('teamName').value=m.name; document.getElementById('teamPhone').value=m.phone; document.getElementById('teamRole').value=m.role; document.getElementById('teamStatus').value=m.status; } }
window.deleteTeam = async function(id) { if(confirm("Padam?")) { await deleteDoc(doc(db,"team",id)); loadTeamData(); } }

// SAVE JADUAL
async function saveSch(data) {
    try { await addDoc(collection(db,"schedules"),data); alert("Disimpan!"); document.querySelectorAll('form').forEach(f=>f.reset()); loadWeeklySchedule(); } catch(e){alert(e.message)}
}

// 1. AHAD
document.getElementById('formAhad').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'IBADAH_AHAD', date:document.getElementById('dateAhad').value,
    leader:document.getElementById('valAhadLeader').value, worship:document.getElementById('valAhadWorship').value,
    speaker:document.getElementById('valAhadSpeaker').value, doaPkk:document.getElementById('valAhadDoaPKK').value,
    usher:document.getElementById('valAhadUsher').value, hasPerjamuan:document.getElementById('checkPerjamuan').checked,
    pkLeader:document.getElementById('valAhadPK').value, pkAsst:document.getElementById('valAhadAsstPK').value,
    bibleOT:`${document.getElementById('valReaderOT').value} (${document.getElementById('valVerseOT').value})`,
    bibleNT:`${document.getElementById('valReaderNT').value} (${document.getElementById('valVerseNT').value})`
})});

// 2. KHAS (UPDATED)
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

// 3. DOA (UPDATED)
document.getElementById('formDoa').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'PERSEKUTUAN_DOA', date:document.getElementById('dateDoa').value, isSkipped:document.getElementById('checkNoDoa').checked,
    activityAlt:document.getElementById('valDoaActivity').value,
    leader:document.getElementById('valDoaPujian').value, // PIMPIN PUJIAN
    material:document.getElementById('valDoaBahan').value, // BAHAN DOA
    sharer:document.getElementById('valDoaRenungan').value // RENUNGAN
})});

// 4. CABANG
document.getElementById('formCabang').addEventListener('submit', (e)=>{ e.preventDefault(); saveSch({
    type:'CABANG', subType:document.getElementById('valCabangType').value, date:document.getElementById('dateCabang').value,
    activity:document.getElementById('valCabangActivity').value, pujian:document.getElementById('valCabangPujian').value,
    renungan:document.getElementById('valCabangRenungan').value, kidBig:document.getElementById('valKidsBig').value,
    kidMid:document.getElementById('valKidsMid').value, kidSmall:document.getElementById('valKidsSmall').value
})});

// DISPLAY JADUAL
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
                rows = `<tr><td width="30%"><b>Pimpin</b></td><td>${d.leader}</td></tr><tr><td><b>Pujian</b></td><td>${d.worship}</td></tr><tr><td><b>Khotbah</b></td><td>${d.speaker}</td></tr><tr><td><b>Doa PKK</b></td><td>${d.doaPkk}</td></tr><tr><td><b>Usher</b></td><td>${d.usher}</td></tr>` +
                (d.hasPerjamuan ? `<tr><td><b>Perjamuan</b></td><td>${d.pkLeader} / ${d.pkAsst}</td></tr>`:'') +
                `<tr><td><b>Alkitab</b></td><td>PL: ${d.bibleOT}<br>PB: ${d.bibleNT}</td></tr>`;
            } else if(d.type==='IBADAH_KHAS') {
                title=d.eventName.toUpperCase();
                rows = `<tr><td><b>Pimpin</b></td><td>${d.leader}</td></tr><tr><td><b>Pujian</b></td><td>${d.worship}</td></tr><tr><td><b>Khotbah</b></td><td>${d.speaker}</td></tr><tr><td><b>Usher</b></td><td>${d.usher}</td></tr>` +
                (d.hasPerjamuan ? `<tr><td><b>Perjamuan</b></td><td>${d.pkLeader} / ${d.pkAsst}</td></tr>`:'') +
                `<tr><td><b>Alkitab</b></td><td>PL: ${d.bibleOT}<br>PB: ${d.bibleNT}</td></tr><tr><td><b>Nota</b></td><td>${d.note}</td></tr>`;
            } else if(d.type==='PERSEKUTUAN_DOA') {
                title="PERSEKUTUAN DOA";
                rows = d.isSkipped ? `<tr><td><b>Info</b></td><td>${d.activityAlt}</td></tr>` : 
                `<tr><td><b>Pimpin Pujian</b></td><td>${d.leader}</td></tr><tr><td><b>Bahan Doa</b></td><td>${d.material}</td></tr><tr><td><b>Renungan</b></td><td>${d.sharer}</td></tr>`;
            } else if(d.type==='CABANG') {
                title=d.subType.toUpperCase();
                rows = d.subType==='Kanak-Kanak' ? `<tr><td><b>Besar</b></td><td>${d.kidBig}</td></tr><tr><td><b>Tengah</b></td><td>${d.kidMid}</td></tr><tr><td><b>Kecil</b></td><td>${d.kidSmall}</td></tr>` :
                `<tr><td><b>Aktiviti</b></td><td>${d.activity}</td></tr><tr><td><b>Pujian</b></td><td>${d.pujian}</td></tr><tr><td><b>Renungan</b></td><td>${d.renungan}</td></tr>`;
            }

            let btn = (currentUser?.role === 'admin') ? `<button class="btn-danger" style="float:right" onclick="deleteSchedule('${doc.id}')">Padam</button>` : "";
            div.innerHTML += `<div class="schedule-table-container"><div class="schedule-header"><h4>${title} <small>(${d.date})</small></h4>${btn}</div><table class="schedule-table">${rows}</table></div>`;
        });
    } catch(e){console.error(e)}
}

window.deleteSchedule = async function(id) { if(confirm("Padam?")) { await deleteDoc(doc(db,"schedules",id)); loadWeeklySchedule(); } }

// UI TOGGLES
window.togglePerjamuan = (id) => document.getElementById(id).classList.toggle('hidden');
window.toggleDoaAlt = () => { document.getElementById('divDoaNormal').classList.toggle('hidden'); document.getElementById('divDoaAlt').classList.toggle('hidden'); };
window.toggleCabangFields = () => {
    const t = document.getElementById('valCabangType').value;
    const isKid = t==='Kanak-Kanak';
    document.getElementById('fieldsStandard').classList.toggle('hidden', isKid);
    document.getElementById('fieldsKids').classList.toggle('hidden', !isKid);
};

// PDF
window.exportWeeklyPDF = async function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dateInput = document.getElementById('weekFilterDate').value;
    const { mon, sun } = getWeekRange(dateInput);

    doc.setFillColor(0, 159, 227); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("GEREJA SIB KEPAYAN", 105, 15, { align: "center" });
    doc.setFontSize(12); doc.setFont("helvetica", "normal");
    doc.text(`JADUAL: ${mon} HINGGA ${sun}`, 105, 30, { align: "center" });

    const q = query(collection(db, "schedules"), where("date", ">=", mon), where("date", "<=", sun), orderBy("date"));
    const snapshot = await getDocs(q);
    
    let yPos = 50; doc.setTextColor(0, 0, 0);

    snapshot.forEach(dData => {
        const d = dData.data();
        let bodyData = [];
        let title = d.type;

        if (d.type === 'IBADAH_AHAD') {
            title = `IBADAH UMUM AHAD (${d.date})`;
            bodyData = [['Pimpin', d.leader], ['Pujian', d.worship], ['Khotbah', d.speaker], ['Doa PKK', d.doaPkk], ['Usher', d.usher || '-'], ['Alkitab', `PL: ${d.bibleOT}\nPB: ${d.bibleNT}`]];
        } else if (d.type === 'IBADAH_KHAS') {
            title = `${d.eventName.toUpperCase()} (${d.date})`;
            bodyData = [['Pimpin', d.leader], ['Pujian', d.worship], ['Khotbah', d.speaker], ['Usher', d.usher || '-'], ['Alkitab', `PL: ${d.bibleOT}\nPB: ${d.bibleNT}`], ['Nota', d.note]];
        } else if (d.type === 'CABANG') {
            title = `PELAYANAN ${d.subType} (${d.date})`;
            bodyData = d.subType==='Kanak-Kanak' ? [['Besar',d.kidBig],['Tengah',d.kidMid],['Kecil',d.kidSmall]] : [['Aktiviti',d.activity],['Pujian',d.pujian],['Renungan',d.renungan]];
        } else if (d.type === 'PERSEKUTUAN_DOA') {
            title = `PERSEKUTUAN DOA (${d.date})`;
            bodyData = d.isSkipped ? [['Info', d.activityAlt]] : [['Pujian',d.leader],['Bahan',d.material],['Renungan',d.sharer]];
        }

        doc.setFontSize(11); doc.setTextColor(0, 159, 227); doc.setFont("helvetica", "bold");
        doc.text(title, 14, yPos); yPos += 2;

        doc.autoTable({
            startY: yPos, body: bodyData, theme: 'grid',
            headStyles: { fillColor: [0, 159, 227] },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } },
            margin: { left: 14, right: 14 }
        });
        yPos = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Jadual-${mon}.pdf`);
}
