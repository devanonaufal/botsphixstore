const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraBroadcast = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/carabroadcast.png'), {
            caption: "*[ CARA BROADCAST ]*\nCara broadcast cukup mudah hanya dengan cara mengetik command `/broadcast <message>`\n\n*Contoh :* `/broadcast Halo, Semua!`",
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
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/carabroadcast.js :  ${err.message}`));
    }
}

module.exports = caraBroadcast