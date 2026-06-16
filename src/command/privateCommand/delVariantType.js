const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

const delVariantType = async (ctx) => {
    try {
        const db = getDatabase();

        if (ctx.from.id != process.env.WHITELIST_ID) {
            return;
        }

        const args = ctx.message.text.split(" ");
        if (args.length < 2) {
            return ctx.reply("*❗Gunakan: /delvarianttype <nama variant>*\n\nContoh: `/delvarianttype Durasi 1 Bulan`", {
                parse_mode: "Markdown",
            });
        }

        const variantName = args.slice(1).join(" ");

        // Cari semua variant dengan nama tersebut
        const variants = db.prepare(`
            SELECT * FROM product_variants WHERE name = ?
        `).all(variantName);

        if (variants.length === 0) {
            return ctx.reply(`*❗Tidak ada variant dengan nama "${variantName}"*`, {
                parse_mode: "Markdown",
            });
        }

        let totalStockDeleted = 0;

        // Hapus stock saja, variant tetap ada
        const deleteStock = db.prepare(`DELETE FROM stock_data_variants WHERE codeVariant = ?`);

        for (const variant of variants) {
            const stockResult = deleteStock.run(variant.codeVariant);
            totalStockDeleted += stockResult.changes;
        }

        await ctx.reply(
            `*✅ Berhasil menghapus semua stock variant "${variantName}"*\n` +
            `📋 Variant: ${variants.length}\n` +
            `📦 Stock dihapus: ${totalStockDeleted}`,
            { parse_mode: "Markdown" }
        );
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND DEL VARIANT TYPE⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/delVariantType.js :  ${err.message}`));
    }
};

module.exports = delVariantType;
