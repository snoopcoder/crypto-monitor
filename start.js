var zabbixNode = require("zabbix-node")
var client = new zabbixNode('http://zbxs.e5-nsk.ru/api_jsonrpc.php', 'script', '123123');
var hostid = '10211';

// Should be call login at the first time
client.login(function(error, resp, body) {
    client.call('host.get', {'hostids': hostid}, function(error, resp, body) {
      console.log(body[0].host);
    });
});

/* // Then the client has had the token
client.call('host.get', {'hostids': hostid}, function(error, resp, body) {
    console.log(body);
}); */