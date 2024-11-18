import Command from './Command.js';
import { pool } from '../../db/db.js';

export default class PasantiaCommand extends Command {

  async createPasantia(usuarioId, titulo, descripcion, salario, empresa, direccion = null, latitud = null, longitud = null) {
    try {
      const [result] = await pool.query(
        'INSERT INTO pasantias (usuario_id, titulo, descripcion, salario, empresa, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [usuarioId, titulo, descripcion, salario, empresa, direccion, latitud, longitud]
      );
      return { success: true, pasantiaId: result.insertId };
    } catch (error) {
      throw new Error(`Error al crear la pasantía: ${error.message}`);
    }
  }

  async getAllPasantias(page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      'SELECT * FROM pasantias ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [Number(pageSize), Number(offset)]
    );

    const [[{ total_count }]] = await pool.query('SELECT COUNT(*) as total_count FROM pasantias');

    const totalPages = Math.ceil(total_count / pageSize);

    return {
      totalItems: total_count,
      currentPage: page,
      pageSize,
      totalPages,
      data: rows
    };
  }

  async getPasantiasByUser(usuarioId, page = 1, pageSize = 10) {
    try {
      const offset = (page - 1) * pageSize;

      // Obtener pasantías creadas por el usuario (asumiendo que hay una columna usuario_id en pasantias)
      const [rows] = await pool.query(
        `SELECT * FROM pasantias
         WHERE usuario_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [Number(usuarioId), Number(pageSize), Number(offset)]
      );

      // Contar total de pasantías del usuario
      const [[{ total_count }]] = await pool.query(
        'SELECT COUNT(*) as total_count FROM pasantias WHERE usuario_id = ?',
        [Number(usuarioId)]
      );

      const totalPages = Math.ceil(total_count / pageSize);

      return {
        totalItems: total_count,
        currentPage: page,
        pageSize,
        totalPages,
        data: rows
      };
    } catch (error) {
      throw new Error(`Error al obtener las pasantías del usuario: ${error.message}`);
    }
  }

  async getPasantiaById(id) {
    const [[pasantia]] = await pool.query(
      'SELECT * FROM pasantias WHERE id = ?',
      [id]
    );
    return pasantia;
  }

  async postularPasantia(pasantiaId, usuarioId, documentoPostulacionId) {
    try {
      const [result] = await pool.query(
        'INSERT INTO postulaciones (pasantia_id, usuario_id, documento_postulacion_id) VALUES (?, ?, ?)',
        [pasantiaId, usuarioId, documentoPostulacionId]
      );
      return { success: true, postulacionId: result.insertId };
    } catch (error) {
      throw new Error(`Error al postular a la pasantía: ${error.message}`);
    }
  }

  async getAllPostulaciones(pasantiaId, page = 1, pageSize = 10) {
    try {
      // Validación de parámetros
      if (page < 1 || pageSize < 1) {
        throw new Error('La página y el tamaño de página deben ser números positivos');
      }

      const offset = (page - 1) * pageSize;
      const [rows] = await pool.query(
        `
            SELECT p.*, u.nombre AS nombre_usuario
            FROM postulaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.pasantia_id = ?
            ORDER BY p.fecha_postulacion DESC
            LIMIT ? OFFSET ?
            `,
        [Number(pasantiaId), Number(pageSize), Number(offset)]
      );

      // También podemos agregar el conteo total para la paginación
      const [[{ total_count }]] = await pool.query(
        'SELECT COUNT(*) as total_count FROM postulaciones WHERE pasantia_id = ?',
        [Number(pasantiaId)]
      );

      const totalPages = Math.ceil(total_count / pageSize);

      return {
        totalItems: total_count,
        currentPage: page,
        pageSize,
        totalPages,
        data: rows
      };
    } catch (error) {
      throw new Error(`Error al obtener las postulaciones: ${error.message}`);
    }
  }

  async aceptarPostulacion(postulacionId) {
    try {
      const [result] = await pool.query(
        'UPDATE postulaciones SET estado = "seleccionado" WHERE id = ?',
        [postulacionId]
      );
      if (result.affectedRows === 0) {
        throw new Error('No se encontró la postulación o no se pudo actualizar');
      }
      return { success: true, message: 'Postulación aceptada' };
    } catch (error) {
      throw new Error(`Error al aceptar la postulación: ${error.message}`);
    }
  }

  async rechazarPostulacion(postulacionId) {
    try {
      const [result] = await pool.query(
        'UPDATE postulaciones SET estado = "rechazado" WHERE id = ?',
        [postulacionId]
      );
      if (result.affectedRows === 0) {
        throw new Error('No se encontró la postulación o no se pudo actualizar');
      }
      return { success: true, message: 'Postulación rechazada' };
    } catch (error) {
      throw new Error(`Error al rechazar la postulación: ${error.message}`);
    }
  }

  async checkUserPostulation(pasantiaId, usuarioId) {
    try {
      const [[postulacion]] = await pool.query(
        'SELECT * FROM postulaciones WHERE pasantia_id = ? AND usuario_id = ?',
        [Number(pasantiaId), Number(usuarioId)]
      );

      return {
        isPostulated: !!postulacion,
        postulacion: postulacion || null
      };
    } catch (error) {
      throw new Error(`Error al verificar la postulación: ${error.message}`);
    }
  }

  async getUserPostulations(usuarioId, page = 1, pageSize = 10) {
    try {
      const offset = (page - 1) * pageSize;

      // Obtener las postulaciones con información de las pasantías
      const [rows] = await pool.query(
        `
        SELECT
          p.*,
          pas.titulo,
          pas.descripcion,
          pas.salario,
          pas.empresa,
          p.estado as estado_postulacion,
          p.fecha_postulacion
        FROM postulaciones p
        JOIN pasantias pas ON p.pasantia_id = pas.id
        WHERE p.usuario_id = ?
        ORDER BY p.fecha_postulacion DESC
        LIMIT ? OFFSET ?
        `,
        [Number(usuarioId), Number(pageSize), Number(offset)]
      );

      // Obtener el total de postulaciones del usuario
      const [[{ total_count }]] = await pool.query(
        'SELECT COUNT(*) as total_count FROM postulaciones WHERE usuario_id = ?',
        [Number(usuarioId)]
      );

      const totalPages = Math.ceil(total_count / pageSize);

      return {
        totalItems: total_count,
        currentPage: page,
        pageSize,
        totalPages,
        data: rows
      };
    } catch (error) {
      throw new Error(`Error al obtener las postulaciones del usuario: ${error.message}`);
    }
  }

  async getAvailablePasantias(usuarioId, page = 1, pageSize = 10) {
    try {
      const offset = (page - 1) * pageSize;

      // Obtener todas las pasantías y marcar si el usuario está postulado
      const [rows] = await pool.query(
        `
        SELECT
          p.*,
          CASE
            WHEN pos.usuario_id IS NOT NULL THEN true
            ELSE false
          END as is_postulado
        FROM pasantias p
        LEFT JOIN postulaciones pos ON p.id = pos.pasantia_id
          AND pos.usuario_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [Number(usuarioId), Number(pageSize), Number(offset)]
      );

      // Obtener el total de pasantías
      const [[{ total_count }]] = await pool.query(
        'SELECT COUNT(*) as total_count FROM pasantias'
      );

      const totalPages = Math.ceil(total_count / pageSize);

      return {
        totalItems: total_count,
        currentPage: page,
        pageSize,
        totalPages,
        data: rows
      };
    } catch (error) {
      throw new Error(`Error al obtener las pasantías disponibles: ${error.message}`);
    }
  }

  async getDocumentoById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT archivo FROM documentos_postulaciones WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        throw new Error('Documento no encontrado');
      }
      return { archivo: rows[0].archivo };
    } catch (error) {
      throw new Error(`Error al obtener el documento: ${error.message}`);
    }
  }

  async uploadDocumento(archivo) {
    try {
      const [result] = await pool.query(
        'INSERT INTO documentos_postulaciones (archivo) VALUES (?)',
        [archivo]
      );
      return { success: true, documentoId: result.insertId };
    } catch (error) {
      throw new Error(`Error al subir el documento: ${error.message}`);
    }
  }

}