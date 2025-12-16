import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(160), allowNull: false },
  descricao: { type: DataTypes.STRING(255), allowNull: true },
  tipo: { type: DataTypes.ENUM('Novo', 'Adtivo', 'Renegociação'), allowNull: false, defaultValue: 'Novo' }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true
});

export default Category;
