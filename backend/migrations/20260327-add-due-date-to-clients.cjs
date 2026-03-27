'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('clients');
    if (!table.due_date) {
      await queryInterface.addColumn('clients', 'due_date', { type: Sequelize.STRING(40), allowNull: true });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('clients');
    if (table.due_date) {
      await queryInterface.removeColumn('clients', 'due_date');
    }
  }
};
