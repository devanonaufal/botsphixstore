require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const clc = require("cli-color");
const moment = require("moment-timezone");
const figlet = require("figlet");

const HandleHears = require("./src/handler/HandleHears");
const handleHears = new HandleHears();

const HandleAction = require("./src/handler/HandleAction");
const handleAction = new HandleAction();

moment.tz.setDefault("Asia/Jakarta");

const { connectDatabase } = require("./src/database/connect");
const command = require("./src/command/exportCommand");
const updateSticker = require("./src/command/privateCommand/updateSticker");

const middleware = require("./src/middleware/middleware");
const ProcessingTransaction = require("./ProcessTransaction");
const { startWebhookServer } = require("./src/webhook/webhookServer");

const token_bot = process.env.BOT_TOKEN;

if (!token_bot || !process.env.WHITELIST_ID) {
  console.error("Harap isi semua yang ada di file .env");
  process.exit(1);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

var bot = new Telegraf(token_bot);

bot.telegram.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "infobot", description: "Info Bot" },
  { command: "adminmenu", description: "Open admin panel" },
]);

bot.on("text", (ctx, next) => middleware(ctx, next));

// Access check untuk callback query (inline buttons)
bot.on("callback_query", async (ctx, next) => {
  const { getDatabase } = require("./src/database/connect");
  try {
    const userId = ctx.from.id;
    if (String(userId) === String(process.env.WHITELIST_ID)) return next();

    const db = getDatabase();
    const allowedUser = db
      .prepare(`SELECT * FROM allowed_users WHERE idTelegram = ?`)
      .get(userId);

    if (!allowedUser || allowedUser.approved !== 1) {
      return ctx.answerCbQuery(
        "⏳ Akun kamu belum disetujui admin. Hubungi WA: +6282234940310 (SphixRay)",
        { show_alert: true }
      );
    }
    return next();
  } catch (err) {
    return next();
  }
});

//help command
bot.command("carasetharga", command.caraSetHarga);
bot.command("caradelvariant", command.caraDelVariant);
bot.command("caraaddstock", command.caraAddStock);
bot.command("caraaddproduct", command.caraAddProduct);
bot.command("caraaddvariant", command.caraAddVariant);
bot.command("carabroadcast", command.caraBroadcast);
bot.command("caradelstock", command.caraDelStock);
bot.command("caradelproduct", command.caraDelProduct);

bot.start(command.startCommand);
bot.command("updateterm", command.updateTermsAndConditions);
bot.command("showstock", command.showStock);
bot.command(["addstock", "addstok"], command.addStock);
bot.command(["addproduct", "addproduk"], command.addProduct);
bot.command("broadcast", command.broadcastCommand);
bot.command(
  ["addproductvariant", "addproductvariants", "addvariant", "addvariants"],
  command.addProductVariants
);
bot.command("adminmenu", command.adminPanelCommand);
bot.command(["delproduk", "delproduct", "delproducts"], command.delProduct);
bot.command(
  [
    "delvariant",
    "delvariants",
    "delproductvariant",
    "delproductvariants",
    "delprodukvariant",
    "delprodukvariants",
  ],
  command.delProductVariant
);
bot.command(["delstock", "delstocks"], command.delStock);
bot.command("delvarianttype", command.delVariantType);
bot.command("liststock", command.listStock);
bot.command("delstockid", command.delStockById);
bot.command("setharga", command.setHarga);
bot.command("setterms", command.setTerms);
bot.command("infobot", (ctx) => {
  try {
    const text =
      "*❖ Creator Bot : SphixRay*\n*❖ Version : V1.0*\n\n*Want to buy my bot?? Chat me on Whatsapp Click below👇*";

    ctx.replyWithMarkdown(text, {
      ...Markup.inlineKeyboard([
        [Markup.button.url("Whatsapp 🪀", "https://wa.me/6282234940310")],
        [Markup.button.url("Telegram 👔", "https://t.me/sphixray")],
      ]),
    });
  } catch (err) {
    ctx.reply("*⚠️SOMETHING ERROR IN COMMAND INFO BOT⚠️*", {
      parse_mode: "Markdown",
    });
    console.log(
      clc.red.bold("[ INFO ]") +
        ` [${moment().format("HH:mm:ss")}]:` +
        clc.blueBright(
          ` Something error in file command/start.js  ${err.message}`
        )
    );
  }
});

//hears
bot.hears(/^\d+$/, (ctx) => handleHears.handleProductList(ctx));
bot.hears("🏅 Top Buyer", (ctx) => handleHears.GetTopBuyer(ctx));
bot.hears("🎟 Best Product", (ctx) => handleHears.GetTopProduct(ctx));
bot.hears("🏷 List Produk", command.listProduct);
bot.hears("🛒 Stock", command.showStock);

//action
bot.action(/^variant-(.+)$/, (ctx) => handleAction.ShowPesanan(ctx));
bot.action(["plus-order", "mines-order", "plus-order-2", "plus-order-5", "plus-order-10"], (ctx) =>
  handleAction.PlusMinesStockProduct(ctx)
);
bot.action("confirm-order", (ctx) => handleAction.ConfirmOrder(ctx));
bot.action("show-code-variant", (ctx) => {
  ctx.deleteMessage();
  handleAction.showAllproductVariant(ctx);
});
bot.action("admin-list-product", (ctx) => handleAction.adminListProduct(ctx));
bot.action("admin-list-variant", (ctx) => handleAction.adminListVariant(ctx));
bot.action("back-to-adminmenu", (ctx) => {
  ctx.deleteMessage();
  command.adminPanelCommand(ctx);
});
bot.action("cancel-order-pesanan", (ctx) => handleAction.cancelOrder(ctx));
bot.action(/^check-status-(.+)$/, (ctx) => handleAction.handleCheckStatus(ctx));
bot.action(["back-to-product-list", "back-to-listproduct"], async (ctx) => {
  await delay(1_800);
  if (ctx.callbackQuery && ctx.callbackQuery.message) {
    const messageId = ctx.callbackQuery.message.message_id;

    await ctx.deleteMessage(messageId);
  }
  await command.listProduct(ctx);
});
bot.action("refresh-stock", (ctx) => command.refreshStock(ctx));
bot.action("list_product", (ctx) => {
    ctx.deleteMessage().catch(()=>{});
    command.listProduct(ctx);
});
bot.action("show_stock", (ctx) => command.showStock(ctx));
bot.action("back-to-main", (ctx) => {
    ctx.deleteMessage().catch(()=>{});
    command.startCommand(ctx);
});
bot.action("best_product", (ctx) => handleHears.GetTopProduct(ctx));
bot.action("top_buyer", (ctx) => handleHears.GetTopBuyer(ctx));
bot.action(/^product-(.+)$/, (ctx) => {
    const code = ctx.match[1];
    handleHears.handleProductByCode(ctx, code);
});
bot.action(/^del-product-id-(\d+)$/, (ctx) => handleAction.deleteProductById(ctx));

// User management commands (admin only)
bot.command("approveuser", command.approveUser);
bot.command("removeuser", command.removeUser);
bot.command("listpending", command.listPending);
bot.command("listusers", command.listUsers);
bot.command("cekid", command.cekId);
bot.action("approve_all_users", command.approveAllUsers);

bot.command("updatesticker", updateSticker);

bot.telegram.getMe().then(async (me) => {
  console.clear();
  console.log(await clc.blue(await figlet("Auto Order")));
  console.log("Mau Beli Script??? Silahkan Hubungi, Whatsapp : https://wa.me/6282234940310");
  console.log(
    clc.green.bold("[ INFO ]") +
      ` [${moment().format("HH:mm:ss")}]:` +
      clc.blueBright(` Succes connect to bot ${me.username}`)
  );
  connectDatabase(); // Ensure database connection is established here
});

bot.launch();

startWebhookServer(bot);

let isProcessing = false;
setInterval(async () => {
  if (!isProcessing) {
    isProcessing = true;
    await ProcessingTransaction(bot);
    isProcessing = false;
  }
}, 7_000);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));