const Database = require('../config/db');
const db = Database.getInstance();
const Persona = require('../models/persona.model');

// ========================
// Obtener personas por empresa
// ========================
exports.obtenerPersonas = async (req, res) => {
  try {
    const id_empresa = req.usuario?.id_empresa;

    if (!id_empresa) {
      return res.status(400).json({ error: 'No se encontró id_empresa en el token' });
    }

    const { data, error } = await db
      .from('personas')
      .select('*')
      .eq('id_empresa', id_empresa);

    if (error) return res.status(500).json({ error: error.message });

    const personas = typeof Persona === 'function' ? data.map(Persona) : data;
    res.json(personas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// Obtener persona por ID
// ========================
exports.obtenerPersonaPorId = async (req, res) => {
  try {
    const { data, error } = await db
      .from('personas')
      .select('*')
      .eq('id_persona', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ message: 'Persona no encontrada' });

    const persona = typeof Persona === 'function' ? Persona(data) : data;
    res.json(persona);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// Crear persona
// ========================
exports.crearPersona = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;
    const id_empresa = req.usuario?.id_empresa;

    const camposFaltantes = [];
    if (!nombre) camposFaltantes.push('nombre');
    if (!email) camposFaltantes.push('email');
    if (!telefono) camposFaltantes.push('telefono');
    if (!id_empresa) camposFaltantes.push('id_empresa');

    if (camposFaltantes.length > 0) {
      return res.status(400).json({ error: `Faltan campos: ${camposFaltantes.join(', ')}` });
    }

    const { data, error } = await db
      .from('personas')
      .insert([{ nombre, email, telefono, id_empresa }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// Actualizar persona
// ========================
exports.actualizarPersona = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    const { data, error } = await db
      .from('personas')
      .update({ nombre, email, telefono })
      .eq('id_persona', req.params.id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ message: 'Persona no encontrada' });

    res.json({ message: 'Persona actualizada', persona: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// Eliminar persona
// ========================
exports.eliminarPersona = async (req, res) => {
  try {
    const { error } = await db
      .from('personas')
      .delete()
      .eq('id_persona', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Persona eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};