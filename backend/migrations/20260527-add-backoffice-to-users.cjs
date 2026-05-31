'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.backoffice) {
      await queryInterface.addColumn('users', 'backoffice', { type: Sequelize.BOOLEAN, defaultValue: false });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (table.backoffice) {
      await queryInterface.removeColumn('users', 'backoffice');
    }
  }
};
