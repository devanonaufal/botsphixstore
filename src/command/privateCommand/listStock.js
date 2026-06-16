const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

const listStock = async (ctx) => {
    try {
        const db = getDatabase();

        if (ctx.from.id != process.env.WHITELIST_ID) {
            return;
        }

        const allStock = db.prepare(`
            SELECT sdv.*, pv.name AS variantName, pv.code AS productCode, p.name AS productName, p.id AS productId
            FROM stock_data_variants sdv
            LEFT JOIN product_variants pv ON sdv.codeVariant = pv.codeVariant
            LEFT JOIN products p ON pv.code = p.code
            ORDER BY p.code ASC, pv.codeVariant ASC, sdv.id ASC
        `).all();

        if (allStock.length === 0) {
            return ctx.reply("*❗Belum ada stock tersedia.*", { parse_mode: "Markdown" });
        }

        let text = "*📋 LIST STOCK*\n\n";

        const escapeMd = (t) => String(t).replace(/[_*[\]()~`>#+=|{}.!-]/g, m => `\\${m}`);

        for (let i = 0; i < allStock.length; i++) {
            const stock = allStock[i];
            const email = escapeMd(stock.email || 'N/A');
            const password = escapeMd(stock.password || 'N/A');
            const profile = escapeMd(stock.profile || 'N/A');
            const pin = escapeMd(stock.pin || 'N/A');

            text += `${i + 1}\\. ID Stock : ${escapeMd(String(stock.id))}\n`;
            text += `    Nama Product : ${escapeMd(stock.productName || 'Unknown')}\n`;
            text += `    Jenis Variant : ${escapeMd(stock.variantName || stock.codeVariant)}\n`;
            text += `    Detail Stock\n`;
            text += `    Email: ${email}\n`;
            text += `    Password: ${password}\n`;
            text += `    Profil: ${profile}\n`;
            text += `    PIN: ${pin}\n\n`;
        }

        text += `_Total: ${allStock.length} stock_`;

        // Split long messages if needed
        if (text.length > 4000) {
            const chunks = [];
            let remaining = text;
            while (remaining.length > 0) {
                if (remaining.length <= 4000) {
                    chunks.push(remaining);
                    break;
                }
                const splitAt = remaining.lastIndexOf('\n', 4000);
                chunks.push(remaining.substring(0, splitAt));
                remaining = remaining.substring(splitAt + 1);
            }
            for (const chunk of chunks) {
                await ctx.reply(chunk, { parse_mode: "MarkdownV2" });
            }
        } else {
            await ctx.reply(text, { parse_mode: "MarkdownV2" });
        }
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND LIST STOCK⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/listStock.js :  ${err.message}`));
    }
};

module.exports = listStock;
