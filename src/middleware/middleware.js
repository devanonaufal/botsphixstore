const { getDatabase } = require('../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');
const { getAddProductIs, setAddProductIs } = require("../command/privateCommand/addProduct");
const { getAddProductVariantsIs, setAddProductVarinatsIs } = require("../command/privateCommand/addProductVariant");

const middleware = async (ctx, next) => {
    try {
        const db = getDatabase(); // Ensure db is initialized
        const userId = ctx.from.id;
        const username = ctx.from.username || '';

        // Admin selalu diizinkan
        if (String(userId) !== String(process.env.WHITELIST_ID)) {
            const allowedUser = db.prepare(`
                SELECT * FROM allowed_users WHERE idTelegram = ?
            `).get(userId);

            if (!allowedUser) {
                // Tambahkan user ke daftar pending
                db.prepare(`
                    INSERT OR IGNORE INTO allowed_users (idTelegram, usernameTelegram, approved) VALUES (?, ?, 0)
                `).run(userId, username);

                return ctx.reply("⏳ Akun kamu sedang menunggu persetujuan admin.\n\nKalau ingin ajukan approval, hubungi admin:\n📱 WhatsApp: +6281283933929 (Fajar)");
            }

            if (allowedUser.approved !== 1) {
                return ctx.reply("⏳ Akun kamu sedang menunggu persetujuan admin.\n\nKalau ingin ajukan approval, hubungi admin:\n📱 WhatsApp: +6281283933929 (Fajar)");
            }
        }

        const userMessage = ctx.message.text;

        if (userMessage.includes("Deskripsi Product :") && userMessage.includes("Name Product :")) {
            const nameMatch = userMessage.match(/Name Product\s*:\s*(.+)/);
            const deskripsiMatch = userMessage.match(/Deskripsi Product\s*:\s*(.+)/);

            const nameProduct = nameMatch ? nameMatch[1].trim() : null;
            const deskripsiProduct = deskripsiMatch ? deskripsiMatch[1].trim() : null;

            if (nameProduct && deskripsiProduct && getAddProductIs()) {
                const getProductCount = db.prepare(`
                    SELECT COUNT(*) AS count FROM products
                `).get().count;

                db.prepare(`
                    INSERT INTO products (name, description, code) VALUES (?, ?, ?)
                `).run(nameProduct, deskripsiProduct, getProductCount + 1);

                setAddProductIs(false);
                console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Successfully added new product ${nameProduct}`));
                ctx.replyWithMarkdown(`*Success add new product ${nameProduct}✅*`);
            }
        }

        if (userMessage.includes("Name Variant :") && userMessage.includes("Number Product :") && userMessage.includes("Code Variant :") && userMessage.includes("Price (Hanya Angka!) :") && userMessage.includes("Deskripsi Variant :")) {
            const nameMatch = userMessage.match(/Name Variant\s*:\s*(.+)/);
            const codeMatch = userMessage.match(/Code Variant\s*:\s*(.+)/);
            const priceMatch = userMessage.match(/Price \(Hanya Angka!\)\s*:\s*(\d+)/);
            const numberListMatch = userMessage.match(/Number Product\s*:\s*(\d+)/);
            const deskripsiMatch = userMessage.match(/Deskripsi Variant\s*:\s*(.+)/);
            const termsMatch = userMessage.match(/Terms\s*:\s*(.+)/s);
            const textReply = ctx.message?.reply_to_message?.text ?? "";

            if (textReply === "") {
                return ctx.reply("*⚠️ HARAP ISI KETERANGAN VARIANT DENGAN CARA DI REPLY! ⚠️*", {
                    parse_mode: "Markdown"
                });
            }

            if (nameMatch && codeMatch && priceMatch && deskripsiMatch && numberListMatch && getAddProductVariantsIs()) {
                const nameVariant = nameMatch[1].trim();
                const codeVariant = codeMatch[1].trim().toLowerCase();
                const price = priceMatch[1].trim();
                const deskripsiVariant = deskripsiMatch[1].trim();
                const numberListProduct = numberListMatch[1].trim();
                const terms = termsMatch ? termsMatch[1].trim() : '';

                const checkProduct = db.prepare(`
                    SELECT * FROM products WHERE code = ?
                `).get(numberListProduct);

                if (!checkProduct) {
                    return ctx.reply("*⚠️ MASUKKAN NOMOR LIST PRODUCT YANG TERSEDIA! ⚠️*", {
                        parse_mode: "Markdown"
                    });
                }

                db.prepare(`
                    INSERT INTO product_variants (name, code, codeVariant, descriptionVariant, price, keteranganVariant, terms) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(nameVariant, numberListProduct, codeVariant, deskripsiVariant, price, textReply, terms);

                setAddProductVarinatsIs(false);
                console.log(clc.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Successfully added new product variant ${nameVariant}`));
                ctx.replyWithMarkdown(`*Success add new product variant ${nameVariant}✅*`);
            }
        }

        if (ctx.message.text === '/updatesticker') {
            return next();
        }

        return next();
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN MIDDLEWARE⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file middleware.js: ${err.message}`));
        return next();
    }
};

module.exports = middleware;
