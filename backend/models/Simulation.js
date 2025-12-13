import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Simulation = sequelize.define('Simulation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  data: { type: DataTypes.STRING(40), allowNull: false },
  receita_novos: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  receita_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  nivel_nome: { type: DataTypes.STRING(20), allowNull: false },
  nivel_fator: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
  comissao_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  created_by: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'simulations',
  timestamps: true,
  underscored: true
});

export default Simulation;
