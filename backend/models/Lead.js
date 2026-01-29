import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Lead = sequelize.define('Lead', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  batch_id: { type: DataTypes.INTEGER, allowNull: false },
  cnpj: { type: DataTypes.STRING(40), allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: true },
  contato: { type: DataTypes.STRING(160), allowNull: true },
  endereco: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.STRING(50), allowNull: true }, // 'lead_interessado', 'lead_nao_interessado', 'aguardando_contato'
  contact_scheduled_at: { type: DataTypes.DATE, allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  payload: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'leads',
  timestamps: true,
  underscored: true
});

export default Lead;
