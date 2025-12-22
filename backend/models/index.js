import sequelize from '../config/database.js';
import User from './User.js';
import Client from './Client.js';
import Simulation from './Simulation.js';
import Sale from './Sale.js';
import Category from './Category.js';
import Product from './Product.js';
import Negotiation from './Negotiation.js';
import NegociacaoProposta from './NegociacaoProposta.js';
import CustomCategory from './CustomCategory.js';
import CustomProduct from './CustomProduct.js';
import NegociacaoPropostaCustomizada from './NegociacaoPropostaCustomizada.js';
import NegociacaoPropostaAnexos from './NegociacaoPropostaAnexos.js';
import NegociacaoPropostaCustomizadaAnexos from './NegociacaoPropostaCustomizadaAnexos.js';
import AccessProfile from './AccessProfile.js';
import PedidoDeVenda from './PedidoDeVenda.js';
import Regiao from './Regiao.js';

Simulation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Simulation, { foreignKey: 'created_by', as: 'simulations' });

User.belongsTo(AccessProfile, { foreignKey: 'profile_id', as: 'profile' });
AccessProfile.hasMany(User, { foreignKey: 'profile_id', as: 'users' });

Negotiation.hasOne(NegociacaoProposta, { foreignKey: 'negotiation_id', as: 'proposal' });
NegociacaoProposta.belongsTo(Negotiation, { foreignKey: 'negotiation_id', as: 'negotiation' });
Negotiation.hasOne(NegociacaoPropostaCustomizada, { foreignKey: 'negotiation_id', as: 'customProposal' });
NegociacaoPropostaCustomizada.belongsTo(Negotiation, { foreignKey: 'negotiation_id', as: 'negotiation' });

Negotiation.hasMany(NegociacaoPropostaAnexos, { foreignKey: 'negotiation_id', as: 'attachments' });
NegociacaoPropostaAnexos.belongsTo(Negotiation, { foreignKey: 'negotiation_id', as: 'negotiation' });

Negotiation.hasMany(NegociacaoPropostaCustomizadaAnexos, { foreignKey: 'negotiation_id', as: 'customAttachments' });
NegociacaoPropostaCustomizadaAnexos.belongsTo(Negotiation, { foreignKey: 'negotiation_id', as: 'negotiation' });

Negotiation.hasOne(PedidoDeVenda, { foreignKey: 'negotiation_id', as: 'pedidoDeVenda' });
PedidoDeVenda.belongsTo(Negotiation, { foreignKey: 'negotiation_id', as: 'negotiation' });

export { sequelize, User, Client, Simulation, Sale, Category, Product, Negotiation, NegociacaoProposta, CustomCategory, CustomProduct, NegociacaoPropostaCustomizada, NegociacaoPropostaAnexos, NegociacaoPropostaCustomizadaAnexos, AccessProfile, PedidoDeVenda, Regiao };
