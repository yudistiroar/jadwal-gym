// 8. ACTION: SIMPAN PESERTA BARU (MENGGUNAKAN LOGIKA COMPOSITE KEY ANTI-TABRAKAN)
async function saveParticipant() {
    const namaInput = elDOM.inputNama.value.trim();
    const hariPilihan = elDOM.pilihHari.value;
    const shiftPilihan = elDOM.pilihShift.value;

    if (namaInput.length < 2 || namaInput.length > 30) {
        showToast("Nama peserta harus antara 2 sampai 30 karakter, bro!", "error");
        return;
    }

    try {
        // Ambil data segar untuk validasi kapasitas & nama ganda
        const dataSegar = await loadData();

        // Ambil baris spesifik untuk hari dan shift ini
        const rowLama = dataSegar.find(row => row.hari === hariPilihan && row.shift === shiftPilihan);
        
        // Pecah string nama berdasarkan koma (jika ada nama lain di shift tersebut)
        let arrayNamaLama = rowLama && rowLama.nama_peserta ? rowLama.nama_peserta.split(',').map(n => n.trim()).filter(n => n !== "") : [];

        if (arrayNamaLama.length >= MAX_CAPACITY) {
            showToast(`Slot Shift ${shiftPilihan} hari ${hariPilihan} sudah penuh!`, "error");
            return;
        }

        if (arrayNamaLama.some(n => n.toLowerCase() === namaInput.toLowerCase())) {
            showToast("Nama ini sudah terdaftar di shift tersebut!", "error");
            return;
        }

        // Gabungkan nama baru ke daftar yang sudah ada
        arrayNamaLama.push(namaInput);
        const namaFinalString = arrayNamaLama.join(', ');

        // Kirim pakai .upsert() ke Supabase. Karena kuncinya sudah digabung (hari + shift),
        // Supabase otomatis memperbarui baris tersebut tanpa eror 409 lagi!
        const { error } = await supabaseClient
            .from('jadwal-gym')
            .upsert([{ hari: hariPilihan, shift: shiftPilihan, nama_peserta: namaFinalString }]);

        if (error) throw error;
        
        elDOM.inputNama.value = "";
        showToast(`Mantap! ${namaInput} berhasil masuk jadwal.`);
    } catch (err) {
        showToast("Gagal menyimpan ke database!", "error");
        console.error(err);
    }
}