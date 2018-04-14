//-------tips------------------------
//process.stdout.write(d);
var moment = require("moment");

const poolsgraber = require("./PoolsGrab");

const exchangegraber = require("./ExсhangeGrab");
const getBalans = require("./getBalance");

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
  let call = [];
  call.push(getBalans.start());
  call.push(poolsgraber.PullPoolsStats());
  call.push(exchangegraber.start());
  await Promise.all(call);

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
