import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Regiao = sequelize.define('Regiao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: true
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'Regioes',
  timestamps: true
});

export default Regiao;
