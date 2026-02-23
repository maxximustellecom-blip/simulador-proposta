'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('clients');
    if (!table.fantasy_name) {
      await queryInterface.addColumn('clients', 'fantasy_name', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.email) {
      await queryInterface.addColumn('clients', 'email', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.phone) {
      await queryInterface.addColumn('clients', 'phone', { type: Sequelize.STRING(40), allowNull: true });
    }
    if (!table.cep) {
      await queryInterface.addColumn('clients', 'cep', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.state) {
      await queryInterface.addColumn('clients', 'state', { type: Sequelize.STRING(10), allowNull: true });
    }
    if (!table.city) {
      await queryInterface.addColumn('clients', 'city', { type: Sequelize.STRING(120), allowNull: true });
    }
    if (!table.neighborhood) {
      await queryInterface.addColumn('clients', 'neighborhood', { type: Sequelize.STRING(120), allowNull: true });
    }
    if (!table.street) {
      await queryInterface.addColumn('clients', 'street', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.number) {
      await queryInterface.addColumn('clients', 'number', { type: Sequelize.STRING(40), allowNull: true });
    }
    if (!table.complement) {
      await queryInterface.addColumn('clients', 'complement', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.opening_date) {
      await queryInterface.addColumn('clients', 'opening_date', { type: Sequelize.STRING(40), allowNull: true });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('clients');
    if (table.fantasy_name) {
      await queryInterface.removeColumn('clients', 'fantasy_name');
    }
    if (table.email) {
      await queryInterface.removeColumn('clients', 'email');
    }
    if (table.phone) {
      await queryInterface.removeColumn('clients', 'phone');
    }
    if (table.cep) {
      await queryInterface.removeColumn('clients', 'cep');
    }
    if (table.state) {
      await queryInterface.removeColumn('clients', 'state');
    }
    if (table.city) {
      await queryInterface.removeColumn('clients', 'city');
    }
    if (table.neighborhood) {
      await queryInterface.removeColumn('clients', 'neighborhood');
    }
    if (table.street) {
      await queryInterface.removeColumn('clients', 'street');
    }
    if (table.number) {
      await queryInterface.removeColumn('clients', 'number');
    }
    if (table.complement) {
      await queryInterface.removeColumn('clients', 'complement');
    }
    if (table.opening_date) {
      await queryInterface.removeColumn('clients', 'opening_date');
    }
  }
};
