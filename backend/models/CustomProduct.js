import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import CustomCategory from './CustomCategory.js';

const CustomProduct = sequelize.define('CustomProduct', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoria_id: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(255), allowNull: true },
  preco: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  regiao: { type: DataTypes.STRING(1000), allowNull: true }
}, {
  tableName: 'custom_products',
  timestamps: true,
  underscored: true
});

CustomCategory.hasMany(CustomProduct, { foreignKey: 'categoria_id', as: 'products' });
CustomProduct.belongsTo(CustomCategory, { foreignKey: 'categoria_id', as: 'category' });

export default CustomProduct;

