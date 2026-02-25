const Database = require("../config/db");
const db = Database.getInstance().getClient();
const Cita = require("../models/cita.model");

const uuidv4 = () => Math.floor(Math.random() * 1000000);

// =========================
// OBTENER SOLO MIS CITAS
// =========================
exports.obtenerCitas = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario; // ✅ CORRECTO

    const { data, error } = await db
      .from("citas")
      .select("*")
      .eq("id_usuario", idUsuario); // 🔐 FILTRO REAL

    if (error) return res.status(500).json({ error: error.message });

    res.json(data.map(row => Cita(row)));
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
};

// =========================
// CREAR CITA (SEGURA)
// =========================
exports.crearCita = async (req, res) => {
  try {
    const idUsuario = req.usuario.id_usuario;
    const { titulo, fecha, hora_inicio, hora_final, color } = req.body;

    if (!fecha || !hora_inicio || !hora_final) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const cita = {
      id_cita: uuidv4(),
      id_usuario: idUsuario, // ✅ ASIGNADO DESDE TOKEN
      titulo,
      fecha,
      hora_inicio,
      hora_final,
      color
    };

    const { data, error } = await db
      .from("citas")
      .insert([cita])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(Cita(data[0]));
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
};

// =========================
// ACTUALIZAR CITA (PROTEGIDA)
// =========================
exports.actualizarCita = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;

  const { data, error } = await db
    .from("citas")
    .update(req.body)
    .eq("id_cita", req.params.id)
    .eq("id_usuario", idUsuario) // 🔐 PROTECCIÓN
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) {
    return res.status(404).json({ error: "No autorizada o no existe" });
  }

  res.json(Cita(data[0]));
};

// =========================
// ELIMINAR CITA (PROTEGIDA)
// =========================
exports.eliminarCita = async (req, res) => {
  const idUsuario = req.usuario.id_usuario;

  const { error } = await db
    .from("citas")
    .delete()
    .eq("id_cita", req.params.id)
    .eq("id_usuario", idUsuario); // 🔐 PROTECCIÓN

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Cita eliminada" });
};