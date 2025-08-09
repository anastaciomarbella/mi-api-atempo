const bcrypt = require('bcryptjs'); // Para cifrar contraseñas
const Usuario = require('../models/usuario.model'); // Modelo de usuario
const Database = require('../config/db'); // Singleton de conexión a Supabase
const db = Database.getInstance(); // Instancia única

const generarId = () => Math.floor(Math.random() * 1000000); // Solo si no usas secuencias

// ===========================================
// REGISTRO DE USUARIO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, telefono, password } = req.body;

    // Validación básica
    if (!nombre || !correo || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya existe
    const { data: usuarioExistente, error: errorSelect } = await db
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .limit(1);

    if (errorSelect) throw errorSelect;

    if (usuarioExistente.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Cifrar la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar ID (solo si no usas autoincrement en Supabase)
    const id = generarId();

    // Insertar en Supabase
    const { error: errorInsert } = await db
      .from('usuarios')
      .insert([
        { id, nombre, correo, telefono, password: hashedPassword }
      ]);

    if (errorInsert) throw errorInsert;

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ error: err.message });
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

    // Buscar usuario en Supabase
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

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Sanitizar datos (eliminar la contraseña antes de enviar)
    const datosUsuario = Usuario(usuario);
    if (datosUsuario && datosUsuario.password) {
      delete datosUsuario.password;
    }

    return res.json({ message: 'Login exitoso', usuario: datosUsuario });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: err.message });
  }
};
