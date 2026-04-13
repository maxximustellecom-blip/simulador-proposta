import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Client from './Client.js';
import User from './User.js';

const Negotiation = sequelize.define('Negotiation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cnpj: { type: DataTypes.STRING(20), allowNull: false },
  tipo: { type: DataTypes.STRING(40), allowNull: false },
  proposta: { type: DataTypes.STRING(40), allowNull: false },
  valor: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Em andamento' },
  cadastro: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  funil_stage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  fatura_due_date: { type: DataTypes.STRING(40), allowNull: true },
  data: { type: DataTypes.STRING(40), allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'negotiations',
  timestamps: true,
  underscored: true
});

Client.hasMany(Negotiation, { foreignKey: 'cnpj', sourceKey: 'cnpj', as: 'negotiations', constraints: false });
Negotiation.belongsTo(Client, { foreignKey: 'cnpj', targetKey: 'cnpj', as: 'client', constraints: false });

User.hasMany(Negotiation, { foreignKey: 'created_by', as: 'createdNegotiations' });
Negotiation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

export default Negotiation;
