const Database = require('../config/db');
const db = Database.getInstance();
// const { v4: uuidv4 } = require('uuid'); // Ya no lo necesitas si no generas UUID manualmente
const Persona = require('../models/persona.model');

// Obtener todas las personas
exports.obtenerPersonas = async (req, res) => {
  try {
    const { data, error } = await db.from('personas').select('*');
    if (error) {
      console.error('Error al obtener personas:', error);
      return res.status(500).json({ error: error.message });
    }
    const personas = typeof Persona === 'function' ? data.map(Persona) : data;
    res.json(personas);
  } catch (err) {
    console.error('Error catch obtenerPersonas:', err);
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
      console.warn('Persona no encontrada para id:', req.params.id);
      return res.status(404).json({ message: 'Persona no encontrada' });
    }
    const persona = typeof Persona === 'function' ? Persona(data) : data;
    res.json(persona);
  } catch (err) {
    console.error('Error catch obtenerPersonaPorId:', err);
    res.status(500).json({ error: err.message });
  }
};

// Crear persona (sin enviar id_persona, que genera la BD)
exports.crearPersona = async (req, res) => {
  try {
    console.log('📩 Datos recibidos en crearPersona:', req.body);

    const { nombre, email, telefono, foto } = req.body;

    if (!nombre || !email || !telefono) {
      console.warn('Faltan campos requeridos:', req.body);
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const nuevaPersona = {
      nombre,
      email,
      telefono,
      foto: foto || null,
    };

    const { data, error } = await db.from('personas').insert([nuevaPersona]).select();

    if (error) {
      console.error('Error al insertar persona:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error catch crearPersona:', err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar persona
exports.actualizarPersona = async (req, res) => {
  try {
    console.log('📩 Datos recibidos en actualizarPersona:', req.body);

    const { data, error } = await db
      .from('personas')
      .update(req.body)
      .eq('id_persona', req.params.id)
      .select();

    if (error) {
      console.error('Error al actualizar persona:', error);
      return res.status(500).json({ error: error.message });
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Persona no encontrada para actualizar' });
    }

    res.json({ message: 'Persona actualizada', persona: data[0] });
  } catch (err) {
    console.error('Error catch actualizarPersona:', err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar persona
exports.eliminarPersona = async (req, res) => {
  try {
    const { error } = await db.from('personas').delete().eq('id_persona', req.params.id);

    if (error) {
      console.error('Error al eliminar persona:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Persona eliminada' });
  } catch (err) {
    console.error('Error catch eliminarPersona:', err);
    res.status(500).json({ error: err.message });
  }
};
