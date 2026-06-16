const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

async function updateTermsAndConditions(ctx) {
    const adminId = process.env.WHITELIST_ID;
    if (String(ctx.from.id) !== String(adminId)) {
        return ctx.reply('❌ Anda tidak memiliki izin untuk mengubah Terms & Conditions.');
    }

    // Ambil teks dari reply
    const replyText = ctx.message?.reply_to_message?.text ?? '';
    if (!replyText) {
        return ctx.reply('⚠️ Silakan reply pesan yang berisi Terms & Conditions baru, lalu gunakan perintah /updateterm <produk> <varian>');
    }

    // Ambil produk dan varian dari perintah
    const commandParts = ctx.message.text.split(' ');
    if (commandParts.length < 3) {
        return ctx.reply('⚠️ Format perintah salah. Gunakan /updateterm <produk> <varian>');
    }

    const product = commandParts[1];
    const variant = commandParts[2];

    try {
        // Perbarui atau tambahkan Terms & Conditions untuk produk dan varian tertentu
        db.prepare(`INSERT INTO terms_conditions (product, variant, term_conditions, updatedAt) 
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
                    ON CONFLICT(product, variant) DO UPDATE SET term_conditions = ?, updatedAt = CURRENT_TIMESTAMP`)
          .run(product, variant, replyText, replyText);

        ctx.reply(`✅ Terms & Conditions untuk produk "${product}" dengan varian "${variant}" berhasil diupdate!`);
    } catch (err) {
        ctx.reply('❌ Gagal update Terms & Conditions.');
    }
}

async function getTermsAndConditions(product, variant) {
    try {
        const row = db.prepare('SELECT term_conditions FROM terms_conditions WHERE product = ? AND variant = ?').get(product, variant);
        return row ? row.term_conditions : null;
    } catch (err) {
        console.error('Error fetching Terms & Conditions:', err);
        return null;
    }
}

module.exports = {
    updateTermsAndConditions,
    getTermsAndConditions
};