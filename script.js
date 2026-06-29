// 1. CONFIG & INITIALIZATION DATABASE
const SUPABASE_URL = "https://usavbkcbyybtmdgsvvxs.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXZia2NieXlidG1kZ3N2dnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTg0NjgsImV4cCI6MjA5ODI5NDQ2OH0.QLNBsyIzAYLhK74Wku0XuWaQDD2i871pyWtiIOgnyS4"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_CAPACITY = 10; 
const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAFTAR_SHIFT = ["Pagi", "Sore"];

// 2. DOM ELEMENT CACHING
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

// 3. TOAST NOTIFICATION MODERN
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'error' ? '<i class="fas fa-times-circle" style="color: var(--accent)"></i>' : '<i class="fas fa-check-circle" style="color: var(--success)"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    elDOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('active'), 50);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 4. SETUP CALENDAR
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
    
    const formatTgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
            console.error("Supabase Error:", error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error("Network Error:", err);
        return [];
    }
}

// Fungsi pembantu untuk memecah data string gabungan menjadi array nama terpisah
function uraiDataPeserta(rawString, targetShift) {
    if (!rawString || typeof rawString !== 'string') return [];
    const bagianShift = rawString.split('|');
    for (let part of bagianShift) {
        const pecahan = part.split(':');
        if (pecahan[0] === targetShift && pecahan[1]) {
            return pecahan[1].split(',').map(n => n.trim()).filter(n => n !== "");
        }
    }
    return [];
}

// Fungsi pembantu untuk membungkus kembali array nama menjadi string panjang tunggal
function bungkusDataPeserta(arrayPagi, arraySore) {
    return `Pagi:${arrayPagi.join(',')}|Sore:${arraySore.join(',')}`;
}

// 6. RENDER CARD JADWAL MODERN
function renderSchedule(dataList) {
    const listTanggal = setupCalendar();
    elDOM.scheduleContainer.innerHTML = ""; 

    DAFTAR_HARI.forEach((hari, indeks) => {
        const isToday = (hari.toLowerCase() === namaHariIniGlobal.toLowerCase());
        const cardHari = document.createElement('div');
        cardHari.className = `day-card ${isToday ? 'today' : ''}`;
        let badgeTodayHTML = isToday ? `<span class="badge-today"><i class="fas fa-star"></i> Hari Ini</span>` : '';

        // JAMINAN KEBAL: Cari baris data berdasarkan HARI saja (1 hari hanya ada 1 baris)
        const rowData = dataList.find(row => row.hari === hari);
        const rawString = rowData ? rowData.nama_peserta : "";

        let blockShiftHTML = "";
        DAFTAR_SHIFT.forEach(shift => {
            const arrayPeserta = uraiDataPeserta(rawString, shift);
            const jumlahPeserta = arrayPeserta.length;
            const persenKapasitas = (jumlahPeserta / MAX_CAPACITY) * 100;
            let statusWarna = persenKapasitas >= 80 ? "danger" : persenKapasitas >= 50 ? "warning" : "";

            let tagsPesertaHTML = "";
            if (jumlahPeserta === 0) {
                tagsPesertaHTML = `<span class="empty-state">Belum ada peserta</span>`;
            } else {
                arrayPeserta.forEach((nama) => {
                    tagsPesertaHTML += `
                        <span class="participant-tag" data-nama="${nama}" data-hari="${hari}" data-shift="${shift}">
                            ${nama} <i class="fas fa-times" style="font-size: 0.7rem; opacity: 0.7;"></i>
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

        cardHari.innerHTML = `${badgeTodayHTML}<div class="day-header"><span class="day-title">${hari}</span><span class="day-date">${listTanggal[indeks]}</span></div>${blockShiftHTML}`;
        elDOM.scheduleContainer.appendChild(cardHari);
    });
    renderNextWorkoutBanner(dataList);
}

// 7. BANNER UPDATE
function renderNextWorkoutBanner(dataList) {
    const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const indeksHariIni = urutanHari.indexOf(DAFTAR_HARI.find(h => h.toLowerCase() === namaHariIniGlobal.toLowerCase()));
    
    for (let i = 0; i < 7; i++) {
        const hariDicari = urutanHari[(indeksHariIni + i) % 7];
        const rowData = dataList.find(r => r.hari === hariDicari);
        
        if (rowData && rowData.nama_peserta) {
            const listPagi = uraiDataPeserta(rowData.nama_peserta, "Pagi");
            const listSore = uraiDataPeserta(rowData.nama_peserta, "Sore");
            const semuaNama = [...listPagi, ...listSore].join(', ');

            if (semuaNama.trim() !== "") {
                const label = i === 0 ? "Hari Ini" : i === 1 ? "Besok" : hariDicari;
                elDOM.nextWorkoutInfo.innerHTML = `<strong>${label}</strong>: <span style="color: var(--primary)">${semuaNama}</span>`;
                return;
            }
        }
    }
    elDOM.nextWorkoutInfo.innerText = "Belum ada jadwal latihan aktif minggu ini. Yuk daftar!";
}

// 8. ACTION: SIMPAN PESERTA BARU (LOGIKA EDIT/UPDATE TOTAL MURNI ANTI BENTROK)
async function saveParticipant() {
    const namaInput = elDOM.inputNama.value.trim();
    const hariPilihan = elDOM.pilihHari.value;
    const shiftPilihan = elDOM.pilihShift.value;

    if (namaInput.length < 2 || namaInput.length > 30) {
        showToast("Nama peserta harus antara 2 sampai 30 karakter, bro!", "error");
        return;
    }

    try {
        const dataSegar = await loadData();
        const barisEksis = dataSegar.find(row => row.hari === hariPilihan);
        
        let listPagi = barisEksis ? uraiDataPeserta(barisEksis.nama_peserta, "Pagi") : [];
        let listSore = barisEksis ? uraiDataPeserta(barisEksis.nama_peserta, "Sore") : [];

        let listTarget = shiftPilihan === "Pagi" ? listPagi : listSore;

        if (listTarget.length >= MAX_CAPACITY) {
            showToast(`Slot Shift ${shiftPilihan} hari ${hariPilihan} sudah penuh!`, "error");
            return;
        }

        if (listPagi.some(n => n.toLowerCase() === namaInput.toLowerCase()) || listSore.some(n => n.toLowerCase() === namaInput.toLowerCase())) {
            showToast("Nama ini sudah terdaftar di hari tersebut!", "error");
            return;
        }

        // Masukkan nama baru ke array shift yang dituju
        if (shiftPilihan === "Pagi") listPagi.push(namaInput);
        else listSore.push(namaInput);

        const teksBungkusFinal = bungkusDataPeserta(listPagi, listSore);

        if (barisEksis) {
            // JIKA BARIS HARI SUDAH ADA, EDIT BARIS ITU MENGGUNAKAN .update() (DIJAMIN LOLOS DARI EROR 409 CONFLICT)
            const { error } = await supabaseClient
                .from('jadwal-gym')
                .update({ nama_peserta: teksBungkusFinal })
                .match({ hari: hariPilihan });
            if (error) throw error;
        } else {
            // JIKA HARI BELUM ADA SAMA SEKALI, BARU LAKUKAN INSERT
            const { error } = await supabaseClient
                .from('jadwal-gym')
                .insert([{ hari: hariPilihan, nama_peserta: teksBungkusFinal }]);
            if (error) throw error;
        }
        
        elDOM.inputNama.value = "";
        showToast(`Mantap! ${namaInput} berhasil masuk jadwal.`);
    } catch (err) {
        showToast("Gagal menyimpan ke database!", "error");
        console.error(err);
    }
}

// 9. CUSTOM MODAL CONFIRM & DELETE SATUAN
function initModalConfirm() {
    elDOM.btnModalCancel.addEventListener('click', () => {
        elDOM.customModal.classList.remove('active');
        pendingDeleteData = null;
    });

    elDOM.btnModalConfirm.addEventListener('click', async () => {
        if (pendingDeleteData) {
            const { nama, hari, shift } = pendingDeleteData;
            const dataSegar = await loadData();
            const barisEksis = dataSegar.find(row => row.hari === hari);

            if (barisEksis) {
                let listPagi = uraiDataPeserta(barisEksis.nama_peserta, "Pagi");
                let listSore = uraiDataPeserta(barisEksis.nama_peserta, "Sore");

                if (shift === "Pagi") {
                    listPagi = listPagi.filter(n => n.toLowerCase() !== nama.toLowerCase());
                } else {
                    listSore = listSore.filter(n => n.toLowerCase() !== nama.toLowerCase());
                }

                const teksBungkusFinal = bungkusDataPeserta(listPagi, listSore);

                if (listPagi.length === 0 && listSore.length === 0) {
                    await supabaseClient.from('jadwal-gym').delete().match({ hari: hari });
                } else {
                    await supabaseClient.from('jadwal-gym').update({ nama_peserta: teksBungkusFinal }).match({ hari: hari });
                }
                showToast(`Jadwal ${nama} berhasil dibatalkan.`);
            }
        }
        elDOM.customModal.classList.remove('active');
        pendingDeleteData = null;
    });
}

elDOM.scheduleContainer.addEventListener('click', (event) => {
    const tagPeserta = event.target.closest('.participant-tag');
    if (tagPeserta) {
        const nama = tagPeserta.getAttribute('data-nama');
        const hari = tagPeserta.getAttribute('data-hari');
        const shift = tagPeserta.getAttribute('data-shift');
        pendingDeleteData = { nama, hari, shift };
        elDOM.modalMessage.innerHTML = `Apakah yakin ingin menghapus nama <strong>${nama}</strong> dari jadwal <strong>${hari} Shift ${shift}</strong>?`;
        elDOM.customModal.classList.add('active');
    }
});

// 10. REALTIME & INIT TRIGGER
function setupRealtime() {
    supabaseClient
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal-gym' }, async () => {
            const dataTerbaru = await loadData();
            renderSchedule(dataTerbaru);
        })
        .subscribe();
}

async function initApp() {
    initModalConfirm();
    setupCalendar();
    setupRealtime();
    elDOM.tombolIkut.addEventListener('click', saveParticipant);
    elDOM.inputNama.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveParticipant(); });

    const dataAwal = await loadData();
    renderSchedule(dataAwal);
}

initApp();