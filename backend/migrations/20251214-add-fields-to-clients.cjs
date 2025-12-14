'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clients', 'fantasy_name', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'email', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'phone', { type: Sequelize.STRING(40), allowNull: true });
    await queryInterface.addColumn('clients', 'cep', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'state', { type: Sequelize.STRING(10), allowNull: true });
    await queryInterface.addColumn('clients', 'city', { type: Sequelize.STRING(120), allowNull: true });
    await queryInterface.addColumn('clients', 'neighborhood', { type: Sequelize.STRING(120), allowNull: true });
    await queryInterface.addColumn('clients', 'street', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'number', { type: Sequelize.STRING(40), allowNull: true });
    await queryInterface.addColumn('clients', 'complement', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'opening_date', { type: Sequelize.STRING(40), allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('clients', 'fantasy_name');
    await queryInterface.removeColumn('clients', 'email');
    await queryInterface.removeColumn('clients', 'phone');
    await queryInterface.removeColumn('clients', 'cep');
    await queryInterface.removeColumn('clients', 'state');
    await queryInterface.removeColumn('clients', 'city');
    await queryInterface.removeColumn('clients', 'neighborhood');
    await queryInterface.removeColumn('clients', 'street');
    await queryInterface.removeColumn('clients', 'number');
    await queryInterface.removeColumn('clients', 'complement');
    await queryInterface.removeColumn('clients', 'opening_date');
  }
};
