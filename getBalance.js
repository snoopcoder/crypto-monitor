import { start } from "repl";

const phin = require("phin").promisified;
var mysql = require("mysql2/promise");
var moment = require("moment");
const dedent = require("dedent");

const fix = require("./fix");
const error = require("./error");
var config = require("./config.json");


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
async function start(){
    let connection = DBconnect();
получить список пулов и кошельков и бирж

let wallet_array =await GetALlWallets(connection);

пройтись по пулам и забрать данные
обновить таблицу балансы
раз в сутки запускать функцию которая берет текущий баланс и записывает его в историю



}

async function GetALlWallets(connection)
{
    let wallet,fields;
    try {
      [wallet, fields] = await connection.execute(
        "SELECT * FROM pools WHERE id=?",
        [pool_id]
      );
    } catch (e) {
      return Error("error select from DB in  GetPoolCurrsCount", e);
    }
    return pool[0].coins_count;
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