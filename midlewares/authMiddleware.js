const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secreto123";

// =========================
// VERIFICAR TOKEN
// =========================
exports.verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded; // 👈 aquí viene id, id_persona, rol, etc.
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// =========================
// VERIFICAR ROL
// =========================
exports.verificarRol = (rolRequerido) => {
  return (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== rolRequerido) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
};