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

  async getDetails(userId, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM reservas
      WHERE usuario_id = ?
    `;

    const query = `
      SELECT r.*, e.nombre AS nombre_espacio
      FROM reservas r
      JOIN espacios e ON r.espacio_id = e.id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha_inicio DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const [[{ total }]] = await pool.query(countQuery, [userId]);
      const [rows] = await pool.query(query, [userId, pageSize, offset]);

      return {
        totalItems: total,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        data: rows.map(row => ({
          reservaId: row.id,
          spaceName: row.nombre_espacio,
          userId: row.usuario_id,
          startDate: row.fecha_inicio,
          endDate: row.fecha_fin,
          reason: row.motivo,
          status: row.estado
        }))
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async getAllDetails(page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM reservas
    `;

    const query = `
      SELECT r.*, e.nombre AS nombre_espacio, u.nombre AS nombre_usuario
      FROM reservas r
      JOIN espacios e ON r.espacio_id = e.id
      JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.fecha_inicio DESC
      LIMIT ? OFFSET ?
    `;

    try {

      const [[{ total }]] = await pool.query(countQuery);

      const [rows] = await pool.query(query, [pageSize, offset]);

      return {
        totalItems: total,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        data: rows.map(row => ({
          reservaId: row.id,
          spaceName: row.nombre_espacio,
          userId: row.usuario_id,
          userName: row.nombre_usuario,
          startDate: row.fecha_inicio,
          endDate: row.fecha_fin,
          reason: row.motivo,
          status: row.estado
        }))
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateStatus(reservaId, newStatus) {
    if (!['aceptado', 'rechazado'].includes(newStatus.toLowerCase())) {
      throw new Error('Estado no válido. Debe ser "aceptado" o "rechazado".');
    }

    const query = `
      UPDATE reservas
      SET estado = ?
      WHERE id = ?
    `;
    try {
      const [result] = await pool.query(query, [newStatus.toLowerCase(), reservaId]);
      if (result.affectedRows === 0) {
        throw new Error('No se encontró la reserva especificada.');
      }
      return { success: true, message: `Reserva ${newStatus.toLowerCase()} con éxito` };
    } catch (error) {
      throw new Error(`Error al actualizar el estado de la reserva: ${error.message}`);
    }
  }

  async updateReservation(reservaId, userId, newStartDate, newEndDate, newReason, newSpaceId = null) {
    const findReservationQuery = `
      SELECT * FROM reservas
      WHERE id = ? AND usuario_id = ? AND estado = 'pendiente'
    `;

    const [reservationRows] = await pool.query(findReservationQuery, [reservaId, userId]);
    if (reservationRows.length === 0) {
      throw new Error('No se puede editar esta reserva. Puede que no exista o no esté en estado "pendiente".');
    }

    // Si se proporciona un nuevo spaceId, verificar su disponibilidad
    const spaceIdToCheck = newSpaceId || reservationRows[0].espacio_id; // Usa el nuevo spaceId si se proporciona
    const queryAvailability = `
      SELECT COUNT(*) as count
      FROM reservas
      WHERE espacio_id = ?
        AND id != ?
        AND ((fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio >= ? AND fecha_fin <= ?))
        AND estado != 'cancelada'
    `;

    const [availabilityResult] = await pool.query(queryAvailability, [
      spaceIdToCheck,
      reservaId,
      newEndDate,
      newStartDate,
      newStartDate,
      newEndDate,
      newStartDate,
      newEndDate
    ]);

    if (availabilityResult[0].count > 0) {
      throw new Error('El espacio no está disponible para las nuevas fechas seleccionadas.');
    }

    const updateQuery = `
      UPDATE reservas
      SET espacio_id = ?, fecha_inicio = ?, fecha_fin = ?, motivo = ?
      WHERE id = ? AND usuario_id = ?
    `;

    const [result] = await pool.query(updateQuery, [spaceIdToCheck, newStartDate, newEndDate, newReason, reservaId, userId]);

    if (result.affectedRows === 0) {
      throw new Error('No se pudo actualizar la reserva.');
    }

    return { success: true, message: 'Reserva actualizada con éxito' };
  }


  async getReservationById(reservaId) {
    const query = `
      SELECT r.*, e.nombre AS nombre_espacio, u.nombre AS nombre_usuario
      FROM reservas r
      JOIN espacios e ON r.espacio_id = e.id
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = ?
    `;

    try {
      const [rows] = await pool.query(query, [reservaId]);

      if (rows.length === 0) {
        throw new Error('No se encontró la reserva especificada.');
      }

      const reservation = rows[0];

      return {
        reservaId: reservation.id,
        spaceName: reservation.nombre_espacio,
        spaceId: reservation.espacio_id,
        userName: reservation.nombre_usuario,
        userId: reservation.usuario_id,
        startDate: reservation.fecha_inicio,
        endDate: reservation.fecha_fin,
        reason: reservation.motivo,
        status: reservation.estado
      };
    } catch (error) {
      throw new Error(`Error al obtener los detalles de la reserva: ${error.message}`);
    }
  }

}