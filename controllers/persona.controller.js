const Database = require('../config/db');
const db = Database.getInstance();
const Persona = require('../models/persona.model');

// ========================
// Obtener todas las personas
// ========================
exports.obtenerPersonas = async (req, res) => {
  try {
    const { data, error } = await db.from('personas').select('*');
    if (error) {
      console.error('Error al obtener personas:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }
    const personas = typeof Persona === 'function' ? data.map(Persona) : data;
    res.json(personas);
  } catch (err) {
    console.error('Error catch obtenerPersonas:', err);
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

// ========================
// Crear persona
// ========================
exports.crearPersona = async (req, res) => {
  try {
    console.log('📩 Datos recibidos en crearPersona:', req.body);

    const { nombre, email, telefono } = req.body;

    // Validación simple
    const camposFaltantes = [];
    if (!nombre) camposFaltantes.push('nombre');
    if (!email) camposFaltantes.push('email');
    if (!telefono) camposFaltantes.push('telefono');

    if (camposFaltantes.length > 0) {
      console.warn('Faltan campos requeridos:', camposFaltantes);
      return res.status(400).json({ error: `Faltan campos requeridos: ${camposFaltantes.join(', ')}` });
    }

    const nuevaPersona = { nombre, email, telefono };

    const { data, error } = await db.from('personas').insert([nuevaPersona]).select();

    if (error) {
      console.error('Error al insertar persona:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message || 'Error desconocido al insertar persona' });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error catch crearPersona:', err);
    res.status(500).json({ error: err.message });
  }
};

// ========================
// Actualizar persona
// ========================
exports.actualizarPersona = async (req, res) => {
  try {
    console.log('📩 Datos recibidos en actualizarPersona:', req.body);

    // No se maneja foto
    const { nombre, email, telefono } = req.body;
    const actualizarCampos = { nombre, email, telefono };

    const { data, error } = await db
      .from('personas')
      .update(actualizarCampos)
      .eq('id_persona', req.params.id)
      .select();

    if (error) {
      console.error('Error al actualizar persona:', JSON.stringify(error, null, 2));
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

// ========================
// Eliminar persona
// ========================
exports.eliminarPersona = async (req, res) => {
  try {
    const { error } = await db.from('personas').delete().eq('id_persona', req.params.id);

    if (error) {
      console.error('Error al eliminar persona:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Persona eliminada' });
  } catch (err) {
    console.error('Error catch eliminarPersona:', err);
    res.status(500).json({ error: err.message });
  }
};