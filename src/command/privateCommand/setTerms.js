const { getDatabase } = require('../../database/connect');
const moment = require('moment-timezone');
const clc = require('cli-color');

const setTerms = async (ctx) => {
    try {
        const db = getDatabase();
        const idTelegram = ctx.from.id;

        if (process.env.WHITELIST_ID == idTelegram) {
            const input = ctx.message.text.split(" ");
            const textReply = ctx.message?.reply_to_message?.text ?? "";

            if (textReply === "") {
                return ctx.reply("⚠️ HARAP REPLY PESAN SYARAT & KETENTUAN YANG BARU ⚠️\n\nPenggunaan:\n/setterms {codeVariant} - reply pesan SnK untuk variant tertentu\n/setterms - reply pesan SnK untuk default (semua variant)", {
                    parse_mode: "Markdown",
                });
            }

            if (input[1]) {
                // Set terms for specific variant
                const codeVariant = input[1];
                const checkVariant = db.prepare(`
                    SELECT * FROM product_variants WHERE codeVariant = ?
                `).get(codeVariant);

                if (!checkVariant) {
                    return ctx.reply("⚠️ VARIANT TIDAK DITEMUKAN ⚠️", {
                        parse_mode: "Markdown",
                    });
                }

                db.prepare(`
                    UPDATE product_variants SET terms = ?, updatedAt = CURRENT_TIMESTAMP WHERE codeVariant = ?
                `).run(textReply, codeVariant);

                ctx.reply(`✅ BERHASIL UPDATE SYARAT & KETENTUAN UNTUK VARIANT ${codeVariant.toUpperCase()}`, {
                    parse_mode: "Markdown",
                });
                console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Terms & conditions updated for variant ${codeVariant}`));
            } else {
                // Set default terms in settings
                db.prepare(`
                    UPDATE settings SET term_conditions = ?, updatedAt = CURRENT_TIMESTAMP
                `).run(textReply);

                ctx.reply("✅ BERHASIL UPDATE SYARAT & KETENTUAN DEFAULT", {
                    parse_mode: "Markdown",
                });
                console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Default terms & conditions updated by admin`));
            }
        }
    } catch (err) {
        ctx.reply("⚠️SOMETHING ERROR IN COMMAND SETTERMS⚠️", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/setTerms.js  ${err.message}`));
    }
};

module.exports = setTerms;
