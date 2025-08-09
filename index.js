require('dotenv').config(); // 1. Carga variables de entorno

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 2. Validación básica de variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Variables SUPABASE_URL o SUPABASE_ANON_KEY no definidas');
  process.exit(1);
}

// 3. Inicialización clientes Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// 4. Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// 5. Middleware para adjuntar supabase en req
app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAdmin = supabaseAdmin;
  next();
});

// 6. Ruta ejemplo para obtener todas las citas
app.get('/api/citas', async (req, res) => {
  const { data, error } = await req.supabase.from('citas').select('*');
  if (error) {
    console.error('❌ Error obteniendo citas:', error.message);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// 7. Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});
