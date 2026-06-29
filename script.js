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
    
    const rentangEl = document.getElementById('rentangTanggal');
    if (rentangEl) {
        rentangEl.innerText = `Periode Minggu Ini: ${hariSenin.toLocaleDateString('id-ID', opsiFormat)} s/d ${hariMinggu.toLocaleDateString('id-ID', opsiFormat)}`;
    }

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
    try {
        const { data, error } = await supabaseClient
            .from('jadwal-gym') // Menggunakan nama tabel strip sesuai database
            .select('*');

        if (error) {
            console.error("Gagal mengambil data:", error);
            return;
        }

        // Reset semua kolom nama di tabel menjadi "-" dulu sebelum diisi data baru
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
    } catch (err) {
        console.error("Terjadi error saat muat data:", err);
    }
}

// 4. Logika Tombol saat Diklik (Kirim Data ke Supabase dengan sistem UPSERT)
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

        const idTarget = `peserta-${hariPilihan}-${shiftPilihan}`;
        const kolomPeserta = document.getElementById(idTarget);
        let namaFinal = namaInput;

        if (kolomPeserta && kolomPeserta.innerText !== "-") {
            // Kalau sudah ada orang, gabungkan namanya dipisah koma
            namaFinal = kolomPeserta.innerText + ", " + namaInput;
        }

        try {
            // Menggunakan .upsert() dengan onConflict 'hari' agar otomatis menimpa jika Primary Key bertabrakan
            const { error } = await supabaseClient
                .from('jadwal-gym')
                .upsert(
                    [{ hari: hariPilihan, shift: shiftPilihan, nama_peserta: namaFinal }],
                    { onConflict: 'hari' }
                );

            if (error) {
                alert("Gagal menyimpan ke database, periksa koneksi!");
                console.error(error);
            } else {
                document.getElementById('inputNama').value = "";
                alert(`Mantap! ${namaInput} berhasil masuk database.`);
            }
        } catch (err) {
            console.error("Gagal mengirim data:", err);
        }
    });
}

// 5. Fitur Klik Nama di Tabel untuk Menghapus / Membatalkan
const tabelJadwal = document.querySelector('table');
if (tabelJadwal) {
    tabelJadwal.addEventListener('click', async function(event) {
        if (event.target.classList.contains('nama-peserta') && event.target.innerText !== "-") {
            const idKolom = event.target.id; 
            const bagianId = idKolom.split("-");
            const hariTarget = bagianId[1];
            const shiftTarget = bagianId[2];

            const konfirmasi = confirm(`Apakah kamu ingin menghapus semua nama di jadwal ${hariTarget} shift ${shiftTarget}?`);
            
            if (konfirmasi) {
                try {
                    // Hapus baris data tersebut di database Supabase
                    const { error } = await supabaseClient
                        .from('jadwal-gym')
                        .delete()
                        .match({ hari: hariTarget, shift: shiftTarget });

                    if (error) {
                        alert("Gagal menghapus data dari database!");
                        console.error(error);
                    } else {
                        alert(`Jadwal ${hariTarget} ${shiftTarget} berhasil dikosongkan.`);
                    }
                } catch (err) {
                    console.error("Gagal menghapus data:", err);
                }
            }
        }
    });
}

// 6. Fitur Sinkronisasi Real-time Otomatis
supabaseClient
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal-gym' }, () => {
        muatDataDariDatabase();
    })
    .subscribe();

// Jalankan fungsi awal saat web dibuka
aturKalenderOtomatis();
muatDataDariDatabase();