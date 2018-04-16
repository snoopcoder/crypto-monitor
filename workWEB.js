var moment = require("moment");
const phin = require("phin").promisified;
var get = require("lodash.get");
const https = require("https");
const error = require("./error");

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

  // реализация повторной поппытки получить данные с пула если есть проблемы со связью
  let attempt = 0;
  while (attempt < 3) {
    let err = 0;
    try {
      res = await phin({
        url: url,
        parse: "json"
      });
    } catch (e) {
      err = 1;
      console.log("cannot get data frome web ", url + e);
    }
    if (res && !err) break;
    await timeout(4000);
    console.log("retry Get_pool_stat_WEB for ", url);
    attempt++;
  }
  if (attempt == 3) {
    return error.MyError("cannot get data frome web ", url);
  }

  //зачем нужен chek:
  //иногда результать будет в виде большого набора данных, массива.
  //и для доступа к искомым данным нужен будет правильный индекс так как маска данных будет в базе со спец символом на месте индекса а поче чек будет содержать условие поиска
  //поэтму нужно найти этот индекс  и скорректировать все маски подставив его вместо специального символа

  if (chek) op_arr = await Fix_item_options(res, op_arr, chek);
  if (!op_arr) return 0;
  let Data = {};
  for (let opt in op_arr) {
    Data[opt] = get(res, op_arr[opt]);
  }
  return Data;
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function Fix_item_options(res, op_arr, chek) {
  // подготовка выражения условия
  let chekExpresson = chek.split("=");
  //проверить что res это массив

  //if (Array.isArray(res.body)) console.log("пришел массив");

  //проверить что длина res больше единицы
  //if (res.body.length > 1) console.log("длина массива больше 1");
  //пробежаться найти нужный индекс
  let id = -1;
  for (let i = 0; i < res.body.length; i++) {
    if (get(res.body[i], chekExpresson[0]) == chekExpresson[1]) {
      id = i;
      break;
    }
  }
  if (id == -1) return 0;
  //скоректировать все маски

  for (let opt in op_arr) {
    op_arr[opt] = op_arr[opt].replace("$", id);
  }

  //last_key = last_key.replace("$", id);
  //volume_key = volume_key.replace("$", id);
  //ask_key = ask_key.replace("$", id);
  //bid_key = bid_key.replace("$", id);
  return op_arr;
}

module.exports.WebGetData = WebGetData;
