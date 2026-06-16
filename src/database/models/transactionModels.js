
function createTransactionTable(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS order_transactions (
            transactionId TEXT PRIMARY KEY,
            telegramUserId INTEGER NOT NULL,
            productCode TEXT NOT NULL,
            paymentKitaRefId TEXT NOT NULL,
            formattedDate TEXT NOT NULL,
            feeTax REAL NOT NULL,
            orderQuantity INTEGER NOT NULL CHECK(orderQuantity >= 1),
            totalPrice REAL NOT NULL CHECK(totalPrice >= 0),
            keteranganVariant TEXT NOT NULL,
            orderData TEXT NOT NULL,
            chatId TEXT NOT NULL,
            messageId TEXT NOT NULL,
            isCanceled INTEGER NOT NULL DEFAULT 0,
            isSuccess INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

module.exports = { createTransactionTable };