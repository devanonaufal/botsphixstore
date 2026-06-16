const Database = require('better-sqlite3');
const clc = require("cli-color");
const moment = require('moment-timezone');
const { createTransactionTable } = require('./models/transactionModels');
const { createStockVariantsTable } = require('./models/stockModels');
const { createProductVariantsTable } = require('./models/productsVariantModels');
const { createProductsTable } = require('./models/productsModels');
const { createBroadcastDataTable } = require('./models/broadcastModels');
const { createSettingTable } = require('./models/settingModels');
const { createAllowedUsersTable } = require('./models/allowedUsersModels');

let db;

function connectDatabase() {
    try {
        db = new Database('./database.sqlite');
        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(" Success connect to SQLite database"));
        initializeTables(db); // Pass db instance to initializeTables
    } catch (error) {
        console.clear();
        console.log("SQLite connection error:", error);
        process.exit();
    }
}

function initializeTables(db) {
    createTransactionTable(db);
    createStockVariantsTable(db);
    createProductVariantsTable(db);
    createProductsTable(db);
    createBroadcastDataTable(db);
    createSettingTable(db);
    createAllowedUsersTable(db);
}

function getDatabase() {
    if (!db) {
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.yellow(" Database is not connected. Please call connectDatabase first."));
        throw new Error("Database is not connected.");
    }
    return db;
}

module.exports = { connectDatabase, getDatabase };