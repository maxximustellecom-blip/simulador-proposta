import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  cnpj: { type: DataTypes.STRING(20), allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  fantasy_name: { type: DataTypes.STRING(160), allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: true },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  cep: { type: DataTypes.STRING(20), allowNull: true },
  state: { type: DataTypes.STRING(10), allowNull: true },
  city: { type: DataTypes.STRING(120), allowNull: true },
  neighborhood: { type: DataTypes.STRING(120), allowNull: true },
  street: { type: DataTypes.STRING(160), allowNull: true },
  number: { type: DataTypes.STRING(40), allowNull: true },
  complement: { type: DataTypes.STRING(160), allowNull: true },
  opening_date: { type: DataTypes.STRING(40), allowNull: true }
}, {
  tableName: 'clients',
  timestamps: true,
  underscored: true
});

export default Client;
