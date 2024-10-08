import express from 'express';
import SpaceReservation from '../class/SpaceReservation/spaceReservation.js';
import ReserveSpaceCommand from '../class/Commands/ReserveSpaceCommand.js';
import { pool } from '../db/db.js';

const router = express.Router();
const spaceReservation = new SpaceReservation();

/**
 * @swagger
 * /reserve:
 *   post:
 *     summary: Reservar un espacio
 *     tags:
 *       - Reservaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               spaceId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *       400:
 *         description: Error en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.post('/reserve', async (req, res) => {
  const { spaceId, userId, startDate, endDate, reason } = req.body;
  const command = new ReserveSpaceCommand(spaceId, userId, startDate, endDate, reason);

  try {
    const result = await spaceReservation.executeCommand(command);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /history/{userId}:
 *   get:
 *     summary: Obtener historial de reservas por usuario
 *     tags:
 *       - Historial
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *       500:
 *         description: Error al obtener el historial
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const history = await spaceReservation.getCommandHistory(userId, page, pageSize);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
});

/**
 * @swagger
 * /spaces:
 *   get:
 *     summary: Obtener todos los espacios disponibles
 *     tags:
 *       - Espacios
 *     responses:
 *       200:
 *         description: Lista de espacios obtenida exitosamente
 *       500:
 *         description: Error al obtener los espacios
 */
router.get('/spaces', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM espacios');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los espacios' });
  }
});

/**
 * @swagger
 * /all-reservations:
 *   get:
 *     summary: Obtener todas las reservaciones
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Reservaciones obtenidas exitosamente
 *       500:
 *         description: Error al obtener las reservaciones
 */
router.get('/all-reservations', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const result = await spaceReservation.getAllDetails(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener todas las reservas' });
  }
});

/**
 * @swagger
 * /update-status/{reservaId}:
 *   put:
 *     summary: Actualizar el estado de una reserva
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.put('/update-status/:reservaId', async (req, res) => {
  const { reservaId } = req.params;
  const { newStatus } = req.body;

  if (!newStatus) {
    return res.status(400).json({ success: false, message: 'Se requiere el nuevo estado' });
  }

  try {
    const result = await spaceReservation.updateStatus(reservaId, newStatus);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /update-reservation/{reservaId}:
 *   put:
 *     summary: Actualizar los detalles de una reserva
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               newStartDate:
 *                 type: string
 *                 format: date-time
 *               newEndDate:
 *                 type: string
 *                 format: date-time
 *               newReason:
 *                 type: string
 *               newSpaceId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reserva actualizada exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.put('/update-reservation/:reservaId', async (req, res) => {
  const { reservaId } = req.params;
  const { userId, newStartDate, newEndDate, newReason, newSpaceId } = req.body;

  try {
    const result = await spaceReservation.updateReservation(reservaId, userId, newStartDate, newEndDate, newReason, newSpaceId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /reservation/{reservaId}:
 *   get:
 *     summary: Obtener los detalles de una reserva
 *     tags:
 *       - Reservaciones
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Detalles de la reserva obtenidos exitosamente
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al obtener los detalles
 */
router.get('/reservation/:reservaId', async (req, res) => {
  const { reservaId } = req.params;

  try {
    const result = await spaceReservation.getReservationById(reservaId);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los detalles de la reserva' });
  }
});

export default router;
