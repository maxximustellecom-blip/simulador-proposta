'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('access_profiles', 'commission_config', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('access_profiles', 'commission_config');
  }
};
