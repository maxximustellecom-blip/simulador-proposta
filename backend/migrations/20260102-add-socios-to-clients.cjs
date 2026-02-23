'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('clients');
    if (!table.socio1_nome) {
      await queryInterface.addColumn('clients', 'socio1_nome', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.socio1_cpf) {
      await queryInterface.addColumn('clients', 'socio1_cpf', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.socio1_contato) {
      await queryInterface.addColumn('clients', 'socio1_contato', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.socio2_nome) {
      await queryInterface.addColumn('clients', 'socio2_nome', { type: Sequelize.STRING(160), allowNull: true });
    }
    if (!table.socio2_cpf) {
      await queryInterface.addColumn('clients', 'socio2_cpf', { type: Sequelize.STRING(20), allowNull: true });
    }
    if (!table.socio2_contato) {
      await queryInterface.addColumn('clients', 'socio2_contato', { type: Sequelize.STRING(160), allowNull: true });
    }
  },
  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('clients');
    if (table.socio1_nome) {
      await queryInterface.removeColumn('clients', 'socio1_nome');
    }
    if (table.socio1_cpf) {
      await queryInterface.removeColumn('clients', 'socio1_cpf');
    }
    if (table.socio1_contato) {
      await queryInterface.removeColumn('clients', 'socio1_contato');
    }
    if (table.socio2_nome) {
      await queryInterface.removeColumn('clients', 'socio2_nome');
    }
    if (table.socio2_cpf) {
      await queryInterface.removeColumn('clients', 'socio2_cpf');
    }
    if (table.socio2_contato) {
      await queryInterface.removeColumn('clients', 'socio2_contato');
    }
  }
};

