// Function untuk mengatur tanggal otomatis dari hari Senin sampai Minggu
function aturKalenderOtomatis() {
    const hariIni = new Date();
    const nomorHariIni = hariIni.getDay(); // 0 = Minggu, 1 = Senin, 2 = Selasa, dst.
    
    // Hitung jarak menuju hari Senin di minggu ini
    const selisihKeSenin = nomorHariIni === 0 ? -6 : 1 - nomorHariIni;
    
    const hariSenin = new Date(hariIni);
    hariSenin.setDate(hariIni.getDate() + selisihKeSenin);
    
    const daftarNamaHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    
    // Tulis Rentang Tanggal di Subtitle Atas Website
    const hariMinggu = new Date(hariSenin);
    hariMinggu.setDate(hariSenin.getDate() + 6);
    
    const opsiFormat = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('rentangTanggal').innerText = 
        `Periode Minggu Ini: ${hariSenin.toLocaleDateString('id-ID', opsiFormat)} s/d ${hariMinggu.toLocaleDateString('id-ID', opsiFormat)}`;

    // Masukkan tanggal otomatis ke tiap baris kolom tabel Hari
    daftarNamaHari.forEach((namaHari, indeks) => {
        const tanggalTarget = new Date(hariSenin);
        tanggalTarget.setDate(hariSenin.getDate() + indeks);
        
        const elemenTgl = document.getElementById(`tgl-${namaHari}`);
        if (elemenTgl) {
            const tanggalAngka = tanggalTarget.getDate();
            const bulanAngka = tanggalTarget.getMonth() + 1; // Bulan dimulai dari 0
            elemenTgl.innerHTML = `${namaHari}<br><small style="color: #a4b0be;">${tanggalAngka}/${bulanAngka}</small>`;
        }
    });
}

// Jalankan fungsi kalender otomatis begitu website dibuka
aturKalenderOtomatis();

// Logika Tombol Konfirmasi Ikut Gym
const tombolIkut = document.getElementById('tombolIkut');

tombolIkut.addEventListener('click', function() {
    const hariPilihan = document.getElementById('pilihHari').value;
    const shiftPilihan = document.getElementById('pilihShift').value;
    const namaInput = document.getElementById('inputNama').value.trim();

    // Validasi input nama
    if (namaInput === "") {
        alert("Masukkan nama kamu dulu, bro!");
        return;
    }

    // Cari ID target kolom peserta (Contoh: peserta-Senin-Pagi)
    const idTarget = `peserta-${hariPilihan}-${shiftPilihan}`;
    const kolomPeserta = document.getElementById(idTarget);

    if (kolomPeserta) {
        // Jika kolom masih kosong (-), ganti dengan nama baru. 
        // Jika sudah ada isinya, tambahkan nama baru di belakangnya dipisah koma.
        if (kolomPeserta.innerText === "-") {
            kolomPeserta.innerText = namaInput;
        } else {
            kolomPeserta.innerText = kolomPeserta.innerText + ", " + namaInput;
        }
        
        // Kosongkan form ketikan setelah sukses memasukkan nama
        document.getElementById('inputNama').value = "";
        alert(`Mantap! ${namaInput} berhasil gabung di shift ${shiftPilihan} hari ${hariPilihan}.`);
    }
});