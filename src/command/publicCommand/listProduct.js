const clc = require('cli-color');
const moment = require('moment-timezone');
const Database = require('better-sqlite3');
const { Input, Markup } = require('telegraf');
 const db = new Database('./database.sqlite');// Ensure db is initialized
const listProduct = async (ctx) => {
    try {
        const from = ctx.from;
        const allProduct = db.prepare(`
            SELECT * FROM products
        `).all();

        // Delete previous message if it's a callback query
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
            try {
                await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
            } catch (e) {
                console.log(clc.yellow("[ WARNING ]") + ` Gagal menghapus pesan: ${e.message}`);
            }
        }

        if (allProduct.length > 0) {
            let productMessage = "╭──────〔 LIST PRODUK 〕─ ";

            let i = 0;
            const inlineButtons = [];
            let row = [];

            for (const data of allProduct) {
                i++;
                productMessage += `\n┊ [ ${i} ] ${data.name.toUpperCase()}`;
                row.push(Markup.button.callback(`${i}`, `product-${data.code}`));
                if (row.length >= 3) {
                    inlineButtons.push(row);
                    row = [];
                }
            }
            if (row.length > 0) {
                inlineButtons.push(row);
            }
            productMessage += "\n╰─────────────────╯";

            inlineButtons.push([Markup.button.callback('🛒 Stock', 'show_stock')]);
            inlineButtons.push([Markup.button.callback('🎟 Best Product', 'best_product'), Markup.button.callback('🏅 Top Buyer', 'top_buyer')]);

            await ctx.telegram.sendPhoto(from.id, Input.fromLocalFile('src/img/poster.png'), {
                caption: productMessage,
                reply_markup: { inline_keyboard: inlineButtons }
            });
        } else {
            const message = "⚠️ BELUM ADA PRODUCT ⚠️";

            await ctx.telegram.sendPhoto(from.id, Input.fromLocalFile('src/img/poster.png'), {
                caption: message,
                disable_web_page_preview: "true",
            });
        }

    } catch (err) {
        ctx.reply("⚠️SOMETHING ERROR TO BACK⚠️");
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/listProduct.js: ${err.message}`));
    }
};

module.exports = listProduct;