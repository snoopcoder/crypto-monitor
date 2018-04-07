const phin = require("phin").promisified;

var mysql = require("mysql2/promise");
var config = require("../config.json");
/*
INSERT INTO  pools SET name="hash4.life", url="https://hash4.life/api/currencies", coins_count=1;
INSERT INTO  pools SET name="hashfaster.com", url="https://hashfaster.com/api/currencies", coins_count=1;
INSERT INTO  pools SET name="protopool.net", url="https://protopool.net/api/currencies", coins_count=1;
INSERT INTO  pools SET name="cryptopool.party", url="https://cryptopool.party/api/currencies", coins_count=1;
INSERT INTO  pools SET name="miningpanda.site", url="https://miningpanda.site/api/currencies", coins_count=1;
INSERT INTO  pools SET name="pickaxe.pro", url="https://pickaxe.pro/api/currencies", coins_count=1;
INSERT INTO  pools SET name="zergpool.com", url="http://api.zergpool.com:8080/api/currencies", coins_count=1;
INSERT INTO  pools SET name="angrypool.com", url="http://angrypool.com/api/currencies", coins_count=1;
INSERT INTO  pools SET name="bsod.pw", url="http://api.bsod.pw/api/currencies", coins_count=1;


https://hash4.life/api/currencies	hash4.life
https://hashfaster.com/api/currencies	hashfaster.com
https://protopool.net/api/currencies	protopool.net
https://cryptopool.party/api/currencies	cryptopool.party
https://miningpanda.site/api/currencies	miningpanda.site
https://pickaxe.pro/api/currencies	pickaxe.pro
http://api.zergpool.com:8080/api/currencies	zergpool.com
http://angrypool.com/api/currencies	angrypool.com
http://api.bsod.pw/api/currencies	bsod.pw


*/
let AllAlgo = [];
let ALLCurrencies = [];
let workArray = [
  "https://hash4.life/api/currencies",
  "https://hashfaster.com/api/currencies",
  "https://protopool.net/api/currencies",
  "https://cryptopool.party/api/currencies",
  "https://miningpanda.site/api/currencies",
  "http://api.zergpool.com:8080/api/currencies",
  "http://angrypool.com/api/currencies",
  "http://api.bsod.pw/api/currencies"
];
start();

async function start() {
  let connection = await DBconnect();
  let i = 0;
  for (let url of workArray) {
    //получаем id пула по url
    //select id from pools where url like 'http://api.zergpool.com:8080/api/currencies';
    let pool_id;
    try {
      [pool_id] = await connection.execute(
        "select id from pools where url like ?",
        [url]
      );
    } catch (e) {
      return Error("error select id from pools", e);
    }
    pool_id = pool_id[0].id;
    //
    i++;
    let res = {};
    try {
      //var restp = await asyncgetJSON(url);
      res = await phin({
        url: url,
        parse: "json"
      });
    } catch (e) {
      return Error("error WEB for " + url, e);
    }
    await Pase(connection, url, res.body, i, pool_id);
  }
  console.log("----------------------------------------------");
  console.log("all algo:");
  for (let algo of AllAlgo) {
    console.log(algo);
  }
  console.log("----------------------------------------------");
  console.log("all Currencies:");
  for (let curr of ALLCurrencies) {
    console.log(curr);
  }
}

async function Pase(connection, url, json, i, pool_id) {
  console.log("----------------------------------------------");
  console.log(i, ") Proccessing for " + url);
  for (let item in json) {
    console.log(json[item].name, json[item].algo);
    if (chkAlgo(FixAlgo(json[item].algo)))
      AllAlgo.push(FixAlgo(json[item].algo));
    if (chkCurr(FixCURR(json[item].name)))
      ALLCurrencies.push(FixCURR(json[item].name));
  }
  console.log("add to config:");

  for (let item in json) {
    let algoText = FixAlgo(json[item].algo);
    let CurrPoolSymbolText = FixCURR(json[item].name);
    //получить id валюты
    let cur_id;
    try {
      [cur_id] = await connection.execute(
        "select id from currencies where pool_simbol = ?",
        [CurrPoolSymbolText]
      );
    } catch (e) {
      return Error("error select id from currencies", e);
    }
    cur_id = cur_id[0].id;
    //получить id алгоритма
    let algo_id;
    try {
      [algo_id] = await connection.execute(
        "select id from algos where symbol = ?",
        [algoText]
      );
    } catch (e) {
      return Error("error select id from algos", e);
    }
    algo_id = algo_id[0].id;
    let query =
      "INSERT INTO  pools_currencies_stats_conf SET pool_id=" +
      pool_id +
      ", algo_id=" +
      algo_id +
      ",currencies_id=" +
      cur_id +
      ";";
    console.log(query);
  }
}

function chkAlgo(algo) {
  if (AllAlgo.indexOf(algo) == -1) return 1;
  return 0;
}

function chkCurr(currency) {
  if (ALLCurrencies.indexOf(currency) == -1) return 1;
  return 0;
}

function FixAlgo(algo) {
  let tempAlgo = algo.split("-");
  if (tempAlgo.length == 2) algo = tempAlgo[0];
  if (algo == "phi1612") algo = "phi";
  return algo;
}

function FixCURR(CURR) {
  //ПЕРЕВЕСТИ все в аперкейс
  CURR = CURR.toUpperCase();
  //Удалить пробелы
  CURR = CURR.replace(/[\s\-]/g, "");
  CURR = CURR.replace(/COIN/gi, "");
  return CURR;
}

async function DBconnect() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.sql.host,
      user: config.sql.user,
      password: config.sql.password,
      database: config.sql.database
    });
  } catch (e) {
    return 0;
  }
  return connection;
}
