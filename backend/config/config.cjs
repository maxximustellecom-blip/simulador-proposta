module.exports = {
  development: {
    username: process.env.DB_USER || 'mysql',
    password: process.env.DB_PASS || 'maxximus20252938',
    database: process.env.DB_NAME || 'maxximustelecom',
    host: process.env.DB_HOST || '31.97.18.57',
    port: Number(process.env.DB_PORT || 3311),
    dialect: 'mysql'
  },
  test: {
    username: process.env.DB_USER || 'mysql',
    password: process.env.DB_PASS || 'maxximus20252938',
    database: (process.env.DB_NAME || 'maxximustelecom') + '_test',
    host: process.env.DB_HOST || '31.97.18.57',
    port: Number(process.env.DB_PORT || 3311),
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql'
  }
};
