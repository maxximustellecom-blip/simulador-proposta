import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CustomCategory = sequelize.define('CustomCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(160), allowNull: false },
  descricao: { type: DataTypes.STRING(255), allowNull: true },
  tipo: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'Novo' }
}, {
  tableName: 'custom_categories',
  timestamps: true,
  underscored: true
});

export default CustomCategory;

