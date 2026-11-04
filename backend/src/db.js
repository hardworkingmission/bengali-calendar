const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  ...require("./db-config")(),
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

module.exports = pool;
