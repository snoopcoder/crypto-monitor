var zabbixNode = require("zabbix-node")
var getJSON = require('get-json')
var client = new zabbixNode('http://zbxs.e5-nsk.ru/api_jsonrpc.php', 'script', '123123');
var hostid = '10211';

// Подключение конфига
var config = require('./config.json');
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


var url = 'https://hashfaster.com/api/wallet?address=UfxfN9VbiFZzCv62g71QzZhLT8HhwUmnh4';
getJSON(url, function(error, response){         
    var NumOpt = 0;
    for (var key in response) {
        NumOpt++;
      }      
       if ((!error)&&(typeof(response=='object'))&&(NumOpt == 6))
       {               
        console.log( response); 
       }
       else
       {
        console.log("Ошибка соединения или разбора данных с " + url);
       }
       // => true 
    
   })