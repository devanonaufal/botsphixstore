const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

const delProductVariant = async (ctx) => {
    try {
        const db = getDatabase(); // Ensure db is initialized

        if (ctx.from.id != process.env.WHITELIST_ID) {
            return;
        }

        const code = ctx.message.text.split(" ");
        const cekProduk = db.prepare(`
            SELECT * FROM product_variants WHERE codeVariant = ?
        `).get(code[1]);

        if (!cekProduk) {
            await ctx.reply("*❗Code yang kamu masukkan tidak di temukan*", {
                parse_mode: "Markdown",
            });
            return;
        }

        db.prepare(`
            DELETE FROM product_variants WHERE codeVariant = ?
        `).run(code[1]);

        await ctx.reply(`*Berhasil menghapus product variant dengan code ${code[1].toUpperCase()}✅*`, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND DEL PRODUCT VARIANT⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/delProduct.js :  ${err.message}`));
    }
};

module.exports = delProductVariant;