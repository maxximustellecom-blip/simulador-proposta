import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NegociacaoPropostaAnexos = sequelize.define('NegociacaoPropostaAnexos', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  negotiation_id: { type: DataTypes.INTEGER, allowNull: false },
  file_name: { type: DataTypes.STRING, allowNull: false },
  file_type: { type: DataTypes.STRING, allowNull: false },
  file_data: { type: DataTypes.BLOB('long'), allowNull: false }
}, {
  tableName: 'negotiation_proposal_attachments',
  timestamps: true,
  underscored: true
});

export default NegociacaoPropostaAnexos;
