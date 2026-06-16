const db = require('better-sqlite3');
const database = new db('./database.sqlite');

// Create table for storing sticker information
const createStickerTable = `
CREATE TABLE IF NOT EXISTS stickers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fileId TEXT NOT NULL
);
`;
database.exec(createStickerTable);

const createSettingTable = (db) => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            term_conditions TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Insert default settings if the table is empty
    const term_conditions = `
1. Pembayaran dilakukan sebelum pesanan diproses.
2. Pesanan yang sudah dibayar tidak dapat dibatalkan.
3. Pastikan data pesanan sudah benar sebelum melakukan pembayaran.
4. Bot tidak bertanggung jawab atas kesalahan input data oleh pembeli.
5. Layanan aktif 24 jam, namun proses bisa mengalami keterlambatan saat gangguan sistem.
6. Dengan menggunakan layanan ini, Anda dianggap telah menyetujui semua syarat & ketentuan.
    `;
    db.prepare(`
        INSERT INTO settings (term_conditions)
        SELECT ? WHERE NOT EXISTS (SELECT 1 FROM settings)
    `).run(term_conditions);
}
module.exports = { createSettingTable };