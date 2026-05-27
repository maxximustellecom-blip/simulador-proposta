'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (table.comissao) {
      await queryInterface.removeColumn('users', 'comissao');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.comissao) {
      await queryInterface.addColumn('users', 'comissao', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      });
    }
  }
};

