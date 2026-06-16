const { Markup, Input } = require("telegraf");
const clc = require('cli-color');
const moment = require('moment-timezone');

const helpCommand = async (ctx) => {
    try {
        // Delete previous message if it's a callback query
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
            try {
                await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
            } catch (e) {
                console.log(clc.yellow("[ WARNING ]") + ` Gagal menghapus pesan: ${e.message}`);
            }
        }

        const reminderMessage = await ctx.reply("*Harap tunggu 1-15 Detik⏲️*", {
            parse_mode: "Markdown"
        });

        await ctx.telegram.sendVideo(ctx.from.id, Input.fromLocalFile('src/img/tutorialvideo.mp4'), {
            caption: "*[ HOW TO ORDER❓]*\n\nTidak tahu cara memesan produk? Tenang saja, kami menyediakan video tutorial nya👆",
            parse_mode: "Markdown"
        });

        await ctx.deleteMessage(reminderMessage.message_id);

    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND HELP*", {
            parse_mode: "Markdown",
        });
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/publicCommand/help.js.js  ${err.message}`));
    }
};

module.exports = helpCommand;
