const pool = require('../config/db');

exports.getAll = async (req, res) => {
  const result = await pool.query('SELECT * FROM empresas');
  res.json(result.rows);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
  if (result.rows.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
  res.json(result.rows[0]);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, telefono } = req.body; // ajusta los campos a tu tabla
  const result = await pool.query(
    'UPDATE empresas SET nombre=$1, direccion=$2, telefono=$3 WHERE id=$4 RETURNING *',
    [nombre, direccion, telefono, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
  res.json(result.rows[0]);
};

exports.create = async (req, res) => {
  const { nombre, direccion, telefono } = req.body;
  const result = await pool.query(
    'INSERT INTO empresas (nombre, direccion, telefono) VALUES ($1, $2, $3) RETURNING *',
    [nombre, direccion, telefono]
  );
  res.status(201).json(result.rows[0]);
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
  res.json({ mensaje: 'Eliminado correctamente' });
};