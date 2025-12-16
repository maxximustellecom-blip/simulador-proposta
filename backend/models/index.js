import sequelize from '../config/database.js';
import User from './User.js';
import Client from './Client.js';
import Simulation from './Simulation.js';
import Sale from './Sale.js';
import Category from './Category.js';
import Product from './Product.js';
import Negotiation from './Negotiation.js';
import NegociacaoProposta from './NegociacaoProposta.js';
import CustomCategory from './CustomCategory.js';
import CustomProduct from './CustomProduct.js';

Simulation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Simulation, { foreignKey: 'created_by', as: 'simulations' });

Negotiation.hasOne(NegociacaoProposta, { foreignKey: 'negotiation_id', as: 'proposal' });
NegociacaoProposta.belongsTo(Negotiation, { foreignKey: 'negotiation_id', as: 'negotiation' });

export { sequelize, User, Client, Simulation, Sale, Category, Product, Negotiation, NegociacaoProposta, CustomCategory, CustomProduct };
