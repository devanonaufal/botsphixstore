const moment = require('moment-timezone');
const clc = require('cli-color');
const { Input } = require('telegraf');
const caraAddVariant = async (ctx) => {
    try {

        if (process.env.WHITELIST_ID != ctx.from.id) {
            return;
        }

        await ctx.telegram.sendPhoto(ctx.from.id, Input.fromLocalFile('src/img/caraaddvariant.png'), {
            caption: "*[ CARA ADD VARIANT ]*\nCara menambahkan variant product adalah dengan cukup ketik command /addvariant untuk bagian *Number product* kalian cukup masukkan nomor product yang ingin di masukkan\n\n*Contoh Number product jika ingin menambahkan product1️⃣ maka masukkan angka 1*\n\n*❗Harap perhatikan lebih baik gambar nya dan jangan lupa reply juga keterangan nya*",
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
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/helpCommand/caraAddVariant.js :  ${err.message}`));
    }
}

module.exports = caraAddVariant