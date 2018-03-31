var zabbixNode = require("zabbix-node");
var getJSON = require("get-json");
var mysql = require("mysql2/promise");
const dedent = require("dedent");
var moment = require("moment");
const phin = require("phin").promisified;

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
getData(Done);
//writeData(Done, 2, moment().format("YYYY-MM-DD HH:mm:ss"), "0.001", "0");

function Done(err, Data) {
  if (err) console.log(err, Data);
  else console.log(Data);
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
  let currency_id = 1;
  let balance = res.body.wallet_balance; //wallet_balance
  let balance_immature = 0;
  writeData(Done, currency_id, ondate, balance, balance_immature);
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
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.sql.host,
      user: config.sql.user,
      password: config.sql.password,
      database: config.sql.database
    });
  } catch (e) {
    return cb(
      "Unexpected error occurred in createConnection during writeData processing - ",
      e.message
    );
  }

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
    currency_id=?,
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
