
function createStockVariantsTable(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS stock_data_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codeVariant TEXT NOT NULL,
            dataStock TEXT NOT NULL,
            email TEXT,
            password TEXT,
            profile TEXT,
            pin TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Add new columns if they don't exist (for existing databases)
    try { db.prepare(`ALTER TABLE stock_data_variants ADD COLUMN email TEXT`).run(); } catch (e) {}
    try { db.prepare(`ALTER TABLE stock_data_variants ADD COLUMN password TEXT`).run(); } catch (e) {}
    try { db.prepare(`ALTER TABLE stock_data_variants ADD COLUMN profile TEXT`).run(); } catch (e) {}
    try { db.prepare(`ALTER TABLE stock_data_variants ADD COLUMN pin TEXT`).run(); } catch (e) {}
}

module.exports = { createStockVariantsTable };