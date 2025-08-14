require('dotenv').config();
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

  getClient() {
    return this.client;
  }

  from(table) {
    return this.client.from(table);
  }

  // Método para hacer queries directas, recibe tabla, método y parámetros
  // Esto es un ejemplo para hacer select/insert/update/delete
  async query(table, method, payload = {}) {
    let queryBuilder = this.client.from(table);

    switch (method) {
      case 'select':
        if (payload.columns) {
          queryBuilder = queryBuilder.select(payload.columns);
        } else {
          queryBuilder = queryBuilder.select('*');
        }
        if (payload.filters) {
          // payload.filters debe ser un array de objetos {field, operator, value}
          payload.filters.forEach(({ field, operator, value }) => {
            queryBuilder = queryBuilder[operator](field, value);
          });
        }
        break;

      case 'insert':
        queryBuilder = queryBuilder.insert(payload.data);
        break;

      case 'update':
        queryBuilder = queryBuilder.update(payload.data);
        if (payload.filters) {
          payload.filters.forEach(({ field, operator, value }) => {
            queryBuilder = queryBuilder[operator](field, value);
          });
        }
        break;

      case 'delete':
        if (payload.filters) {
          payload.filters.forEach(({ field, operator, value }) => {
            queryBuilder = queryBuilder[operator](field, value);
          });
        }
        queryBuilder = queryBuilder.delete();
        break;

      default:
        throw new Error(`Método ${method} no soportado`);
    }

    const { data, error } = await queryBuilder;
    if (error) {
      console.error(`❌ Error en query ${method} tabla ${table}:`, error.message);
      throw error;
    }
    return data;
  }
}

module.exports = Database;
