const phin = require("phin").promisified;
var mysql = require("mysql2/promise");
var moment = require("moment");
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
  let connection = await DBconnect();
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
    [pools_array, fields] = await connection.execute("SELECT * FROM pools");
  } catch (e) {
    return Error(
      "error select from DB in  Get_currencies_tickers_conf_List",
      e
    );
  }
  let stub = [];
  stub.push(pools_array[6]);
  pools_array = stub;
  let calls = [];
  for (let i = 0; i < pools_array.length; i++) {
    calls.push(PullPoolStat(connection, pools_array[i].id, pools_array[i].url));
  }
  await Promise.all(calls);

  //for (let i = 0; i < urls.length; i++) GetPoolStat(urls[i]);
}

async function PullPoolStat(connection, pool_id, url) {
  let pool_api_data = await Get_pool_stat_WEB(connection, url);

  //console.log(pool_api_data);
  //подсчитать количество монет и сравнить с тем что есть в конфиге пула, уведомить если листинг изменился для принятия решения
  //chekPoolData(pool_api_data);

  //получить наблюдаемые валюты из базы
  let curries_conf_checklist = await get_Pool_curries_conf_checklist(
    connection,
    pool_id
  );
  for (let conf of curries_conf_checklist) {
    //поиск идет по имени и алгоритму находим их значения в текстовом виде
    let algo = await GetAlgoSymbol(connection, conf.algo_id);
    let name = await GetCurrencyName(connection, conf.currencies_id);
    let dnow = moment().format("YYYY-MM-DD HH:mm:ss");
    let workers, hashrate, h24_blocks;

    let gotit = false;
    for (let item in pool_api_data) {
      if (
        (pool_api_data[item].algo == algo) &
        (pool_api_data[item].name == name)
      ) {
        //console.log(pool_api_data[item].workers);
        gotit = true;
        workers = pool_api_data[item].workers;
        hashrate = pool_api_data[item].hashrate;
        h24_blocks = pool_api_data[item]["24h_blocks"];
      }
    }
    //проверочка вдруг монету делистнули с пула
    if (!gotit) {
      return Error("config not found in new data" + " " + url + " " + name, e);
    }

    await Insert_pools_currencies_stats_DB(
      connection,
      dnow,
      conf.id,
      workers,
      hashrate,
      h24_blocks
    );

    //для каждой валюты получить новые данные и занести в базу
    //если найдены в наборе нужные данные то внести их базу
    //if (1 == 1) Inset_pool_currency_stats();
  }
}
async function Insert_pools_currencies_stats_DB(
  connection,
  dnow,
  conf_id,
  workers,
  hashrate,
  h24_blocks
) {
  console.log(conf_id, dnow, workers, hashrate, h24_blocks);
}

async function GetAlgoSymbol(connection, algo_id) {
  let symbol;
  try {
    [symbol, fields] = await connection.execute(
      "SELECT symbol FROM algos WHERE id=?",
      [algo_id]
    );
  } catch (e) {
    return Error("error select from DB in get_Pool_curries_conf_checklist", e);
  }
  return symbol[0].symbol;
}
async function GetCurrencyName(connection, currencies_id) {
  let currency_name;
  try {
    [currency_name, fields] = await connection.execute(
      "SELECT name FROM currencies WHERE id=?",
      [currencies_id]
    );
  } catch (e) {
    return Error("error select from DB in get_Pool_curries_conf_checklist", e);
  }
  console.log(currency_name[0].name);
  return currency_name[0].name;
}

async function get_Pool_curries_conf_checklist(connection, pool_id) {
  let conf_id_array;
  try {
    [conf_id_array, fields] = await connection.execute(
      "SELECT id,pool_id,algo_id,currencies_id FROM pools_currencies_stats_conf WHERE pool_id=?",
      [pool_id]
    );
  } catch (e) {
    return Error("error select from DB in get_Pool_curries_conf_checklist", e);
  }
  return conf_id_array;
}

//async function Inset_pool_currency_stats(

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

async function Get_pool_stat_WEB(connection, url) {
  let res = {};
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });
  } catch (e) {
    return Error("error in Get_pool_stat_WEB", e);
  }
  return res.body;
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
