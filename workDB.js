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

MyDBclass.prototype.Select = async function(q, param, LogToSQL) {
  let res, fields;
  try {
    if (param) {
      [res, fields] = await this.connection.execute(q, param);
    } else {
      [res, fields] = await this.connection.execute(q);
    }
  } catch (e) {
    if (LogToSQL)
      return await error.WriteSQL("error select from DB for " + q, e);
    else return error.MyError("error select from DB for " + q, e);
  }

  return res;
};

MyDBclass.prototype.Insert = async function(q, param, LogToSQL) {
  let df;
  try {
    df = await this.connection.execute(q, param);
  } catch (e) {
    if (LogToSQL)
      return await error.WriteSQL("error Insert from DB for " + q, e);
    else return error.MyError("error Insert from DB for " + q, e);
  }
};

module.exports.DBconnect = DBconnect;
