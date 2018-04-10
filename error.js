var mysql = require("mysql2/promise");
var moment = require("moment");
const dedent = require("dedent");

var config = require("./config.json");


async function WriteSQL(err, Data) {
    let connection = await DBconnect();
    if (err) {
      console.log(
        moment().format("YYYY-MM-DD HH:mm:ss") + " " + err + " " + Data
      );
      let dnow = moment().format("YYYY-MM-DD HH:mm:ss");
      try {
        await connection.execute(
          dedent`
        INSERT INTO  Errors SET 
        on_date=?,         
        text=?      
        `,
          [dnow, err + " " + Data]
        );
      } catch (e) {
       console.log(
          "Unexpected error occurred in INSERT during writeData error.WriteSQL processing -",
          e.message
        );
      }
      return 0;
    }
    //else console.log(Data);
    //return Data;
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
  module.exports.WriteSQL = WriteSQL;