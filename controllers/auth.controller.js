// controllers/auth.controller.js

const bcrypt = require('bcryptjs'); // Para cifrar contraseñas
const Usuario = require('../models/usuario.model'); // Modelo de usuario
const Database = require('../config/db'); // Singleton de conexión
const db = Database.getInstance(); // Obtenemos la instancia del Singleton
const queries = require(`../sql/${process.env.DB_CLIENT}/usuario.sql`); // Consultas SQL específicas

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
    const resultado = await db.query(queries.SELECT_BY_CORREO, [correo]);
    const existe = (resultado.rows || resultado).length > 0;
    if (existe) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Cifrar la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar ID (solo si no estás usando secuencia/trigger en Oracle/PostgreSQL)
    const id = generarId();

    // Insertar en la base de datos
    await db.query(queries.INSERT, [id, nombre, correo, telefono, hashedPassword]);

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

    const resultado = await db.query(queries.SELECT_BY_CORREO, [correo]);
    const filas = resultado.rows || resultado;

    if (filas.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = filas[0];

    const passwordValida = await bcrypt.compare(password, usuario.PASSWORD || usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

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
