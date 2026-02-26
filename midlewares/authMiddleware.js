const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secreto123";

// =========================
// VERIFICAR TOKEN
// =========================
exports.verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Verificar que exista el header
  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  // 2️⃣ Verificar formato correcto: Bearer token
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  // 3️⃣ Extraer token correctamente
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4️⃣ Guardamos usuario en request
    req.usuario = decoded;

    next();
  } catch (err) {
    console.error("Error JWT:", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// =========================
// VERIFICAR ROL
// =========================
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