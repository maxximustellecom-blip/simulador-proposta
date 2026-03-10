'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('appointments');

    if (!table.dias_antecedencia) {
      await queryInterface.addColumn('appointments', 'dias_antecedencia', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }

    if (!table.notified_before) {
      await queryInterface.addColumn('appointments', 'notified_before', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    if (!table.notified_day) {
      await queryInterface.addColumn('appointments', 'notified_day', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('appointments');

    if (table.notified_day) {
      await queryInterface.removeColumn('appointments', 'notified_day');
    }

    if (table.notified_before) {
      await queryInterface.removeColumn('appointments', 'notified_before');
    }

    if (table.dias_antecedencia) {
      await queryInterface.removeColumn('appointments', 'dias_antecedencia');
    }
  }
};

