const express = require('express');
const crypto = require('crypto');
const { getDatabase } = require('../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

function startWebhookServer(bot) {
    const app = express();
    app.use(express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        }
    }));

    const PORT = process.env.WEBHOOK_PORT || 3000;
    const GOPAY_API_KEY = process.env.GOPAY_API_KEY;

    function verifySignature(req) {
        const signature = req.headers['x-gpg-signature'];
        if (!signature) return false;
        const computedSignature = crypto.createHmac('sha256', GOPAY_API_KEY)
            .update(req.rawBody || '')
            .digest('hex');
        return signature === computedSignature;
    }

    app.post('/webhook', async (req, res) => {
        try {
            const payload = req.body;
            console.log(clc.green.bold("[ WEBHOOK ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Received webhook: ${JSON.stringify(payload)}`));

            if (!verifySignature(req)) {
                console.log(clc.red.bold("[ WEBHOOK ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.yellow(` Invalid signature`));
                return res.status(403).json({ status: false, message: 'Invalid signature' });
            }

            res.json({ status: true });

            const db = getDatabase();
            const { order_id, status: paymentStatus } = payload;

            if (paymentStatus === 'paid') {
                const transaction = db.prepare(`
                    SELECT * FROM order_transactions WHERE paymentKitaRefId = ? AND isSuccess = 0 AND isCanceled = 0
                `).get(order_id);

                if (transaction) {
                    db.prepare(`UPDATE order_transactions SET isSuccess = 1 WHERE paymentKitaRefId = ?`).run(order_id);

                    try {
                        await bot.telegram.deleteMessage(transaction.chatId, transaction.messageId);
                    } catch (e) {
                        // message might already be deleted
                    }

                    const productVariant = db.prepare(`
                        SELECT * FROM product_variants WHERE codeVariant = ?
                    `).get(transaction.productCode);

                    const productName = productVariant ? productVariant.name.toUpperCase() : transaction.productCode.toUpperCase();
                    const successMessage = `「 TRANSAKSI BERHASIL 」
└ Produk: ${productName}
└ Jumlah: ${transaction.orderQuantity}
└ Total: Rp ${transaction.totalPrice.toLocaleString('id-ID')}
Terimakasih sudah membeli produk kami 🙏.
Jika ada kendala pada akun segera chat admin @fa_jrrrr`;

                    await bot.telegram.sendMessage(transaction.chatId, successMessage);

                    const fs = require('fs');
                    const path = require('path');

                    let productInfoText = `「 TRANSAKSI BERHASIL 」\n\n`;
                    productInfoText += `📦 Produk: ${productName}\n`;
                    productInfoText += `📊 Jumlah: ${transaction.orderQuantity}\n`;
                    productInfoText += `📅 Tanggal: ${transaction.formattedDate}\n`;
                    productInfoText += `💰 Total Harga: Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n\n`;

                    const settings = db.prepare(`SELECT term_conditions FROM settings ORDER BY id DESC LIMIT 1`).get();
                    const terms = (productVariant && productVariant.terms) || (settings ? settings.term_conditions : '');
                    if (terms) {
                        productInfoText += `🔹 SYARAT & KETENTUAN 🔹\n${terms}\n\n`;
                    }

                    productInfoText += '「 DETAIL AKUN 」\n\n';
                    productInfoText += (transaction.orderData || '').trim() || '(Tidak ada detail akun)\n';

                    const tempFilePath = path.join(__dirname, '..', '..', `temp_${transaction.transactionId}.txt`);
                    fs.writeFileSync(tempFilePath, productInfoText);

                    await bot.telegram.sendDocument(transaction.chatId, {
                        source: tempFilePath
                    }, {
                        caption: `「 ${productName} 」`
                    });

                    fs.unlinkSync(tempFilePath);

                    const ownerId = process.env.WHITELIST_ID;
                    if (ownerId) {
                        const notifMsg =
                            `<b>NOTIFIKASI TRANSAKSI SUKSES</b>\n` +
                            `ID Transaksi: <code>${transaction.transactionId}</code>\n` +
                            `User: <a href="tg://user?id=${transaction.telegramUserId}">${transaction.username || transaction.telegramUserId || '-'}</a>\n` +
                            `Produk: <b>${transaction.productCode.toUpperCase()}</b>\n` +
                            `Harga: Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n` +
                            `Keterangan: ${transaction.keteranganVariant || 'N/A'}\n` +
                            `\n<b>Data Order:</b>\n<code>${transaction.orderData}</code>`;
                        await bot.telegram.sendMessage(ownerId, notifMsg, { parse_mode: "HTML" });
                    }

                    console.log(clc.green.bold("[ WEBHOOK ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Transaction ${order_id} marked as success via webhook`));
                }
            }
        } catch (error) {
            console.error(clc.red.bold("[ WEBHOOK ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.yellow(` ${error.message}`));
            res.status(500).json({ status: false, message: 'Internal error' });
        }
    });

    app.listen(PORT, () => {
        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Webhook server running on port ${PORT}`));
    });

    return app;
}

module.exports = { startWebhookServer };
