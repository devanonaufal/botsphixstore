const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

const delProduct = async (ctx) => {
    try {
        const db = getDatabase(); // Ensure db is initialized

        if (ctx.from.id != process.env.WHITELIST_ID) {
            return;
        }

        const code = ctx.message.text.split(" ");
        const cekProduk = db.prepare(`
            SELECT * FROM products WHERE code = ?
        `).get(code[1]);

        if (!cekProduk) {
            await ctx.reply("*❗Code yang kamu masukkan tidak di temukan*", {
                parse_mode: "Markdown",
            });
            return;
        }

        // Ambil semua codeVariant dari product ini untuk hapus stock
        const variants = db.prepare(`
            SELECT codeVariant FROM product_variants WHERE code = ?
        `).all(parseInt(code[1]));

        // Hapus semua stock dari setiap variant
        const deleteStock = db.prepare(`
            DELETE FROM stock_data_variants WHERE codeVariant = ?
        `);
        for (const variant of variants) {
            deleteStock.run(variant.codeVariant);
        }

        // Hapus semua variant dari product
        db.prepare(`
            DELETE FROM product_variants WHERE code = ?
        `).run(parseInt(code[1]));

        // Hapus product
        db.prepare(`
            DELETE FROM products WHERE code = ?
        `).run(parseInt(code[1]));

        const remainingProducts = db.prepare(`
            SELECT * FROM products ORDER BY code ASC
        `).all();

        const updateProductCode = db.prepare(`
            UPDATE products SET code = ? WHERE id = ?
        `);

        const updateVariantCode = db.prepare(`
            UPDATE product_variants SET code = ? WHERE code = ?
        `);

        for (let i = 0; i < remainingProducts.length; i++) {
            const newCode = i + 1;

            updateProductCode.run(newCode, remainingProducts[i].id);
            updateVariantCode.run(newCode, remainingProducts[i].code);
        }

        await ctx.reply(`*✅ Berhasil menghapus product "${cekProduk.name}"*\n📦 Variant dihapus: ${variants.length}\n🗑 Nomor list sudah di-reset otomatis.`, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND DEL PRODUCT⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/delProductVariant.js :  ${err.message}`));
    }
};

module.exports = delProduct;