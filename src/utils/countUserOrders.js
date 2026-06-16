const { getDatabase } = require('../database/connect');
const clc = require("cli-color");
const moment = require('moment-timezone');

async function countUserOrders(telegramId) {
    try {
        const db = getDatabase(); // Ensure db is initialized
        const transactionData = db.prepare(`
            SELECT orderQuantity FROM order_transactions 
            WHERE telegramUserId = ? AND isSuccess = 1 AND isCanceled = 0
        `).all(telegramId);

        const count = transactionData.reduce((total, data) => total + data.orderQuantity, 0);

        return count;
    } catch (err) {
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file utils/countUserOrders.js: ${err.message}`));
    }
}

module.exports = countUserOrders;