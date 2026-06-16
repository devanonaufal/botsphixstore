const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraSetHarga = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/carasetharga.png'), {
            caption: "*[ CARA SET HARGA ]*\nCara mengatur harga product variant hanya dengan cara `/setharga <new_price> <code_variant>` dan new price hanya boleh angka saja!\n\n*Contoh :* `/setharga 20000 net1b`",
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
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/caraSetHarga.js :  ${err.message}`));
    }
}

module.exports = caraSetHarga