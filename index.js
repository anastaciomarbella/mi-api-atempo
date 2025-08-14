require('dotenv').config();
console.log('🧪 DB_CLIENT desde index env:', process.env.DB_CLIENT);
const express = require('express');
const cors = require('cors');
const debug = require('debug')('app:server');
const Database = require('./config/db'); // Tu clase Database para Supabase
const db = Database.getInstance(); // Instancia singleton de Supabase
const { generarAvisos } = require('./utils/notificador');

const app = express();

app.use(express.json());
app.use(cors({ origin: 'https://atempo-react.onrender.com', credentials: true }));

// Middleware para adjuntar el cliente supabase en req
app.use((req, res, next) => {
  req.supabase = db.getClient();
  next();
});

// Tus rutas, que en sus controladores deben usar req.supabase
app.use('/api/personas', require('./routes/persona.routes'));
app.use('/api/citas', require('./routes/cita.routes'));
app.use('/api/avisos', require('./routes/aviso.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/frecuentes', require('./routes/clientes.routes'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});

// Ejecutar función de avisos cada 30 minutos
const INTERVALO_MINUTOS = 30;
setInterval(() => {
  generarAvisos();
}, INTERVALO_MINUTOS * 60 * 1000);
