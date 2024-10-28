import Command from './Command.js';
import { pool } from '../../db/db.js';

export default class PasantiaCommand extends Command {
  async createPasantia(titulo, descripcion, salario, empresa) {
    try {
      const [result] = await pool.query(
        'INSERT INTO pasantias (titulo, descripcion, salario, empresa) VALUES (?, ?, ?, ?)',
        [titulo, descripcion, salario, empresa]
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
      [pageSize, offset]
    );

    const [
      [{ total_count }]
    ] = await pool.query('SELECT COUNT(*) as total_count FROM pasantias');

    const totalPages = Math.ceil(total_count / pageSize);

    return {
      totalItems: total_count,
      currentPage: page,
      pageSize,
      totalPages,
      data: rows
    };
  }

  async getPasantiaById(id) {
    const [[pasantia]] = await pool.query(
      'SELECT * FROM pasantias WHERE id = ?',
      [id]
    );
    return pasantia;
  }

  async postularPasantia(pasantiaId, usuarioId) {
    try {
      const [result] = await pool.query(
        'INSERT INTO postulaciones (pasantia_id, usuario_id) VALUES (?, ?)',
        [pasantiaId, usuarioId]
      );
      return { success: true, postulacionId: result.insertId };
    } catch (error) {
      throw new Error(`Error al postular a la pasantía: ${error.message}`);
    }
  }

  async getAllPostulaciones(pasantiaId, page = 1, pageSize = 10) {
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
      [pasantiaId, pageSize, offset]
    );
    return rows;
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
}