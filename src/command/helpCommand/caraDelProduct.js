const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');

const caraDelProduct = async (ctx) => {
    try {
        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/caradelproduct.png'), {
            caption: "*\\[ CARA DELETE PRODUCT \\]*\n" +
                "Kalian cukup command /delproduct \\<number_produk\\> untuk number_produk yang kamu masukkan adalah angka product nya yang dari listproduct\n\n" +
                "*Contoh :* /delproduct 1",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🔙 Back', callback_data: 'back-to-adminmenu' },
                    ]
                ]
            },
            parse_mode: "MarkdownV2"
        });
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND TUTORIAL⚠️*", {
            parse_mode: "Markdown",
        });
        console.log(
            clc.red.bold("[ INFO ]") +
            ` [${moment().format('HH:mm:ss')}]:` +
            clc.blueBright(` Something error in file command/helpCommand/caraDelProduct.js :  ${err.message}`)
        );
    }
};

module.exports = caraDelProduct;
