
function createProductVariantsTable(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS product_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code INTEGER NOT NULL,
            codeVariant TEXT NOT NULL,
            descriptionVariant TEXT NOT NULL,
            price REAL NOT NULL,
            keteranganVariant TEXT NOT NULL,
            terms TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Add terms column if it doesn't exist (for existing databases)
    try {
        db.prepare(`ALTER TABLE product_variants ADD COLUMN terms TEXT`).run();
    } catch (e) {
        // Column already exists, ignore
    }
}

module.exports = { createProductVariantsTable };