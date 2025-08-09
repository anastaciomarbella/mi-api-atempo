module.exports = {
  SELECT_TOP_CLIENTES: `
    SELECT
      id_cita,
      id_persona,
      titulo,
      fecha,
      hora_inicio,
      hora_final,
      nombre_cliente,
      split_part(nombre_cliente, ' ', 1) AS nombre,
      regexp_replace(nombre_cliente, '^.*\\s(\\S+)\\s(\\S+)$', '\\1 \\2') AS apellidos,
      numero_cliente,
      COUNT(*) AS veces_registrado,
      motivo
    FROM citas
    WHERE numero_cliente IS NOT NULL
    GROUP BY id_cita, id_persona, titulo,fecha,hora_inicio,hora_final,nombre_cliente,nombre, apellidos, numero_cliente, motivo
    ORDER BY veces_registrado DESC
  `,
    SELECT_BY_ID: `
    SELECT * FROM citas WHERE id_cita = $1
  `,
  DELETE: `
    DELETE FROM citas WHERE id_cita = $1
  `

};
