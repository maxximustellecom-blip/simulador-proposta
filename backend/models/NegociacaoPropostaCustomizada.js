import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NegociacaoPropostaCustomizada = sequelize.define('NegociacaoPropostaCustomizada', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  negotiation_id: { type: DataTypes.INTEGER, allowNull: false },
  linhas: { type: DataTypes.JSON, allowNull: false },
  total_atual: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  total_proposto: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  total_economia: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  percentual_economia: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
  total_acessos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  anotacoes: { type: DataTypes.TEXT, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'negotiation_custom_proposals',
  timestamps: true,
  underscored: true
});

export default NegociacaoPropostaCustomizada;

