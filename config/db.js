require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('⚠️ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    }

    console.log('🔌 Conectando a Supabase...');

    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false }
      }
    );

    console.log('✅ Cliente de Supabase inicializado correctamente');
  }

  static instance;

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  getClient() {
    return this.client;
  }

  from(table) {
    return this.client.from(table);
  }

  async query(table, method, payload = {}) {
    let query;

    switch (method) {

      case 'select':
        query = this.client.from(table).select(payload.columns || '*');

        if (payload.filters) {
          payload.filters.forEach(({ field, operator, value }) => {
            query = query[operator](field, value);
          });
        }
        break;

      case 'insert':
        query = this.client.from(table).insert(payload.data);
        break;

      case 'update':
        query = this.client.from(table).update(payload.data);

        if (payload.filters) {
          payload.filters.forEach(({ field, operator, value }) => {
            query = query[operator](field, value);
          });
        }
        break;

      case 'delete':
        query = this.client.from(table).delete();

        if (payload.filters) {
          payload.filters.forEach(({ field, operator, value }) => {
            query = query[operator](field, value);
          });
        }
        break;

      default:
        throw new Error(`Método ${method} no soportado`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ Error en ${method} (${table}):`, error.message);
      throw new Error(error.message);
    }

    return data;
  }
}

module.exports = Database;
