const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const moment = require('moment-timezone');
const { getDatabase } = require('./src/database/connect');
const { checkStatus } = require('./src/utils/gopayGateway');
const addStocks = require('./src/utils/addStocks');
const { getTermsAndConditions } = require('./src/command/privateCommand/updateTerm');

async function ProcessingTransaction(bot) {
    try {
        const db = getDatabase();
        const pendingTransactions = db.prepare(`
            SELECT * FROM order_transactions 
            WHERE isSuccess = 0 AND isCanceled = 0
        `).all();

        if (pendingTransactions.length === 0) {
            console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(" No pending transactions to process."));
            return;
        }

        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Processing ${pendingTransactions.length} pending transactions.`));

        // Process all transactions concurrently
        await Promise.all(
            pendingTransactions.map(async (transaction) => {
                try {
                    const response = await checkStatus(transaction.paymentKitaRefId);
                    console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Processing transaction ${JSON.stringify(response)}...`));
                    if (response.status === 'success' && response.data && response.data.status === 'paid') {
                        // Transaction is successful
                        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Transaction ${transaction.transactionId} is successful.`));

                        db.prepare(`
                            UPDATE order_transactions 
                            SET isSuccess = 1 
                            WHERE transactionId = ? AND isSuccess = 0 AND isCanceled = 0
                        `).run(transaction.transactionId);

                        await bot.telegram.deleteMessage(transaction.chatId, transaction.messageId);

                        // Get product variant info
                        const productVariant = db.prepare(`
                            SELECT * FROM product_variants WHERE codeVariant = ?
                        `).get(transaction.productCode);

                        // Get terms from variant first, then fallback to settings
                        let terms = '';
                        if (productVariant && productVariant.terms) {
                            terms = productVariant.terms;
                        } else {
                            const settings = db.prepare(`
                                SELECT term_conditions FROM settings ORDER BY id DESC LIMIT 1
                            `).get();
                            terms = settings ? settings.term_conditions : '';
                        }

                        // Generate product info text for file
                        let productInfoText = `「 TRANSAKSI BERHASIL 」\n\n`;
                        productInfoText += `📦 Produk: ${productVariant ? productVariant.name.toUpperCase() : transaction.productCode.toUpperCase()}\n`;
                        productInfoText += `📊 Jumlah: ${transaction.orderQuantity}\n`;
                        productInfoText += `📅 Tanggal: ${transaction.formattedDate}\n`;
                        productInfoText += `💰 Total Harga: Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n\n`;

                        if (terms) {
                            productInfoText += `🔹 SYARAT & KETENTUAN 🔹\n${terms}\n\n`;
                        }

                        productInfoText += '「 DETAIL AKUN 」\n\n';

                        // Parse account details from orderData (stock was already deleted during ConfirmOrder)
                        const orderDataLines = (transaction.orderData || '').split('\n').filter(line => line.trim() !== '');
                        if (orderDataLines.length > 0) {
                            // Group lines into account blocks (each block starts with non-key:value line or is separated by blank lines)
                            // Since orderData is the raw stock text, just output it directly
                            productInfoText += transaction.orderData.trim() + '\n';
                        } else {
                            productInfoText += '(Tidak ada detail akun)\n';
                        }

                        // Create temporary file with product info
                        const tempFilePath = path.join(__dirname, `temp_${transaction.transactionId}.txt`);
                        fs.writeFileSync(tempFilePath, productInfoText);

                        // Send simple transaction success message
                        const productName = productVariant ? productVariant.name.toUpperCase() : transaction.productCode.toUpperCase();
                        const successMessage = `「 TRANSAKSI BERHASIL 」
└ Produk: ${productName}
└ Jumlah: ${transaction.orderQuantity}
└ Total: Rp ${transaction.totalPrice.toLocaleString('id-ID')}
Terimakasih sudah membeli produk kami 🙏.
Jika ada kendala pada akun segera chat admin @fa_jrrrr`;

                        await bot.telegram.sendMessage(transaction.chatId, successMessage);

                        // Send product info file
                        await bot.telegram.sendDocument(transaction.chatId, {
                            source: tempFilePath
                        }, {
                            caption: `「 ${productName} 」`
                        });

                        // Delete temporary file
                        fs.unlinkSync(tempFilePath);

                        // Kirim notifikasi ke owner (WHITELIST_ID) jika transaksi sukses
                        const ownerId = process.env.WHITELIST_ID || (process.env.WHITELIST_ID === 0 ? 0 : null);
                        if (ownerId) {
                            const escape = (t) => String(t).replace(/[\\`*_\[\]()~>#+\-=|{}.!:\.]/g, m => `\\${m}`);

                            // Get product & variant name
                            const variantInfo = db.prepare(`
                                SELECT pv.name AS variantName, p.name AS productName
                                FROM product_variants pv
                                LEFT JOIN products p ON pv.code = p.code
                                WHERE pv.codeVariant = ?
                            `).get(transaction.productCode);

                            const productName = variantInfo ? variantInfo.productName : transaction.productCode;
                            const variantName = variantInfo ? variantInfo.variantName : '-';

                            // Parse orderData untuk ambil ID Stock, email, password, profil, pin
                            const orderLines = (transaction.orderData || '').split('\n');
                            let stockId = '', email = '', password = '', profile = '', pin = '';
                            for (const line of orderLines) {
                                const lowerLine = line.toLowerCase().trim();
                                if (lowerLine.startsWith('id stock:') && !stockId) stockId = line.split(':').slice(1).join(':').trim();
                                else if (lowerLine.startsWith('email:') && !email) email = line.split(':').slice(1).join(':').trim();
                                else if (lowerLine.startsWith('password:') && !password) password = line.split(':').slice(1).join(':').trim();
                                else if (lowerLine.startsWith('profil:') && !profile) profile = line.split(':').slice(1).join(':').trim();
                                else if (lowerLine.startsWith('pin:') && !pin) pin = line.split(':').slice(1).join(':').trim();
                            }

                            let notifMsg = `*NOTIFIKASI TRANSAKSI SUKSES*\n` +
                                `ID Transaksi: \`${escape(transaction.transactionId)}\`\n` +
                                `User: [${escape(transaction.username || transaction.telegramUserId || '-')}](tg://user?id=${escape(transaction.telegramUserId)})\n` +
                                `Produk: *${escape(productName)}*\n` +
                                `Variant: *${escape(variantName)}*\n` +
                                `Total: Rp ${escape(transaction.totalPrice.toLocaleString('id-ID'))}\n` +
                                `\n*Data Order:*\n` +
                                `ID Stock: ${escape(stockId || 'N/A')}\n` +
                                `Email: ${escape(email || 'N/A')}\n` +
                                `Password: ${escape(password || 'N/A')}\n` +
                                `Profil: ${escape(profile || 'N/A')}\n` +
                                `Pin: ${escape(pin || 'N/A')}`;

                            await bot.telegram.sendMessage(ownerId, notifMsg, {
                                parse_mode: "MarkdownV2"
                            });
                        }
                    } else {
                        // Transaction is still pending
                        console.log(clc.yellow.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Transaction ${transaction.transactionId} is still pending.`));
                    }
                } catch (error) {
                    console.error(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error processing transaction ${transaction.transactionId}: ${error.message}`));
                }
            })
        );
    } catch (error) {
        console.error(clc.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Error in ProcessingTransaction: ${error.message}`));
    }
}

module.exports = ProcessingTransaction;