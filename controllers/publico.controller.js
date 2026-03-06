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

    if (error || !empresa) {
      return res.status(404).json({
        error: 'Empresa no encontrada'
      });
    }

    res.json(empresa);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};



// ========================
// GET empleados por slug
// ========================
exports.obtenerPersonas = async (req, res) => {

  try {

    const { slug } = req.params;

    // buscar empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa) {
      return res.status(404).json({
        error: 'Empresa no encontrada'
      });
    }

    // obtener empleados de la empresa
    const { data: personas, error } = await db
      .from('personas')
      .select('id_persona, nombre')
      .eq('id_empresa', empresa.id_empresa)
      .eq('rol', 'empleado'); // 👈 SOLO empleados

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json(personas);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};



// ========================
// POST crear cita pública
// ========================
exports.crearCitaPublica = async (req, res) => {

  try {

    const { slug } = req.params;

    // buscar empresa
    const { data: empresa, error: errorEmpresa } = await db
      .from('empresas')
      .select('id_empresa')
      .eq('slug', slug)
      .single();

    if (errorEmpresa || !empresa) {
      return res.status(404).json({
        error: 'Empresa no encontrada'
      });
    }

    const {
      id_empleado,
      titulo,
      fecha,
      hora_inicio,
      hora_final,
      nombre_cliente,
      numero_cliente,
      motivo,
      color
    } = req.body;

    // validar datos
    if (
      !id_empleado ||
      !titulo ||
      !fecha ||
      !hora_inicio ||
      !hora_final ||
      !nombre_cliente
    ) {
      return res.status(400).json({
        error: 'Datos incompletos'
      });
    }

    // ========================
    // verificar conflicto
    // ========================

    const { data: citasExistentes } = await db
      .from('citas')
      .select('hora_inicio, hora_final')
      .eq('id_empresa', empresa.id_empresa)
      .eq('id_empleado', id_empleado)
      .eq('fecha', fecha);

    const hayConflicto = citasExistentes?.some(c =>
      hora_inicio < c.hora_final && hora_final > c.hora_inicio
    );

    if (hayConflicto) {
      return res.status(409).json({
        error: 'El empleado ya tiene una cita en ese horario'
      });
    }

    // ========================
    // crear cita
    // ========================

    const { data, error } = await db
      .from('citas')
      .insert({
        id_empresa: empresa.id_empresa,
        id_empleado,
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

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.status(201).json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};