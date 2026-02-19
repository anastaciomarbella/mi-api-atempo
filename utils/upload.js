const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../config/db');
const db = Database.getInstance();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// ===========================================
// REGISTRO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    const { nombre, correo, telefono, password, nombreEmpresa } = req.body;

    if (!nombre || !correo || !telefono || !password || !nombreEmpresa) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Verificar correo existente
    const { data: usuarioExistente } = await db
      .from('usuarios')
      .select('id_usuario')
      .eq('correo', correo)
      .maybeSingle();

    if (usuarioExistente) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Crear empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .insert([{ nombre_empresa: nombreEmpresa }])
      .select('id_empresa')
      .single();

    if (errorEmpresa) {
      return res.status(500).json({ message: "Error al crear empresa" });
    }

    // Hash contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario como ADMIN
    const { error: errorUsuario } = await db
      .from('usuarios')
      .insert([{
        nombre,
        correo,
        telefono,
        password: hashedPassword,
        rol: "admin",
        id_empresa: empresa.id_empresa
      }]);

    if (errorUsuario) {
      return res.status(500).json({ message: "Error al crear usuario" });
    }

    return res.status(201).json({
      message: "Usuario registrado correctamente"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ===========================================
// LOGIN
// ===========================================
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
    }

    const { data: usuario, error } = await db
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_empresa: usuario.id_empresa,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    delete usuario.password;

    return res.status(200).json({
      message: "Login exitoso",
      token,
      usuario
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
