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
  },
  num_p2b: {
    type: DataTypes.STRING,
    allowNull: true
  },
  num_radar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data_entrada: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data_input: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data_ativacao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  etiqueta: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  etiqueta_cor: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  comissao_paga: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }
}, {
  tableName: 'pedidos_de_venda',
  timestamps: true,
  underscored: true
});

export default PedidoDeVenda;
