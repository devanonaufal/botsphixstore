const { getDatabase } = require('../database/connect');
const clc = require("cli-color");
const moment = require('moment-timezone');

async function countTotalUsers() {
    try {
        const db = getDatabase();
        const userData = db.prepare(`
            SELECT DISTINCT idTelegram FROM broadcast_data
        `).all();

        return userData.length;
    } catch (err) {
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file utils/countTotalUsers.js: ${err.message}`));
        return 0;
    }
}

module.exports = countTotalUsers;
