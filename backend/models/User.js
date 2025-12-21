import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  matricula: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  password: { type: DataTypes.STRING(200), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
  profile_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

export default User;
