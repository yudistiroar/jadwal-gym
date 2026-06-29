// 1. Konfigurasi Koneksi Supabase (Project ID & Anon Key milik Yudis)
const SUPABASE_URL = "https://usavbkcbyybtmdgsvvxs.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXZia2NieXlidG1kZ3N2dnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTg0NjgsImV4cCI6MjA5ODI5NDQ2OH0.QLNBsyIzAYLhK74Wku0XuWaQDD2i871pyWtiIOgnyS4"; 

// Buka gerbang koneksi otomatis
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Fungsi Kalender Otomatis
function aturKalenderOtomatis() {
    const hariIni = new Date();
    const nomorHariIni = hariIni.getDay(); 
    const selisihKeSenin = nomorHariIni === 0 ? -6 : 1 - nomorHariIni;
    
    const hariSenin = new Date(hariIni);
    hariSenin.setDate(hariIni.getDate() + selisihKeSenin);
    
    const daftarNamaHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const hariMinggu = new Date(hariSenin);
    hariMinggu.setDate(hariSenin.getDate() + 6);
    
    const opsiFormat = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('rentangTanggal').innerText = 
        `Periode Minggu Ini: ${hariSenin.toLocaleDateString('id-ID', opsiFormat)} s/d ${hariMinggu.toLocaleDateString('id-ID', opsiFormat)}`;

    daftarNamaHari.forEach((namaHari, indeks) => {
        const tanggalTarget = new Date(hariSenin);
        tanggalTarget.setDate(hariSenin.getDate() + indeks);
        
        const elemenTgl = document.getElementById(`tgl-${namaHari}`);
        if (elemenTgl) {
            elemenTgl.innerHTML = `${namaHari}<br><small style="color: #a4b0be;">${tanggalTarget.getDate()}/${tanggalTarget.getMonth() + 1}</small>`;
        }
    });
}

// 3. Fungsi Ambil Data dari Supabase dan Tampilkan ke Tabel HTML
async function muatDataDariDatabase() {
    const { data, error } = await supabaseClient
        .from('jadwal-gym') // Sudah pakai strip sesuai image_afde7a.png
        .select('*');

    if (error) {
        console.error("Gagal mengambil data:", error);
        return;
    }

    // Reset semua kolom nama di tabel menjadi "-" dulu
    document.querySelectorAll('.nama-peserta').forEach(td => td.innerText = "-");

    // Isi data hasil tarikan dari database ke dalam tabel HTML
    if (data) {
        data.forEach(row => {
            const idTarget = `peserta-${row.hari}-${row.shift}`;
            const kolom = document.getElementById(idTarget);
            if (kolom) {
                kolom.innerText = row.nama_peserta;
            }
        });
    }
}

// 4. Logika Tombol saat Diklik (Kirim Data ke Supabase)
const tombolIkut = document.getElementById('tombolIkut');
if (tombolIkut) {
    tombolIkut.addEventListener('click', async function() {
        const hariPilihan = document.getElementById('pilihHari').value;
        const shiftPilihan = document.getElementById('pilihShift').value;
        const namaInput = document.getElementById('inputNama').value.trim();

        if (namaInput === "") {
            alert("Masukkan nama kamu dulu, bro!");
            return;
        }

        // Cek dulu apakah di hari & shift itu sudah ada orang yang daftar
        const idTarget = `peserta-${hariPilihan}-${shiftPilihan}`;
        const kolomPeserta = document.getElementById(idTarget);
        let namaFinal = namaInput;

        if (kolomPeserta && kolomPeserta.innerText !== "-") {
            // Kalau sudah ada orang, gabungkan namanya dipisah koma
            namaFinal = kolomPeserta.innerText + ", " + namaInput;
        }

        // Hapus data lama di shift tersebut (jika ada), lalu masukkan yang baru
        await supabaseClient
            .from('jadwal-gym')
            .delete()
            .match({ hari: hariPilihan, shift: shiftPilihan });

        const { error } = await supabaseClient
            .from('jadwal-gym')
            .insert([{ hari: hariPilihan, shift: shiftPilihan, nama_peserta: namaFinal }]);

        if (error) {
            alert("Gagal menyimpan ke database, periksa koneksi!");
            console.error(error);
        } else {
            document.getElementById('inputNama').value = "";
            alert(`Mantap! ${namaInput} berhasil masuk database.`);
        }
    });
}

// 5. Fitur Sinkronisasi Real-time Otomatis
supabaseClient
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal-gym' }, () => {
        muatDataDariDatabase();
    })
    .subscribe();

// Jalankan fungsi awal saat web dibuka
aturKalenderOtomatis();
muatDataDariDatabase();