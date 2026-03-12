 'use strict';
 
 module.exports = {
   up: async (queryInterface, Sequelize) => {
     const table = await queryInterface.describeTable('appointments');
 
     if (!table.finalizado) {
       await queryInterface.addColumn('appointments', 'finalizado', {
         type: Sequelize.BOOLEAN,
         allowNull: false,
         defaultValue: false
       });
     }
   },
 
   down: async (queryInterface) => {
     const table = await queryInterface.describeTable('appointments');
 
     if (table.finalizado) {
       await queryInterface.removeColumn('appointments', 'finalizado');
     }
   }
 };
