/**
 * SCRIPT FIX DATABASE COLUMN
 * Jalankan SEKALI di server: node fix_db_column.js
 * Hapus file ini setelah selesai dijalankan!
 */
const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('=== MEMPERBAIKI STRUKTUR DATABASE ===\n');

try {
    // Mengecek apakah kolom paymentKitaRefId sudah ada
    const cols = db.prepare('PRAGMA table_info(order_transactions)').all();
    const hasPaymentKita = cols.some(c => c.name === 'paymentKitaRefId');
    const hasSaweria = cols.some(c => c.name === 'trxSaweriaId');

    if (hasPaymentKita) {
        console.log('✅ Database sudah benar. Kolom paymentKitaRefId sudah ada.');
    } else if (hasSaweria) {
        console.log('⚠️ Ditemukan kolom lama (trxSaweriaId). Sedang mengubah nama kolom...');
        db.prepare('ALTER TABLE order_transactions RENAME COLUMN trxSaweriaId TO paymentKitaRefId').run();
        console.log('✅ Berhasil mengubah trxSaweriaId menjadi paymentKitaRefId!');
    } else {
        console.log('⚠️ Kolom referensi pembayaran tidak ditemukan, menambahkan kolom baru...');
        db.prepare('ALTER TABLE order_transactions ADD COLUMN paymentKitaRefId TEXT NOT NULL DEFAULT ""').run();
        console.log('✅ Berhasil menambahkan kolom paymentKitaRefId!');
    }
} catch (error) {
    console.error('❌ Error saat memperbaiki database:', error.message);
}

console.log('\n✅ Proses selesai! Hapus file ini dari server sekarang (rm fix_db_column.js).');
db.close();
