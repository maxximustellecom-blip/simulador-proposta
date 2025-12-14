'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sales', 'p2b', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('sales', 'p2b');
  }
};
