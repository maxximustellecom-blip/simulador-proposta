'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('negotiations');
    if (!table.fatura_due_date) {
      await queryInterface.addColumn('negotiations', 'fatura_due_date', { type: Sequelize.STRING(40), allowNull: true });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('negotiations');
    if (table.fatura_due_date) {
      await queryInterface.removeColumn('negotiations', 'fatura_due_date');
    }
  }
};
