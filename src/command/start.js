const { getDatabase } = require('../database/connect');
const clc = require("cli-color");
const moment = require('moment-timezone');
const countUserOrders = require('../utils/countUserOrders');
const countAllTransaction = require('../utils/countAllTransaction');
const countTotalUsers = require('../utils/countTotalUsers');
const countTotalProductsSold = require('../utils/countTotalProductsSold');
const { Input, Markup } = require('telegraf');

const escapeMarkdown = (text) => {
    // Escape karakter spesial untuk Markdown
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
};

const startCommand = async (ctx) => {
    try {
        const db = getDatabase(); // Ensure db is initialized
        const from = ctx.from;

        // Reset unpaid or pending status checking transactions for this user
        const activeTransactions = db.prepare(`
            SELECT * FROM order_transactions 
            WHERE telegramUserId = ? AND isSuccess = 0 AND isCanceled = 0
        `).all(from.id);

        if (activeTransactions.length > 0) {
            console.log(clc.yellow(`[ RESET ] Resetting ${activeTransactions.length} pending orders for user ${from.id}`));
            const insertStock = db.prepare(
                `INSERT INTO stock_data_variants (codeVariant, dataStock, email, password, profile, pin) VALUES (?, ?, ?, ?, ?, ?)`
            );

            for (const transaction of activeTransactions) {
                // Delete previous QRIS/status message silently
                if (transaction.chatId && transaction.messageId) {
                    try {
                        await ctx.telegram.deleteMessage(transaction.chatId, transaction.messageId);
                    } catch (_) {}
                }

                // Restore stock
                const rawOrderData = transaction.orderData || '';
                const blocks = rawOrderData
                    .split(/(?=ID Stock:)/i)
                    .map(b => b.trim())
                    .filter(b => b.startsWith('ID Stock:'));

                for (const block of blocks) {
                    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                    const contentLines = lines.filter(l => !l.toLowerCase().startsWith('id stock:'));
                    const dataStock = contentLines.join('\n');

                    let email = '', password = '', profile = '', pin = '';
                    for (const line of contentLines) {
                        const low = line.toLowerCase();
                        if (low.startsWith('email:')) email = line.split(':').slice(1).join(':').trim();
                        else if (low.startsWith('password:')) password = line.split(':').slice(1).join(':').trim();
                        else if (low.startsWith('profil:')) profile = line.split(':').slice(1).join(':').trim();
                        else if (low.startsWith('pin:')) pin = line.split(':').slice(1).join(':').trim();
                    }

                    insertStock.run(transaction.productCode, dataStock, email, password, profile, pin);
                }

                // Update database
                db.prepare(`
                    UPDATE order_transactions 
                    SET isCanceled = 1 
                    WHERE transactionId = ?
                `).run(transaction.transactionId);
            }

            try {
                await ctx.reply("⚠️ Transaksi sebelumnya yang belum dibayar telah dibatalkan otomatis agar Anda bisa membuat pesanan baru.");
            } catch (_) {}
        }

        // Cek akses user (admin selalu diizinkan)
        if (String(from.id) !== String(process.env.WHITELIST_ID)) {
            const allowedUser = db.prepare(`
                SELECT * FROM allowed_users WHERE idTelegram = ?
            `).get(from.id);

            if (!allowedUser) {
                db.prepare(`
                    INSERT OR IGNORE INTO allowed_users (idTelegram, usernameTelegram, approved) VALUES (?, ?, 0)
                `).run(from.id, from.username || '');
            }

            if (!allowedUser || allowedUser.approved !== 1) {
                return ctx.reply("⏳ Akun kamu sedang menunggu persetujuan admin.\n\nKalau ingin ajukan approval, hubungi admin:\n📱 WhatsApp: +6281283933929 (Fajar)");
            }
        }

        const [totalTransaction, totalProfit] = await countAllTransaction();
        const totalUsers = await countTotalUsers();
        const totalProductsSold = await countTotalProductsSold();

        const checkBroadcast = db.prepare(`
            SELECT * FROM broadcast_data WHERE idTelegram = ?
        `).get(from.id);

        if (!checkBroadcast) {
            db.prepare(`
                INSERT INTO broadcast_data (usernameTelegram, idTelegram) VALUES (?, ?)
            `).run(from.username, from.id);
        }

        // Format total profit to Indonesian currency
        const formattedTotalProfit = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(totalProfit);

        // Buat pesan profil sesuai format gambar
        const profileMessage = `Selamat Datang di Auto Order BlackHost!

Informasi Anda:
ID: ${from.id}
Username: @${from.username || 'N/A'}
Nama: ${from.first_name || 'N/A'} ${from.last_name || ''}

Stats Bot:
Produk Terjual: ${totalProductsSold} pcs
Total Transaksi: ${formattedTotalProfit}
Total Pengguna: ${totalUsers}

Silakan pilih tombol di bawah untuk informasi lebih lanjut.`;

        // Inline keyboard buttons
        const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏷 List Produk', 'list_product')],
            [Markup.button.callback('🛒 Stock', 'show_stock')],
            [Markup.button.callback('🎟 Best Product', 'best_product'), Markup.button.callback('🏅 Top Buyer', 'top_buyer')]
        ]);

        // Kirim gambar dengan caption
        try {
            await ctx.replyWithPhoto(Input.fromLocalFile('src/img/poster.png'), {
                caption: profileMessage,
                reply_markup: inlineKeyboard.reply_markup
            });
        } catch (photoError) {
            // Jika pengiriman foto gagal, kirim hanya teks
            console.log(clc.yellow("[ WARNING ]") + ` Gagal mengirim foto: ${photoError.message}`);
            await ctx.reply(profileMessage, {
                reply_markup: inlineKeyboard.reply_markup
            });
        }

    } catch (err) {
        // Tangani error umum
        await ctx.reply("*⚠️ Terjadi error saat menjalankan command!*", {
            parse_mode: "Markdown"
        });
        console.log(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]: ${clc.blueBright(`Error in command/start.js: ${err.message}`)}`);
    }
};

module.exports = startCommand;
