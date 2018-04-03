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

// Подключение конфига
var config = require("./config.json");

var client = new zabbixNode(
  "http://zbxs.e5-nsk.ru/api_jsonrpc.php",
  "script",
  "123123"
);
var hostid = "10211";

// Should be call login at the first time
/*client.login(function(error, resp, body) {
    client.call('host.get', {'hostids': hostid}, function(error, resp, body) {
      console.log(body[0].host);
    });
});
*/

/* // Then the client has had the token
client.call('host.get', {'hostids': hostid}, function(error, resp, body) {
    console.log(body);
}); */
//getData(Done);
//writeData(Done, 2, moment().format("YYYY-MM-DD HH:mm:ss"), "0.001", "0");

function Error(err, Data) {
  if (err) {
    console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " " + err + " " + Data);
    return 0;
  }
  //else console.log(Data);
  //return Data;
}

async function getData(cb) {
  let res = {};
  let url =
    "http://dwarfpool.com/eth/api?wallet=0x1e758cc212cf5e2af9cd04e9aca388a9d1cc6e77&email=eth@example.com";
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });

    //console.log(res.body);
    //console.log(restp);
  } catch (e) {
    return cb("Unexpected error occurred in createConnection", e);
  }
  //writeData(Done, 2, moment().format("YYYY-MM-DD HH:mm:ss"), "0.001", "0");
  let ondate = moment().format("YYYY-MM-DD HH:mm:ss");
  let wallet_id = 2;
  let balance = res.body.wallet_balance; //wallet_balance
  let balance_immature = 0;
  //writeData(Done, wallet_id, ondate, balance, balance_immature);
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

async function writeData(cb, currency_id, ondate, balance, balance_immature) {
  //console.log("DB connected");
  /*var [rows, fields] = await connection.execute('show databases');
 console.log(rows);*/
  /*
  [rows, fields] = await connection.execute(
    'SELECT * FROM `balances`'
  );
  for (let row of rows) {
    for (let cell in row)
    {
        console.log("row." + cell + " = " + row[cell]);
    }
  }*/

  /*
  connection.query("INSERT INTO  balances SET `ondate`='2012-12-31 11:30:45', currency_id=1", function(err, result) {
    if (err) throw err;    
    console.log("fgfgfgfgfgfgfg");
  });*/

  //let id = 2;
  let dnow = moment().format("YYYY-MM-DD HH:mm:ss");
  try {
    await connection.execute(
      dedent`
    INSERT INTO  balances SET 
    ondate=?, 
    wallet_id=?,
    balance=?,
    balance_immature=?`,
      [ondate, currency_id, balance, balance_immature]
    );
  } catch (e) {
    connection.end();
    return cb(
      "Unexpected error occurred in INSERT during writeData processing -",
      e.message
    );
  }

  console.log("INSERT done");
  connection.end();
}

async function test(cb) {
  let TikersData = {
    PROTON: {
      url: "https://graviex.net//api/v2/tickers/protonbtc.json",
      last: "",
      volume: "",
      ask: "",
      bid: "",
      chek: ""
    },
    ULT: {
      url: "https://api.crypto-bridge.org/api/v1/ticker",
      last: "[14].last",
      volume: "",
      ask: "",
      bid: "",
      chek: "id=ULT_BTC"
    }
  };
  const https = require("https");

  var rootCas = require("ssl-root-cas/latest").create();

  let outs = rootCas.addFile(
    __dirname + "/config/ssl/comodorsadomainvalidationsecureserverca.crt"
  );
  https.globalAgent.options.ca = rootCas;
  // will work with all https requests will all libraries (i.e. request.js)
  //var https = (require("https").globalAgent.options.ca = rootCas);

  https
    .get("https://graviex.net//api/v2/tickers/protonbtc.json", res => {
      //console.log("statusCode:", res.statusCode);
      //console.log("headers:", res.headers);

      res.on("data", d => {
        //process.stdout.write(d);
      });
    })
    .on("error", e => {
      console.error(e);
    });

  var request = require("request");

  var url = "https://graviex.net//api/v2/tickers/protonbtc.json";
  /*
  request(
    {
      url: url,
      json: true
    },
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log(body); // Print the json response
      }
    }
  );
*/
  url = "https://api.crypto-bridge.org/api/v1/ticker";

  request(
    {
      url: url,
      json: true
    },
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        // let lastKey = "[2].last";
        // let data1 = get(body, "[2].last");
        //console.log(get(Obj, "data3[1]")); //boo!
        //console.log(data1); // Print the json response
      }
    }
  );

  /*
  let Obj = {
    data1: "ddd",
    data2: "fff",
    data3: ["gg", "hh"]
  };
  let properties1 = "data1";
  let properties2 = "data3[1]";
  console.log(Obj[properties1]); //ok
  console.log(get(Obj, "data3[1]")); //boo!
  console.log("ok");
  */

  //--
  let res = {};
  url = "https://graviex.net//api/v2/tickers/protonbtc.json";
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });

    let last = get(res, "body.ticker.last");
    let volume = get(res, "body.ticker.volbtc");
    let ask = get(res, "body.ticker.sell");
    let bid = get(res, "body.ticker.buy");
    console.log("last:", last);
    console.log("volume:", volume);
    console.log("ask:", ask);
    console.log("bid:", bid);
  } catch (e) {
    return cb("Unexpected error occurred in createConnection", e);
  }

  //

  /*
  let url = "https://graviex.net//api/v2/tickers/protonbtc.json";
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });

    //console.log(res.body);
    //console.log(restp);
  } catch (e) {
    return cb("Unexpected error occurred in createConnection", e);
  }
  let balance = res.body.wallet_balance;*/
}

async function getTiker(cb, id) {
  //db.execute('SELECT * FROM users WHERE LIMIT = ?', [10]).spread(function (users) {
  // console.log('Hello users', users);

  let TikersData = {
    PROTON: {
      url: "https://graviex.net//api/v2/tickers/protonbtc.json",
      last: "",
      volume: "",
      ask: "",
      bid: "",
      chek: ""
    },
    ULT: {
      url: "https://api.crypto-bridge.org/api/v1/ticker",
      last: "[14].last",
      volume: "",
      ask: "",
      bid: "",
      chek: "id=ULT_BTC"
    }
  };
}

async function start() {
  // do something
  let connection = await DBconnect();
  if (!connection) {
    console.log("DBconnect error -cannot connect to DB, exit");
    return;
  }

  //первый запуск при инициализации
  Task5min(connection);
  //Task60min(connection);
  //Task24h(connection); но тут лучше наверное переделать на расписание по времени или вобще все переделать ан расписание. чтоб и 5 мин таймер запусался в кратное время. и часовой


  //Запуск функции шедулера
  //
  // начать повторы с интервалом 5мин
  var timerId = setInterval(() => {
    Task5min(connection);
  }, 300000);
}

async function Task5min(connection) {
  //получить список всех валют указаных в проверке 5 мин и запусить их проверку через цикл
  let currencies_tickers_conf_List = await Get_currencies_tickers_conf_List(
    connection
  );
  Pull_currencies_tickers(connection, currencies_tickers_conf_List);
  //Pull_pools_grubeddata(connection, pools_grubeddata_conf_List)



  //await sleep();

  //connection;
  //.execute("SELECT * FROM currencies_tickers_conf WHERE id = ?", [5])
  let [configs, fields] = await connection.query(
    "SELECT  id FROM currencies_tickers_conf"
  );
  for (let config of configs) {
  }

  /*
  let [rows, fields] = await connection.query(
    "SELECT * FROM currencies_tickers_conf WHERE id = ?",
    [3]
  );*/
/*
  let sheduler5min = [5];
  for (let id of sheduler5min) {
    //getData(id, Error);
  }
*/
  //получить список всех пулов указаных в проверке 5 мин и запусить их проверку через цикл
  //
}

//---- test for
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep() {
  await timeout(60000);
}
//----
let currency_id,
exchange_id,
ticker_name,
url,
last_key,
volume_key,
ask_key,
bid_key,
chek;
async function Pull_currensy_ticker(connection, currencies_tickers_conf_id) {
  //console.log("start debug Pull_currensy_ticker");
  [
    currency_id,
    exchange_id,
    ticker_name,
    url,
    last_key,
    volume_key,
    ask_key,
    bid_key,
    chek
  ] = await Get_currency_ticker_options(connection, currencies_tickers_conf_id);
  let dnow, last, volume, ask, bid;
  try
  {
    [dnow, last, volume, ask, bid] = await Get_currency_ticker_WEB(
      currency_id,
      exchange_id,
      ticker_name,
      url,
      last_key,
      volume_key,
      ask_key,
      bid_key,
      chek
    );
  }  
  catch(e)
  {

    //console.log("error in Get_currency_ticker_WEB");
    return  Error("error in Get_currency_ticker_WEB",ticker_name);
  }
  console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " ok");


  /*
    let last = get(res, "body.ticker.last");
    let volume = get(res, "body.ticker.volbtc");
    let ask = get(res, "body.ticker.sell");
    let bid = get(res, "body.ticker.buy");
    */
  Inset_currency_ticker_DB();
}
async function Inset_currency_ticker_DB(dnow, last, volume, ask, bid) {
  console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " get start insert"+ticker_name);
}

async function Get_currency_ticker_WEB(
  currency_id,
  exchange_id,
  ticker_name,
  url,
  last_key,
  volume_key,
  ask_key,
  bid_key,
  chek
) {
  let res = {};
  let dnow = moment().format("YYYY-MM-DD HH:mm:ss");  
  try {   
    res = await phin({
      url: url,
      parse: "json"
    });
  } catch (e) {
    return Error("cannot get data frome web ", url + e);
  }
  let last = get(res, last_key);
  let volume = 0;
  if (volume_key) volume = get(res, volume_key);
  let ask = 0;
  if (ask_key) ask = get(res, ask_key);
  let bid = 0;
  if (bid_key) bid = get(res, bid_key);
  if (chek) {
    let chekExpresson  = chek.split("=");    
    if (get(res,chekExpresson[0] )!=chekExpresson[1])
    {
      console.log("все плохо");
      console.log(get(res,chekExpresson[0] ));
      console.log(chekExpresson[1]);
      return Error("wrong config to get data frome web - check failed ", get(res,chekExpresson[0])+"!="+ chekExpresson[1]);
    }
    console.log("все хорошо");
    console.log(get(res,chekExpresson[0] ));
    console.log(chekExpresson[1]);
    console.log("dfdfdf");


  }
  console.log(dnow, last, volume, ask, bid);
  return [dnow, last, volume, ask, bid];
}

async function Get_currency_ticker_options(
  connection,
  currencies_tickers_conf_id
) {
  //todo try
  let [options, fields] = await connection.query(
    "SELECT * FROM currencies_tickers_conf WHERE id = ?",
    [currencies_tickers_conf_id]
  );
  // to do  check (options.length == 1)
  //let id = options[0].id;
  let currency_id = options[0].currency_id;
  let exchange_id = options[0].exchange_id;
  let ticker_name = options[0].ticker_name;
  let url = options[0].url;
  let last_key = options[0].last_key;
  let volume_key = options[0].volume_key;
  let ask_key = options[0].ask_key;
  let bid_key = options[0].bid_key;
  let chek = options[0].chek;
  return [
    currency_id,
    exchange_id,
    ticker_name,
    url,
    last_key,
    volume_key,
    ask_key,
    bid_key,
    chek
  ];
}

function Pull_currencies_tickers(
  connection,
  currencies_tickers_conf_List_Array
) {
  for (let currencies_tickers_conf_id of currencies_tickers_conf_List_Array) {
    Pull_currensy_ticker(connection, currencies_tickers_conf_id);
  }
}

//currencies_tickers_conf
async function Get_currencies_tickers_conf_List(connection) {
  //try   todo
  let [currencies_tickers_conf_List, fields] = await connection.query(
    "SELECT * FROM sheduler5min"
  );
  let currencies_tickers_conf_List_Array = [];
  for (let currencies_ticker of currencies_tickers_conf_List) {
    currencies_tickers_conf_List_Array.push(
      currencies_ticker.currencies_tickers_conf_id
    );
  }
  return currencies_tickers_conf_List_Array;
}

async function getCurrenses(connection, currensysArray) {}

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

//test(Done);
start();
//getTiker(1,Done);
