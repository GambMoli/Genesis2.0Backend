// ReserveSpaceCommand.js
import Command from './Command.js';
import { pool } from '../../db/db.js';

export default class ReserveSpaceCommand extends Command {
  constructor(spaceId, userId, startDate, endDate, reason) {
    super();
    this.spaceId = spaceId;
    this.userId = userId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
    this.reservaId = null;
  }

  async execute() {
    if (!await this.checkAvailability()) {
      throw new Error('El espacio no está disponible para las fechas seleccionadas.');
    }

    const insertQuery = `
      INSERT INTO reservas (espacio_id, usuario_id, fecha_inicio, fecha_fin, motivo, estado)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const [result] = await pool.query(insertQuery, [
      this.spaceId,
      this.userId,
      this.startDate,
      this.endDate,
      this.reason,
      'pendiente'
    ]);

    this.reservaId = result.insertId;
    await this.sendConfirmationNotification();

    return { success: true, message: 'Reserva creada con éxito', reservaId: this.reservaId };
  }

  async undo() {
    if (!this.reservaId) {
      throw new Error('No se puede deshacer una reserva que no se ha creado.');
    }

    const deleteQuery = 'DELETE FROM reservas WHERE id = ?';
    await pool.query(deleteQuery, [this.reservaId]);

    return { success: true, message: 'Reserva cancelada con éxito' };
  }

  async checkAvailability() {
    const query = `
      SELECT COUNT(*) as count
      FROM reservas
      WHERE espacio_id = ?
        AND ((fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio >= ? AND fecha_fin <= ?))
        AND estado != 'cancelada'
    `;

    const [result] = await pool.query(query, [
      this.spaceId,
      this.endDate,
      this.startDate,
      this.startDate,
      this.endDate,
      this.startDate,
      this.endDate
    ]);

    return result[0].count === 0;
  }

  async sendConfirmationNotification() {
    console.log(`Enviando notificación para la reserva ${this.reservaId}`);
  }

  async getDetails(userId) {
    const query = `
      SELECT r.*, e.nombre AS nombre_espacio
      FROM reservas r
      JOIN espacios e ON r.espacio_id = e.id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha_inicio DESC
    `;
    try {
      const [rows] = await pool.query(query, [userId]);
      return rows.map(row => ({
        details: {
          reservaId: row.id,
          spaceName: row.nombre_espacio, // Cambiado de spaceId a spaceName
          userId: row.usuario_id,
          startDate: row.fecha_inicio,
          endDate: row.fecha_fin,
          reason: row.motivo,
          status: row.estado,
          nombre: row.nombre
        }
      }));
    } catch (error) {
      throw new Error(error);
    }
  }

}