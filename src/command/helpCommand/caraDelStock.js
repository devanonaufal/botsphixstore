const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraDelStock = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/caradelstock.png'), {
            caption: "*[ CARA DELETE STOCK ]*\nCara nya hampir sama dengan addstock tetapi cara kerja nya mengahapus data untuk mengahpus stock kamu hanya dengan cara mengetik command `/delstock <code_variant>`",
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
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/caraDelStock.js :  ${err.message}`));
    }
}

module.exports = caraDelStock