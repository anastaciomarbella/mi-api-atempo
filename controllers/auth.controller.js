const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("../config/db");


const db = Database.getInstance();

const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_cambiar_en_produccion";

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
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      });
    }

    // 🔎 Verificar si el correo ya existe
    const { data: usuarioExistente } = await db
      .from("usuarios")
      .select("id_usuario")
      .eq("correo", correo)
      .maybeSingle();

    if (usuarioExistente) {
      return res.status(400).json({
        message: "El correo ya está registrado",
      });
    }

    // 1️⃣ Crear empresa (sin logo aún)
    const { data: empresa, error: errorEmpresa } = await db
      .from("empresas")
      .insert([
        {
          nombre_empresa: nombreEmpresa,
        },
      ])
      .select("id_empresa, nombre_empresa")
      .single();

    if (errorEmpresa) {
      console.error(errorEmpresa);
      return res.status(500).json({
        message: "Error al crear empresa",
      });
    }

    // 2️⃣ Subir logo a Supabase Storage (service role)
    let logoUrl = null;

    if (req.file) {
      const ext = req.file.originalname.split(".").pop().toLowerCase();

      if (!["jpg", "jpeg", "png"].includes(ext)) {
        return res.status(400).json({
          message: "Solo se permiten imágenes JPG o PNG",
        });
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
        return res.status(500).json({
          message: "Error al subir el logo",
        });
      }

      const { data } = supabase.storage
        .from("logotipo")
        .getPublicUrl(filePath);

      logoUrl = data.publicUrl;

      // Guardar logo en empresa
      await db
        .from("empresas")
        .update({ logo_url: logoUrl })
        .eq("id_empresa", empresa.id_empresa);
    }

    // 3️⃣ Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: nuevoUsuario, error: errorUsuario } = await db
      .from("usuarios")
      .insert([
        {
          nombre,
          correo,
          telefono,
          password: hashedPassword,
          id_empresa: empresa.id_empresa,
        },
      ])
      .select("*")
      .single();

    if (errorUsuario) {
      console.error(errorUsuario);
      return res.status(500).json({
        message: "Error al crear usuario",
      });
    }

    delete nuevoUsuario.password;

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      usuario: {
        ...nuevoUsuario,
        nombre_empresa: empresa.nombre_empresa,
        logo_url: logoUrl,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error interno del servidor",
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
        message: "Correo y contraseña son obligatorios",
      });
    }

    const { data: usuario, error } = await db
      .from("usuarios")
      .select(`
        *,
        empresas (
          nombre_empresa,
          logo_url
        )
      `)
      .eq("correo", correo)
      .single();

    if (error || !usuario) {
      return res.status(401).json({
        message: "Credenciales incorrectas",
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({
        message: "Credenciales incorrectas",
      });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_empresa: usuario.id_empresa,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const usuarioResponse = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono,
      id_empresa: usuario.id_empresa,
      nombre_empresa: usuario.empresas?.nombre_empresa,
      logo_url: usuario.empresas?.logo_url,
    };

    return res.status(200).json({
      message: "Login exitoso",
      token,
      usuario: usuarioResponse,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};