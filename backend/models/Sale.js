import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Client from './Client.js';
import Simulation from './Simulation.js';
import User from './User.js';

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.ENUM('novos', 'renovacao', 'ultraFibra', 'wttx', 'm2m'), allowNull: false },
  receita: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  vendedor: { type: DataTypes.STRING(120), allowNull: false },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  simulation_id: { type: DataTypes.INTEGER, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'sales',
  timestamps: true,
  underscored: true
});

Client.hasMany(Sale, { foreignKey: 'client_id', as: 'sales' });
Sale.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Simulation.hasMany(Sale, { foreignKey: 'simulation_id', as: 'sales' });
Sale.belongsTo(Simulation, { foreignKey: 'simulation_id', as: 'simulation' });

User.hasMany(Sale, { foreignKey: 'created_by', as: 'createdSales' });
Sale.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

export default Sale;
