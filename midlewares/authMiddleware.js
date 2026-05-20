const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secreto123";

exports.verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token requerido" });
  }
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id_usuario || !decoded.id_empresa) {
      return res.status(401).json({ message: "Token incompleto" });
    }
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