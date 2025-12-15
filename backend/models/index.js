import sequelize from '../config/database.js';
import User from './User.js';
import Client from './Client.js';
import Simulation from './Simulation.js';
import Sale from './Sale.js';
import Category from './Category.js';
import Product from './Product.js';

Simulation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Simulation, { foreignKey: 'created_by', as: 'simulations' });

export { sequelize, User, Client, Simulation, Sale, Category, Product };
