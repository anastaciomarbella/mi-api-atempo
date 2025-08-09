const bcrypt = require('bcryptjs');
const db = require('../config/db');
const Usuario = require('../models/usuario.model');

exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, telefono, password } = req.body;

    if (!nombre || !correo || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si correo ya existe
    const { data: usuariosExistentes, error: errorSelect } = await db
      .from('usuarios')
      .select('id')
      .eq('correo', correo)
      .limit(1);

    if (errorSelect) throw errorSelect;

    if (usuariosExistentes.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Cifrar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const { data: nuevoUsuario, error: errorInsert } = await db
      .from('usuarios')
      .insert([{ nombre, correo, telefono, password: hashedPassword }])
      .select()
      .single();

    if (errorInsert) throw errorInsert;

    return res.status(201).json({ message: 'Usuario registrado correctamente', usuario: Usuario(nuevoUsuario) });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

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
      .eq('correo', correo)
      .limit(1);

    if (errorSelect) throw errorSelect;

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];

    // Comparar contraseña
    const esValido = await bcrypt.compare(password, usuario.password);
    if (!esValido) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    return res.json({ message: 'Login exitoso', usuario: Usuario(usuario) });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
