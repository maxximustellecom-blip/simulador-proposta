'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'comissao_fixa_ativa', { type: Sequelize.BOOLEAN, defaultValue: false });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'comissao_fixa_ativa');
  }
};
