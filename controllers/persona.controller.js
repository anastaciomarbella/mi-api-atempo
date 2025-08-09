// controllers/persona.controller.js
const Database = require('../config/db');
const db = Database.getInstance();
const Persona = require('../models/persona.model');

const generarId = () => Math.floor(Math.random() * 1000000);

// Obtener todas las personas
exports.obtenerPersonas = async (req, res) => {
  const { data, error } = await db.from('personas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(Persona));
};

// Obtener persona por ID
exports.obtenerPersonaPorId = async (req, res) => {
  const { data, error } = await db.from('personas').select('*').eq('id_persona', req.params.id).single();
  if (error) return res.status(404).json({ message: 'Persona no encontrada' });
  res.json(Persona(data));
};

// Crear persona
exports.crearPersona = async (req, res) => {
  const nuevaPersona = { id_persona: generarId(), ...req.body };
  const { data, error } = await db.from('personas').insert([nuevaPersona]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Actualizar persona
exports.actualizarPersona = async (req, res) => {
  const { data, error } = await db.from('personas').update(req.body).eq('id_persona', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Persona actualizada', persona: data[0] });
};

// Eliminar persona
exports.eliminarPersona = async (req, res) => {
  const { error } = await db.from('personas').delete().eq('id_persona', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Persona eliminada' });
};
