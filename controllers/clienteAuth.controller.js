const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../config/db');
const db = Database.getInstance().getClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secreto123';

// ========================
// REGISTRO CLIENTE
// ========================
exports.registrarCliente = async (req, res) => {
  try {
    const { nombre, telefono, password, slug } = req.body;

    if (!nombre || !telefono || !password || !slug)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });

    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa, nombre_empresa, logo_url, slug')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const { data: existente } = await db
      .from('clientes')
      .select('id_cliente')
      .eq('telefono', telefono)
      .eq('id_empresa', empresa.id_empresa)
      .maybeSingle();

    if (existente)
      return res.status(400).json({ error: 'Este teléfono ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: cliente, error } = await db
      .from('clientes')
      .insert([{
        nombre,
        telefono,
        password: hashedPassword,
        id_empresa: empresa.id_empresa
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const token = jwt.sign(
      { id_cliente: cliente.id_cliente, id_empresa: empresa.id_empresa },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Registro exitoso',
      token,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        id_empresa: empresa.id_empresa,
        nombre_empresa: empresa.nombre_empresa,
        logo_url: empresa.logo_url,
        slug: empresa.slug
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// LOGIN CLIENTE
// ========================
exports.loginCliente = async (req, res) => {
  try {
    const { telefono, password, slug } = req.body;

    if (!telefono || !password || !slug)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });

    const { data: empresa } = await db
      .from('empresas')
      .select('id_empresa, nombre_empresa, logo_url, slug')
      .eq('slug', slug)
      .single();

    if (!empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const { data: cliente } = await db
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .eq('id_empresa', empresa.id_empresa)
      .maybeSingle();

    if (!cliente)
      return res.status(401).json({ error: 'Teléfono o contraseña incorrectos' });

    const valido = await bcrypt.compare(password, cliente.password);
    if (!valido)
      return res.status(401).json({ error: 'Teléfono o contraseña incorrectos' });

    const token = jwt.sign(
      { id_cliente: cliente.id_cliente, id_empresa: empresa.id_empresa },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        id_empresa: empresa.id_empresa,
        nombre_empresa: empresa.nombre_empresa,
        logo_url: empresa.logo_url,
        slug: empresa.slug
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// OBTENER CITAS DEL CLIENTE
// ========================
exports.obtenerMisCitas = async (req, res) => {
  try {
    const { id_cliente, id_empresa } = req.clienteAuth;

    const { data, error } = await db
      .from('citas')
      .select('*')
      .eq('id_empresa', id_empresa)
      .eq('id_cliente_registro', id_cliente) // 👈 CORREGIDO
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// CANCELAR CITA
// ========================
exports.cancelarCita = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const { id_cliente } = req.clienteAuth;

    const { data: cita, error: errorBuscar } = await db
      .from('citas')
      .select('*')
      .eq('id_cita', id_cita)
      .eq('id_cliente_registro', id_cliente)
      .single();

    if (errorBuscar || !cita)
      return res.status(404).json({ error: 'Cita no encontrada o no tienes permiso' });

    const { error } = await db
      .from('citas')
      .delete()
      .eq('id_cita', id_cita);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Cita cancelada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ========================
// EDITAR CITA DEL CLIENTE
// ========================
exports.editarCita = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const { id_cliente } = req.clienteAuth;

    const { data: cita, error: errorBuscar } = await db
      .from('citas')
      .select('*')
      .eq('id_cita', id_cita)
      .eq('id_cliente_registro', id_cliente)
      .single();

    if (errorBuscar || !cita)
      return res.status(404).json({ error: 'Cita no encontrada o no tienes permiso' });

    const { id_persona, titulo, fecha, hora_inicio, hora_final, nombre_cliente, numero_cliente, motivo, color } = req.body;

    const { data, error } = await db
      .from('citas')
      .update({ id_cliente: id_persona, titulo, fecha, hora_inicio, hora_final, nombre_cliente, numero_cliente, motivo, color })
      .eq('id_cita', id_cita)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};