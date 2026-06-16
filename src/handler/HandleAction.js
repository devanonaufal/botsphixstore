require('dotenv').config();
const fs = require('fs').promises;
const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
const clc = require('cli-color');
const moment = require('moment-timezone');
const QRCode = require('qrcode');

const axios = require('axios');
const startCommand = require('../command/start');
const { createOrder } = require('../utils/gopayGateway');

async function getGoPayGatewayQris(totalAmount, refId, productDesc = 'Pembelian Produk') {
    try {
        const response = await createOrder(refId, totalAmount, productDesc);
        if (response.status !== 'success' || !response.data) {
            throw new Error('Gagal membuat order di GoPay Gateway');
        }
        const qrUrl = response.data.qr_url;
        const qrImageResponse = await axios.get(qrUrl, { responseType: 'arraybuffer' });
        const qrBuffer = Buffer.from(qrImageResponse.data);
        console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Berhasil membuat QRIS GoPay Gateway untuk ${refId}`));
        return [qrBuffer, response.data.order_id];
    } catch (error) {
        const timestamp = moment().format('HH:mm:ss');
        console.error(clc.red.bold("[ ERROR ]") + ` [${timestamp}]:` + clc.yellow(` Gagal mendapatkan QRIS GoPay Gateway: ${error.message}`));
        if (error.response) {
            console.error(clc.red.bold("[ RESPONSE BODY ]") + ` [${timestamp}]:` +
                clc.yellow(` ${JSON.stringify(error.response.data, null, 2)}`));
        }
        throw error;
    }
}

function generateRandomCode() {
    const prefix = "INV";

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;

    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    const randomCode = `${prefix}${datePart}${randomNumber}`;
    return randomCode;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ======================================================
// FUNGSI INI TIDAK DIGUNAKAN LAGI (FEE DINONAKTIFKAN)
// ======================================================
async function generateUniqueRandomPrice() {
    const totalPriceList = [];
    const getTransaction = db.prepare(`
        SELECT feeTax, createdAt FROM order_transactions 
        WHERE isSuccess = 0 AND isCanceled = 0
    `).all();

    getTransaction.forEach(data => {
        const createdAt = moment(data.createdAt);
        const time = moment();
        const selisih = time.diff(createdAt, 'minutes');

        if (selisih < 6) {
            totalPriceList.push(data.feeTax);
        }
    });

    let randomPrice;
    let feeExists = true;

    while (feeExists) {
        randomPrice = getRandomInt(0, 155);

        feeExists = totalPriceList.includes(randomPrice);

        if (feeExists) {
            console.log(clc.blue.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Fee ${randomPrice} sudah ada, mencari fee baru...`));
        }
    }

    totalPriceList.push(randomPrice);

    return randomPrice.toString().padStart(2, '0');
}

class HandleAction {
    async ShowPesanan(ctx) {
        try {
            const variantValue = ctx.match[1];
            const SearchCodeVariant = db.prepare(`
                SELECT * FROM product_variants WHERE codeVariant = ?
            `).get(variantValue);
            const result = db.prepare(` SELECT * FROM product_variants`).all();
            console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Mencari variant ${JSON.stringify(result,null,2)}}`));
            console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Mencari variant ${variantValue}`));
            if (!SearchCodeVariant) {
                return ctx.answerCbQuery("404 PRODUCTS NOT FOUND", { show_alert: true });
            }

            const allStock = db.prepare(`
                SELECT * FROM stock_data_variants WHERE codeVariant = ?
            `).all(variantValue);

            if (allStock.length == 0) {
                return ctx.answerCbQuery("SISA STOCK 0 TIDAK BISA MELANJUTKAN..", { show_alert: true });
            }

            await delay(1_000);
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                const messageId = ctx.callbackQuery.message.message_id;
                await ctx.deleteMessage(messageId);
            }

            let data = "*KONFIRMASI PESANAN*\n";
            data += "*╭─────────────────╮*\n";
            data += `*│ Product:* ${SearchCodeVariant.name.toUpperCase()}\n`;
            data += `*│ Code Variant:* ${SearchCodeVariant.codeVariant}\n`;
            data += `*│ Harga:* Rp ${SearchCodeVariant.price.toLocaleString('id-ID')}\n`;
            data += `*│ Stock Tersedia:* ${allStock.length}\n`;
            data += "*│──────────────────*\n";
            data += `*│ Jumlah Pesanan:* 1\n`;
            const totalPrice = 1 * SearchCodeVariant.price;
            data += `*│ Total dibayar:* Rp ${parseInt(totalPrice).toLocaleString('id-ID')}\n`;
            data += "*╰─────────────────╯*\n";
            data += "*╰➤ Jika ingin mengorder klik Confirm Order✅*";

            return ctx.reply(data, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'mines-order' },
                            { text: '+', callback_data: 'plus-order' },
                        ],
                        [
                            { text: '+2', callback_data: 'plus-order-2' },
                            { text: '+5', callback_data: 'plus-order-5' },
                            { text: '+10', callback_data: 'plus-order-10' },
                        ],
                        [
                            { text: '🔙Kembali', callback_data: "back-to-product-list" },
                            { text: 'Confirm Order✅', callback_data: 'confirm-order' },
                        ]
                    ]
                },
                parse_mode: "Markdown"
            });
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi admin jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async PlusMinesStockProduct(ctx) {
        try {
            const action = ctx.callbackQuery.data;

            const messageText = ctx.callbackQuery.message.text;
            const orderAmountMatch = messageText.match(/Jumlah Pesanan:\s*(\d+)/);
            const productMatch = messageText.match(/Product:\s*(.+)/);
            const codeVariantMatch = messageText.match(/Code Variant:\s*(.+)/);
            const priceMatch = messageText.match(/Harga:\s*Rp\s*([\d,.]+)/);
            const stockMatch = messageText.match(/Stock Tersedia:\s*(\d+)/);

            let orderAmount = orderAmountMatch ? parseInt(orderAmountMatch[1]) : null;
            const product = productMatch ? productMatch[1].trim() : null;
            const codeVariant = codeVariantMatch ? codeVariantMatch[1].trim() : null;
            const price = priceMatch ? priceMatch[1].replace(/\./g, '').trim() : null;
            const stock = stockMatch ? parseInt(stockMatch[1]) : null;

            if (!ctx.session) {
                ctx.session = {};
            }

            const userLastAction = ctx.session?.lastAction || 0;
            const currentTime = Date.now();

            const minimumDelay = 1_500;

            if (currentTime - userLastAction < minimumDelay) {
                return ctx.answerCbQuery("Tunggu sebentar sebelum memencet tombol lagi!", { show_alert: true });
            }

            ctx.session.lastAction = currentTime;

            ctx.session.lastAction = currentTime;

            if (action == 'mines-order' && orderAmount == 1) {
                return ctx.answerCbQuery("Jumlah orderan tidak boleh 0 atau mines!!", { show_alert: true });
            }

            let addition = 0;
            if (action == 'plus-order') addition = 1;
            else if (action == 'plus-order-2') addition = 2;
            else if (action == 'plus-order-5') addition = 5;
            else if (action == 'plus-order-10') addition = 10;

            if (addition > 0) {
                if (orderAmount + addition > stock) {
                    return ctx.answerCbQuery("Stock tidak cukup", { show_alert: true });
                }
                orderAmount += addition;
            } else if (action == 'mines-order') {
                orderAmount--;
            }

            if (orderAmount > stock) {
                return ctx.answerCbQuery("Stock tidak cukup", { show_alert: true });
            }

            const totalPrice = orderAmount * parseInt(price);
            let data = "*KONFIRMASI PESANAN*\n";
            data += "*╭─────────────────╮*\n";
            data += `*│ Product:* ${product.toUpperCase()}\n`;
            data += `*│ Code Variant:* ${codeVariant}\n`;
            data += `*│ Harga:* Rp ${parseInt(price).toLocaleString('id-ID')}\n`;
            data += `*│ Stock Tersedia:* ${stock}\n`;
            data += "*│──────────────────*\n";
            data += `*│ Jumlah Pesanan:* ${orderAmount}\n`;
            data += `*│ Total dibayar:* Rp ${parseInt(totalPrice).toLocaleString('id-ID')}\n`;
            data += "*╰─────────────────╯*\n";
            data += "*╰➤ Jika ingin mengorder klik Confirm Pesanan✅*";

            try {
                await ctx.editMessageText(data, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'mines-order' },
                                { text: '+', callback_data: 'plus-order' },
                            ],
                            [
                                { text: '+2', callback_data: 'plus-order-2' },
                                { text: '+5', callback_data: 'plus-order-5' },
                                { text: '+10', callback_data: 'plus-order-10' },
                            ],
                            [
                                { text: '🔙Kembali', callback_data: 'back-to-product-list' },
                                { text: 'Confirm Order✅', callback_data: 'confirm-order' },
                            ]
                        ]
                    },
                    parse_mode: 'Markdown'
                });
            } catch (editErr) {
                // Abaikan error "message is not modified" — konten sama, bukan error kritis
                if (!editErr.message?.includes('message is not modified')) {
                    throw editErr;
                }
            }

            ctx.answerCbQuery();
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi admin jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    // ======================================================
    // CONFIRM ORDER - FEE DINONAKTIFKAN (FEE = 0)
    // ======================================================
    async ConfirmOrder(ctx) {
        try {
            await delay(1_000);
            // Silent delete — pesan mungkin sudah terlalu lama / tidak bisa dihapus
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                try {
                    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                } catch (_) { /* abaikan error delete */ }
            }

            const messageText = ctx.callbackQuery.message.text;
            const orderAmountMatch = messageText.match(/Jumlah Pesanan:\s*(\d+)/);
            const productMatch = messageText.match(/Product:\s*(.+)/);
            const codeVariantMatch = messageText.match(/Code Variant:\s*(.+)/);
            const priceMatch = messageText.match(/Harga:\s*Rp\s*([\d,.]+)/);

            let orderAmount = orderAmountMatch ? parseInt(orderAmountMatch[1]) : null;
            const product = productMatch ? productMatch[1] : null;
            const codeVariant = codeVariantMatch ? codeVariantMatch[1] : null;
            const price = priceMatch ? priceMatch[1].replace(/\./g, '').trim() : null;

            const getVariantProduct = db.prepare(`
                SELECT * FROM product_variants WHERE codeVariant = ?
            `).get(codeVariant);

            const getTransaction = db.prepare(`
                SELECT * FROM order_transactions WHERE telegramUserId = ? AND isSuccess = 0 AND isCanceled = 0
            `).get(ctx.from.id);

            if (getTransaction) {
                return ctx.answerCbQuery("Tidak bisa confirm order, Harap selesaikan transaction sebelumnya", { show_alert: true });
            }

            const UserID = ctx.from.id;

            if (!getVariantProduct) {
                await ctx.editMessageText("*⚠️ Tidak bisa mendapatkan product, Harap coba lagi nanti*", {
                    parse_mode: 'Markdown',
                });

                ctx.answerCbQuery();
                return;
            }

            try { ctx.answerCbQuery("Bot sedang membuat QRIS..", { show_alert: true }); } catch(e) {}
            
            // ======================================================
            // FEE DINONAKTIFKAN - Bayar sesuai total pesanan
            // ======================================================
            const fee = 0; // Fee di-set 0
            const totalAmount = Number(orderAmount * price); // Langsung total tanpa fee
            // const fee = await generateUniqueRandomPrice(); // DI-NONAKTIFKAN
            // const totalAmount = Number(orderAmount * price) + Number(fee); // DI-NONAKTIFKAN
            
            const formattedDateFile = moment().tz('Asia/Jakarta').format('YYYY-MM-DD_HH-mm-ss');
            const uniqCode = generateRandomCode();
            const [qr_img, trxPaymentKitaRef] = await getGoPayGatewayQris(totalAmount, uniqCode, `Pembelian ${product}`);
            console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Berhasil membuat QRIS GoPay Gateway untuk transaksi ${uniqCode}`));

            let expirationTime = new Date(Date.now() + 5 * 60 * 1000);
            let formattedTime = new Date(expirationTime).toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta", hour12: false }).slice(0, 5);

            let text = `*╭──────────────\n*`;
            text += `*│ Produk:* ${product.toUpperCase()}\n`;
            text += `*│ Harga satuan:* Rp ${parseInt(price).toLocaleString('id-ID')}\n`;
            text += `*│ ID TRX :* ${uniqCode}\n`;
            text += `*│─────────────── *\n`;
            text += `*│ Jumlah Pesanan:* ${orderAmount}\n`;
            text += `*│ Total yang di bayar:* Rp ${totalAmount.toLocaleString('id-ID')}\n`;
            text += `*╰─────────────\n*`;
            text += `*Harap selesaikan pembayaran sebelum jam ${formattedTime} WIB⏲️ dengan cara scan QRIS di atas*\n\nIngin membatalkan transaksi? Klik button *Cancel Order❌*`;

            const stickerData = db.prepare(`SELECT fileId FROM stickers LIMIT 1`).get();
            const stickerFileId = stickerData ? stickerData.fileId : null;

            if (stickerFileId) {
                await ctx.telegram.sendSticker(UserID, stickerFileId);
            }

            const sendMessage = await ctx.telegram.sendPhoto(UserID, { source: qr_img }, {
                caption: text,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Check Status', callback_data: `check-status-${uniqCode}` }
                        ],
                        [
                            { text: 'Cancel Order❌', callback_data: 'cancel-order-pesanan' }
                        ]
                    ]
                },
                parse_mode: "Markdown",
            });

            const getStock = db.prepare(`
                SELECT * FROM stock_data_variants WHERE codeVariant = ?
            `).all(getVariantProduct.codeVariant);

            let dataStock = "";
            let totalStock = 0;
            for (const stock of getStock) {
                if (totalStock >= orderAmount) {
                    break;
                }

                dataStock += `ID Stock: ${stock.id}\n${stock.dataStock}\n`;
                db.prepare(`
                    DELETE FROM stock_data_variants WHERE id = ?
                `).run(stock.id);
                totalStock++;
            }

            const formattedDate = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

            db.prepare(`
                INSERT INTO order_transactions (
                    transactionId, telegramUserId, productCode, paymentKitaRefId, orderQuantity, formattedDate, feeTax, totalPrice, orderData, chatId, keteranganVariant, messageId
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                uniqCode, UserID, getVariantProduct.codeVariant, trxPaymentKitaRef, orderAmount, formattedDate, fee, totalAmount, dataStock, sendMessage.chat.id, getVariantProduct.keteranganVariant, sendMessage.message_id
            );

            try { ctx.answerCbQuery(); } catch(e) {}
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi admin jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async cancelOrder(ctx) {
        try {
            await delay(1_000);
            // Silent delete — pesan QRIS mungkin sudah terlalu lama atau sudah dihapus
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                try {
                    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                } catch (_) { /* abaikan error delete */ }
            }

            const getTransaction = db.prepare(`
                SELECT * FROM order_transactions 
                WHERE telegramUserId = ? AND isCanceled = 0 AND isSuccess = 0
            `).get(ctx.from.id);

            if (!getTransaction) {
                await ctx.answerCbQuery('⚠️ Tidak ada transaksi aktif yang bisa dibatalkan.', { show_alert: true });
                await startCommand(ctx);
                return;
            }

            // ── RESTORE STOCK ────────────────────────────────────────────
            // orderData format: "ID Stock: 75\nEmail: x\nPassword: y\nProfil: z\nPIN: n\nID Stock: 76\n..."
            // Split per blok "ID Stock:" → tiap blok = 1 baris stock di DB
            const rawOrderData = getTransaction.orderData || '';
            const blocks = rawOrderData
                .split(/(?=ID Stock:)/i)          // split tapi tetap include "ID Stock:" di tiap bagian
                .map(b => b.trim())
                .filter(b => b.startsWith('ID Stock:'));

            const insertStock = db.prepare(
                `INSERT INTO stock_data_variants (codeVariant, dataStock, email, password, profile, pin) VALUES (?, ?, ?, ?, ?, ?)`
            );

            for (const block of blocks) {
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

                // Ambil baris content (skip baris "ID Stock: ...")
                const contentLines = lines.filter(l => !l.toLowerCase().startsWith('id stock:'));
                const dataStock = contentLines.join('\n');   // sama persis dengan format saat addStock

                // Parse field individual
                let email = '', password = '', profile = '', pin = '';
                for (const line of contentLines) {
                    const low = line.toLowerCase();
                    if (low.startsWith('email:'))    email    = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('password:')) password = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('profil:'))   profile  = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('pin:'))      pin      = line.split(':').slice(1).join(':').trim();
                }

                insertStock.run(getTransaction.productCode, dataStock, email, password, profile, pin);
            }

            console.log(`[ CANCEL ] Restored ${blocks.length} stock item(s) for ${getTransaction.productCode}`);

            db.prepare(`
                UPDATE order_transactions 
                SET isCanceled = 1 
                WHERE telegramUserId = ? AND isCanceled = 0 AND isSuccess = 0
            `).run(ctx.from.id);

            await ctx.answerCbQuery('✅ Transaksi berhasil dibatalkan!', { show_alert: true });

            // Tampilkan menu utama setelah cancel
            await startCommand(ctx);
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi admin jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async showAllproductVariant(ctx) {
        try {
             // Ensure db is initialized
            let text = "*[ SHOW CODE PRODUCT VARIANT ]*\n\n";
            const getAllData = db.prepare(`
                SELECT name, codeVariant FROM product_variants
            `).all();

            for (const variant of getAllData) {
                text += `\`${variant.name.toUpperCase()} || ${variant.codeVariant}\`\n`;
            }

            ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔙 Back', callback_data: 'back-to-adminmenu' },
                        ]
                    ]
                },
                parse_mode: "Markdown"
            });
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi admin jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async adminListProduct(ctx) {
        try {
            if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

            const allProducts = db.prepare(`
                SELECT * FROM products ORDER BY code ASC
            `).all();

            if (allProducts.length === 0) {
                return ctx.answerCbQuery("Belum ada product.", { show_alert: true });
            }

            let text = "*📦 LIST PRODUCT*\n\n";
            const inlineKeyboard = [];

            for (const product of allProducts) {
                const variantCount = db.prepare(`
                    SELECT COUNT(*) AS count FROM product_variants WHERE code = ?
                `).get(product.code).count;

                const stockCount = db.prepare(`
                    SELECT COUNT(*) AS count FROM stock_data_variants WHERE codeVariant IN (SELECT codeVariant FROM product_variants WHERE code = ?)
                `).get(product.code).count;

                text += `*[ ${product.code} ] ${product.name}*\n`;
                text += `   🆔 ID: \`${product.id}\` | Variant: ${variantCount} | Stock: ${stockCount}\n\n`;

                inlineKeyboard.push([{ text: `🗑 Hapus "${product.name}"`, callback_data: `del-product-id-${product.id}` }]);
            }

            text += `_Total: ${allProducts.length} product_`;
            inlineKeyboard.push([{ text: '🔙 Back', callback_data: 'back-to-adminmenu' }]);

            ctx.editMessageText(text, {
                reply_markup: { inline_keyboard: inlineKeyboard },
                parse_mode: "Markdown"
            });
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, err.message);
            ctx.reply("*⚠️ Error saat mengambil list product!*", { parse_mode: "Markdown" });
        }
    }

    async adminListVariant(ctx) {
        try {
            if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

            const allVariants = db.prepare(`
                SELECT pv.*, p.name AS productName FROM product_variants pv
                LEFT JOIN products p ON pv.code = p.code
                ORDER BY pv.code ASC, pv.codeVariant ASC
            `).all();

            if (allVariants.length === 0) {
                return ctx.answerCbQuery("Belum ada variant.", { show_alert: true });
            }

            let text = "*📋 LIST VARIANT*\n\n";
            let currentCode = null;
            for (const variant of allVariants) {
                if (variant.code !== currentCode) {
                    currentCode = variant.code;
                    text += `*── ${variant.productName || 'Unknown'} ──*\n`;
                }

                const stockCount = db.prepare(`
                    SELECT COUNT(*) AS count FROM stock_data_variants WHERE codeVariant = ?
                `).get(variant.codeVariant).count;

                text += `  • *${variant.name}*\n`;
                text += `    ID: \`${variant.id}\` | Code: \`${variant.codeVariant}\` | Harga: Rp ${parseInt(variant.price).toLocaleString('id-ID')} | Stock: ${stockCount}\n`;
            }

            text += `\n_Total: ${allVariants.length} variant_`;

            ctx.editMessageText(text, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Back', callback_data: 'back-to-adminmenu' }]
                    ]
                },
                parse_mode: "Markdown"
            });
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, err.message);
            ctx.reply("*⚠️ Error saat mengambil list variant!*", { parse_mode: "Markdown" });
        }
    }

    async deleteProductById(ctx) {
        try {
            if (String(process.env.WHITELIST_ID) !== String(ctx.from.id)) return;

            const match = ctx.callbackQuery.data.match(/^del-product-id-(\d+)$/);
            if (!match) return ctx.answerCbQuery("Invalid request", { show_alert: true });

            const productId = parseInt(match[1]);
            const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId);

            if (!product) {
                return ctx.answerCbQuery("Product tidak ditemukan!", { show_alert: true });
            }

            // Ambil semua codeVariant dari product ini untuk hapus stock
            const variants = db.prepare(`SELECT codeVariant FROM product_variants WHERE code = ?`).all(product.code);

            // Hapus semua stock dari setiap variant
            const deleteStock = db.prepare(`DELETE FROM stock_data_variants WHERE codeVariant = ?`);
            for (const variant of variants) {
                deleteStock.run(variant.codeVariant);
            }

            // Hapus semua variant dari product
            db.prepare(`DELETE FROM product_variants WHERE code = ?`).run(product.code);

            // Hapus product
            db.prepare(`DELETE FROM products WHERE id = ?`).run(productId);

            // Resequence code
            const remainingProducts = db.prepare(`SELECT * FROM products ORDER BY code ASC`).all();
            const updateProductCode = db.prepare(`UPDATE products SET code = ? WHERE id = ?`);
            const updateVariantCode = db.prepare(`UPDATE product_variants SET code = ? WHERE code = ?`);

            for (let i = 0; i < remainingProducts.length; i++) {
                const newCode = i + 1;
                updateProductCode.run(newCode, remainingProducts[i].id);
                updateVariantCode.run(newCode, remainingProducts[i].code);
            }

            await ctx.answerCbQuery(`✅ "${product.name}" berhasil dihapus!`, { show_alert: true });

            // Refresh list
            const allProducts = db.prepare(`SELECT * FROM products ORDER BY code ASC`).all();
            let text = "*📦 LIST PRODUCT*\n\n";
            const inlineKeyboard = [];

            for (const p of allProducts) {
                const variantCount = db.prepare(`SELECT COUNT(*) AS count FROM product_variants WHERE code = ?`).get(p.code).count;
                const stockCount = db.prepare(`SELECT COUNT(*) AS count FROM stock_data_variants WHERE codeVariant IN (SELECT codeVariant FROM product_variants WHERE code = ?)`).get(p.code).count;
                text += `*[ ${p.code} ] ${p.name}*\n`;
                text += `   🆔 ID: \`${p.id}\` | Variant: ${variantCount} | Stock: ${stockCount}\n\n`;
                inlineKeyboard.push([{ text: `🗑 Hapus "${p.name}"`, callback_data: `del-product-id-${p.id}` }]);
            }

            text += `_Total: ${allProducts.length} product_`;
            inlineKeyboard.push([{ text: '🔙 Back', callback_data: 'back-to-adminmenu' }]);

            ctx.editMessageText(text, {
                reply_markup: { inline_keyboard: inlineKeyboard },
                parse_mode: "Markdown"
            });
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, err.message);
            ctx.answerCbQuery("⚠️ Error saat menghapus product!", { show_alert: true });
        }
    }

    async handleCheckStatus(ctx) {
        // Jawab segera agar Telegram tidak timeout (maks 30 detik)
        try { await ctx.answerCbQuery('⏳ Sedang mengecek status pembayaran...'); } catch (_) {}

        try {
            const callbackData = ctx.callbackQuery.data;
            const match = callbackData.match(/^check-status-(.+)$/);
            if (!match) return;

            const uniqCode = match[1];
            const fs = require('fs');
            const path = require('path');
            const { checkStatus } = require('../utils/gopayGateway');

            // Ambil transaksi dari DB
            const transaction = db.prepare(`
                SELECT * FROM order_transactions 
                WHERE transactionId = ? AND isSuccess = 0 AND isCanceled = 0
            `).get(uniqCode);

            if (!transaction) {
                // Cek apakah transaksi memang sudah sukses sebelumnya
                const doneTransaction = db.prepare(`
                    SELECT * FROM order_transactions WHERE transactionId = ?
                `).get(uniqCode);

                if (doneTransaction && doneTransaction.isSuccess === 1) {
                    return ctx.reply('*✅ Transaksi ini sudah berhasil sebelumnya.*', { parse_mode: 'Markdown' });
                }
                if (doneTransaction && doneTransaction.isCanceled === 1) {
                    return ctx.reply('*❌ Transaksi ini sudah dibatalkan.*', { parse_mode: 'Markdown' });
                }
                return ctx.reply('*⚠️ Transaksi tidak ditemukan.*', { parse_mode: 'Markdown' });
            }

            if (!transaction.paymentKitaRefId) {
                return ctx.reply('*⚠️ Referensi pembayaran tidak ditemukan. Hubungi admin.*', { parse_mode: 'Markdown' });
            }

            // Panggil PaymentKita API
            let response;
            try {
                response = await checkStatus(transaction.paymentKitaRefId);
            } catch (apiErr) {
                console.error(`[ ERROR ] handleCheckStatus API: ${apiErr.message}`);
                return ctx.reply('*⚠️ Gagal menghubungi server pembayaran. Coba lagi beberapa saat lagi.*', { parse_mode: 'Markdown' });
            }

            console.log(`[ CHECK STATUS ] Response: ${JSON.stringify(response)}`);

            // Normalisasi status dari respon GoPay Gateway
            const outerStatus = (response?.status || '').toLowerCase();
            const innerStatus = (response?.data?.status || '').toLowerCase();
            const isPaid = (outerStatus === 'success') && (innerStatus === 'paid');

            if (!isPaid) {
                return ctx.reply(
                    `*⏳ Pembayaran belum terdeteksi.*\n\nSilakan selesaikan pembayaran lalu tekan *Check Status* lagi.\n\n_Status: ${response?.data?.status || 'Pending'}_`,
                    { parse_mode: 'Markdown' }
                );
            }

            // ── TRANSAKSI SUKSES ──────────────────────────────────────────

            // 1. Update DB
            db.prepare(`
                UPDATE order_transactions SET isSuccess = 1 
                WHERE transactionId = ? AND isSuccess = 0 AND isCanceled = 0
            `).run(uniqCode);

            // 2. Hapus pesan QRIS secara silent
            try {
                await ctx.telegram.deleteMessage(transaction.chatId, transaction.messageId);
            } catch (_) { /* pesan mungkin sudah dihapus */ }

            // 3. Ambil info produk & variant
            const productVariant = db.prepare(`
                SELECT * FROM product_variants WHERE codeVariant = ?
            `).get(transaction.productCode);

            const productName = productVariant
                ? productVariant.name.toUpperCase()
                : transaction.productCode.toUpperCase();

            // 4. Kirim pesan sukses ke user
            const successMessage =
                `「 TRANSAKSI BERHASIL 」\n` +
                `└ Produk: ${productName}\n` +
                `└ Jumlah: ${transaction.orderQuantity}\n` +
                `└ Total: Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n` +
                `Terimakasih sudah membeli produk kami 🙏.\n` +
                `Jika ada kendala pada akun segera chat admin @sphixray`;

            await ctx.telegram.sendMessage(transaction.chatId, successMessage);

            // 5. Buat file detail produk
            let terms = '';
            if (productVariant && productVariant.terms) {
                terms = productVariant.terms;
            } else {
                const settings = db.prepare(`SELECT term_conditions FROM settings ORDER BY id DESC LIMIT 1`).get();
                terms = settings ? settings.term_conditions : '';
            }

            let productInfoText = `「 TRANSAKSI BERHASIL 」\n\n`;
            productInfoText += `📦 Produk: ${productName}\n`;
            productInfoText += `📊 Jumlah: ${transaction.orderQuantity}\n`;
            productInfoText += `📅 Tanggal: ${transaction.formattedDate}\n`;
            productInfoText += `💰 Total Harga: Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n\n`;
            if (terms) productInfoText += `🔹 SYARAT & KETENTUAN 🔹\n${terms}\n\n`;
            productInfoText += `「 DETAIL AKUN 」\n\n`;
            productInfoText += (transaction.orderData || '').trim() || '(Tidak ada detail akun)';

            const tempFilePath = path.join(__dirname, '..', '..', `temp_${transaction.transactionId}.txt`);
            fs.writeFileSync(tempFilePath, productInfoText);

            await ctx.telegram.sendDocument(transaction.chatId, { source: tempFilePath }, {
                caption: `「 ${productName} 」`
            });

            try { fs.unlinkSync(tempFilePath); } catch (_) {}

            // 6. Notifikasi ke owner
            const ownerId = process.env.WHITELIST_ID;
            if (ownerId) {
                const orderLines = (transaction.orderData || '').split('\n');
                let stockId = '', email = '', password = '', profile = '', pin = '';
                for (const line of orderLines) {
                    const low = line.toLowerCase().trim();
                    if (low.startsWith('id stock:') && !stockId) stockId = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('email:') && !email) email = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('password:') && !password) password = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('profil:') && !profile) profile = line.split(':').slice(1).join(':').trim();
                    else if (low.startsWith('pin:') && !pin) pin = line.split(':').slice(1).join(':').trim();
                }

                const notifMsg =
                    `<b>NOTIFIKASI TRANSAKSI SUKSES (Manual Check)</b>\n` +
                    `ID Transaksi: <code>${transaction.transactionId}</code>\n` +
                    `User: <a href="tg://user?id=${transaction.telegramUserId}">${transaction.telegramUserId}</a>\n` +
                    `Produk: <b>${productName}</b>\n` +
                    `Total: Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n` +
                    `\n<b>Data Order:</b>\n` +
                    `ID Stock: ${stockId || 'N/A'}\n` +
                    `Email: ${email || 'N/A'}\n` +
                    `Password: ${password || 'N/A'}\n` +
                    `Profil: ${profile || 'N/A'}\n` +
                    `Pin: ${pin || 'N/A'}`;

                try {
                    await ctx.telegram.sendMessage(ownerId, notifMsg, { parse_mode: 'HTML' });
                } catch (_) {}
            }

            console.log(`[ CHECK STATUS ] Transaction ${uniqCode} marked SUCCESS via manual check.`);

        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]: handleCheckStatus: ${err.message}`, err.stack);
            try {
                await ctx.reply('*⚠️ Terjadi error saat cek status. Silakan coba lagi atau hubungi admin.*', { parse_mode: 'Markdown' });
            } catch (_) {}
        }
    }

}

module.exports = HandleAction;