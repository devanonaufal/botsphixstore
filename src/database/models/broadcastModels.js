function createBroadcastDataTable(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS broadcast_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usernameTelegram TEXT,
            idTelegram INTEGER,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

module.exports = { createBroadcastDataTable };