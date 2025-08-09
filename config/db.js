
require('dotenv').config(); // Carga variables de entorno

const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('⚠️ Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env');
    }

    console.log('🔌 Conectando a Supabase...');
    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Cliente de Supabase inicializado');
  }

  static instance;

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Método para acceder directamente al cliente de Supabase
  getClient() {
    return this.client;
  }

  // Atajo para acceder a una tabla
  from(table) {
    return this.client.from(table);
  }
}

module.exports = Database;
