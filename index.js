require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('./config/db');
const { generarAvisos } = require('./utils/notificador');

const db = Database.getInstance();
const app = express();

app.use(express.json());
app.use(cors({ origin: 'https://atempo-react.onrender.com', credentials: true }));

app.use((req, res, next) => {
  req.supabase = db.getClient();
  next();
});

app.use('/api/personas', require('./routes/persona.routes'));
app.use('/api/citas', require('./routes/cita.routes'));
app.use('/api/avisos', require('./routes/aviso.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/frecuentes', require('./routes/clientes.routes'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`));

const INTERVALO_MINUTOS = 30;
setInterval(async () => {
  try { await generarAvisos(); }
  catch(err){ console.error('❌ Error en setInterval generarAvisos:', err); }
}, INTERVALO_MINUTOS*60*1000);
