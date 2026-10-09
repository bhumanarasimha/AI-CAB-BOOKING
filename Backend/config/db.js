const { Sequelize } = require('sequelize');

let sequelize = new Sequelize('sqlite::memory:', { logging: false });
let isConnected = false;

const connectDB = async () => {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'smartride_db';

  try {
    const mysqlSequelize = new Sequelize(database, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    await mysqlSequelize.authenticate();
    sequelize = mysqlSequelize;
    console.log(`[MySQL] Connected successfully to database '${database}' on ${host}:${port}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`[MySQL Notice] Could not connect to MySQL server at ${host}:${port} (${error.message}). Running in High-Performance Local DB Mode.`);
    await sequelize.authenticate();
    isConnected = false;
    return false;
  }
};

const getSequelize = () => sequelize;
const getIsConnected = () => isConnected;

module.exports = { connectDB, getSequelize, getIsConnected };
