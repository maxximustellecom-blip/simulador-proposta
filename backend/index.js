import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRouter from './routes/auth.js';
import clientRouter from './routes/client.js';
import simulationRouter from './routes/simulation.js';
import saleRouter from './routes/sale.js';
import categoryRouter from './routes/category.js';
import productRouter from './routes/product.js';
import negotiationRouter from './routes/negotiation.js';
import customCategoryRouter from './routes/customCategory.js';
import customProductRouter from './routes/customProduct.js';
import authContext from './middleware/authContext.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(authContext);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/clients', clientRouter);
app.use('/simulations', simulationRouter);
app.use('/sales', saleRouter);
app.use('/categories', categoryRouter);
app.use('/products', productRouter);
app.use('/negotiations', negotiationRouter);
app.use('/custom-categories', customCategoryRouter);
app.use('/custom-products', customProductRouter);

const port = process.env.PORT || 3001;

app.listen(port, () => {});
sequelize.authenticate().then(async () => {
  await sequelize.sync({ alter: true });
  try {
    const candidates = ['clients_cnpj_unique','clients_cnpj_key','cnpj','cnpj_UNIQUE'];
    for (const name of candidates) {
      try { await sequelize.getQueryInterface().removeIndex('clients', name); } catch {}
      try { await sequelize.query(`ALTER TABLE clients DROP INDEX ${name}`); } catch {}
    }
    const [rows] = await sequelize.query('SHOW INDEXES FROM clients');
    for (const r of rows || []) {
      if (String(r.Column_name) === 'cnpj' && String(r.Non_unique) === '0') {
        const name = r.Key_name;
        try { await sequelize.getQueryInterface().removeIndex('clients', name); } catch {}
        try { await sequelize.query(`ALTER TABLE clients DROP INDEX ${name}`); } catch {}
      }
    }
  } catch {}
  try {
    const [rows2] = await sequelize.query('SHOW INDEXES FROM clients');
    const exists = (rows2 || []).some(r => String(r.Key_name) === 'clients_cnpj_created_by_unique');
    if (!exists) {
      await sequelize.getQueryInterface().addIndex('clients', ['cnpj','created_by'], { unique: true, name: 'clients_cnpj_created_by_unique' });
    }
  } catch {}
}).catch(() => {});
