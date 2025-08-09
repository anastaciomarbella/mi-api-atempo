require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const debug = require('debug')('app:server');
const { generarAvisos } = require('./utils/notificador');

const app = express();

// ✅ Validar variables de entorno necesarias
if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error('❌ Faltan variables de entorno para Supabase');
  process.exit(1);
}

// ✅ Crear clientes Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Middlewares globales
app.use(express.json());
app.use(helmet()); // Seguridad HTTP

// CORS dinámico
const allowedOrigins = [
  'http://localhost:3000',
  'https://atempo-react.onrender.com' // tu frontend en Render
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true
  })
);

// Middleware para agregar clientes Supabase a req
app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAdmin = supabaseAdmin;
  next();
});

// ✅ Ejemplos de rutas
app.use('/api/personas', require('./routes/persona.routes'));
app.use('/api/citas', require('./routes/cita.routes'));
app.use('/api/avisos', require('./routes/aviso.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/frecuentes', require('./routes/clientes.routes'));

// Ruta de prueba
app.get('/api/citas', async (req, res) => {
  const { data, error } = await req.supabase.from('citas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Middleware global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error inesperado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});

// ⚠ Avisos automáticos (si Render está activo)
const INTERVALO_MINUTOS = 30;
setInterval(() => {
  generarAvisos();
}, INTERVALO_MINUTOS * 60 * 1000);
