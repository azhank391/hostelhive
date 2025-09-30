require("dotenv").config();

const buildConfig = () => {
  const useSSL = ["1", "true", "TRUE"].includes(String(process.env.DB_SSL || "").trim());
  const rejectUnauthorized = !["0", "false", "FALSE"].includes(String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "").trim());
  const connectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || "10000", 10);

  const dialectOptions = { connectTimeout };
  if (useSSL) {
    const caPath = process.env.DB_SSL_CA_PATH;
    if (caPath) {
      try {
        const fs = require("fs");
        dialectOptions.ssl = { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized };
      } catch {
        dialectOptions.ssl = { rejectUnauthorized };
      }
    } else {
      dialectOptions.ssl = { rejectUnauthorized };
    }
  }

  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: process.env.SEQUELIZE_LOGGING === "true" ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || "10", 10),
      min: parseInt(process.env.DB_POOL_MIN || "0", 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
      idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
    },
    dialectOptions,
  };
};

module.exports = {
  development: buildConfig(),
  production: buildConfig(),
};
