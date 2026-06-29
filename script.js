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

// 4. SETUP CALENDAR (Intl.DateTimeFormat)
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

// 6. RENDER CARD JADWAL MODERN
function renderSchedule(dataList) {
    const listTanggal = setupCalendar();
    elDOM.scheduleContainer.innerHTML = ""; 

    DAFTAR_HARI.forEach((hari, indeks) => {