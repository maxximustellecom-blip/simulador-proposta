'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('negotiations');
    if (!table.cadastro) {
      await queryInterface.addColumn('negotiations', 'cadastro', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('negotiations');
    if (table.cadastro) {
      await queryInterface.removeColumn('negotiations', 'cadastro');
    }
  }
};
