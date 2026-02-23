'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clients', 'reference_point', { type: Sequelize.STRING(160), allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('clients', 'reference_point');
  }
};

