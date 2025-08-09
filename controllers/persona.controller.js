const Database = require('../config/db');
const db = Database.getInstance();
const Persona = require('../models/persona.model');

const generarId = () => Math.floor(Math.random() * 1000000);

// Obtener todas las personas
exports.obtenerPersonas = async (req, res) => {
  try {
    const { data, error } = await db.from('personas').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data.map(Persona));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener persona por ID
exports.obtenerPersonaPorId = async (req, res) => {
  try {
    const { data, error } = await db
      .from('personas')
      .select('*')
      .eq('id_persona', req.params.id)
      .single();
    if (error || !data) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    res.json(Persona(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear persona
exports.crearPersona = async (req, res) => {
  try {
    const { nombre, email, telefono, foto } = req.body;

    if (!nombre || !email || !telefono) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const nuevaPersona = {
      id_persona: generarId(),
      nombre,
      email,
      telefono,
      foto: foto || null
    };

    const { data, error } = await db.from('personas').insert([nuevaPersona]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar persona
exports.actualizarPersona = async (req, res) => {
  try {
    const { data, error } = await db
      .from('personas')
      .update(req.body)
      .eq('id_persona', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Persona actualizada', persona: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar persona
exports.eliminarPersona = async (req, res) => {
  try {
    const { error } = await db.from('personas').delete().eq('id_persona', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Persona eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
