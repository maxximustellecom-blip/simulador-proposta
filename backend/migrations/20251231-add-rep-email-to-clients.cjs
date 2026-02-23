'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('clients');
    if (!table.rep_email) {
      await queryInterface.addColumn('clients', 'rep_email', { type: Sequelize.STRING(160), allowNull: true });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('clients');
    if (table.rep_email) {
      await queryInterface.removeColumn('clients', 'rep_email');
    }
  }
};

