const Database = require("../config/db");
const db = Database.getInstance().getClient();
const Servicio = require("../models/servicio.model");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"), false);
    }
    cb(null, true);
  },
});

async function subirImagen(file, id_empresa) {
  const ext = file.originalname.split(".").pop();
  const fileName = `${id_empresa}/servicio_${Date.now()}.${ext}`;
  const { error } = await db.storage
    .from("servicios-imagenes")
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) throw new Error("Error al subir imagen: " + error.message);
  const { data } = db.storage.from("servicios-imagenes").getPublicUrl(fileName);
  return data.publicUrl;
}

async function eliminarImagen(imagen_url) {
  if (!imagen_url) return;
  try {
    const parts = imagen_url.split("/servicios-imagenes/");
    if (parts.length < 2) return;
    await db.storage.from("servicios-imagenes").remove([parts[1]]);
  } catch (_) {}
}

const obtenerServicios = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });
    const { data, error } = await db
      .from("servicios")
      .select("*")
      .eq("id_empresa", req.usuario.id_empresa)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data.map((s) => Servicio(s)));
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const crearServicio = async (req, res) => {
  try {
    console.log("[crearServicio] req.usuario:", req.usuario);
    console.log("[crearServicio] req.body:", req.body);
    console.log("[crearServicio] req.file:", req.file ? req.file.originalname : "sin imagen");

    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });

    const { nombre, descripcion, precio, duracion } = req.body;

    if (!nombre || !precio)
      return res.status(400).json({ error: "Nombre y precio son obligatorios" });

    let imagen_url = null;
    if (req.file) {
      console.log("[crearServicio] Subiendo imagen...");
      imagen_url = await subirImagen(req.file, req.usuario.id_empresa);
      console.log("[crearServicio] imagen_url:", imagen_url);
    }

    const insertPayload = {
      id_empresa:  req.usuario.id_empresa,
      nombre,
      descripcion: descripcion || null,
      precio:      parseFloat(precio),
      duracion:    duracion ? parseInt(duracion) : null,
      imagen_url,
    };
    console.log("[crearServicio] insertPayload:", insertPayload);

    const { data, error } = await db
      .from("servicios")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[crearServicio] Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("[crearServicio] Servicio creado:", data);
    res.status(201).json(Servicio(data));
  } catch (err) {
    console.error("[crearServicio] catch error:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
};

const actualizarServicio = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });
    const { data: servicioActual, error: errorBuscar } = await db
      .from("servicios")
      .select("*")
      .eq("id_servicio", req.params.id)
      .eq("id_empresa", req.usuario.id_empresa)
      .single();
    if (errorBuscar || !servicioActual)
      return res.status(404).json({ error: "Servicio no encontrado" });
    const { nombre, descripcion, precio, duracion } = req.body;
    let imagen_url = servicioActual.imagen_url;
    if (req.file) {
      await eliminarImagen(servicioActual.imagen_url);
      imagen_url = await subirImagen(req.file, req.usuario.id_empresa);
    }
    const { data, error } = await db
      .from("servicios")
      .update({
        nombre:      nombre      || servicioActual.nombre,
        descripcion: descripcion ?? servicioActual.descripcion,
        precio:      precio      ? parseFloat(precio) : servicioActual.precio,
        duracion:    duracion    ? parseInt(duracion)  : servicioActual.duracion,
        imagen_url,
      })
      .eq("id_servicio", req.params.id)
      .eq("id_empresa",  req.usuario.id_empresa)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(Servicio(data));
  } catch (err) {
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
};

const eliminarServicio = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });
    const { data: servicioActual, error: errorBuscar } = await db
      .from("servicios")
      .select("*")
      .eq("id_servicio", req.params.id)
      .eq("id_empresa",  req.usuario.id_empresa)
      .single();
    if (errorBuscar || !servicioActual)
      return res.status(404).json({ error: "Servicio no encontrado" });
    await eliminarImagen(servicioActual.imagen_url);
    const { error } = await db
      .from("servicios")
      .delete()
      .eq("id_servicio", req.params.id)
      .eq("id_empresa",  req.usuario.id_empresa);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Servicio eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  upload,
  obtenerServicios,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
};