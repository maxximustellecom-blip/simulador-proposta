import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.TIME, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  notified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true
});

export default Appointment;
