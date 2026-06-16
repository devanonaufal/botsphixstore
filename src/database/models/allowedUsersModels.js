function createAllowedUsersTable(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS allowed_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idTelegram INTEGER UNIQUE,
            usernameTelegram TEXT,
            approved INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

module.exports = { createAllowedUsersTable };
