import { Sequelize } from 'sequelize';

const {
  DB_HOST = '31.97.18.57',
  DB_PORT = '3311',
  DB_USER = 'mysql',
  DB_PASS = 'maxximus20252938',
  DB_NAME = 'maxximustelecom',
  DB_LOGGING = 'false'
} = process.env;

const logging = DB_LOGGING === 'true' ? console.log : false;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
