import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LeadBatch = sequelize.define('LeadBatch', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  file_name: { type: DataTypes.STRING(255), allowNull: false },
  assigned_to: { type: DataTypes.INTEGER, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  total_leads: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'lead_batches',
  timestamps: true,
  underscored: true
});

export default LeadBatch;
