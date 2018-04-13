const phin = require("phin").promisified;
var mysql = require("mysql2/promise");
var moment = require("moment");
const dedent = require("dedent");

const fix = require("./fix");
const error = require("./error");
var config = require("./config.json");

var MyworkDB = require("./workDB");
var MyworkWEB = require("./workWEB");

async function Get_pool_stat_WEB(connection, url) {
  let res = {};
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });
  } catch (e) {
    return Error("error in Get_pool_stat_WEB for " + url, e);
  }
  return res.body;
}

start();
async function start() {
  let myconnection = await MyworkDB.DBconnect();
  if (!myconnection) return 0;

  //получить список пулов и кошельков и бирж
  let wallets_conf_array = await GetALlWallets(myconnection);
  if (!wallets_conf_array) {
    myconnection.End();
    return 0;
  }
  for (let wallet_conf of wallets_conf_array) {
    console.log(
      wallet_conf.url,
      wallet_conf.balance_key,
      wallet_conf.balance_immature_key,
      wallet_conf.chek
    );
    //let opt = [wallet_conf.balance_key, wallet_conf.balance_immature_key];
    let opt = new Object();
    opt.balance = wallet_conf.balance_key;
    opt.balance_immature = wallet_conf.balance_immature_key;
    let res = await MyworkWEB.WebGetData(
      wallet_conf.url,
      opt,
      wallet_conf.chek
    );
    console.log(
      wallet_conf.url,
      "balance:",
      res[0],
      "balance_immature:",
      res[1]
    );
  }
  //пройтись по кошелькам и забрать данные
  //обновить таблицу балансы
  //раз в сутки запускать функцию которая берет текущий баланс и записывает его в историю
  myconnection.End();
}

async function GetALlWallets(myconnection) {
  let q = "SELECT * FROM wallets_conf";
  let wallets = await myconnection.Select(q);
  if (wallets.length) return wallets;
  else return 0;
}

/*

async function Pull_currencies_tickers(
  connection,
  currencies_tickers_conf_List_Array
) {
  let calls = [];
  for (let currencies_tickers_conf_id of currencies_tickers_conf_List_Array) {
    //Pull_currensy_ticker при вызове вызращает промис, который мы пушим в масси, который потом уже передадим в Promise.all который вернем нам общий промис и уже завершениия его мы дождемся через await
    calls.push(Pull_currensy_ticker(connection, currencies_tickers_conf_id));
    //return calls;
  }

  await Promise.all(calls);
}
*/
