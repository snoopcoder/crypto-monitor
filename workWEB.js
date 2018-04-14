var moment = require("moment");
const phin = require("phin").promisified;
var get = require("lodash.get");
const https = require("https");

/*------<fix>-----------------------
не забирает данные с сайтов с косяным сертификатом. в возникшей ошибке причина -не включен премежуточный сертификат в файл сертификата полученного с сервера
проверка сертификата:
https://www.ssllabs.com/ssltest/analyze.html?d=graviex.net
текст ошибки:
Unexpected error occurred in createConnection { Error: unable to verify the first certificate
    at TLSSocket.onConnectSecure (_tls_wrap.js:1036:34)
    at TLSSocket.emit (events.js:127:13)
    at TLSSocket._finishInit (_tls_wrap.js:633:8) code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' }
    в коде ниже мы подключаем библиотеку, которая загружает свежие сертификаты, которым доверяют браузеры но не доверяет нода, плюс мы ложем недостающий промежутоынй сертификат*/
var rootCas = require("ssl-root-cas/latest").create();
let outs = rootCas.addFile(
  __dirname + "/config/ssl/comodorsadomainvalidationsecureserverca.crt"
);
https.globalAgent.options.ca = rootCas;
//------</fix>-----------------------

async function WebGetData(url, op_arr, chek) {
  let res = {};
  //let dnow = moment().format("YYYY-MM-DD HH:mm:ss");
  try {
    res = await phin({
      url: url,
      parse: "json"
    });
  } catch (e) {
    return error.MyError("cannot get data frome web ", url + e);
  }

  //зачем нужен chek:
  //иногда результать будет в виде большого набора данных, массива.
  //и для доступа к искомым данным нужен будет правильный индекс так как маска данных будет в базе со спец символом на месте индекса а поче чек будет содержать условие поиска
  //поэтму нужно найти этот индекс  и скорректировать все маски подставив его вместо специального символа

  res = res.body;
  let Data = {};
  for (let opt in op_arr) {
    if (chek) opt = Fix_item_options(opt, chek);
    Data[opt] = get(res, op_arr[opt]);
  }
  //op_arr = await Fix_item_options(op_arr);

  /*
  let last = get(res, last_key);
  let volume = 0;
  if (volume_key) volume = get(res, volume_key);
  let ask = 0;
  if (ask_key) ask = get(res, ask_key);
  let bid = 0;
  if (bid_key) bid = get(res, bid_key);
  //dnow, last, volume, ask, bid
  return [dnow, last, volume, ask, bid];*/
  return Data;
}

async function Fix_item_options( /////не работает!!!!!!!!!!!
  res,
  last_key,
  volume_key,
  ask_key,
  bid_key,
  chek
) {
  /////не работает!!!!!!!!!!!
  /////не работает!!!!!!!!!!!
  /////не работает!!!!!!!!!!!
  /////не работает!!!!!!!!!!!

  // fixkey
  let chekExpresson = chek.split("=");
  //проверить что res это массив

  //if (Array.isArray(res.body)) console.log("пришел массив");

  //проверить что длина res больше единицы
  //if (res.body.length > 1) console.log("длина массива больше 1");
  //пробежаться найти нужный индекс
  let id;
  for (let i = 0; i < res.body.length; i++) {
    //console.log(get(res.body[i], chekExpresson[0]) + " " + chekExpresson[1]); // res.body[i].id="ULT_BTC")
    if (get(res.body[i], chekExpresson[0]) == chekExpresson[1]) {
      id = i;
      break;
    }
  }
  //скоректировать все маски
  last_key = last_key.replace("$", id);
  volume_key = volume_key.replace("$", id);
  ask_key = ask_key.replace("$", id);
  bid_key = bid_key.replace("$", id);
  return [last_key, volume_key, ask_key, bid_key];
}

module.exports.WebGetData = WebGetData;
