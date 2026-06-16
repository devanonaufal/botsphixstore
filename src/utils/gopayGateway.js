const axios = require('axios');
const clc = require('cli-color');
const moment = require('moment-timezone');
require('dotenv').config();

const API_KEY = process.env.GOPAY_API_KEY;
const API_URL = process.env.GOPAY_API_URL || 'https://paymentgateway.lempeurhh.biz.id';

function getTimestamp() {
    return moment().format('HH:mm:ss');
}

async function retryRequest(fn, maxRetries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const status = error.response?.status;
            if ((status === 502 || status === 503 || status === 504) && attempt < maxRetries) {
                console.log(clc.yellow.bold("[ WARNING ]") + ` [${getTimestamp()}]: GoPay Gateway server error (${status}), retry ${attempt}/${maxRetries} in ${delayMs}ms...`);
                await new Promise(r => setTimeout(r, delayMs));
            } else {
                throw error;
            }
        }
    }
}

/**
 * Membuat pesanan baru dan menghasilkan QRIS dinamis.
 * @param {string} refId - ID Referensi unik dari sistem bot (e.g. INV...)
 * @param {number} amount - Nominal transaksi
 * @param {string} description - Keterangan pembelian
 * @returns {Promise<object>} Respon dari API
 */
async function createOrder(refId, amount, description = 'Pembelian Produk') {
    const url = `${API_URL}/api/create_order.php`;
    const payload = {
        amount: amount,
        ref_id: refId,
        description: description,
        expired_minutes: 15
    };

    try {
        console.log(clc.green.bold("[ INFO ]") + ` [${getTimestamp()}]: GoPay Gateway createOrder request payload: ${JSON.stringify(payload, null, 2)}`);
        const response = await retryRequest(() => axios({
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            data: payload
        }));
        console.log(clc.green.bold("[ INFO ]") + ` [${getTimestamp()}]: GoPay Gateway createOrder response: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error(clc.red.bold("[ ERROR ]") + ` [${getTimestamp()}]: GoPay Gateway createOrder error: ${error.message}`);
        if (error.response) {
            console.error(clc.red.bold("[ RESPONSE BODY ]") + ` [${getTimestamp()}]: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        throw error;
    }
}

/**
 * Mengecek status pesanan berdasarkan order_id dari GoPay Gateway.
 * @param {string} orderId - ID order dari GoPay Gateway (e.g. GPG-...)
 * @returns {Promise<object>} Respon dari API
 */
async function checkStatus(orderId) {
    const url = `${API_URL}/api/check_status.php`;
    try {
        const response = await retryRequest(() => axios({
            method: 'get',
            url: url,
            params: {
                order_id: orderId
            }
        }));
        console.log(clc.green.bold("[ INFO ]") + ` [${getTimestamp()}]: GoPay Gateway checkStatus response: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error(clc.red.bold("[ ERROR ]") + ` [${getTimestamp()}]: GoPay Gateway checkStatus error: ${error.message}`);
        if (error.response) {
            console.error(clc.red.bold("[ RESPONSE BODY ]") + ` [${getTimestamp()}]: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        throw error;
    }
}

module.exports = { createOrder, checkStatus };
