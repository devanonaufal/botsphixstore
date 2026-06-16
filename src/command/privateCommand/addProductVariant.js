const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone')

let addProductVariants_is = false;

const setAddProductVarinatsIs = (value) => {
    addProductVariants_is = value;

    setTimeout(() => {
        addProductVariants_is = false;
    }, 10 * 60 * 1000);
}

const getAddProductVariantsIs = () => {
    return addProductVariants_is;
}

const addProductVariants = async (ctx) => {
    try {
        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }
        const db = getDatabase();
        const products = db.prepare(`SELECT code, name FROM products ORDER BY code ASC`).all();

        let productList = "*📦 LIST PRODUCT (untuk Number Product):*\n";
        if (products.length === 0) {
            productList += "_Belum ada product. Tambahkan dulu dengan /addproduct_\n";
        } else {
            for (const p of products) {
                productList += `  *[ ${p.code} ]* ${p.name}\n`;
            }
        }

        await ctx.replyWithMarkdown(productList);

        const message = "*HARAP ISI DATA ADD PRODUCT VARIANT DI BAWAH👇*\n```\nName Variant :\nNumber Product :\nCode Variant :\nPrice (Hanya Angka!) :\nDeskripsi Variant :\nTerms : (opsional)```";

        await ctx.replyWithMarkdown(message);
        ctx.replyWithMarkdown("*Harap isi data di atas dan masukkan Number Product sesuai list di atas*");

        // Set addProduct_is ke true
        setAddProductVarinatsIs(true);
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN PRIVATE COMMAND ADD PRODUCT⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/addProductVariants.js  ${err.message}`));
    }
}

module.exports = { addProductVariants, getAddProductVariantsIs, setAddProductVarinatsIs };