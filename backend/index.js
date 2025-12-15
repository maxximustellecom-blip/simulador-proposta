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

const port = process.env.PORT || 3001;

app.listen(port, () => {});
sequelize.authenticate().then(() => {
  return sequelize.sync({ alter: true });
}).catch(() => {});
