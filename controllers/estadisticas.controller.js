const Database = require("../config/db");
const db = Database.getInstance().getClient();

// ==================================================
// GET /api/estadisticas?periodo=dia|semana|mes
// ==================================================
exports.obtenerEstadisticas = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });

    const id_empresa = req.usuario.id_empresa;
    const { periodo = "dia" } = req.query;

    // ── Calcular rango de fechas ──────────────────────────────────────────
    const hoy = new Date();
    let fechaDesde, fechaHasta;

    if (periodo === "dia") {
      const iso = hoy.toISOString().split("T")[0];
      fechaDesde = iso;
      fechaHasta = iso;
    } else if (periodo === "semana") {
      const diaSemana = hoy.getDay(); // 0=domingo
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - ((diaSemana + 6) % 7));
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      fechaDesde = lunes.toISOString().split("T")[0];
      fechaHasta = domingo.toISOString().split("T")[0];
    } else if (periodo === "mes") {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      fechaDesde = primerDia.toISOString().split("T")[0];
      fechaHasta = ultimoDia.toISOString().split("T")[0];
    } else {
      return res.status(400).json({ error: "Período no válido. Usa: dia, semana o mes" });
    }

    // ── 1. Traer todas las citas del período ──────────────────────────────
    const { data: citas, error: errorCitas } = await db
      .from("citas")
      .select("id_cita, titulo, fecha, hora_inicio, id_cliente")
      .eq("id_empresa", id_empresa)
      .gte("fecha", fechaDesde)
      .lte("fecha", fechaHasta);

    if (errorCitas) return res.status(500).json({ error: errorCitas.message });

    const total_citas = citas.length;

    // ── 2. Total de servicios distintos usados ────────────────────────────
    const serviciosUnicos = new Set(citas.map(c => c.titulo).filter(Boolean));
    const total_servicios = serviciosUnicos.size;

    // ── 3. Ingreso estimado — buscar precio en tabla servicios ────────────
    let ingreso_estimado = 0;
    if (citas.length > 0) {
      const titulosUnicos = [...serviciosUnicos];
      const { data: serviciosData } = await db
        .from("servicios")
        .select("nombre, precio")
        .eq("id_empresa", id_empresa)
        .in("nombre", titulosUnicos);

      if (serviciosData) {
        const precioMap = {};
        serviciosData.forEach(s => { precioMap[s.nombre] = parseFloat(s.precio) || 0; });
        ingreso_estimado = citas.reduce((acc, c) => acc + (precioMap[c.titulo] || 0), 0);
      }
    }

    // ── 4. Servicios más solicitados ──────────────────────────────────────
    const conteoServicios = {};
    citas.forEach(c => {
      if (c.titulo) conteoServicios[c.titulo] = (conteoServicios[c.titulo] || 0) + 1;
    });
    const servicios_populares = Object.entries(conteoServicios)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // ── 5. Empleados con más citas ────────────────────────────────────────
    let empleados_top = [];
    if (citas.length > 0) {
      const conteoEmpleados = {};
      citas.forEach(c => {
        if (c.id_cliente) conteoEmpleados[c.id_cliente] = (conteoEmpleados[c.id_cliente] || 0) + 1;
      });

      const idsEmpleados = Object.keys(conteoEmpleados);
      const { data: personasData } = await db
        .from("personas")
        .select("id_persona, nombre")
        .in("id_persona", idsEmpleados);

      if (personasData) {
        empleados_top = personasData
          .map(p => ({ nombre: p.nombre, total: conteoEmpleados[p.id_persona] || 0 }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
      }
    }

    // ── 6. Distribución por hora (solo período "dia") ─────────────────────
    let por_hora = [];
    if (periodo === "dia" && citas.length > 0) {
      const conteoPorHora = {};
      citas.forEach(c => {
        if (c.hora_inicio) {
          const hora = c.hora_inicio.slice(0, 2) + ":00"; // "09:00"
          conteoPorHora[hora] = (conteoPorHora[hora] || 0) + 1;
        }
      });
      por_hora = Object.entries(conteoPorHora)
        .map(([hora, total]) => ({ hora, total }))
        .sort((a, b) => a.hora.localeCompare(b.hora));
    }

    // ── Respuesta ─────────────────────────────────────────────────────────
    return res.json({
      periodo,
      fecha_desde:        fechaDesde,
      fecha_hasta:        fechaHasta,
      total_citas,
      total_servicios,
      ingreso_estimado:   parseFloat(ingreso_estimado.toFixed(2)),
      servicios_populares,
      empleados_top,
      por_hora,
    });

  } catch (err) {
    console.error("Error en obtenerEstadisticas:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};