// controllers/auth.controller.js

const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');
const Database = require('../config/db');
const db = Database.getInstance();
const queries = require(`../sql/${process.env.DB_CLIENT}/usuario.sql`);

const generarId = () => Math.floor(Math.random() * 1000000); // Usar secuencias si tienes

// Registro de usuario
exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, telefono, password } = req.body;

    if (!nombre || !correo || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya está registrado
    const resultado = await db.query(queries.SELECT_BY_CORREO, [correo]);
    const existe = (resultado.rows || resultado).length > 0;
    if (existe) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Cifrar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar ID (si no usas secuencias)
    const id = generarId();

    // Insertar usuario
    await db.query(queries.INSERT, [id, nombre, correo, telefono, hashedPassword]);

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Login de usuario
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

    // Mapeamos con el modelo y eliminamos la password antes de enviar
    const datosUsuario = Usuario(usuario);
    if (datosUsuario?.password) delete datosUsuario.password;

    return res.json({ message: 'Login exitoso', usuario: datosUsuario });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
