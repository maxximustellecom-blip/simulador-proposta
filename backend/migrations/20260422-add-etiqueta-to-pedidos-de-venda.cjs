'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('pedidos_de_venda');
    if (!table.etiqueta) {
      await queryInterface.addColumn('pedidos_de_venda', 'etiqueta', {
        type: Sequelize.STRING(120),
        allowNull: true
      });
    }
    if (!table.etiqueta_cor) {
      await queryInterface.addColumn('pedidos_de_venda', 'etiqueta_cor', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('pedidos_de_venda');
    if (table.etiqueta) {
      await queryInterface.removeColumn('pedidos_de_venda', 'etiqueta');
    }
    if (table.etiqueta_cor) {
      await queryInterface.removeColumn('pedidos_de_venda', 'etiqueta_cor');
    }
  }
};

