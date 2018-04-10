const phin = require("phin").promisified;
var mysql = require("mysql2/promise");
var moment = require("moment");
const dedent = require("dedent");

const fix = require("../fix");
var config = require("../config.json");

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

//Start();

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

async function PoolsProccess(connection) {
  let pools_array;
  try {
    [pools_array, fields] = await connection.execute("SELECT * FROM pools");
  } catch (e) {
    return Error(
      "error select from DB in  Get_currencies_tickers_conf_List",
      e
    );
  }
  /*
  let stub = [];
  stub.push(pools_array[5]);
  pools_array = stub;
  */

  for (let i = 0; i < pools_array.length; i++) {
    let pool_api_data = await Get_pool_stat_WEB(connection, pools_array[i].url);
    if (pool_api_data == 0) continue;
    console.log("----------------------------------");
    console.log(pools_array[i].name);
    await ChekConf(connection, pools_array[i].id, pool_api_data);
    await ChekPoolData(connection, pools_array[i].id, pool_api_data);
  }
}

async function ChekConf(connection, pool_id, pool_api_data) {
  let curries_conf_checklist = await get_Pool_curries_conf_checklist(
    connection,
    pool_id
  );
  let SomeCurrDisabledOnPool = false;
  let errormess = "[err] Монета из конфига на нейдена в данных с пула:";
  let fixmess = "[fix]";

  for (let conf of curries_conf_checklist) {
    //поиск идет по имени и алгоритму находим их значения в текстовом виде
    let algo = await GetAlgoSymbol(connection, conf.algo_id);
    let CurrencyPoolSymbol = await GetCurrencyPoolSymbol(
      connection,
      conf.currencies_id
    );

    let gotit = false;
    for (let item in pool_api_data) {
      if (
        fix.FixAlgo(pool_api_data[item].algo) == algo &&
        fix.FixCURR(pool_api_data[item].name) == CurrencyPoolSymbol
      ) {
        gotit = true;
        break;
      }
    }
    if (!gotit) {
      SomeCurrDisabledOnPool = true; // только чтобы вывести что конфиг в порядке
      errormess += "\n      name:" + CurrencyPoolSymbol + " algo:" + algo;
      fixmess +=
        "\n      UPDATE pools_currencies_stats_conf SET enable_monitoring=0 WHERE id=" +
        conf.id +
        ";";
    }
  }
  if (!SomeCurrDisabledOnPool)
    console.log("[ok] Для всех монет в конфиге есть данные");
  else {
    console.log(errormess);
    console.log(fixmess);
  }
}

async function ChekPoolData(connection, pool_id, pool_api_data) {
  let SomeCurrDisabledOnPool = false;
  let config_chek_list;
  try {
    [config_chek_list, fields] = await connection.execute(
      "SELECT currencies.pool_simbol as CurrencyPoolSymbol, algos.symbol as AlgoSymbol, pools_currencies_stats_conf.id as ConfID FROM pools_currencies_stats_conf join currencies join algos on pools_currencies_stats_conf.currencies_id=currencies.id and pools_currencies_stats_conf.algo_id=algos.id   WHERE pool_id=?;",
      [pool_id]
    );
  } catch (e) {
    return Error("error select from DB in  GetPoolCurrsCount", e);
  }
  let errormess = "[err] Данные на пуле не отражены в конфиге:";
  let fixmess = "[fix]";
  for (let item in pool_api_data) {
    let FixedPoolAlgo = fix.FixAlgo(pool_api_data[item].algo);
    let FixedPoolCurName = fix.FixCURR(pool_api_data[item].name);
    let gotit = false;
    for (let conf of config_chek_list) {
      //поиск идет по имени и алгоритму находим их значения в текстовом виде
      let algo = conf.AlgoSymbol;
      let CurrencyPoolSymbol = conf.CurrencyPoolSymbol;

      if (FixedPoolAlgo == algo && FixedPoolCurName == CurrencyPoolSymbol) {
        //console.log(pool_api_data[item].workers);
        gotit = true;
        break;
      }
    }

    if (!gotit) {
      SomeCurrDisabledOnPool = true; // только чтобы вывести что конфиг в порядке
      errormess +=
        "\n      name:" + FixedPoolCurName + " algo:" + FixedPoolAlgo;

      // проверить есть ли алго, если нет до добавить но основной запрос на добавление монеты не сформируется
      let algo_id = await GetAlgoID(connection, FixedPoolAlgo);
      if (!algo_id) {
        fixmess +=
          "\n      INSERT algos SET symbol='" +
          FixedPoolAlgo +
          "',name='" +
          FixedPoolCurName +
          "'; -- запрос на добавление конфига не сформирован так как отсутвует алгоритм в базе - необходимо запустить весь скип занова после добавление алгорима в базу этим запросом";
        continue;
      }
      //провертить есть ли монета, если нет до добавить
      let curr_id = await GetCurrID(connection, FixedPoolCurName);
      if (!curr_id) {
        fixmess +=
          "\n      INSERT currencies SET symbol='" +
          FixedPoolCurName +
          "',name='" +
          FixedPoolCurName +
          "',pool_simbol='" +
          FixedPoolCurName +
          "'; -- запрос на добавление конфига не сформирован так как отсутвует монета в базе - необходимо запустить весь скип занова после добавление монеты в базу этим запросом";
        continue;
      }

      fixmess +=
        "\n      INSERT pools_currencies_stats_conf SET pool_id=" +
        pool_id +
        ", algo_id='" +
        algo_id +
        "',currencies_id='" +
        curr_id +
        "',enable_monitoring=1;";
    }
  }

  if (!SomeCurrDisabledOnPool)
    console.log("[ok] Все данные пула отражены в конфиге");
  else {
    console.log(errormess);
    console.log(fixmess);
  }
}

async function GetCurrID(connection, AlgoSymbol) {
  let id;
  try {
    [id, fields] = await connection.execute(
      "SELECT id FROM currencies WHERE symbol like ?",
      [AlgoSymbol]
    );
  } catch (e) {
    return Error("error select from DB in GetAlgoSymbol", e);
  }
  if (id.length == 1) return id[0].id;
  return 0;
}
async function GetAlgoID(connection, AlgoSymbol) {
  let id;
  try {
    [id, fields] = await connection.execute(
      "SELECT id FROM algos WHERE symbol like ?",
      [AlgoSymbol]
    );
  } catch (e) {
    return Error("error select from DB in GetAlgoSymbol", e);
  }
  return id[0].id;
}

async function GetAlgoSymbol(connection, algo_id) {
  let symbol;
  try {
    [symbol, fields] = await connection.execute(
      "SELECT symbol FROM algos WHERE id=?",
      [algo_id]
    );
  } catch (e) {
    return Error("error select from DB in GetAlgoSymbol", e);
  }
  return symbol[0].symbol;
}
async function GetCurrencyPoolSymbol(connection, currencies_id) {
  let pool_simbol;
  try {
    [pool_simbol, fields] = await connection.execute(
      "SELECT pool_simbol FROM currencies WHERE id=?",
      [currencies_id]
    );
  } catch (e) {
    return Error("error select from DB in GetCurrencyPoolSymbol", e);
  }
  return pool_simbol[0].pool_simbol;
}

async function get_Pool_curries_conf_checklist(connection, pool_id) {
  let conf_id_array;
  try {
    [conf_id_array, fields] = await connection.execute(
      "SELECT * FROM pools_currencies_stats_conf WHERE pool_id=? and enable_monitoring=1",
      [pool_id]
    );
  } catch (e) {
    return Error("error select from DB in get_Pool_curries_conf_checklist", e);
  }
  return conf_id_array;
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
    return Error("error in Get_pool_stat_WEB for " + url, e);
  }
  return res.body;
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

async function GetPoolCurrsCount(connection, pool_id) {
  let pool;
  try {
    [pool, fields] = await connection.execute(
      "SELECT * FROM pools WHERE id=?",
      [pool_id]
    );
  } catch (e) {
    return Error("error select from DB in  GetPoolCurrsCount", e);
  }
  return pool[0].coins_count;
}

async function start() {
  let connection = await DBconnect();
  await PoolsProccess(connection);
  connection.end();
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

start();
