const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
const clc = require("cli-color");
const moment = require("moment-timezone");

const setHarga = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        const input = ctx.message.text.split(" ");

        if (input.length <= 2) {
            return ctx.reply("Harap masukkan input dengan benar tidak boleh ada yang tertinggal.");
        }

        const price = parseInt(input[1]);
        if (isNaN(price)) {
            return ctx.reply("Harap masukkan harga dengan benar dan hanya angka!!");
        }

        const checkCode = db.prepare(`
            SELECT * FROM product_variants WHERE codeVariant = ?
        `).get(input[2]);
            console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Cek code variant ${input[2]} dengan harga ${price}`));
        if (!checkCode) {
            return ctx.reply("404 NOT FOUND || VARIANT TIDAK DI TEMUKAN");
        }

        db.prepare(`
            UPDATE product_variants SET price = ? WHERE codeVariant = ?
        `).run(price, input[2]);

        ctx.reply("*✅BERHASIL MELAKUKAN SET HARGA ✅*", {
            parse_mode: "Markdown",
        });
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND SET HARGA⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/setHarga.js  ${err.message}`));
    }
};

module.exports = setHarga;