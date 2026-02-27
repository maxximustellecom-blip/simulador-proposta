const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('clients');
    if (!tableInfo.notes) {
      await queryInterface.addColumn('clients', 'notes', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('clients');
    if (tableInfo.notes) {
      await queryInterface.removeColumn('clients', 'notes');
    }
  }
};
