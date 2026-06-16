const { getDatabase } = require('../../database/connect');
const moment = require('moment-timezone');
const clc = require('cli-color');

const broadcastCommand = async (ctx) => {
    try {
        const db = getDatabase(); // Ensure db is initialized

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        const allDataBroadcast = db.prepare(`
            SELECT * FROM broadcast_data
        `).all();

        const fullMessage = ctx.message.text;
        const messageWithoutCommand = fullMessage.replace('/broadcast', '').trim();
        const messageToBroadcast = `<b>[ 📢 BROADCAST 📢 ]</b>\n\n${messageWithoutCommand}`;

        let successCount = 0;
        let failCount = 0;

        for (const data of allDataBroadcast) {
            try {
                await ctx.telegram.sendMessage(data.idTelegram, messageToBroadcast, {
                    parse_mode: "HTML",
                });
                successCount++;
            } catch (sendErr) {
                failCount++;
                const errCode = sendErr.response?.error_code || sendErr.code || '?';
                console.log(
                    clc.yellow.bold("[ BROADCAST SKIP ]") +
                    ` [${moment().format('HH:mm:ss')}]: Failed to send to ${data.idTelegram} - ${errCode}: ${sendErr.message}`
                );
                // Jika user blokir bot (403) atau akun tidak ada (400), skip dan lanjut
                // Jangan stop seluruh broadcast hanya karena 1 user bermasalah
            }
        }

        await ctx.replyWithMarkdown(
            `*✅ BROADCAST SELESAI*\n\n` +
            `📤 Terkirim: *${successCount}* user\n` +
            `❌ Gagal (diblokir/tidak aktif): *${failCount}* user`
        );
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND BROADCAST⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/broadcast.js :  ${err.message}`));
    }
};

module.exports = broadcastCommand;