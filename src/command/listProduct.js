const Database = require('better-sqlite3');
const clc = require("cli-color");
const moment = require('moment-timezone');

async function listProduct(ctx) {
    try {
        const db = new Database('./database.sqlite', { verbose: false});//Ensure db is initialized
        const products = db.prepare(`
            SELECT * FROM products
        `).all();

        if (products.length === 0) {
            return ctx.reply("*⚠️ No products available at the moment ⚠️*", {
                parse_mode: "Markdown",
            });
        }

        let productList = "*📦 Available Products 📦*\n\n";
        products.forEach((product, index) => {
            productList += `${index + 1}. *${product.name}*\n   - Description: ${product.description}\n   - Code: ${product.code}\n\n`;
        });

        await ctx.reply(productList, {
            parse_mode: "Markdown",
        });
    } catch (err) {
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/listProduct.js: ${err.message}`));
        ctx.reply("*⚠️ An error occurred while fetching the product list. Please try again later.*", {
            parse_mode: "Markdown",
        });
    }
}

module.exports = listProduct;
