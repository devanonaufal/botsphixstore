const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
const moment = require('moment-timezone');
class HandleHears {
    async handleProductByCode(ctx, codeNumber) {
        try {
            // Delete previous message if it's a callback query
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                try {
                    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                } catch (e) {
                    console.log(`[ WARNING ] Gagal menghapus pesan: ${e.message}`);
                }
            }

            const getProduct = db.prepare(`
                SELECT * FROM products WHERE code = ?
            `).get(codeNumber);

            if (!getProduct) {
                return ctx.reply("*⚠️ Product tidak ditemukan ⚠️*", { parse_mode: "Markdown" });
            }

            const getAllProductVariant = db.prepare(`
                SELECT * FROM product_variants WHERE code = ?
            `).all(codeNumber) || [];

            if (getAllProductVariant.length === 0) {
                return ctx.reply(
                    "⚠️ VARIANT PRODUCTS BELUM ADA ⚠️",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🔙 Back', callback_data: 'back-to-listproduct' }]
                            ]
                        }
                    }
                );
            }

            const escapeMarkdown = (t) => String(t).replace(/[_*[\]()~`>#+=|{}.!-]/g, m => `\\${m}`);

            let text = `*╭──── ${escapeMarkdown(getProduct.name)} ────╮*\n`;
            text += `*│*\n`;
            text += `*│ 📝 Deskripsi:*\n`;
            text += `*│* ${escapeMarkdown(getProduct.description)}\n`;
            text += `*│*\n`;
            text += `*│ 📦 Variant Tersedia:*\n`;

            for (const variant of getAllProductVariant) {
                const stockCount = db.prepare(`
                    SELECT COUNT(*) AS count FROM stock_data_variants WHERE codeVariant = ?
                `).get(variant.codeVariant).count;

                const soldRow = db.prepare(`
                    SELECT COALESCE(SUM(orderQuantity), 0) AS totalSold
                    FROM order_transactions
                    WHERE productCode = ? AND isSuccess = 1
                `).get(variant.codeVariant);
                const totalSold = soldRow ? soldRow.totalSold : 0;

                text += `*│*  • ${escapeMarkdown(variant.name)} \\- Rp ${escapeMarkdown(variant.price.toLocaleString('id-ID'))} \\(Stock: ${escapeMarkdown(stockCount)}\\) \\(terjual: ${escapeMarkdown(totalSold)}\\)\n`;
            }

            text += `*│*\n`;
            text += `*╰────────────────────╯*\n\n`;
            text += `Pilih variant di bawah untuk melakukan order:`;

            function addButton(inlineKeyboard, btnText, callbackData) {
                const newButton = { text: btnText, callback_data: callbackData };
                if (inlineKeyboard.length === 0 || inlineKeyboard[inlineKeyboard.length - 1].length >= 2) {
                    inlineKeyboard.push([newButton]);
                } else {
                    inlineKeyboard[inlineKeyboard.length - 1].push(newButton);
                }
                return inlineKeyboard;
            }

            let inlineKeyboard = [];
            for (const data of getAllProductVariant) {
                inlineKeyboard = addButton(inlineKeyboard, `${data.name} 📦`, `variant-${data.codeVariant.toLowerCase()}`);
            }
            inlineKeyboard.push([{ text: "🔙 Back", callback_data: "back-to-product-list" }]);

            await ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                },
                parse_mode: "MarkdownV2"
            });
        } catch (err) {
            ctx.reply("⚠️SOMETHING ERROR IN HANDLE ACTION⚠️");
            console.error(`[ ERROR ] [${moment().format('HH:mm:ss')}]:`, err.message);
        }
    }

    async handleProductList(ctx) {
        try {
            const message = ctx.message.text;
            const numberRegex = /^\d+$/;

            if (numberRegex.test(message)) {
                const codeNumber = message;

                const getProduct = db.prepare(`
                    SELECT * FROM products WHERE code = ?
                `).get(codeNumber);

                if (!getProduct) return;

                const getAllProductVariant = db.prepare(`
                    SELECT * FROM product_variants WHERE code = ?
                `).all(codeNumber) || [];

                if (getAllProductVariant.length === 0) {
                    return ctx.reply(
                        "*⚠️ VARIANT PRODUCTS BELUM ADA ⚠️*",
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '🔙 Back', callback_data: 'back-to-listproduct' },
                                    ]
                                ]
                            },
                            parse_mode: 'Markdown'
                        }
                    );
                }

                const escapeMarkdown = (t) => String(t).replace(/[_*[\]()~`>#+=|{}.!-]/g, m => `\\${m}`);

                let text = `*╭──── ${escapeMarkdown(getProduct.name)} ────╮*\n`;
                text += `*│*\n`;
                text += `*│ 📝 Deskripsi:*\n`;
                text += `*│* ${escapeMarkdown(getProduct.description)}\n`;
                text += `*│*\n`;
                text += `*│ 📦 Variant Tersedia:*\n`;

                for (const variant of getAllProductVariant) {
                    const stockCount = db.prepare(`
                        SELECT COUNT(*) AS count FROM stock_data_variants WHERE codeVariant = ?
                    `).get(variant.codeVariant).count;

                    const soldRow = db.prepare(`
                        SELECT COALESCE(SUM(orderQuantity), 0) AS totalSold
                        FROM order_transactions
                        WHERE productCode = ? AND isSuccess = 1
                    `).get(variant.codeVariant);
                    const totalSold = soldRow ? soldRow.totalSold : 0;

                    text += `*│*  • ${escapeMarkdown(variant.name)} \\- Rp ${escapeMarkdown(variant.price.toLocaleString('id-ID'))} \\(Stock: ${escapeMarkdown(stockCount)}\\) \\(terjual: ${escapeMarkdown(totalSold)}\\)\n`;
                }

                text += `*│*\n`;
                text += `*╰────────────────────╯*\n\n`;
                text += `Pilih variant di bawah untuk melakukan order:`;

                function addButton(inlineKeyboard, btnText, callbackData) {
                    const newButton = { text: btnText, callback_data: callbackData };
                    if (inlineKeyboard.length === 0 || inlineKeyboard[inlineKeyboard.length - 1].length >= 2) {
                        inlineKeyboard.push([newButton]);
                    } else {
                        inlineKeyboard[inlineKeyboard.length - 1].push(newButton);
                    }
                    return inlineKeyboard;
                }

                let inlineKeyboard = [];
                for (const data of getAllProductVariant) {
                    inlineKeyboard = addButton(inlineKeyboard, `${data.name} 📦`, `variant-${data.codeVariant.toLowerCase()}`);
                }
                inlineKeyboard.push([{ text: "🔙 Back", callback_data: "back-to-product-list" }]);

                await ctx.reply(text, {
                    reply_markup: {
                        inline_keyboard: inlineKeyboard
                    },
                    parse_mode: "MarkdownV2"
                });
            }
        } catch (err) {
            ctx.reply("*⚠️SOMETHING ERROR IN HANDLE ACTION⚠️*", {
                parse_mode: "Markdown",
            });
            console.error(`[ ERROR ] [${moment().format('HH:mm:ss')}]:`, err.message);
        }
    }

    // Helper to escape Telegram MarkdownV2 reserved characters
    escapeMarkdown(text) {
        return String(text).replace(/[\\`*_\[\]()~>#+\-=|{}.!]/g, (match) => `\\${match}`);
    }

    async GetTopBuyer(ctx) {
        try {
            // Delete previous message if it's a callback query
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                try {
                    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                } catch (e) {
                    console.log(clc.yellow("[ WARNING ]") + ` Gagal menghapus pesan: ${e.message}`);
                }
            }

            const topBuyers = db.prepare(`
                SELECT telegramUserId AS id, SUM(totalPrice) AS totalSpent, COUNT(*) AS totalOrders
                FROM order_transactions
                WHERE isSuccess = 1
                GROUP BY telegramUserId
                ORDER BY totalSpent DESC
                LIMIT 5
            `).all();

            let buyerMessage = "*🎉 Top 5 Buyers 🎉*\n";
            buyerMessage += "🔥 Berikut adalah pelanggan paling loyal dengan total belanja tertinggi: 🔥\n";
            topBuyers.forEach((buyer, index) => {
                const safeId = this.escapeMarkdown(buyer.id);
                const safeTotalSpent = this.escapeMarkdown(buyer.totalSpent.toLocaleString('id-ID'));
                const safeTotalOrders = this.escapeMarkdown(buyer.totalOrders);
                buyerMessage += `\n${index + 1}\\. 🏆 *User ID:* \`${safeId}\`\n   💰 *Total Belanja:* Rp${safeTotalSpent}\n   📦 *Total Pesanan:* ${safeTotalOrders} transaksi\n`;
            });

            await ctx.reply(`${buyerMessage}`, { parse_mode: "MarkdownV2" });
        } catch (error) {
            console.error("Error fetching top buyers:", error);
            await ctx.reply("*⚠️ Terjadi kesalahan saat mengambil data Top Buyers ⚠️*", { parse_mode: "Markdown" });
        }
    }

    async GetTopProduct(ctx) {
        try {
            // Delete previous message if it's a callback query
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                try {
                    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                } catch (e) {
                    console.log(clc.yellow("[ WARNING ]") + ` Gagal menghapus pesan: ${e.message}`);
                }
            }

            const topProducts = db.prepare(`
                SELECT ot.productCode AS codeVariant, pv.name AS variantName, p.name AS productName,
                       SUM(ot.orderQuantity) AS totalSold, SUM(ot.totalPrice) AS revenue
                FROM order_transactions ot
                LEFT JOIN product_variants pv ON ot.productCode = pv.codeVariant
                LEFT JOIN products p ON pv.code = p.code
                WHERE ot.isSuccess = 1
                GROUP BY ot.productCode
                ORDER BY totalSold DESC
                LIMIT 10
            `).all();

            let productMessage = "\n*📦 Top 10 Products 📦*\n";
            productMessage += "✨ Produk\\-produk yang paling laris di toko kami: ✨\n";
            topProducts.forEach((product, index) => {
                const safeProductName = this.escapeMarkdown(product.productName || '?');
                const safeVariantName = this.escapeMarkdown(product.variantName || product.codeVariant);
                const safeTotalSold = this.escapeMarkdown(product.totalSold);
                const safeRevenue = this.escapeMarkdown(product.revenue.toLocaleString('id-ID'));
                productMessage += `\n${index + 1}\\. 🏷 *${safeProductName}* \\| *${safeVariantName}*\n   🔢 *Terjual:* ${safeTotalSold}x  💵 *Rp${safeRevenue}*\n`;
            });

            await ctx.reply(`${productMessage}`, { parse_mode: "MarkdownV2" });
        } catch (error) {
            console.error("Error fetching top products:", error);
            await ctx.reply("*⚠️ Terjadi kesalahan saat mengambil data Top Products ⚠️*", { parse_mode: "Markdown" });
        }
    }
}

module.exports = HandleHears;