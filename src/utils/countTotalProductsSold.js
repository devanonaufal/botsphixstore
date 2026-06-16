const { getDatabase } = require('../database/connect');
const clc = require("cli-color");
const moment = require('moment-timezone');

async function countTotalProductsSold() {
    try {
        const db = getDatabase();
        const transactionData = db.prepare(`
            SELECT orderQuantity FROM order_transactions 
            WHERE isSuccess = 1 AND isCanceled = 0
        `).all();

        const totalSold = transactionData.reduce((total, data) => total + data.orderQuantity, 0);

        return totalSold;
    } catch (err) {
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file utils/countTotalProductsSold.js: ${err.message}`));
        return 0;
    }
}

module.exports = countTotalProductsSold;
