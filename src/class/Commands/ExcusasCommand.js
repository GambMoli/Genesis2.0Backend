import Command from './Command.js';
import { pool } from '../../db/db.js';

export default class ExcusasCommand extends Command {

  async createExcusa(id_estudiante, razon_falta, fecha_falta, id_documento) {
    try {
      const [result] = await pool.query(
        'INSERT INTO excusas_medicas (id_estudiante, razon_falta, fecha_falta, id_documento, estado) VALUES (?, ?, ?, ?, ?)',
        [id_estudiante, razon_falta, fecha_falta, id_documento, 0] // Estado inicial: 0 = Pendiente
      );
      return { success: true, excusaId: result.insertId };
    } catch (error) {
      throw new Error(`Error al crear la excusa médica: ${error.message}`);
    }
  }

  async getAllExcusas(page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT
        e.*,
        u.nombre,
        u.documento
      FROM excusas_medicas e
      LEFT JOIN usuarios u ON e.id_estudiante = u.id
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?`,
      [Number(pageSize), Number(offset)]
    );

    const [[{ total_count }]] = await pool.query('SELECT COUNT(*) as total_count FROM excusas_medicas');

    const totalPages = Math.ceil(total_count / pageSize);

    return {
      totalItems: total_count,
      currentPage: page,
      pageSize,
      totalPages,
      data: rows.map(row => ({
        ...row,
        nombre_completo: `${row.nombre}`.trim()
      }))
    };
  }

  async getExcusasByEstudiante(id_estudiante, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      'SELECT * FROM excusas_medicas WHERE id_estudiante = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [id_estudiante, Number(pageSize), Number(offset)]
    );

    const [[{ total_count }]] = await pool.query(
      'SELECT COUNT(*) as total_count FROM excusas_medicas WHERE id_estudiante = ?',
      [id_estudiante]
    );

    const totalPages = Math.ceil(total_count / pageSize);

    return {
      totalItems: total_count,
      currentPage: page,
      pageSize,
      totalPages,
      data: rows
    };
  }

  async updateExcusaState(id, estado) {
    try {
      const [result] = await pool.query(
        'UPDATE excusas_medicas SET estado = ? WHERE id = ?',
        [estado, id]
      );
      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      throw new Error(`Error al actualizar el estado de la excusa: ${error.message}`);
    }
  }

  async getDocumentoById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT archivo FROM documentos_excusas WHERE id = ?',
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
        'INSERT INTO documentos_excusas (archivo) VALUES (?)',
        [archivo]
      );
      return { success: true, documentoId: result.insertId };
    } catch (error) {
      throw new Error(`Error al subir el documento: ${error.message}`);
    }
  }
}