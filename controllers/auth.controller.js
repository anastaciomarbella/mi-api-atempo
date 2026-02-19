const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../config/db');
const db = Database.getInstance();

const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_cambiar_en_produccion";

// ===========================================
// REGISTRO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    let { nombre, correo, telefono, password, nombreEmpresa } = req.body;

    // LIMPIAR DATOS
    nombre = nombre?.trim();
    correo = correo?.trim().toLowerCase();
    telefono = telefono?.trim();
    password = password?.trim();
    nombreEmpresa = nombreEmpresa?.trim();

    if (!nombre || !correo || !telefono || !password || !nombreEmpresa) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }

    // Verificar si ya existe
    const { data: usuarioExistente } = await db
      .from('usuarios')
      .select('id_usuario')
      .eq('correo', correo)
      .maybeSingle();

    if (usuarioExistente) {
      return res.status(400).json({
        message: 'El correo ya está registrado'
      });
    }

    // Crear empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .insert([{ nombre_empresa: nombreEmpresa }])
      .select('id_empresa')
      .single();

    if (errorEmpresa) {
      return res.status(500).json({
        message: 'Error al crear empresa'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const { data: nuevoUsuario, error: errorUsuario } = await db
      .from('usuarios')
      .insert([{
        nombre,
        correo,
        telefono,
        password: hashedPassword,
        id_empresa: empresa.id_empresa
      }])
      .select('*')
      .single();

    if (errorUsuario) {
      return res.status(500).json({
        message: 'Error al crear usuario'
      });
    }

    delete nuevoUsuario.password;

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      usuario: nuevoUsuario
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};

// ===========================================
// LOGIN
// ===========================================
exports.login = async (req, res) => {
  try {
    let { correo, password } = req.body;

    correo = correo?.trim().toLowerCase();
    password = password?.trim();

    if (!correo || !password) {
      return res.status(400).json({
        message: 'Correo y contraseña son obligatorios'
      });
    }

    const { data: usuario, error } = await db
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error || !usuario) {
      return res.status(401).json({
        message: 'Credenciales incorrectas'
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({
        message: 'Credenciales incorrectas'
      });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_empresa: usuario.id_empresa
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    delete usuario.password;

    return res.status(200).json({
      message: 'Login exitoso',
      token,
      usuario
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};
