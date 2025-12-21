import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AccessProfile = sequelize.define('AccessProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'access_profiles',
  timestamps: true,
  underscored: true
});

export default AccessProfile;
