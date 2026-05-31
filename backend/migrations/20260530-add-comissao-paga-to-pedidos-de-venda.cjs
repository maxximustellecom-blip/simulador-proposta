'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('pedidos_de_venda');
    if (!table.comissao_paga) {
      await queryInterface.addColumn('pedidos_de_venda', 'comissao_paga', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('pedidos_de_venda');
    if (table.comissao_paga) {
      await queryInterface.removeColumn('pedidos_de_venda', 'comissao_paga');
    }
  }
};

