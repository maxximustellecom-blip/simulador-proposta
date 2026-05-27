import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  matricula: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  celular: { type: DataTypes.STRING(20), allowNull: true },
  password: { type: DataTypes.STRING(200), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
  tipo: { type: DataTypes.ENUM('interno', 'externo'), allowNull: false, defaultValue: 'interno' },
  comissao_novo: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_aditivo: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_renovacao: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_migracao: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_pf_pj: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_tt: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_ultra_fibra: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_controle_pf: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_wttx: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_m2m: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
  comissao_fixa_ativa: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  backoffice: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  profile_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

export default User;
