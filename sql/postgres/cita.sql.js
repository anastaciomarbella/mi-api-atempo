module.exports = {
  INSERT: `
    INSERT INTO citas (
      id_cita, id_persona, titulo, fecha, hora_inicio, hora_final,
      nombre_cliente, numero_cliente, motivo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `,

  SELECT_ALL: `
    SELECT * FROM citas
  `,

  SELECT_BY_ID: `
    SELECT * FROM citas WHERE id_cita = $1
  `,
 SELECT_BY_ID_PERSONA: `
    SELECT * FROM citas WHERE id_persona = $1
  `,
  UPDATE: `
    UPDATE citas SET
      id_persona = $2,
      titulo = $3,
      fecha = $4,
      hora_inicio = $5,
      hora_final = $6,
      nombre_cliente = $7,
      numero_cliente = $8,
      motivo = $9
    WHERE id_cita = $1
  `,

  DELETE: `
    DELETE FROM citas WHERE id_cita = $1
  `,

  SELECT_NEXT_24H: `
    SELECT * FROM citas
    WHERE fecha >= CURRENT_DATE
      AND fecha <= CURRENT_DATE + 1
  `
};
