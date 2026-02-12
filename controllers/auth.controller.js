const bcrypt = require('bcryptjs');
const Database = require('../config/db');
const db = Database.getInstance();

// ===========================================
// REGISTRO DE USUARIO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, telefono, password, nombreEmpresa } = req.body;

    if (!nombre || !correo || !telefono || !password || !nombreEmpresa) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }

    // 1️⃣ Verificar si el correo ya existe
    const { data: usuarioExistente, error: errorCorreo } = await db
      .from('usuarios')
      .select('id_usuario')
      .eq('correo', correo)
      .maybeSingle();

    if (errorCorreo) {
      console.error('Error al verificar correo:', errorCorreo);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (usuarioExistente) {
      return res.status(400).json({
        message: 'El correo ya está registrado'
      });
    }

    // 2️⃣ Crear empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .insert([{ nombre_empresa: nombreEmpresa }])
      .select('id_empresa')
      .single();

    if (errorEmpresa) {
      console.error('Error al crear empresa:', errorEmpresa);
      return res.status(500).json({
        message: 'Error al crear empresa'
      });
    }

    // 3️⃣ Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Crear usuario
    const { error: errorUsuario } = await db
      .from('usuarios')
      .insert([{
        nombre,
        correo,
        telefono,
        password: hashedPassword,
        id_empresa: empresa.id_empresa
      }]);

    if (errorUsuario) {
      console.error('Error al crear usuario:', errorUsuario);
      return res.status(500).json({
        message: 'Error al crear usuario'
      });
    }

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      id_empresa: empresa.id_empresa
    });

  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};

// ===========================================
// LOGIN (correo + teléfono)
// ===========================================
exports.login = async (req, res) => {
  try {
    const { correo, telefono } = req.body;

    if (!correo || !telefono) {
      return res.status(400).json({
        message: 'Correo y teléfono son obligatorios'
      });
    }

    const { data: usuario, error } = await db
      .from('usuarios')
      .select('id_usuario, nombre, correo, telefono, id_empresa')
      .eq('correo', correo)
      .eq('telefono', telefono)
      .single();

    if (error || !usuario) {
      return res.status(401).json({
        message: 'Credenciales incorrectas'
      });
    }

    return res.status(200).json({
      message: 'Login exitoso',
      usuario
    });

  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};
