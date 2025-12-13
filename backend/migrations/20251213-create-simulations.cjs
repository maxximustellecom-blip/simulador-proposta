'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('simulations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      data: { type: Sequelize.STRING(40), allowNull: false },
      receita_novos: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      receita_total: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      nivel_nome: { type: Sequelize.STRING(20), allowNull: false },
      nivel_fator: { type: Sequelize.DECIMAL(6,2), allowNull: false },
      comissao_total: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      created_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('simulations');
  }
};
