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
import accessProfileRouter from './routes/accessProfile.js';
import pedidoDeVendaRouter from './routes/pedidoDeVenda.js';
import regiaoRouter from './routes/regiao.js';
import authContext from './middleware/authContext.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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
app.use('/access-profiles', accessProfileRouter);
app.use('/pedidos-venda', pedidoDeVendaRouter);
app.use('/regioes', regiaoRouter);
app.use('/types', tipoRouter);

const port = process.env.PORT || 3001;

app.listen(port, () => {});
sequelize.authenticate().then(() => {
  return sequelize.sync({ alter: true });
}).catch(() => {});
