const phin = require("phin").promisified;
var mysql = require("mysql2/promise");
var config = require("./config.json");

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
function FixAlgo(algo) {
  let tempAlgo = algo.split("-");
  if (tempAlgo.length == 2) algo = tempAlgo[0];
  return algo;
}

let urls = [
  "https://hash4.life/api/currencies",
  "https://hashfaster.com/api/currencies",
  "https://protopool.net/api/currencies",
  "https://cryptopool.party/api/currencies",
  "https://miningpanda.site/api/currencies",
  "https://pickaxe.pro/api/currencies",
  "http://api.zergpool.com:8080/api/currencies",
  "http://angrypool.com/api/currencies",
  "http://api.bsod.pw/api/currencies"
];

Start();


async function Start() {
let connection =  await DBconnect();
PullPoolsStats(connection);
}

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

*/

async function PullPoolsStats(connection) {
  let pools_array;
  try {
    [pools_array,fields] = await connection.execute(
      "SELECT * FROM pools"
    );
  } catch (e) {
    return Error(
      "error select from DB in  Get_currencies_tickers_conf_List",
      e
    );
  }
  let currencies_tickers_conf_List_Array = [];
  for (let i =0; i < pools_array.length; i++) {
    PullPoolStat(pools_array[i].id,pools_array[i].url);    
  }  

  //for (let i = 0; i < urls.length; i++) GetPoolStat(urls[i]);
}

async function PullPoolStat (pool_id,url){
 // console.log(pool_id,url);
 
}

async function GetPoolStat(url) {
  let res = {};
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });

    //console.log(url);
    let i = 0;
    for (let obj in res.body) {
      i++;

      console.log(
        i +
          ") " +
          res.body[obj].name +
          " algo:" +
          FixAlgo(res.body[obj].algo) +
          " workers:" +
          res.body[obj].workers +
          " hashrate:" +
          res.body[obj].hashrate +
          " 24h_blocks:" +
          res.body[obj]["24h_blocks"]
      );
    }
    console.log("----------", "total monets: " + i);
  } catch (e) {
    return console.log("Unexpected error occurred in createConnection", e, url);
  }
}

async function Get_pool_stat_WEB(connection,pool_id){
  let ;
  try {
    [currencies_tickers_conf_List, fields] = await connection.query(
      "SELECT * FROM sheduler5min"
    );
  } catch (e) {
    return Error(
      "error select from DB in  Get_currencies_tickers_conf_List",
      e
    );
  }
  let currencies_tickers_conf_List_Array = [];
  for (let currencies_ticker of currencies_tickers_conf_List) {
    currencies_tickers_conf_List_Array.push(
      currencies_ticker.currencies_tickers_conf_id
    );
  }
  return currencies_tickers_conf_List_Array;
  

}
//
//Забрать данные с пула
//распарсить
//записать в таблицу пулов количество монет на пуле (контролировать изменение)
//записать данные в том числе если появились новые алгоритмы

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
