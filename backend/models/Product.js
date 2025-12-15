import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Category from './Category.js';

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoria_id: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(255), allowNull: true },
  preco: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true
});

Category.hasMany(Product, { foreignKey: 'categoria_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoria_id', as: 'category' });

export default Product;

