const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("../config/db");

const db = Database.getInstance();
const JWT_SECRET = process.env.JWT_SECRET || "secreto123";


// ===========================================
// REGISTRO (EMPRESA + USUARIO ADMIN)
// ===========================================
exports.registrar = async (req, res) => {
  try {
    let { nombre, correo, telefono, password, nombreEmpresa } = req.body;

    nombre = nombre?.trim();
    correo = correo?.trim().toLowerCase();
    telefono = telefono?.trim();
    password = password?.trim();
    nombreEmpresa = nombreEmpresa?.trim();

    if (!nombre || !correo || !password || !nombreEmpresa) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // 1️⃣ verificar correo
    const { data: existente } = await db
      .from("usuarios")
      .select("id_usuario")
      .eq("correo", correo)
      .maybeSingle();

    if (existente) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // 2️⃣ crear empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from("empresas")
      .insert([{ nombre_empresa: nombreEmpresa }])
      .select("id_empresa, nombre_empresa")
      .single();

    if (errorEmpresa) {
      return res.status(500).json({ message: "Error al crear empresa" });
    }

    // 3️⃣ subir logo (opcional)
    let logoUrl = null;
    if (req.file) {
      const ext = req.file.originalname.split(".").pop().toLowerCase();
      if (!["jpg", "jpeg", "png"].includes(ext)) {
        return res.status(400).json({ message: "Solo JPG o PNG" });
      }

      const filePath = `${empresa.id_empresa}/logo.${ext}`;
      const { error } = await supabase.storage
        .from("logotipo")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) {
        return res.status(500).json({ message: "Error al subir logo" });
      }

      const { data } = supabase.storage.from("logotipo").getPublicUrl(filePath);
      logoUrl = data.publicUrl;

      await db.from("empresas")
        .update({ logo_url: logoUrl })
        .eq("id_empresa", empresa.id_empresa);
    }

    // 4️⃣ crear usuario ADMIN
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: usuario, error: errorUsuario } = await db
      .from("usuarios")
      .insert([{
        nombre,
        correo,
        telefono,
        password: hashedPassword,
        rol: "admin",
        id_empresa: empresa.id_empresa
      }])
      .select("*")
      .single();

    if (errorUsuario) {
      return res.status(500).json({ message: "Error al crear usuario" });
    }

    delete usuario.password;

    res.status(201).json({
      message: "Registro exitoso",
      usuario,
      empresa: {
        ...empresa,
        logo_url: logoUrl
      }
    });

  } catch (err) {
  console.error("ERROR REAL:", err);
  res.status(500).json({
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

    correo = correo?.trim().toLowerCase();
    password = password?.trim();

    if (!correo || !password) {
      return res.status(400).json({ message: "Correo y contraseña requeridos" });
    }

    // 1️⃣ buscar usuario
    const { data: usuario } = await db
      .from("usuarios")
      .select("*")
      .eq("correo", correo)
      .maybeSingle();

    if (!usuario) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // 2️⃣ validar password
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // 3️⃣ obtener empresa
    const { data: empresa } = await db
      .from("empresas")
      .select("nombre_empresa, logo_url")
      .eq("id_empresa", usuario.id_empresa)
      .maybeSingle();

    // 4️⃣ token
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_empresa: usuario.id_empresa,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 5️⃣ respuesta
    res.json({
      message: "Login exitoso",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        rol: usuario.rol,
        id_empresa: usuario.id_empresa,
        nombre_empresa: empresa?.nombre_empresa || null,
        logo_url: empresa?.logo_url || null
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};