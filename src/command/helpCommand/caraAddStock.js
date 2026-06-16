const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraAddStock = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/caraaddstock.png'), {
            caption: "*[ CARA ADD STOCK ]*\nKalian tinggal kirim data nya seperti gambar di atas dan reply data stock nya dengan command\n\n*❗Harap perhatikan lebih baik gambar nya*",
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
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/caraAddStock.js :  ${err.message}`));
    }
}

module.exports = caraAddStock