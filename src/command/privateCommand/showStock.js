const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
const clc = require("cli-color");
const moment = require("moment-timezone");

const showStock = async (ctx) => {
    try {
            // Delete previous message if it's a callback query
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                try {
                    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                } catch (e) {
                    console.log(clc.yellow("[ WARNING ]") + ` Gagal menghapus pesan: ${e.message}`);
                }
            }

            const allStockData = db.prepare(`
                SELECT pv.codeVariant, pv.name AS variantName, p.name AS productName, COUNT(sdv.id) AS stockCount
                FROM product_variants pv
                LEFT JOIN products p ON pv.code = p.code
                LEFT JOIN stock_data_variants sdv ON pv.codeVariant = sdv.codeVariant
                GROUP BY pv.codeVariant, pv.name
                ORDER BY pv.code ASC, pv.codeVariant ASC
            `).all();

            let text = `Informasi Stok\n- Tanggal: ${moment().tz('Asia/Jakarta').format('M/D/YYYY, HH:mm:ss A')}\n\n`;

            allStockData.forEach((stock, index) => {
                text += `${index + 1}. ${stock.productName} | ${stock.variantName} ➔ ${stock.stockCount}x\n`;
            });

            await ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔙 Kembali ke Menu Awal', callback_data: 'back-to-main' }
                        ],
                        [
                            { text: '🏷 Menu List Produk', callback_data: 'list_product' }
                        ]
                    ]
                }
            });

    } catch (err) {
        ctx.reply("⚠️SOMETHING ERROR IN COMMAND SHOWSTOCK⚠️");
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/showStock.js  ${err.message}`));
    }
};

const refreshStock = async (ctx) => {
    try {
        const allStockData = db.prepare(`
            SELECT pv.codeVariant, pv.name AS variantName, p.name AS productName, COUNT(sdv.id) AS stockCount
            FROM product_variants pv
            LEFT JOIN products p ON pv.code = p.code
            LEFT JOIN stock_data_variants sdv ON pv.codeVariant = sdv.codeVariant
            GROUP BY pv.codeVariant, pv.name
            ORDER BY pv.code ASC, pv.codeVariant ASC
        `).all();

        let text = `Informasi Stok (Diperbarui)\n- Tanggal: ${moment().tz('Asia/Jakarta').format('M/D/YYYY, HH:mm:ss A')}\n\n`;

        allStockData.forEach((stock, index) => {
            text += `${index + 1}. ${stock.productName} | ${stock.variantName} ➔ ${stock.stockCount}x\n`;
        });

        await ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🔙 Kembali ke Menu Awal', callback_data: 'back-to-main' }
                    ],
                    [
                        { text: '🏷 Menu List Produk', callback_data: 'list_product' }
                    ]
                ]
            }
        });
    } catch (err) {
        ctx.reply("⚠️SOMETHING ERROR IN COMMAND REFRESH STOCK⚠️");
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/showStock.js  ${err.message}`));
    }
};

module.exports = { showStock, refreshStock };