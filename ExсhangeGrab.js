const dedent = require("dedent");
var moment = require("moment");

const error = require("./error");
var MyworkDB = require("./workDB");
var MyworkWEB = require("./workWEB");

async function start() {
  let myconnection = await MyworkDB.DBconnect();
  if (!myconnection) return 0;

  //получить список всех валют указаных в проверке 5 мин и запусить их проверку через цикл
  let currencies_tickers_conf_List = await Get_currencies_tickers_conf_List(
    myconnection
  );

  await Pull_currencies_tickers(myconnection, currencies_tickers_conf_List);
  //Pull_pools_grubeddata(myconnection, pools_grubeddata_conf_List)
  myconnection.End();
  //await sleep();
}

async function Pull_currensy_ticker(myconnection, currencies_tickers_conf_id) {
  let [
    currency_id,
    exchange_id,
    ticker_name,
    url,
    last_key,
    volume_key,
    ask_key,
    bid_key,
    chek
  ] = await Get_currency_ticker_options(
    myconnection,
    currencies_tickers_conf_id
  );

  let opt = new Object();
  opt.last = last_key;
  opt.volume = volume_key;
  opt.ask = ask_key;
  opt.bid = bid_key;

  let { last, volume, ask, bid } = await MyworkWEB.WebGetData(url, opt, chek);
  //Ошибка в получении данных выходим
  if (!last || !volume || !ask || !bid) return 0;

  let dnow = moment().format("YYYY-MM-DD HH:mm:ss");

  await Inset_currency_ticker_DB(myconnection, [
    dnow,
    currencies_tickers_conf_id,
    last,
    volume,
    ask,
    bid
  ]);
}
async function Inset_currency_ticker_DB(myconnection, param) {
  let q = dedent`
    INSERT INTO  currencies_tickers SET 
    on_date=?, 
    conf_id=?,
    last=?,
    volume=?,
    ask=?,
    bid=?`;
  await myconnection.Insert(q, param);
}

async function Get_currency_ticker_options(
  myconnection,
  currencies_tickers_conf_id
) {
  let q =
    "SELECT * FROM currencies_tickers_conf WHERE id = " +
    currencies_tickers_conf_id;
  let options = await myconnection.Select(q);
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

async function Pull_currencies_tickers(
  myconnection,
  currencies_tickers_conf_List_Array
) {
  let calls = [];
  for (let currencies_tickers_conf_id of currencies_tickers_conf_List_Array) {
    //Pull_currensy_ticker при вызове вызращает промис, который мы пушим в масси, который потом уже передадим в Promise.all который вернем нам общий промис и уже завершениия его мы дождемся через await
    calls.push(Pull_currensy_ticker(myconnection, currencies_tickers_conf_id));
    //return calls;
  }

  await Promise.all(calls);
}

//currencies_tickers_conf
async function Get_currencies_tickers_conf_List(myconnection) {
  let q = "SELECT id FROM currencies_tickers_conf where enable_monitoring=1";
  let currencies_tickers_conf_List = await myconnection.Select(q);
  if (!currencies_tickers_conf_List.length) return 0;

  let currencies_tickers_conf_List_Array = [];
  for (let currencies_ticker of currencies_tickers_conf_List) {
    currencies_tickers_conf_List_Array.push(currencies_ticker.id);
  }
  return currencies_tickers_conf_List_Array;
}

module.exports.start = start;
