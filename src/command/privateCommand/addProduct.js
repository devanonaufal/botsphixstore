const { getDatabase } = require('../../database/connect');
const clc = require('cli-color');
const moment = require('moment-timezone');

let addProduct_is = false;

// Setter untuk memperbarui nilai addProduct_is
const setAddProductIs = (value) => {
    addProduct_is = value;

    setTimeout(() => {
        addProduct_is = false;
    }, 10 * 60 * 1000);
}

// Getter untuk mengambil nilai addProduct_is
const getAddProductIs = () => {
    return addProduct_is;
}

const addProduct = async (ctx) => {
    try {
        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        const db = getDatabase(); // Ensure db is initialized
        const message = "*HARAP ISI DATA ADD PRODUCT DI BAWAH DENGAN CARA COPAS👇*\n```\nName Product :\nDeskripsi Product :```";

        await ctx.replyWithMarkdown(message);
        ctx.replyWithMarkdown("*Harap isi data di atas jika ingin menambahkan product*");

        // Set addProduct_is ke true
        setAddProductIs(true);
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN PRIVATE COMMAND ADD PRODUCT⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/addProduct.js  ${err.message}`));
    }
}

// Mengekspor fungsi dan getter/setter
module.exports = { addProduct, getAddProductIs, setAddProductIs };