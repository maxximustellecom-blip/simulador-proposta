'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('clients');
    if (!table.rep_nome) {
      await queryInterface.addColumn('clients', 'rep_nome', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.rep_cpf) {
      await queryInterface.addColumn('clients', 'rep_cpf', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.rep_rg) {
      await queryInterface.addColumn('clients', 'rep_rg', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.rep_tel1) {
      await queryInterface.addColumn('clients', 'rep_tel1', { type: Sequelize.STRING(40), allowNull: true });
    }
    if (!table.rep_tel2) {
      await queryInterface.addColumn('clients', 'rep_tel2', { type: Sequelize.STRING(40), allowNull: true });
    }
    if (!table.gestor_nome) {
      await queryInterface.addColumn('clients', 'gestor_nome', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.gestor_cpf) {
      await queryInterface.addColumn('clients', 'gestor_cpf', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.gestor_rg) {
      await queryInterface.addColumn('clients', 'gestor_rg', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.gestor_tel1) {
      await queryInterface.addColumn('clients', 'gestor_tel1', { type: Sequelize.STRING(40), allowNull: true });
    }
    if (!table.gestor_tel2) {
      await queryInterface.addColumn('clients', 'gestor_tel2', { type: Sequelize.STRING(40), allowNull: true });
    }
    if (!table.auth1_nome) {
      await queryInterface.addColumn('clients', 'auth1_nome', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.auth1_cpf) {
      await queryInterface.addColumn('clients', 'auth1_cpf', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.auth1_rg) {
      await queryInterface.addColumn('clients', 'auth1_rg', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.auth1_contato) {
      await queryInterface.addColumn('clients', 'auth1_contato', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.auth2_nome) {
      await queryInterface.addColumn('clients', 'auth2_nome', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.auth2_cpf) {
      await queryInterface.addColumn('clients', 'auth2_cpf', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.auth2_contato) {
      await queryInterface.addColumn('clients', 'auth2_contato', { type: Sequelize.STRING(160), allowNull: true });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('clients');
    if (table.rep_nome) {
      await queryInterface.removeColumn('clients', 'rep_nome');
    }
    if (table.rep_cpf) {
      await queryInterface.removeColumn('clients', 'rep_cpf');
    }
    if (table.rep_rg) {
      await queryInterface.removeColumn('clients', 'rep_rg');
    }
    if (table.rep_tel1) {
      await queryInterface.removeColumn('clients', 'rep_tel1');
    }
    if (table.rep_tel2) {
      await queryInterface.removeColumn('clients', 'rep_tel2');
    }
    if (table.gestor_nome) {
      await queryInterface.removeColumn('clients', 'gestor_nome');
    }
    if (table.gestor_cpf) {
      await queryInterface.removeColumn('clients', 'gestor_cpf');
    }
    if (table.gestor_rg) {
      await queryInterface.removeColumn('clients', 'gestor_rg');
    }
    if (table.gestor_tel1) {
      await queryInterface.removeColumn('clients', 'gestor_tel1');
    }
    if (table.gestor_tel2) {
      await queryInterface.removeColumn('clients', 'gestor_tel2');
    }
    if (table.auth1_nome) {
      await queryInterface.removeColumn('clients', 'auth1_nome');
    }
    if (table.auth1_cpf) {
      await queryInterface.removeColumn('clients', 'auth1_cpf');
    }
    if (table.auth1_rg) {
      await queryInterface.removeColumn('clients', 'auth1_rg');
    }
    if (table.auth1_contato) {
      await queryInterface.removeColumn('clients', 'auth1_contato');
    }
    if (table.auth2_nome) {
      await queryInterface.removeColumn('clients', 'auth2_nome');
    }
    if (table.auth2_cpf) {
      await queryInterface.removeColumn('clients', 'auth2_cpf');
    }
    if (table.auth2_contato) {
      await queryInterface.removeColumn('clients', 'auth2_contato');
    }
  }
};
