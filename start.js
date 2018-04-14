//-------tips------------------------
//process.stdout.write(d);

var zabbixNode = require("zabbix-node");
var getJSON = require("get-json");
var mysql = require("mysql2/promise");
const dedent = require("dedent");
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

//----
const poolsgraber = require("./PoolsGrab");

function Error(err, Data) {
  if (err) {
    console.log(
      moment().format("YYYY-MM-DD HH:mm:ss") + " " + err + " " + Data
    );
    return 0;
  }
  //else console.log(Data);
  //return Data;
}

function asyncgetJSON(url) {
  return new Promise(function(resolve, reject) {
    getJSON(url, function(error, response) {
      if (!error && typeof (response == "object")) {
        resolve(response);
      } else {
        reject(error);
      }
    });
  });
}

async function start() {
  // do something

  //первый запуск при инициализации
  Task5min();
  //Task60min(connection);
  //Task24h(connection); но тут лучше наверное переделать на расписание по времени или вобще все переделать ан расписание. чтоб и 5 мин таймер запусался в кратное время. и часовой

  //Запуск функции шедулера
  //
  // начать повторы с интервалом 5мин
  var timer5 = setInterval(() => {
    Task5min();
  }, 300000);

  Task60min();
  //Task60min(connection);
  //Task24h(connection); но тут лучше наверное переделать на расписание по времени или вобще все переделать ан расписание. чтоб и 5 мин таймер запусался в кратное время. и часовой

  //Запуск функции шедулера
  //
  // начать повторы с интервалом 5мин
  var timer60 = setInterval(() => {
    Task60min();
  }, 3600000);
}

async function Task60min() {}

async function Task5min() {
  await poolsgraber.PullPoolsStats(connection);
  connection.end();
  console.log(moment().format("YYYY-MM-DD HH:mm:ss"), "выполнено");
}

//---- test for
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep() {
  await timeout(60000);
}
//----

//test(Done);
start();
//getTiker(1,Done);
