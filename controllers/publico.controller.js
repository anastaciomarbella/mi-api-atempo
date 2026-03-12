const Database = require('../config/db');
const db = Database.getInstance().getClient();

// ========================
// GET info empresa por slug
// ========================
exports.obtenerEmpresa = async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: empresa, error } = await db
      .from('empresas')
      .select('id_empresa, nombre_empresa, logo_url, slug')
      .eq('slug', slug)
      .single();

    if (error || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// GET empleados por slug
// ========================
exports.obtenerPersonas = async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const { data: personas, error } = await db
      .from('personas')
      .select('id_persona, nombre')
      .eq('id_empresa', empresa.id_empresa)
      .eq('rol', 'empleado');

    if (error) return res.status(500).json({ error: error.message });

    res.json(personas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// GET servicios públicos por slug
// ========================
exports.obtenerServiciosPublicos = async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const { data: servicios, error } = await db
      .from('servicios')
      .select('id_servicio, nombre, descripcion, precio, duracion, imagen_url')
      .eq('id_empresa', empresa.id_empresa)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(servicios || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// GET citas ocupadas de una persona en una fecha
// ========================
exports.obtenerCitasOcupadas = async (req, res) => {
  try {
    const { slug } = req.params;
    const { id_persona, fecha } = req.query;

    if (!id_persona || !fecha)
      return res.status(400).json({ error: 'Faltan parámetros id_persona y fecha' });

    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const { data: citas, error } = await db
      .from('citas')
      .select('hora_inicio, hora_final')
      .eq('id_empresa', empresa.id_empresa)
      .eq('id_cliente', id_persona)
      .eq('fecha', fecha);

    if (error) return res.status(500).json({ error: error.message });

    res.json(citas || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// POST crear cita pública
// ========================
exports.crearCitaPublica = async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa)
      return res.status(404).json({ error: 'Empresa no encontrada' });

    const {
      id_persona,
      id_cliente_registro,
      titulo,
      fecha,
      hora_inicio,
      hora_final,
      nombre_cliente,
      numero_cliente,
      motivo,
      color
    } = req.body;

    if (!id_persona || !titulo || !fecha || !hora_inicio || !hora_final || !nombre_cliente)
      return res.status(400).json({ error: 'Datos incompletos' });

    if (hora_final <= hora_inicio)
      return res.status(400).json({ error: 'La hora de fin debe ser mayor a la hora de inicio' });

    const { data: citasExistentes } = await db
      .from('citas')
      .select('hora_inicio, hora_final')
      .eq('id_empresa', empresa.id_empresa)
      .eq('id_cliente', id_persona)
      .eq('fecha', fecha);

    const hayConflicto = citasExistentes?.some(c =>
      hora_inicio < c.hora_final && hora_final > c.hora_inicio
    );

    if (hayConflicto)
      return res.status(409).json({
        error: 'El encargado ya tiene una cita en ese horario. Por favor elige otro horario.'
      });

    const { data, error } = await db
      .from('citas')
      .insert({
        id_empresa:          empresa.id_empresa,
        id_cliente:          id_persona,
        id_cliente_registro: id_cliente_registro || null,
        titulo,
        fecha,
        hora_inicio,
        hora_final,
        nombre_cliente,
        numero_cliente,
        motivo,
        color
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};