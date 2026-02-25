require('dotenv').config();

const express = require('express');
const cors = require('cors');
const debug = require('debug')('app:server');
const Database = require('./config/db');
const { generarAvisos } = require('./utils/notificador');

const app = express();
const db = Database.getInstance();

// 🔥 IMPORTANTE PARA RENDER (detecta https correctamente)
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());

app.use(cors({
  origin: 'https://atempo-react.onrender.com',
  credentials: true
}));

// Middleware para adjuntar cliente Supabase
app.use((req, res, next) => {
  req.supabase = db.getClient();
  next();
});

// ===============================
// 🔹 Ruta de prueba
// ===============================
app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API funcionando correctamente'
  });
});

// ===============================
// 🔹 Rutas principales
// ===============================
app.use('/api/personas', require('./routes/persona.routes'));
app.use('/api/citas', require('./routes/cita.routes'));
app.use('/api/avisos', require('./routes/aviso.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/frecuentes', require('./routes/clientes.routes'));

// ===============================
// 🔹 Servidor
// ===============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado correctamente en puerto ${PORT}`);
});

// ===============================
// 🔹 Sistema automático de avisos
// ===============================
const INTERVALO_MINUTOS = 30;

setInterval(() => {
  generarAvisos();
}, INTERVALO_MINUTOS * 60 * 1000);