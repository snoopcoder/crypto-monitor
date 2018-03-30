var zabbixNode = require("zabbix-node");
var getJSON = require("get-json");
var mysql = require("mysql2/promise");
const dedent = require("dedent");
var moment = require("moment");
const phin = require("phin").promisified;

var client = new zabbixNode(
  "http://zbxs.e5-nsk.ru/api_jsonrpc.php",
  "script",
  "123123"
);
var hostid = "10211";

// Подключение конфига
var config = require("./config.json");
// // Использование конфига
console.dir(config.port);

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
//writeData(Done);

function Done(err, Data) {
  if (err) console.log(err, Data);
  else console.log(Data);
}

async function getData(cb) {
  var url =
    "https://hashfaster.com/api/wallet?address=UfxfN9VbiFZzCv62g71QzZhLT8HhwUmnh4";
  try {
    //var restp = await asyncgetJSON(url);
    const res = await phin({
      url:
        "https://hashfaster.com/api/wallet?address=UfxfN9VbiFZzCv62g71QzZhLT8HhwUmnh4",
      parse: "json"
    });

    console.log(res.body);
    //console.log(restp);
  } catch (e) {
    return cb("Unexpected error occurred in createConnection", e);
  }
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

async function writeData(cb) {
  var connection;

  /*
const  mysql = require('mysql2/promise');
  // create the connection
  const connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'test'});
  // query database
  const [rows, fields] = await connection.execute('SELECT * FROM `table` WHERE `name` = ? AND `age` > ?', ['Morty', 14]);

 */

  // create the connection to database

  try {
    connection = await mysql.createConnection({
      host: "192.168.88.31",
      user: "scode",
      password: "master",
      database: "cryptomonitor"
    });
  } catch (e) {
    return cb("Unexpected error occurred in createConnection", e.message);
  }

  console.log("DB connected");
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

  let id = 2;
  let dnow = moment().format("YYYY-MM-DD HH:mm:ss");
  try {
    await connection.execute(
      dedent`
    INSERT INTO  balances SET 
    ondate=?, 
    currency_id=?,
    value=10.2`,
      [dnow, id]
    );
  } catch (e) {
    connection.end();
    return cb("Unexpected error occurred in INSERT INTO", e.message);
  }

  console.log("INSERT done");
  connection.end();
}
