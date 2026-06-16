const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraAddProduct = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/caraaddproduct.png'), {
            caption: "*[ CARA ADD PRODUCT ]*\nKalian tinggal command `/addproduct` dan tinggal isi apa yang disuruhkan oleh bot\n\n*Contoh nya seperti gambar di atas🔍*",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🔙 Back', callback_data: 'back-to-adminmenu' },
                    ]
                ]
            },
            parse_mode: "Markdown"
        })
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND TUTORIAL⚠️*", {
            parse_mode: "Markdown",
        })
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/caraAddProduct.js :  ${err.message}`));
    }
}

module.exports = caraAddProduct