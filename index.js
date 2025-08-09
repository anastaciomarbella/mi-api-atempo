// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const app = express();

// Validar variables de entorno necesarias
if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    '❌ ERROR: Debes definir SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en .env'
  );
  process.exit(1);
}

// Crear clientes Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middlewares
app.use(
  cors({
    origin: 'https://atempo-react.onrender.com', // Cambia por el dominio de tu frontend
    credentials: true,
  })
);
app.use(express.json());

// Middleware para agregar clientes Supabase a req
app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAdmin = supabaseAdmin;
  next();
});

// Ruta GET ejemplo para obtener citas
app.get('/api/citas', async (req, res) => {
  const { data, error } = await req.supabase.from('citas').select('*');
  if (error) {
    console.error('❌ Error obteniendo citas:', error.message);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Ruta POST para registrar usuarios
app.post('/api/auth/registro', async (req, res) => {
  const { nombre, correo, telefono, password } = req.body;

  if (!nombre || !correo || !telefono || !password) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await req.supabaseAdmin
      .from('usuarios')
      .insert([{ nombre, correo, telefono, password: hashedPassword }]);

    if (error) {
      console.error('Error insertando usuario:', error.message);
      return res.status(500).json({ message: 'Error al registrar usuario' });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente', data });
  } catch (err) {
    console.error('Error inesperado:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});
