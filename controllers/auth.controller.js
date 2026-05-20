const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("../config/db");

const db = Database.getInstance();

const JWT_SECRET = process.env.JWT_SECRET || "secreto123";

// ===========================================
// GENERAR SLUG
// ===========================================
function generarSlug(nombre, id) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + id;
}

// ===========================================
// REGISTRO
// ===========================================
exports.registrar = async (req, res) => {
  try {

    console.log("BODY:", req.body);

    let {
      nombre,
      correo,
      telefono,
      password,
      nombreEmpresa
    } = req.body;

    // LIMPIAR DATOS
    nombre = nombre?.trim();
    correo = correo?.trim().toLowerCase();
    telefono = telefono?.trim();
    password = password?.trim();
    nombreEmpresa = nombreEmpresa?.trim();

    // VALIDAR CAMPOS
    if (!nombre || !correo || !password || !nombreEmpresa) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      });
    }

    // VALIDAR USUARIO EXISTENTE
    const { data: existente, error: errorExistente } = await db
      .from("usuarios")
      .select("id_usuario")
      .eq("correo", correo)
      .maybeSingle();

    if (errorExistente) {
      console.log("ERROR EXISTENTE:", errorExistente);

      return res.status(500).json({
        message: "Error verificando usuario",
        error: errorExistente.message
      });
    }

    if (existente) {
      return res.status(400).json({
        message: "El correo ya está registrado"
      });
    }

    // CREAR EMPRESA
    const { data: empresa, error: errorEmpresa } = await db
      .from("empresas")
      .insert([
        {
          nombre_empresa: nombreEmpresa
        }
      ])
      .select("id_empresa, nombre_empresa")
      .single();

    console.log("EMPRESA:", empresa);
    console.log("ERROR EMPRESA:", errorEmpresa);

    if (errorEmpresa) {
      return res.status(500).json({
        message: "Error al crear empresa",
        error: errorEmpresa.message,
        detalle: errorEmpresa
      });
    }

    if (!empresa) {
      return res.status(500).json({
        message: "Empresa no creada"
      });
    }

    // GENERAR SLUG
    const slug = generarSlug(
      nombreEmpresa,
      empresa.id_empresa
    );

    const { error: errorSlug } = await db
      .from("empresas")
      .update({ slug })
      .eq("id_empresa", empresa.id_empresa);

    if (errorSlug) {
      console.log("ERROR SLUG:", errorSlug);

      return res.status(500).json({
        message: "Error al generar slug",
        error: errorSlug.message
      });
    }

    // ENCRIPTAR PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREAR USUARIO
    const { data: usuario, error: errorUsuario } = await db
      .from("usuarios")
      .insert([
        {
          nombre,
          correo,
          telefono,
          password: hashedPassword,
          rol: "admin",
          id_empresa: empresa.id_empresa
        }
      ])
      .select("*")
      .single();

    console.log("USUARIO:", usuario);
    console.log("ERROR USUARIO:", errorUsuario);

    if (errorUsuario) {
      return res.status(500).json({
        message: "Error al crear usuario",
        error: errorUsuario.message,
        detalle: errorUsuario
      });
    }

    if (!usuario) {
      return res.status(500).json({
        message: "Usuario no creado"
      });
    }

    // ELIMINAR PASSWORD
    delete usuario.password;

    // RESPUESTA EXITOSA
    return res.status(201).json({
      message: "Registro exitoso",
      usuario,
      empresa: {
        ...empresa,
        slug
      }
    });

  } catch (err) {

    console.error("ERROR REAL REGISTRO:");
    console.error(err);

    return res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  }
};

// ===========================================
// LOGIN
// ===========================================
exports.login = async (req, res) => {
  try {

    let { correo, password } = req.body;

    // LIMPIAR DATOS
    correo = correo?.trim().toLowerCase();
    password = password?.trim();

    // VALIDAR CAMPOS
    if (!correo || !password) {
      return res.status(400).json({
        message: "Correo y contraseña requeridos"
      });
    }

    // BUSCAR USUARIO
    const { data: usuario, error } = await db
      .from("usuarios")
      .select("*")
      .eq("correo", correo)
      .maybeSingle();

    console.log("USUARIO LOGIN:", usuario);
    console.log("ERROR LOGIN:", error);

    if (error) {
      return res.status(500).json({
        message: "Error buscando usuario",
        error: error.message
      });
    }

    if (!usuario) {
      return res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }

    // VALIDAR PASSWORD
    const valido = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!valido) {
      return res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }

    // BUSCAR EMPRESA
    const { data: empresa } = await db
      .from("empresas")
      .select("nombre_empresa, logo_url, slug")
      .eq("id_empresa", usuario.id_empresa)
      .maybeSingle();

    // GENERAR TOKEN
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_empresa: usuario.id_empresa,
        rol: usuario.rol
      },
      JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    // ELIMINAR PASSWORD
    delete usuario.password;

    // RESPUESTA
    return res.json({
      message: "Login exitoso",
      token,
      usuario: {
        ...usuario,
        nombre_empresa: empresa?.nombre_empresa || null,
        logo_url: empresa?.logo_url || null,
        slug: empresa?.slug || null
      }
    });

  } catch (err) {

    console.error("ERROR REAL LOGIN:");
    console.error(err);

    return res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  }
};