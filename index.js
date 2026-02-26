require('dotenv').config();

console.log('🧪 DB_CLIENT desde index env:', process.env.DB_CLIENT);

const express = require('express');
const cors = require('cors');
const debug = require('debug')('app:server');

const Database = require('./config/db');
const { generarAvisos } = require('./utils/notificador');

// ==============================
// Inicialización
// ==============================
const app = express();
const db = Database.getInstance();

// ==============================
// Middlewares globales
// ==============================
app.use(express.json());

// CORS (producción + desarrollo)
app.use(cors({
  origin: [
    'https://atempo-react.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Archivos estáticos (si usas uploads locales)
app.use('/uploads', express.static('uploads'));

// Adjuntar cliente Supabase a cada request
app.use((req, res, next) => {
  req.supabase = db.getClient();
  next();
});

// ==============================
// RUTA RAÍZ (EVITA Cannot GET /)
// ==============================
app.get('/', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API Atempo funcionando correctamente 🚀'
  });
});

// ==============================
// RUTA DE PRUEBA
// ==============================
app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API test OK'
  });
});

// ==============================
// RUTAS DEL SISTEMA
// ==============================
app.use('/api/personas', require('./routes/persona.routes'));
app.use('/api/citas', require('./routes/cita.routes'));
app.use('/api/avisos', require('./routes/aviso.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/frecuentes', require('./routes/clientes.routes'));

// ==============================
// MANEJO DE RUTAS NO EXISTENTES
// ==============================
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: 'Ruta no encontrada'
  });
});

// ==============================
// ARRANQUE DEL SERVIDOR
// ==============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});

// ==============================
// TAREA PROGRAMADA (AVISOS)
// ==============================
const INTERVALO_MINUTOS = 30;

setInterval(() => {
  generarAvisos();
}, INTERVALO_MINUTOS * 60 * 1000);