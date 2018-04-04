const phin = require("phin").promisified;

async function start() {
  let res = {};
  let url = "https://protopool.net/api/currencies";
  try {
    //var restp = await asyncgetJSON(url);
    res = await phin({
      url: url,
      parse: "json"
    });

    console.log(res.body);
    let i = 0;
    for (let obj in res.body) {
      i++;
      console.log(
        i +
          " " +
          res.body[obj].name +
          " " +
          res.body[obj].algo +
          " " +
          res.body[obj].workers +
          " " +
          res.body[obj]["24h_btc"]
      );
    }
    //console.log(restp);
  } catch (e) {
    return cb("Unexpected error occurred in createConnection", e);
  }
}
start();
/*
"algo":"c11-stipend",
"port":3583,
"name":"Stipend",
"height":85365,
"workers":231,
"shares":1128,
"hashrate":16086676083,
"estimate":"0.00582",
"24h_blocks":65,
"24h_btc":0.11218253,
"lastblock":85364,
"timesincelast":265
*/
