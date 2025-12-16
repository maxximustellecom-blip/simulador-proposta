'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clients', 'rep_nome', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'rep_cpf', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'rep_rg', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'rep_tel1', { type: Sequelize.STRING(40), allowNull: true });
    await queryInterface.addColumn('clients', 'rep_tel2', { type: Sequelize.STRING(40), allowNull: true });
    
    await queryInterface.addColumn('clients', 'gestor_nome', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'gestor_cpf', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'gestor_rg', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'gestor_tel1', { type: Sequelize.STRING(40), allowNull: true });
    await queryInterface.addColumn('clients', 'gestor_tel2', { type: Sequelize.STRING(40), allowNull: true });

    await queryInterface.addColumn('clients', 'auth1_nome', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'auth1_cpf', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'auth1_rg', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'auth1_contato', { type: Sequelize.STRING(160), allowNull: true });

    await queryInterface.addColumn('clients', 'auth2_nome', { type: Sequelize.STRING(160), allowNull: true });
    await queryInterface.addColumn('clients', 'auth2_cpf', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('clients', 'auth2_contato', { type: Sequelize.STRING(160), allowNull: true });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('clients', 'rep_nome');
    await queryInterface.removeColumn('clients', 'rep_cpf');
    await queryInterface.removeColumn('clients', 'rep_rg');
    await queryInterface.removeColumn('clients', 'rep_tel1');
    await queryInterface.removeColumn('clients', 'rep_tel2');

    await queryInterface.removeColumn('clients', 'gestor_nome');
    await queryInterface.removeColumn('clients', 'gestor_cpf');
    await queryInterface.removeColumn('clients', 'gestor_rg');
    await queryInterface.removeColumn('clients', 'gestor_tel1');
    await queryInterface.removeColumn('clients', 'gestor_tel2');

    await queryInterface.removeColumn('clients', 'auth1_nome');
    await queryInterface.removeColumn('clients', 'auth1_cpf');
    await queryInterface.removeColumn('clients', 'auth1_rg');
    await queryInterface.removeColumn('clients', 'auth1_contato');

    await queryInterface.removeColumn('clients', 'auth2_nome');
    await queryInterface.removeColumn('clients', 'auth2_cpf');
    await queryInterface.removeColumn('clients', 'auth2_contato');
  }
};
