import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  cnpj: { type: DataTypes.STRING(20), allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  fantasy_name: { type: DataTypes.STRING(160), allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: true },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  cep: { type: DataTypes.STRING(20), allowNull: true },
  state: { type: DataTypes.STRING(10), allowNull: true },
  city: { type: DataTypes.STRING(120), allowNull: true },
  neighborhood: { type: DataTypes.STRING(120), allowNull: true },
  street: { type: DataTypes.STRING(160), allowNull: true },
  number: { type: DataTypes.STRING(40), allowNull: true },
  complement: { type: DataTypes.STRING(160), allowNull: true },
  opening_date: { type: DataTypes.STRING(20), allowNull: true },

    rep_nome: { type: DataTypes.STRING(160), allowNull: true },
    rep_cpf: { type: DataTypes.STRING(20), allowNull: true },
    rep_rg: { type: DataTypes.STRING(20), allowNull: true },
    rep_tel1: { type: DataTypes.STRING(40), allowNull: true },
    rep_tel2: { type: DataTypes.STRING(40), allowNull: true },

    gestor_nome: { type: DataTypes.STRING(160), allowNull: true },
    gestor_cpf: { type: DataTypes.STRING(20), allowNull: true },
    gestor_rg: { type: DataTypes.STRING(20), allowNull: true },
    gestor_tel1: { type: DataTypes.STRING(40), allowNull: true },
    gestor_tel2: { type: DataTypes.STRING(40), allowNull: true },
  auth1_nome: { type: DataTypes.STRING(160), allowNull: true },
  auth1_cpf: { type: DataTypes.STRING(20), allowNull: true },
  auth1_rg: { type: DataTypes.STRING(20), allowNull: true },
  auth1_contato: { type: DataTypes.STRING(160), allowNull: true },
  auth2_nome: { type: DataTypes.STRING(160), allowNull: true },
  auth2_cpf: { type: DataTypes.STRING(20), allowNull: true },
  auth2_contato: { type: DataTypes.STRING(160), allowNull: true }
}, {
  tableName: 'clients',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['cnpj', 'created_by'], name: 'clients_cnpj_created_by_unique' }
  ]
});

export default Client;
