'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (!table.celular) {
      await queryInterface.addColumn('users', 'celular', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (table.celular) {
      await queryInterface.removeColumn('users', 'celular');
    }
  }
};
