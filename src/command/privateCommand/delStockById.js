const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

const delStockById = async (ctx) => {
    try {
        const db = getDatabase();

        if (ctx.from.id != process.env.WHITELIST_ID) {
            return;
        }

        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.reply("*❗Gunakan: /delstockid <id stock>*\n\nContoh: `/delstockid 5`", {
                parse_mode: "Markdown",
            });
        }

        const stockId = parseInt(args[1]);
        if (isNaN(stockId)) {
            return ctx.reply("*❗ID stock harus berupa angka!*", { parse_mode: "Markdown" });
        }

        const stock = db.prepare(`SELECT * FROM stock_data_variants WHERE id = ?`).get(stockId);

        if (!stock) {
            return ctx.reply(`*❗Stock dengan ID ${stockId} tidak ditemukan!*`, { parse_mode: "Markdown" });
        }

        db.prepare(`DELETE FROM stock_data_variants WHERE id = ?`).run(stockId);

        await ctx.reply(
            `*✅ Berhasil menghapus stock ID ${stockId}*\n` +
            `Code Variant: ${stock.codeVariant}\n` +
            `Data: ${stock.dataStock}`,
            { parse_mode: "Markdown" }
        );
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND DELSTOCKID⚠️*", { parse_mode: "Markdown" });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/delStockById.js :  ${err.message}`));
    }
};

module.exports = delStockById;
