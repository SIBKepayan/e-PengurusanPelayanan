// --- DATA MOCKUP ---
const mockMembers = [
    { id: 1, name: "Bro. Jason", phone: "012-3456789", status: "Aktif" },
    { id: 2, name: "Sis. Sarah", phone: "019-8765432", status: "Aktif" },
    { id: 3, name: "Pst. David", phone: "013-5551234", status: "Aktif" },
    { id: 4, name: "Dkn. Michael", phone: "011-2233445", status: "Aktif" },
    { id: 5, name: "Sis. Mary", phone: "014-9988776", status: "Baru" }
];

// Inisialisasi Data Members
if (!localStorage.getItem('members')) {
    localStorage.setItem('members', JSON.stringify(mockMembers));
}
// Inisialisasi Data Jadual (Simpanan Sementara)
if (!localStorage.getItem('schedules')) {
    localStorage.setItem('schedules', JSON.stringify([]));
}

// --- NAVIGATION & AUTH ---
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('auth-container');

if(signUpButton) signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
if(signInButton) signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

function navigateTo(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

// --- LOGIN HANDLER ---
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    if (email === 'admin@sib.com' && pass === '12345') {
        setupDashboard('admin', 'Admin Gereja');
    } else if (email === 'council@sib.com' && pass === '12345') {
        setupDashboard('council', 'Ahli Majlis');
    } else {
        alert('E-mel atau kata laluan salah!');
    }
});

function setupDashboard(role, name) {
    localStorage.setItem('currentUserRole', role);
    document.getElementById('username-display').textContent = name;
    document.getElementById('user-role-display').textContent = role === 'admin' ? 'Administrator' : 'Ahli Majlis';
    
    const adminItems = document.querySelectorAll('.admin-only');
    
    if (role === 'admin') {
        adminItems.forEach(el => el.style.display = 'block');
    } else {
        adminItems.forEach(el => el.style.display = 'none');
    }

    // Populate semua dropdown dengan nama ahli
    populateMemberSelects();
    // Auto set tarikh
    setDefaultDates();

    if(role === 'admin') loadMembersTable();
    loadScheduleView();

    navigateTo('dashboard-page');
    showTab('tab-overview');
}

function logout() {
    navigateTo('landing-page');
}

window.showTab = function(tabId) {
    document.querySelectorAll('.content-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    // Highlight menu sidebar
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
};

// --- HELPER FUNCTIONS ---
function populateMemberSelects() {
    const members = JSON.parse(localStorage.getItem('members'));
    const selects = document.querySelectorAll('.member-select');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Pilih --</option>';
        members.forEach(m => {
            const option = document.createElement('option');
            option.value = m.name;
            option.textContent = m.name;
            select.appendChild(option);
        });
    });
}

function getNextDayOfWeek(date, dayOfWeek) {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate.toISOString().split('T')[0];
}

function setDefaultDates() {
    const today = new Date();
    // 5 = Friday, 0 = Sunday
    document.getElementById('doaDate').value = getNextDayOfWeek(today, 5); 
    document.getElementById('ahadDate').value = getNextDayOfWeek(today, 0); 
}

// --- IBADAH ADMIN LOGIC ---
window.switchIbadahTab = function(type) {
    document.getElementById('subtab-doa').classList.add('hidden');
    document.getElementById('subtab-ahad').classList.add('hidden');
    
    document.getElementById('subtab-' + type).classList.remove('hidden');
    
    // Update button styles
    const btns = document.querySelectorAll('.tab-switcher button');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

window.toggleDoaFields = function() {
    const isSkipped = document.getElementById('doaSkip').checked;
    const normalFields = document.getElementById('doaNormalFields');
    const altFields = document.getElementById('doaAlternativeFields');
    
    if (isSkipped) {
        normalFields.classList.add('hidden');
        altFields.classList.remove('hidden');
    } else {
        normalFields.classList.remove('hidden');
        altFields.classList.add('hidden');
    }
}

window.togglePerjamuan = function() {
    const isPk = document.getElementById('ahadPerjamuan').checked;
    const fields = document.getElementById('perjamuanFields');
    if (isPk) fields.classList.remove('hidden');
    else fields.classList.add('hidden');
}

// --- SAVE SCHEDULES ---
document.getElementById('cabangForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const schedule = {
        type: "Cabang - " + document.getElementById('cabangType').value,
        date: document.getElementById('cabangDate').value,
        details: {
            activity: document.getElementById('cabangActivity').value,
            pujian: document.getElementById('cabangPujian').value,
            renungan: document.getElementById('cabangRenungan').value
        }
    };
    saveAndAlert(schedule);
});

document.getElementById('doaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const isSkipped = document.getElementById('doaSkip').checked;
    let details = {};

    if(isSkipped) {
        details.activity = document.getElementById('doaAltActivity').value || "Tiada Aktiviti";
        details.note = "Aktiviti Khas/Tiada Persekutuan";
    } else {
        details.leader = document.getElementById('doaLeader').value;
        details.material = document.getElementById('doaMaterial').value;
        details.sharer = document.getElementById('doaSharer').value;
    }

    const schedule = {
        type: "Persekutuan Doa",
        date: document.getElementById('doaDate').value,
        details: details
    };
    saveAndAlert(schedule);
});

document.getElementById('ahadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const schedule = {
        type: "Ibadah Raya Ahad",
        date: document.getElementById('ahadDate').value,
        details: {
            leader: document.getElementById('ahadLeader').value,
            worship: document.getElementById('ahadWorship').value,
            speaker: document.getElementById('ahadSpeaker').value,
            doaPkk: document.getElementById('ahadDoaPKK').value,
            usher: document.getElementById('ahadUsher').value,
            bibleOT: `${document.getElementById('ahadReaderOT').value} (${document.getElementById('ahadVerseOT').value})`,
            bibleNT: `${document.getElementById('ahadReaderNT').value} (${document.getElementById('ahadVerseNT').value})`,
            perjamuan: document.getElementById('ahadPerjamuan').checked ? 
                       `PK: ${document.getElementById('ahadPK').value}, Asst: ${document.getElementById('ahadAssistantPK').value}` : "Tiada"
        }
    };
    saveAndAlert(schedule);
});

function saveAndAlert(data) {
    const schedules = JSON.parse(localStorage.getItem('schedules'));
    schedules.push(data);
    localStorage.setItem('schedules', JSON.stringify(schedules));
    alert("Jadual berjaya disimpan!");
    loadScheduleView();
}

// --- VIEW SCHEDULES ---
function loadScheduleView() {
    const schedules = JSON.parse(localStorage.getItem('schedules'));
    const container = document.getElementById('schedule-display-area');
    
    if (schedules.length === 0) {
        container.innerHTML = '<p class="text-muted">Tiada jadual direkodkan.</p>';
        return;
    }

    let html = '';
    // Sort by date (terbaru di atas)
    schedules.sort((a, b) => new Date(b.date) - new Date(a.date));

    schedules.forEach(s => {
        let detailHtml = '<ul style="margin-left:20px; font-size:0.9rem;">';
        for (const [key, value] of Object.entries(s.details)) {
            if(value) detailHtml += `<li><strong>${key.toUpperCase()}:</strong> ${value}</li>`;
        }
        detailHtml += '</ul>';

        html += `
        <div class="card-form" style="border-left: 5px solid var(--primary);">
            <h4>${s.type} <span style="float:right; font-size:0.8rem; color:#666;">${s.date}</span></h4>
            ${detailHtml}
        </div>`;
    });
    
    container.innerHTML = html;
}

// --- MEMBER MANAGEMENT ---
function loadMembersTable() {
    const members = JSON.parse(localStorage.getItem('members'));
    const tbody = document.querySelector('#membersTable tbody');
    tbody.innerHTML = '';
    
    members.forEach(member => {
        tbody.innerHTML += `<tr>
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>${member.phone}</td>
            <td>${member.status}</td>
        </tr>`;
    });
    document.getElementById('stat-members').innerText = members.length;
}

document.getElementById('addMemberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('newMemberName').value;
    const phone = document.getElementById('newMemberPhone').value;
    const members = JSON.parse(localStorage.getItem('members'));
    
    members.push({ id: members.length + 1, name: name, phone: phone, status: "Aktif" });
    localStorage.setItem('members', JSON.stringify(members));
    
    alert('Ahli ditambah!');
    this.reset();
    populateMemberSelects(); // Update dropdowns realtime
    loadMembersTable();
});

window.exportPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Laporan Keahlian SIB Kepayan", 10, 10);
    const members = JSON.parse(localStorage.getItem('members'));
    const data = members.map(m => [m.id, m.name, m.phone, m.status]);
    doc.autoTable({ head: [['ID', 'Nama', 'Telefon', 'Status']], body: data, startY: 20 });
    doc.save("Laporan-Keahlian.pdf");
};