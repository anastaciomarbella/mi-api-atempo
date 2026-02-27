const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secreto123";

// ==================================================
// VERIFICAR TOKEN
// ==================================================
exports.verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Verificar header
  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  // 2️⃣ Formato Bearer
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  // 3️⃣ Extraer token
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4️⃣ VALIDACIÓN CLAVE
    if (!decoded.id_usuario || !decoded.id_empresa) {
      return res.status(401).json({ message: "Token incompleto" });
    }

    // 5️⃣ Guardar usuario completo
    req.usuario = {
      id_usuario: decoded.id_usuario,
      id_empresa: decoded.id_empresa,
      rol: decoded.rol
    };

    next();
  } catch (err) {
    console.error("Error JWT:", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// ==================================================
// VERIFICAR ROL
// ==================================================
exports.verificarRol = (rolRequerido) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (req.usuario.rol !== rolRequerido) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  };
};