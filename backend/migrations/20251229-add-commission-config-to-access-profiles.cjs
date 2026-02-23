'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('access_profiles');
    if (!table.commission_config) {
      await queryInterface.addColumn('access_profiles', 'commission_config', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('access_profiles');
    if (table.commission_config) {
      await queryInterface.removeColumn('access_profiles', 'commission_config');
    }
  }
};
