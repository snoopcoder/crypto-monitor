const error = require("./error");
var config = require("./config.json");
var mysql = require("mysql2/promise");

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

  return new MyDBclass(connection);
}

function MyDBclass(connection) {
  this.connection = connection;
}

MyDBclass.prototype.End = function() {
  this.connection.release();
};

MyDBclass.prototype.Select = async function(q, LogToSQL) {
  let res, fields;
  try {
    [res, fields] = await this.connection.execute(q);
  } catch (e) {
    if (LogToSQL)
      return await error.WriteSQL("error select from DB for " + q, e);
    else return error.MyError("error select from DB for " + q, e);
  }
  return res;
};

module.exports.DBconnect = DBconnect;
