const db = require('../../database/models/settingModels');

module.exports = async function updateSticker(ctx) {
    try {
        if (!ctx.message.sticker) {
            return ctx.reply("⚠️ Harap kirimkan sticker untuk diupdate.");
        }

        const fileId = ctx.message.sticker.file_id;

        // Update sticker in the database
        db.prepare(`DELETE FROM stickers`).run();
        db.prepare(`INSERT INTO stickers (fileId) VALUES (?)`).run(fileId);

        ctx.reply("✅ Sticker berhasil diupdate.");
    } catch (error) {
        console.error("Error updating sticker:", error);
        ctx.reply("⚠️ Terjadi kesalahan saat mengupdate sticker.");
    }
};