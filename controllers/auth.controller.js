const bcrypt = require('bcryptjs');
const Database = require('../config/db'); // Singleton de Supabase
const db = Database.getInstance();
const { v4: uuidv4 } = require('uuid'); // Para generar nombre único para la foto
const fs = require('fs');

// ===========================================
// REGISTRO DE USUARIO
// ===========================================
exports.registrar = async (req, res) => {
  try {
    const { negocio, nombre, correo, telefono, password } = req.body;
    let fotoUrl = null;

    // Validar campos obligatorios
    if (!negocio || !nombre || !correo || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Si se envió una foto (archivo)
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;

      // Subir a Supabase Storage
      const { data, error: uploadError } = await db.storage
        .from('usuarios')
        .upload(fileName, fs.readFileSync(req.file.path), { contentType: req.file.mimetype });

      if (uploadError) {
        console.error('Error al subir foto:', uploadError);
        return res.status(500).json({ message: 'Error al subir foto' });
      }

      // Obtener URL pública
      const { publicUrl, error: urlError } = db.storage.from('usuarios').getPublicUrl(fileName);
      if (urlError) {
        console.error('Error al obtener URL pública:', urlError);
      } else {
        fotoUrl = publicUrl;
      }

      // Opcional: eliminar archivo temporal
      fs.unlinkSync(req.file.path);
    }

    // Verificar si correo ya existe
    const { data: usuarios, error: errorSelect } = await db
      .from('usuarios')
      .select('*')
      .eq('correo', correo);

    if (errorSelect) {
      console.error('Error al consultar usuario:', errorSelect);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (usuarios.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const { error: errorInsert } = await db.from('usuarios').insert([
      { foto: fotoUrl, negocio, nombre, correo, telefono, password: hashedPassword }
    ]);

    if (errorInsert) {
      console.error('Error al insertar usuario:', errorInsert);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    return res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
