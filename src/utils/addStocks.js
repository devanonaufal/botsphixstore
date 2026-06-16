const { db } = require('../database/connect');
const moment = require('moment-timezone');
const clc = require('cli-color');

const addStocks = async (text, code) => {
    try {
        // Pisahkan teks berdasarkan newline (\n)
        const products = text.split("\n").map(product => product.trim()).filter(product => product);

        const insertStock = db.prepare(`
            INSERT INTO stock_data_variants (codeVariant, dataStock) VALUES (?, ?)
        `);

        for (const product of products) {
            insertStock.run(code, product);
        }

        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Stocks added successfully`));
        return;
    } catch (err) {
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error add stock : ${err.message}`));
    }
};

module.exports = addStocks;