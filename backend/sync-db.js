import sequelize from './config/database.js';
import './models/index.js';

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing database:', err);
    process.exit(1);
  }
}

sync();
