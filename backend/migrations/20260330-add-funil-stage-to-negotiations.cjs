'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('negotiations');
    if (!table.funil_stage) {
      await queryInterface.addColumn('negotiations', 'funil_stage', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('negotiations');
    if (table.funil_stage) {
      await queryInterface.removeColumn('negotiations', 'funil_stage');
    }
  }
};
