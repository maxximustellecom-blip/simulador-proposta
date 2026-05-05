'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'comissao_novo', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_aditivo', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_renovacao', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_migracao', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_pf_pj', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_tt', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_ultra_fibra', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_controle_pf', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_wttx', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
    await queryInterface.addColumn('users', 'comissao_m2m', { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'comissao_novo');
    await queryInterface.removeColumn('users', 'comissao_aditivo');
    await queryInterface.removeColumn('users', 'comissao_renovacao');
    await queryInterface.removeColumn('users', 'comissao_migracao');
    await queryInterface.removeColumn('users', 'comissao_pf_pj');
    await queryInterface.removeColumn('users', 'comissao_tt');
    await queryInterface.removeColumn('users', 'comissao_ultra_fibra');
    await queryInterface.removeColumn('users', 'comissao_controle_pf');
    await queryInterface.removeColumn('users', 'comissao_wttx');
    await queryInterface.removeColumn('users', 'comissao_m2m');
  }
};
