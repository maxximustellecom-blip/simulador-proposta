import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NegociacaoProposta = sequelize.define('NegociacaoProposta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  negotiation_id: { type: DataTypes.INTEGER, allowNull: false },
  linhas: { type: DataTypes.JSON, allowNull: false },
  total_valor: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  total_acessos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  anotacoes: { type: DataTypes.TEXT, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'negotiation_proposals',
  timestamps: true,
  underscored: true
});

export default NegociacaoProposta;

