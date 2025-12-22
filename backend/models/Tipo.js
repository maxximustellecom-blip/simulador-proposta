import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tipo = sequelize.define('Tipo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(160), allowNull: false },
  descricao: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'tipos',
  timestamps: true,
  underscored: true
});

export default Tipo;
