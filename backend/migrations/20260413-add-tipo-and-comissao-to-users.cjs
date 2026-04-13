'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (!table.tipo) {
      await queryInterface.addColumn('users', 'tipo', {
        type: Sequelize.ENUM('interno', 'externo'),
        allowNull: false,
        defaultValue: 'interno'
      });
    }
    if (!table.comissao) {
      await queryInterface.addColumn('users', 'comissao', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      });
    }
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'tipo');
    await queryInterface.removeColumn('users', 'comissao');
  }
};
