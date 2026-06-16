const caraAddProduct = require("./helpCommand/caraAddProduct");
const caraAddStock = require("./helpCommand/caraAddStock");
const caraAddVariant = require("./helpCommand/caraAddVariant");
const caraBroadcast = require("./helpCommand/caraBroadcast");
const caraDelProduct = require("./helpCommand/caraDelProduct");
const caraDelStock = require("./helpCommand/caraDelStock");
const caraDelVariant = require("./helpCommand/caraDelVariant");
const caraSetHarga = require("./helpCommand/caraSetHarga");
const { addProduct } = require("./privateCommand/addProduct");
const { addProductVariants } = require("./privateCommand/addProductVariant");
const {showStock,refreshStock} = require("./privateCommand/showStock");
const addStock = require("./privateCommand/addStock");
const adminPanelCommand = require("./privateCommand/adminPanel");
const broadcastCommand = require("./privateCommand/broadcast");
const delProductVariant = require("./privateCommand/delProduct");
const delProduct = require("./privateCommand/delProductVariant");
const delStock = require("./privateCommand/delStock");
const delVariantType = require("./privateCommand/delVariantType");
const listStock = require("./privateCommand/listStock");
const delStockById = require("./privateCommand/delStockById");
const setHarga = require("./privateCommand/setHarga");
const setTerms = require("./privateCommand/setTerms");
const listProduct = require("./publicCommand/listProduct");
const startCommand = require("./start");
const { updateTermsAndConditions } = require("./privateCommand/updateTerm");
const { approveUser, removeUser, listPending, listUsers, approveAllUsers, cekId } = require("./privateCommand/manageUsers");


module.exports = {
    updateTermsAndConditions,
    startCommand,
    refreshStock,
    showStock,
    addStock,
    listProduct,
    addProduct,
    broadcastCommand,
    addProductVariants,
    adminPanelCommand,
    delStock,
    delProduct,
    delProductVariant,
    delVariantType,
    listStock,
    delStockById,
    setHarga,
    setTerms,
    caraSetHarga,
    caraAddProduct,
    caraDelProduct,
    caraDelVariant,
    caraBroadcast,
    caraAddStock,
    caraDelStock,
    caraAddVariant,
    approveUser,
    removeUser,
    listPending,
    listUsers,
    approveAllUsers,
    cekId
}