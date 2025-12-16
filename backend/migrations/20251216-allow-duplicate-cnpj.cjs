'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try { await queryInterface.removeIndex('clients', 'clients_cnpj_unique'); } catch {}
    try { await queryInterface.removeIndex('clients', 'clients_cnpj_key'); } catch {}
    try { await queryInterface.removeIndex('clients', 'cnpj'); } catch {}
    try { await queryInterface.removeConstraint('clients', 'clients_cnpj_unique'); } catch {}
    await queryInterface.changeColumn('clients', 'cnpj', {
      type: Sequelize.STRING(20),
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('clients', 'cnpj', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true
    });
  }
};

