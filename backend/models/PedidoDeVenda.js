import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PedidoDeVenda = sequelize.define('PedidoDeVenda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  negotiation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'negotiations',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pendente'
  }
}, {
  tableName: 'pedidos_de_venda',
  timestamps: true,
  underscored: true
});

export default PedidoDeVenda;
