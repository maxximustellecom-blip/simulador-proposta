'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sales', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      tipo: { type: Sequelize.ENUM('novos', 'renovacao', 'ultraFibra', 'wttx', 'm2m'), allowNull: false },
      receita: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      vendedor: { type: Sequelize.STRING(120), allowNull: false },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      simulation_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'simulations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      created_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('sales');
  }
};
