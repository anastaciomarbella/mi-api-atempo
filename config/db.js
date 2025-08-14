require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('⚠️ Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env');
    }

    console.log('🔌 Conectando a Supabase...');
    this.client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
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

  // Método query genérico para compatibilidad con SQL-like
  async query(table, method, payload = {}) {
    let queryBuilder = this.client.from(table);

    switch (method) {
      case 'select':
        queryBuilder = queryBuilder.select(payload.columns || '*');
        if (payload.filters) {
          payload.filters.forEach(f => queryBuilder = queryBuilder[f.operator](f.field, f.value));
        }
        break;
      case 'insert':
        queryBuilder = queryBuilder.insert(payload.data);
        break;
      case 'update':
        queryBuilder = queryBuilder.update(payload.data);
        if (payload.filters) {
          payload.filters.forEach(f => queryBuilder = queryBuilder[f.operator](f.field, f.value));
        }
        break;
      case 'delete':
        if (payload.filters) {
          payload.filters.forEach(f => queryBuilder = queryBuilder[f.operator](f.field, f.value));
        }
        queryBuilder = queryBuilder.delete();
        break;
      default:
        throw new Error(`Método ${method} no soportado`);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  }
}

module.exports = Database;
