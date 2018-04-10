const phin = require("phin").promisified;
var mysql = require("mysql2/promise");
var moment = require("moment");
const dedent = require("dedent");

const fix = require("./fix");
const error = require("./error");
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
  stub.push(pools_array[5]);
  pools_array = stub;
  
  let calls = [];
  for (let i = 0; i < pools_array.length; i++) {
    calls.push(PullPoolStat(connection, pools_array[i].id, pools_array[i].url));
  }
  await Promise.all(calls);
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
  let curr_count;
  let SomeCurrDisabledOnPool = false;
  for (let conf of curries_conf_checklist) {
    //поиск идет по имени и алгоритму находим их значения в текстовом виде
    let algo = await GetAlgoSymbol(connection, conf.algo_id);
    let CurrencyPoolSymbol = await GetCurrencyPoolSymbol(
      connection,
      conf.currencies_id
    );
    let dnow = moment().format("YYYY-MM-DD HH:mm:ss");
    let workers, hashrate, h24_blocks;

    let gotit = false;
    curr_count =0;
    let pool_atem_array =[];
    let pool_atem = {};
    let resName,resAlgo;
    for (let item in pool_api_data) {
      curr_count++;      
      if (
        fix.FixAlgo(pool_api_data[item].algo) == algo &&
        fix.FixCURR(pool_api_data[item].name) == CurrencyPoolSymbol
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
      SomeCurrDisabledOnPool = true;
      error.WriteSQL(
        "config not found in new data" + " " + url + " name:" + CurrencyPoolSymbol + " algo:" + algo +" #" ,
        "error"
      );
      continue ;
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
  if ((curr_count!=GetPoolCurrsCount(connection,pool_id))||(SomeCurrDisabledOnPool))
  {
    await PullInfoForPool(connection,pool_api_data,curr_count,pool_id);
  }
}

async function PullInfoForPool(connection,pool_api_data,curr_count,pool_id){
  let dnow = moment().format("YYYY-MM-DD HH:mm:ss");;
  let i = 0;
  for (let item in pool_api_data)
  {
    i++
    try {
      await connection.execute(
        dedent`
      INSERT INTO  pools_currencies_lists SET 
      on_date=?, 
      curr_name_on_pool_txt=?,
      algo_name_on_pool_txt=?,
      comment=?,
      pool_id=?      
      `,
        [dnow, pool_api_data[item].name, pool_api_data[item].algo, "["+i+"/"+curr_count+"]", pool_id]
      );
    } catch (e) {
      return error.WriteSQL(
        "Unexpected error occurred in INSERT during writeData PullInfoForPool processing -",
        e.message
      );
    }
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
  try {
    await connection.execute(
      dedent`
    INSERT INTO  pools_currencies_stats SET 
    on_date=?, 
    conf_id=?,
    workers=?,
    hashrate=?,
    24h_blocks=?
    `,
      [dnow, conf_id, workers, hashrate, h24_blocks]
    );
  } catch (e) {
    return Error(
      "Unexpected error occurred in INSERT during writeData pools_currencies_stats processing -",
      e.message
    );
  }
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
      "SELECT * FROM pools_currencies_stats_conf WHERE pool_id=?",
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

/*
async function Start() {
  let connection = await DBconnect();
  await PullPoolsStats(connection);

  connection.end();
}
*/

async function GetPoolCurrsCount(connection,pool_id)
{
let pool;
  try {
    [pool, fields] = await connection.execute("SELECT * FROM pools WHERE id=?",[pool_id]);
  } catch (e) {
    return Error(
      "error select from DB in  GetPoolCurrsCount",
      e
    );
  }
return pool[0].coins_count;
}


async function start() {
  let connection = DBconnect();

    
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


start()