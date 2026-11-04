require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function migrate() {
  const connection = await mysql.createConnection({
    ...require("./db-config")(),
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await connection.query(sql);
  console.log("Migration complete: users, notes tables ready.");
  await connection.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
