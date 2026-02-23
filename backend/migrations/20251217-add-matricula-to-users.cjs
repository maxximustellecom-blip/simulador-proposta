'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (!table.matricula) {
      await queryInterface.addColumn('users', 'matricula', {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('users');
    if (table.matricula) {
      await queryInterface.removeColumn('users', 'matricula');
    }
  }
};
