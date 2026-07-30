require("dotenv").config();
const mysql = require("mysql2/promise");

const MAX_ATTEMPTS = 30;
const DELAY_MS = 2000;

async function waitForDb() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      await connection.ping();
      await connection.end();
      console.log("MySQL is ready.");
      return;
    } catch (err) {
      console.log(`Waiting for MySQL (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
  console.error("MySQL did not become ready in time.");
  process.exit(1);
}

waitForDb();
