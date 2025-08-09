require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const debug = require('debug')('app:server');
const { generarAvisos } = require('../utils/notificador');

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
app.use(helmet());

// ✅ CORS dinámico (ponerlo antes de rutas)
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://mi-api-atempo.onrender.com/',
    'https://atempo-react.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Middleware para agregar clientes Supabase a req
app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAdmin = supabaseAdmin;
  next();
});

// ✅ Rutas
app.use('/api/personas', require('./routes/persona.routes'));
app.use('/api/citas', require('./routes/cita.routes'));
app.use('/api/avisos', require('./routes/aviso.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/frecuentes', require('./routes/clientes.routes'));

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

