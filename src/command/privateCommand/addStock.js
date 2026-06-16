const { getDatabase } = require('../../database/connect');
const moment = require('moment-timezone');
const clc = require('cli-color');

const addStock = async (ctx) => {
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
                return ctx.reply("*⚠️ HARAP REPLY TEXT STOCK NYA AGAR BISA DI TAMBAHKAN ⚠️*\n\nFormat:\nEmail: {email}\nPassword: {password}\nProfil: {profil}\nPIN: {pin}", {
                    parse_mode: "Markdown",
                });
            }

            // Parse account details from text
            const lines = textReply.split('\n');
            let email = '';
            let password = '';
            let profile = '';
            let pin = '';

            lines.forEach(line => {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('email:')) {
                    email = line.split(':')[1]?.trim() || '';
                } else if (lowerLine.includes('password:')) {
                    password = line.split(':')[1]?.trim() || '';
                } else if (lowerLine.includes('profil:')) {
                    profile = line.split(':')[1]?.trim() || '';
                } else if (lowerLine.includes('pin:')) {
                    pin = line.split(':')[1]?.trim() || '';
                }
            });

            const insertStock = db.prepare(`
                INSERT INTO stock_data_variants (codeVariant, dataStock, email, password, profile, pin) VALUES (?, ?, ?, ?, ?, ?)
            `);

            insertStock.run(input[1], textReply, email, password, profile, pin);

            ctx.reply(`✅ BERHASIL MENAMBAHKAN STOCK\nEmail: ${email || 'N/A'}\nPassword: ${password ? '***' : 'N/A'}\nProfil: ${profile || 'N/A'}\nPIN: ${pin ? '***' : 'N/A'}`);
        }
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND ADDSTOCK⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/addStock.js  ${err.message}`));
    }
};

module.exports = addStock;