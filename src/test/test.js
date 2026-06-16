const QRCode = require('qrcode');

const qrtext = "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214526410099677350303UMI51440014ID.CO.QRIS.WWW0215ID20243618285000303UMI5204541153033605802ID5920DEDE STORE OK21522876006SUBANG61054121162070703A016304A89F"

function toCRC16(str) {
  function charCodeAt(str, i) {
    let get = str.substr(i, 1)
    return get.charCodeAt()
  }

  let crc = 0xFFFF;
  let strlen = str.length;
  for (let c = 0; c < strlen; c++) {
    crc ^= charCodeAt(str, c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  hex = crc & 0xFFFF;
  hex = hex.toString(16);
  hex = hex.toUpperCase();
  if (hex.length == 3) {
    hex = "0" + hex;
  }
  return hex;
}

async function qrisDinamis(nominal, path) {
  let qris = qrtext

  let qris2 = qris.slice(0, -4);
  let replaceQris = qris2.replace("010211", "010212");
  let pecahQris = replaceQris.split("5802ID");
  let uang = "54" + ("0" + nominal.length).slice(-2) + nominal + "5802ID";

  let output = pecahQris[0] + uang + pecahQris[1] + toCRC16(pecahQris[0] + uang + pecahQris[1])

  QRCode.toFile(path, output, { margin: 2, scale: 10 })
  return path
}

(async() => {
    console.log(qrisDinamis(1030, './qris.png'))
})