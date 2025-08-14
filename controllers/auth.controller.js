// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const Database = require('../config/db'); // Singleton de conexión Supabase
const db = Database.getInstance();

// ===========================================
// REGISTRO DE USUARIO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, telefono, password, nombreEmpresa } = req.body;

    if (!nombre || !correo || !telefono || !password || !nombreEmpresa) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si correo ya está registrado
    const { data: usuarios, error: errorSelect } = await db
      .from('usuarios')
      .select('*')
      .eq('correo', correo);

    if (errorSelect) {
      console.error('Error al consultar usuario:', errorSelect);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (usuarios.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario con nombreEmpresa
    const { error: errorInsert } = await db.from('usuarios').insert([
      { nombre, correo, telefono, password: hashedPassword, nombre_empresa: nombreEmpresa }
    ]);

    if (errorInsert) {
      console.error('Error al insertar usuario:', errorInsert);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ===========================================
// LOGIN DE USUARIO
// ===========================================
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
    }

    // Buscar usuario por correo
    const { data: usuarios, error: errorSelect } = await db
      .from('usuarios')
      .select('*')
      .eq('correo', correo);

    if (errorSelect) {
      console.error('Error al consultar usuario:', errorSelect);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];

    // Comparar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // No enviar password en la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    return res.json({ message: 'Login exitoso', usuario: usuarioSinPassword });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
