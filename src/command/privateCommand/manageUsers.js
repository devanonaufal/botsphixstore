const { getDatabase } = require('../../database/connect');
const { Markup } = require('telegraf');
const clc = require('cli-color');
const moment = require('moment-timezone');

// /approveuser <idTelegram>
const approveUser = async (ctx) => {
    try {
        if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

        const db = getDatabase();
        const args = ctx.message.text.split(' ');

        if (args.length < 2) {
            return ctx.reply("*⚠️ Format: /approveuser <idTelegram>*", { parse_mode: "Markdown" });
        }

        const targetId = args[1].trim();
        const user = db.prepare(`SELECT * FROM allowed_users WHERE idTelegram = ?`).get(targetId);

        if (!user) {
            return ctx.reply("*⚠️ User tidak ditemukan di database.*", { parse_mode: "Markdown" });
        }

        if (user.approved === 1) {
            return ctx.reply("*ℹ️ User ini sudah disetujui sebelumnya.*", { parse_mode: "Markdown" });
        }

        db.prepare(`UPDATE allowed_users SET approved = 1, updatedAt = CURRENT_TIMESTAMP WHERE idTelegram = ?`).run(targetId);

        ctx.reply(`*✅ User ${user.usernameTelegram ? '@' + user.usernameTelegram : targetId} berhasil disetujui!*`, { parse_mode: "Markdown" });

        // Kirim notifikasi ke user yang di-approve
        try {
            await ctx.telegram.sendMessage(targetId, "🎉 Selamat! Akun kamu sudah disetujui oleh admin.\nSekarang kamu bisa menggunakan bot ini. Ketik /start untuk memulai.");
        } catch (e) {
            // User mungkin belum memulai chat dengan bot
        }

        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` User ${targetId} approved`));
    } catch (err) {
        ctx.reply("*⚠️ Error saat approve user!*", { parse_mode: "Markdown" });
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error approveUser: ${err.message}`));
    }
};

// /removeuser <idTelegram>
const removeUser = async (ctx) => {
    try {
        if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

        const db = getDatabase();
        const args = ctx.message.text.split(' ');

        if (args.length < 2) {
            return ctx.reply("*⚠️ Format: /removeuser <idTelegram>*", { parse_mode: "Markdown" });
        }

        const targetId = args[1].trim();
        const user = db.prepare(`SELECT * FROM allowed_users WHERE idTelegram = ?`).get(targetId);

        if (!user) {
            return ctx.reply("*⚠️ User tidak ditemukan di database.*", { parse_mode: "Markdown" });
        }

        db.prepare(`DELETE FROM allowed_users WHERE idTelegram = ?`).run(targetId);
        ctx.reply(`*✅ User ${user.usernameTelegram ? '@' + user.usernameTelegram : targetId} berhasil dihapus dari daftar akses!*`, { parse_mode: "Markdown" });
        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` User ${targetId} removed`));
    } catch (err) {
        ctx.reply("*⚠️ Error saat remove user!*", { parse_mode: "Markdown" });
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error removeUser: ${err.message}`));
    }
};

// /listpending
const listPending = async (ctx) => {
    try {
        if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

        const db = getDatabase();
        const pendingUsers = db.prepare(`SELECT * FROM allowed_users WHERE approved = 0`).all();

        if (pendingUsers.length === 0) {
            return ctx.reply("*✅ Tidak ada user yang menunggu persetujuan.*", { parse_mode: "Markdown" });
        }

        let text = "*📋 Daftar User Pending:*\n\n";
        pendingUsers.forEach((user, index) => {
            const safeUsername = user.usernameTelegram ? '@' + user.usernameTelegram.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&') : 'N/A';
            text += `${index + 1}. ${safeUsername}\n   ID: \`${user.idTelegram}\`\n   Tanggal: ${user.createdAt}\n\n`;
        });

        text += `Gunakan /approveuser <id> untuk menyetujui satu per satu.`;

        ctx.reply(text, {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
                [Markup.button.callback(`✅ Approve All (${pendingUsers.length} user)`, 'approve_all_users')]
            ])
        });
    } catch (err) {
        ctx.reply("*⚠️ Error saat mengambil daftar pending!*", { parse_mode: "Markdown" });
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error listPending: ${err.message}`));
    }
};

// /listusers - tampilkan semua user yang sudah approved
const listUsers = async (ctx) => {
    try {
        if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

        const db = getDatabase();
        const approvedUsers = db.prepare(`SELECT * FROM allowed_users WHERE approved = 1`).all();

        if (approvedUsers.length === 0) {
            return ctx.reply("*ℹ️ Belum ada user yang disetujui.*", { parse_mode: "Markdown" });
        }

        let text = "*📋 Daftar User Aktif:*\n\n";
        approvedUsers.forEach((user, index) => {
            const safeUsername = user.usernameTelegram ? '@' + user.usernameTelegram.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&') : 'N/A';
            text += `${index + 1}. ${safeUsername}\n   ID: \`${user.idTelegram}\`\n\n`;
        });

        text += "Gunakan /removeuser <id> untuk menghapus akses";

        ctx.reply(text, { parse_mode: "Markdown" });
    } catch (err) {
        ctx.reply("*⚠️ Error saat mengambil daftar user!*", { parse_mode: "Markdown" });
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error listUsers: ${err.message}`));
    }
};

// /cekid <idTelegram>
const cekId = async (ctx) => {
    try {
        if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

        const db = getDatabase();
        const args = ctx.message.text.split(' ');

        if (args.length < 2 || !args[1].trim()) {
            return ctx.reply("*⚠️ Format: /cekid <idTelegram>*\n\nContoh: `/cekid 1703052007`", { parse_mode: "Markdown" });
        }

        const targetId = args[1].trim();

        // Cek apakah ID yang dicari adalah admin (WHITELIST_ID)
        if (String(targetId) === String(process.env.WHITELIST_ID)) {
            const adminUsername = ctx.botInfo
                ? null
                : null; // username admin diambil dari broadcast_data jika ada
            const broadcastAdmin = db.prepare(`SELECT * FROM broadcast_data WHERE idTelegram = ?`).get(targetId);
            const safeUsername = broadcastAdmin && broadcastAdmin.usernameTelegram
                ? '@' + broadcastAdmin.usernameTelegram.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
                : '_Tidak ada username_';

            const text =
                `*🔍 Informasi User*\n\n` +
                `🆔 *ID Telegram:* \`${targetId}\`\n` +
                `👤 *Username:* ${safeUsername}\n` +
                `📌 *Status:* 👑 Admin / Owner\n` +
                `📅 *Terdaftar:* ${broadcastAdmin ? broadcastAdmin.createdAt : 'N/A'}`;

            ctx.reply(text, { parse_mode: "Markdown" });
            console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Admin cek ID: ${targetId} (Admin)`));
            return;
        }

        // Cari di allowed_users
        let user = db.prepare(`SELECT * FROM allowed_users WHERE idTelegram = ?`).get(targetId);

        // Jika tidak ada di allowed_users, cari di broadcast_data (user pernah /start tapi belum di-approve)
        if (!user) {
            const broadcastUser = db.prepare(`SELECT * FROM broadcast_data WHERE idTelegram = ?`).get(targetId);

            if (!broadcastUser) {
                return ctx.reply(
                    `*🔍 Hasil Pencarian ID: \`${targetId}\`*\n\n` +
                    `❌ *User tidak ditemukan di database.*\n\n` +
                    `_ID ini belum pernah menggunakan bot sama sekali._`,
                    { parse_mode: "Markdown" }
                );
            }

            // User ada di broadcast_data tapi tidak di allowed_users
            const safeUsername = broadcastUser.usernameTelegram
                ? '@' + broadcastUser.usernameTelegram.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
                : '_Tidak ada username_';

            const text =
                `*🔍 Informasi User*\n\n` +
                `🆔 *ID Telegram:* \`${broadcastUser.idTelegram}\`\n` +
                `👤 *Username:* ${safeUsername}\n` +
                `📌 *Status:* ⚠️ Tidak terdaftar di allowed users\n` +
                `📅 *Pertama /start:* ${broadcastUser.createdAt || 'N/A'}`;

            ctx.reply(text, { parse_mode: "Markdown" });
            console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Admin cek ID: ${targetId} (broadcast_data only)`));
            return;
        }

        // User ditemukan di allowed_users
        const safeUsername = user.usernameTelegram
            ? '@' + user.usernameTelegram.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
            : '_Tidak ada username_';

        const statusEmoji = user.approved === 1 ? '✅ Aktif' : '⏳ Pending';
        const createdAt = user.createdAt || 'N/A';
        const updatedAt = user.updatedAt || 'N/A';

        const text =
            `*🔍 Informasi User*\n\n` +
            `🆔 *ID Telegram:* \`${user.idTelegram}\`\n` +
            `👤 *Username:* ${safeUsername}\n` +
            `📌 *Status:* ${statusEmoji}\n` +
            `📅 *Terdaftar:* ${createdAt}\n` +
            `🔄 *Diperbarui:* ${updatedAt}`;

        ctx.reply(text, { parse_mode: "Markdown" });
        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Admin cek ID: ${targetId}`));
    } catch (err) {
        ctx.reply("*⚠️ Error saat mencari ID user!*", { parse_mode: "Markdown" });
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error cekId: ${err.message}`));
    }
};

// callback action: approve_all_users
const approveAllUsers = async (ctx) => {
    try {
        if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) {
            return ctx.answerCbQuery('⛔ Kamu bukan admin!', { show_alert: true });
        }

        await ctx.answerCbQuery('⏳ Sedang memproses...');

        const db = getDatabase();
        const pendingUsers = db.prepare(`SELECT * FROM allowed_users WHERE approved = 0`).all();

        if (pendingUsers.length === 0) {
            return ctx.editMessageText('*✅ Tidak ada user pending yang perlu di-approve.*', { parse_mode: 'Markdown' });
        }

        let successCount = 0;
        let failCount = 0;
        const failedUsers = [];

        for (const user of pendingUsers) {
            try {
                db.prepare(`UPDATE allowed_users SET approved = 1, updatedAt = CURRENT_TIMESTAMP WHERE idTelegram = ?`).run(user.idTelegram);
                successCount++;

                // Kirim notifikasi ke user
                try {
                    await ctx.telegram.sendMessage(
                        user.idTelegram,
                        `🎉 Selamat! Akun kamu sudah *disetujui* oleh admin.\nSekarang kamu bisa menggunakan bot ini. Ketik /start untuk memulai.`,
                        { parse_mode: 'Markdown' }
                    );
                } catch (_) {
                    // User mungkin belum mulai chat / sudah blokir bot
                }

                console.log(clc.green.bold('[ INFO ]') + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Approve All: User ${user.idTelegram} approved`));
            } catch (e) {
                failCount++;
                failedUsers.push(user.idTelegram);
                console.log(clc.red.bold('[ ERROR ]') + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Approve All: gagal approve ${user.idTelegram} - ${e.message}`));
            }
        }

        const resultText =
            `*✅ Approve All Selesai!*\n\n` +
            `👤 Total pending: *${pendingUsers.length} user*\n` +
            `✅ Berhasil di-approve: *${successCount} user*\n` +
            (failCount > 0 ? `❌ Gagal: *${failCount} user*\n   ID: ${failedUsers.join(', ')}` : ``);

        await ctx.editMessageText(resultText, { parse_mode: 'Markdown' });
    } catch (err) {
        ctx.answerCbQuery('⚠️ Error saat approve all!', { show_alert: true });
        console.log(clc.red.bold('[ ERROR ]') + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error approveAllUsers: ${err.message}`));
    }
};

module.exports = { approveUser, removeUser, listPending, listUsers, approveAllUsers, cekId };

