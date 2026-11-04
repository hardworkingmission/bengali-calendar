const fs = require("node:fs");

// Shared by the API, readiness check, and schema migration.
function dbConfig() {
  const caPath = process.env.DB_SSL_CA;
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(caPath && {
      ssl: { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized: true, verifyIdentity: true },
    }),
  };
}

module.exports = dbConfig;
