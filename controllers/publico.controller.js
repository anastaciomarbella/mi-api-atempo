const Database = require('../config/db');
const db = Database.getInstance().getClient();

// ========================
// GET info empresa por slug
// ========================
exports.obtenerEmpresa = async (req, res) => {
  try {
    const { data: empresa, error } = await db
      .from('empresas')
      .select('id_empresa, nombre_empresa, logo_url, slug')
      .eq('slug', req.params.slug)
      .single();

    if (error || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// GET encargados por slug
// ========================
exports.obtenerPersonas = async (req, res) => {
  try {
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', req.params.slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const { data, error } = await db
      .from('personas')
      .select('id_persona, nombre')
      .eq('id_empresa', empresa.id_empresa);

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// POST crear cita pública
// ========================
exports.crearCitaPublica = async (req, res) => {
  try {
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', req.params.slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id_cliente, titulo, fecha, hora_inicio, hora_final,
      nombre_cliente, numero_cliente, motivo, color
    } = req.body;

    if (!id_cliente || !titulo || !fecha || !hora_inicio || !hora_final || !nombre_cliente)
      return res.status(400).json({ error: 'Datos incompletos' });

    // Verificar conflicto
    const { data: citasExistentes } = await db
      .from('citas')
      .select('hora_inicio, hora_final')
      .eq('id_empresa', empresa.id_empresa)
      .eq('id_cliente', id_cliente)
      .eq('fecha', fecha);

    const hayConflicto = citasExistentes?.some(c =>
      hora_inicio < c.hora_final && hora_final > c.hora_inicio
    );

    if (hayConflicto)
      return res.status(409).json({ error: 'El encargado ya tiene una cita en ese horario' });

    const { data, error } = await db
      .from('citas')
      .insert({
        id_empresa: empresa.id_empresa,
        id_cliente, titulo, fecha, hora_inicio, hora_final,
        nombre_cliente, numero_cliente, motivo, color
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};