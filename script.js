// 1. Ambil tombol update dari HTML berdasarkan ID-nya
const tombol = document.getElementById('tombolUpdate');

// 2. Beritahu tombol untuk melakukan sesuatu saat diklik
tombol.addEventListener('click', function() {
    // Ambil data yang sedang diketik atau dipilih di dalam form
    const hariPilihan = document.getElementById('pilihHari').value;
    const tempatBaru = document.getElementById('inputTempat').value;
    const jamBaru = document.getElementById('inputJam').value;

    // Validasi sederhana: Pastikan inputan tidak kosong
    if (tempatBaru === "" || jamBaru === "") {
        alert("Silakan isi tempat dan jam gym terlebih dahulu!");
        return; // Hentikan proses jika kosong
    }

    // 3. Cari seluruh baris di dalam tabel kita
    const semuaBaris Tabel = document.querySelectorAll('table tbody tr');

    // 4. Periksa baris mana yang harinya cocok dengan pilihan di form
    semuaBarisTabel.forEach(function(baris) {
        // Ambil teks hari dari kolom pertama (index 0)
        const teksHariDiTabel = baris.cells[0].innerText;

        // Jika harinya cocok, ganti isinya dengan data dari form
        if (teksHariDiTabel === hariPilihan) {
            baris.cells[1].innerText = tempatBaru; // Ganti tempat gym
            baris.cells[2].innerText = jamBaru;    // Ganti jam gym
        }
    });

    // 5. Kosongkan kembali form input setelah sukses update biar rapi
    document.getElementById('inputTempat').value = "";
    document.getElementById('inputJam').value = "";
    
    alert("Jadwal hari " + hariPilihan + " berhasil diperbarui!");
});