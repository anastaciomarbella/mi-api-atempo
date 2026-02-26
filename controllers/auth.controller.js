const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("../config/db");

const db = Database.getInstance();
const JWT_SECRET = process.env.JWT_SECRET || "secreto123";

// ===========================================
// REGISTRO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    let { nombre, correo, telefono, password, nombreEmpresa } = req.body;

    nombre = nombre?.trim();
    correo = correo?.trim().toLowerCase();
    telefono = telefono?.trim();
    password = password?.trim();
    nombreEmpresa = nombreEmpresa?.trim();

    if (!nombre || !correo || !telefono || !password || !nombreEmpresa) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Verificar si el correo ya existe
    const { data: usuarioExistente } = await db
      .from("usuarios")
      .select("id_usuario")
      .eq("correo", correo)
      .maybeSingle();

    if (usuarioExistente) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Crear empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from("empresas")
      .insert([{ nombre_empresa: nombreEmpresa }])
      .select("id_empresa, nombre_empresa")
      .single();

    if (errorEmpresa) {
      console.error(errorEmpresa);
      return res.status(500).json({ message: "Error al crear empresa" });
    }

    // Subir logo si hay archivo
    let logoUrl = null;
    if (req.file) {
      const ext = req.file.originalname.split(".").pop().toLowerCase();
      if (!["jpg", "jpeg", "png"].includes(ext)) {
        return res.status(400).json({ message: "Solo se permiten imágenes JPG o PNG" });
      }

      const filePath = `${empresa.id_empresa}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logotipo")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ message: "Error al subir el logo" });
      }

      const { data } = supabase.storage.from("logotipo").getPublicUrl(filePath);
      logoUrl = data.publicUrl;

      await db.from("empresas").update({ logo_url: logoUrl }).eq("id_empresa", empresa.id_empresa);
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: nuevoUsuario, error: errorUsuario } = await db
      .from("usuarios")
      .insert([{ nombre, correo, telefono, password: hashedPassword, id_empresa: empresa.id_empresa }])
      .select("*")
      .single();

    if (errorUsuario) {
      console.error(errorUsuario);
      return res.status(500).json({ message: "Error al crear usuario" });
    }

    delete nuevoUsuario.password;

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario: { ...nuevoUsuario, nombre_empresa: empresa.nombre_empresa, logo_url: logoUrl },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ===========================================
// LOGIN (correo + contraseña, empresa + citas del usuario)
// ===========================================
exports.login = async (req, res) => {
  try {
    let { correo, password } = req.body;
    correo = correo?.trim().toLowerCase();
    password = password?.trim();

    if (!correo || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
    }

    // Buscar usuario
    const { data: usuario, error: errorUsuario } = await db
      .from("usuarios")
      .select("*")
      .eq("correo", correo)
      .maybeSingle();

    if (!usuario || errorUsuario) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Obtener empresa asociada
    const { data: empresa } = await db
      .from("empresas")
      .select("nombre_empresa, logo_url")
      .eq("id_empresa", usuario.id_empresa)
      .maybeSingle();

    // Obtener solo citas de este usuario
    const { data: citas } = await db
      .from("citas")
      .select("*")
      .eq("id_usuario", usuario.id_usuario);

    // Generar token
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, id_persona: usuario.id_persona, id_empresa: usuario.id_empresa },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Responder con usuario, empresa y citas
    return res.status(200).json({
      message: "Login exitoso",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        id_persona: usuario.id_persona,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        id_empresa: usuario.id_empresa,
        nombre_empresa: empresa?.nombre_empresa || null,
        logo_url: empresa?.logo_url || null,
        citas: citas || [],
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};