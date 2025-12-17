'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'matricula', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'matricula');
  }
};
