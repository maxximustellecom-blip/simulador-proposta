'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('sales');
    if (!table.p2b) {
      await queryInterface.addColumn('sales', 'p2b', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('sales');
    if (table.p2b) {
      await queryInterface.removeColumn('sales', 'p2b');
    }
  }
};
