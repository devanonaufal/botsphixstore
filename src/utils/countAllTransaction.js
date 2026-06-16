const { getDatabase } = require('../database/connect');
const clc = require("cli-color");
const moment = require('moment-timezone');

async function countAllTransaction() {
    try {
        const db = getDatabase(); // Ensure db is initialized
        const transactionData = db.prepare(`
            SELECT totalPrice FROM order_transactions 
            WHERE isSuccess = 1 AND isCanceled = 0
        `).all();

        const profit = transactionData.reduce((total, data) => {
            return total + data.totalPrice;
        }, 0);

        return [transactionData.length, profit];
    } catch (err) {
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file utils/countAllTransaction.js: ${err.message}`));
    }
}

module.exports = countAllTransaction;