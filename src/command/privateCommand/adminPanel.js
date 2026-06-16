const clc = require('cli-color');
const moment = require('moment-timezone')

const adminPanelCommand = async (ctx) => {
    try {
        if (process.env.WHITELIST_ID != ctx.from.id) {
            return
        }

        const text = `
*[ ADMIN HELP ]*

LIST COMMAND BANTUAN :
/caraaddproduct
/caradelproduct
/caraaddvariant
/caradelvariant
/caraaddstock
/caradelstock
/carasetharga
/carabroadcast

*[ KELOLA AKSES USER ]*
/listpending - Lihat user menunggu approval
/listusers - Lihat user yang sudah aktif
/approveuser <id> - Setujui akses user
/removeuser <id> - Hapus akses user
/cekid <id> - Cek informasi user berdasarkan ID

*[ HAPUS PRODUCT & VARIANT ]*
/delvarianttype <nama> - Hapus semua stock variant berdasarkan nama
/liststock - Lihat detail semua stock
/delstockid <id> - Hapus stock berdasarkan ID

*Untuk melihat list product & variant klik tombol di bawah👇*`

        ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📦 List Product', callback_data: 'admin-list-product' },
                        { text: '📋 List Variant', callback_data: 'admin-list-variant' },
                    ],
                    [
                        { text: '📃 Show Code', callback_data: 'show-code-variant' },
                    ]
                ]
            },
            parse_mode: "Markdown"
        })
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND ADMIN PANEL⚠️*", {
            parse_mode: "Markdown",
        })
        console.log(clc.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + clc.blueBright(` Something error in file command/privateCommand/adminPanel.js :  ${err.message}`));
    }
}

module.exports = adminPanelCommand