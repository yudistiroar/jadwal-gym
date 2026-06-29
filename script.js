// 1. CONFIG & INITIALIZATION DATABASE
const SUPABASE_URL = "https://usavbkcbyybtmdgsvvxs.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXZia2NieXlidG1kZ3N2dnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTg0NjgsImV4cCI6MjA5ODI5NDQ2OH0.QLNBsyIzAYLhK74Wku0XuWaQDD2i871pyWtiIOgnyS4"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_CAPACITY = 10; // Kapasitas Maksimal Per Shift Gym
const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAFTAR_SHIFT = ["Pagi", "Sore"];

// 2. DOM ELEMENT CACHING (Menghindari Pemanggilan DOM Berulang)
const elDOM = {
    rentangTanggal: document.getElementById('rentangTanggal'),
    inputNama: document.getElementById('inputNama'),
    pilihHari: document.getElementById('pilihHari'),
    pilihShift: document.getElementById('pilihShift'),
    tombolIkut: document.getElementById('tombolIkut'),
    scheduleContainer: document.getElementById('scheduleContainer'),
    nextWorkoutInfo: document.getElementById('nextWorkoutInfo'),
    toastContainer: document.getElementById('toastContainer'),
    customModal: document.getElementById('customModal'),
    modalMessage: document.getElementById('modalMessage'),
    btnModalConfirm: document.getElementById('btnModalConfirm'),
    btnModalCancel: document.getElementById('btnModalCancel')
};

let pendingDeleteData = null;

// 3. TOAST NOTIFICATION MODERN FUNCTION
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fas fa-check-circle" style="color: var(--success)"></i>';
    if(type === 'error') icon = '<i class="fas fa-times-circle" style="color: var(--accent)"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    elDOM.toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('active'), 50);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 4. SETUP CALENDAR & HARI INI HIGHLIGHT (Menggunakan Intl.DateTimeFormat)
let namaHariIniGlobal = "";
function setupCalendar() {
    const hariIni = new Date();
    const formatterHari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });
    namaHariIniGlobal = formatterHari.format(hariIni);

    const nomorHariIni = hariIni.getDay(); 
    const selisihKeSenin = nomorHariIni === 0 ? -6 : 1 - nomorHariIni;
    
    const hariSenin = new Date(hariIni);
    hariSenin.setDate(hariIni.getDate() + selisihKeSenin);
    
    const hariMinggu = new Date(hariSenin);
    hariMinggu.setDate(hariSenin.getDate() + 6);
    
    const formatOpsi = { day: 'numeric', month: 'long', year: 'numeric' };
    const formatTgl = new Intl.DateTimeFormat('id-ID', formatOpsi);
    
    if (elDOM.rentangTanggal) {
        elDOM.rentangTanggal.innerHTML = `<i class="far fa-calendar-alt"></i> Periode: ${formatTgl.format(hariSenin)} s/d ${formatTgl.format(hariMinggu)}`;
    }
    
    return DAFTAR_HARI.map((_, indeks) => {
        const tglTarget = new Date(hariSenin);
        tglTarget.setDate(hariSenin.getDate() + indeks);
        return `${tglTarget.getDate()}/${tglTarget.getMonth() + 1}`;
    });
}

// 5. LOAD DATA UTAMA DARI SUPABASE
async function loadData() {
    try {
        const { data, error } = await supabaseClient
            .from('jadwal-gym')
            .select('*');

        if (error) {
            showToast("Gagal memuat data dari database!", "error");
            console.error(error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}

// 6. RENDER CARD JADWAL MODERN WITH INDIKATORS & HIGHLIGHT
function renderSchedule(dataList) {
    const listTanggal = setupCalendar();
    elDOM.scheduleContainer.innerHTML = ""; 

    DAFTAR_HARI.forEach((hari, indeks) => {
        const isToday = (hari.toLowerCase() === namaHariIniGlobal.toLowerCase());
        const cardHari = document.createElement('div');
        cardHari.className = `day-card ${isToday ? 'today' : ''}`;
        
        let badgeTodayHTML = isToday ? `<span class="badge-today"><i class="fas fa-star"></i> Hari Ini</span>` : '';

        let blockShiftHTML = "";
        DAFTAR_SHIFT.forEach(shift => {
            const pesertaDiShiftIni = dataList.filter(row => row.hari === hari && row.shift === shift);
            const jumlahPeserta = pesertaDiShiftIni.length;
            const persenKapasitas = (jumlahPeserta / MAX_CAPACITY) * 100;

            let statusWarna = "";
            if (persenKapasitas >= 80) statusWarna = "danger";
            else if (persenKapasitas >= 50) statusWarna = "warning";

            let tagsPesertaHTML = "";
            if (jumlahPeserta === 0) {
                tagsPesertaHTML = `<span class="empty-state">Belum ada peserta</span>`;
            } else {
                pesertaDiShiftIni.forEach(p => {
                    tagsPesertaHTML += `
                        <span class="participant-tag" data-id="${p.id}" data-nama="${p.nama_peserta}" data-hari="${hari}" data-shift="${shift}">
                            ${p.nama_peserta} <i class="fas fa-times" style="font-size: 0.7rem; opacity: 0.7;"></i>
                        </span>`;
                });
            }

            blockShiftHTML += `
                <div class="shift-block">
                    <div class="shift-header">
                        <span><i class="far fa-clock"></i> Shift ${shift}</span>
                        <span style="color: ${jumlahPeserta >= MAX_CAPACITY ? 'var(--accent)' : 'var(--text-muted)'}">
                            👥 ${jumlahPeserta}/${MAX_CAPACITY}
                        </span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar ${statusWarna}" style="width: ${Math.min(persenKapasitas, 100)}%"></div>
                    </div>
                    <div class="participant-list">
                        ${tagsPesertaHTML}
                    </div>
                </div>`;
        });

        cardHari.innerHTML = `
            ${badgeTodayHTML}
            <div class="day-header">
                <span class="day-title">${hari}</span>
                <span class="day-date">${listTanggal[indeks]}</span>
            </div>
            ${blockShiftHTML}
        `;
        elDOM.scheduleContainer.appendChild(cardHari);
    });

    renderNextWorkoutBanner(dataList);
}

// 7. BANNER UPDATE: LATIHAN TERDEKAT HARI INI / BESOK
function renderNextWorkoutBanner(dataList) {
    const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const indeksHariIni = urutanHari.indexOf(DAFTAR_HARI.find(h => h.toLowerCase() === namaHariIniGlobal.toLowerCase()));
    
    if(indeksHariIni === -1) {
        elDOM.nextWorkoutInfo.innerText = "Selamat beristirahat minggu ini, bro!";
        return;
    }

    for (let i = 0; i < 7; i++) {
        const indeksTarget = (indeksHariIni + i) % 7;
        const hariDicari = urutanHari[indeksTarget];
        
        const dataHariTerpilih = dataList.filter(row => row.hari === hariDicari);
        if(dataHariTerpilih.length > 0) {
            const namaHariTeks = i === 0 ? "Hari Ini" : i === 1 ? "Besok" : hariDicari;
            const daftarNama = dataHariTerpilih.map(p => p.nama_peserta).join(', ');
            elDOM.nextWorkoutInfo.innerHTML = `<strong>${namaHariTeks}</strong> terisi oleh: <span style="color: var(--primary)">${daftarNama}</span>`;
            return;
        }
    }
    elDOM.nextWorkoutInfo.innerText = "Belum ada jadwal latihan aktif minggu ini. Yuk daftar!";
}

// 8. ACTION: SIMPAN PESERTA BARU
async function saveParticipant() {
    const namaInput = elDOM.inputNama.value.trim();
    const hariPilihan = elDOM.pilihHari.value;
    const shiftPilihan = elDOM.pilihShift.value;

    if (namaInput.length < 2 || namaInput.length > 30) {
        showToast("Nama peserta harus antara 2 sampai 30 karakter, bro!", "error");
        return;
    }

    const dataSegar = await loadData();

    const totalDiShiftItu = dataSegar.filter(row => row.hari === hariPilihan && row.shift === shiftPilihan).length;
    if (totalDiShiftItu >= MAX_CAPACITY) {
        showToast(`Maaf bro, slot Shift ${shiftPilihan} hari ${hariPilihan} sudah penuh! (Maks ${MAX_CAPACITY} orang)`, "error");
        return;
    }

    const sudahDaftar = dataSegar.some(row => 
        row.hari === hariPilihan && 
        row.shift === shiftPilihan && 
        row.nama_peserta.toLowerCase() === namaInput.toLowerCase()
    );

    if (sudahDaftar) {
        showToast(`${namaInput} sudah terdaftar di shift ini, tidak perlu mendaftar dua kali!`, "error");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('jadwal-gym')
            .insert([{ hari: hariPilihan, shift: shiftPilihan, nama_peserta: namaInput }]);

        if (error) {
            showToast("Gagal mendaftar ke server, coba lagi!", "error");
            console.error(error);
        } else {
            elDOM.inputNama.value = "";
            showToast(`Mantap! ${namaInput} berhasil masuk jadwal.`);
        }
    } catch (err) {
        console.error(err);
    }
}

// 9. MODAL KONFIRMASI CUSTOM & PROSES DELETE PESERTA
function initModalConfirm() {
    elDOM.btnModalCancel.addEventListener('click', () => {
        elDOM.customModal.classList.remove('active');
        pendingDeleteData = null;
    });

    elDOM.btnModalConfirm.addEventListener('click', async () => {
        if (pendingDeleteData) {
            const { id, nama } = pendingDeleteData;
            try {
                const { error } = await supabaseClient
                    .from('jadwal-gym')
                    .delete()
                    .match({ id: id });

                if (error) {
                    showToast("Gagal membatalkan jadwal latihan!", "error");
                    console.error(error);
                } else {
                    showToast(`Jadwal latihan ${nama} berhasil dibatalkan.`);
                }
            } catch (err) {
                console.error(err);
            }
        }
        elDOM.customModal.classList.remove('active');
        pendingDeleteData = null;
    });
}

elDOM.scheduleContainer.addEventListener('click', (event) => {
    const tagPeserta = event.target.closest('.participant-tag');
    if (tagPeserta) {
        const id = tagPeserta.getAttribute('data-id');
        const nama = tagPeserta.getAttribute('data-nama');
        const hari = tagPeserta.getAttribute('data-hari');
        const shift = tagPeserta.getAttribute('data-shift');

        pendingDeleteData = { id, nama, hari, shift };
        
        elDOM.modalMessage.innerHTML = `Apakah kamu yakin ingin menghapus nama <strong>${nama}</strong> dari jadwal latihan hari <strong>${hari} Shift ${shift}</strong>?`;
        elDOM.customModal.classList.add('active');
    }
});

// 10. SETUP REALTIME UPDATE SINKRONISASI OTOMATIS
function setupRealtime() {
    supabaseClient
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal-gym' }, async () => {
            const dataTerbaru = await loadData();
            renderSchedule(dataTerbaru);
        })
        .subscribe();
}

// 11. INITIAL APP RUNNING TRIGGER
async function initApp() {
    initModalConfirm();
    setupCalendar();
    setupRealtime();
    
    elDOM.tombolIkut.addEventListener('click', saveParticipant);
    elDOM.inputNama.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveParticipant();
    });

    const dataAwal = await loadData();
    renderSchedule(dataAwal);
}

initApp();