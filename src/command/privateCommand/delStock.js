const { getDatabase } = require('../../database/connect');
const moment = require('moment-timezone');
const clc = require('cli-color');

const delStock = async (ctx) => {
    try {
        const db = getDatabase(); // Ensure db is initialized
        const idTelegram = ctx.from.id;

        if (process.env.WHITELIST_ID == idTelegram) {
            const input = ctx.message.text.split(" ");
            const textReply = ctx.message?.reply_to_message?.text ?? "";
            const checkCode = db.prepare(`
                SELECT * FROM product_variants WHERE codeVariant = ?
            `).get(input[1]);

            if (!checkCode) {
                return ctx.reply("*⚠️ CODE VARIANT PRODUCT TIDAK DI TEMUKAN ⚠️*", {
                    parse_mode: "Markdown",
                });
            } else if (textReply === "") {
                return ctx.reply("*⚠️ HARAP REPLY TEXT STOCK NYA AGAR BISA DI HAPUS ⚠️*", {
                    parse_mode: "Markdown",
                });
            }

            const stocks = textReply
                .split("\n")
                .map(product => product.trim())
                .filter(product => product);

            const deleteStock = db.prepare(`
                DELETE FROM stock_data_variants WHERE dataStock = ? AND codeVariant = ?
            `);

            let i = 0;
            for (const stock of stocks) {
                const result = deleteStock.run(stock, input[1]);
                if (result.changes > 0) {
                    i++;
                }
            }

            ctx.reply(`*✅ BERHASIL MENGHAPUS STOCK | TOTAL STOCK YANG DI HAPUS : ${i} ✅*`, {
                parse_mode: "Markdown",
            });
        }
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND DELSTOCK⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/delStock.js  ${err.message}`));
    }
};

module.exports = delStock;