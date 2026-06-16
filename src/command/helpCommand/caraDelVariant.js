const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraDelVariant = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/caradelvariants.png'), {
            caption: "*[ CARA DELETE VARIANT ]*\nCara untuk menghapus variant product hanya dengan cara mengetik command `/delvariant <code_variant>`\n\n*Contoh :* `/delvariant spo1b`",
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
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/caraDelVariant.js :  ${err.message}`));
    }
}

module.exports = caraDelVariant