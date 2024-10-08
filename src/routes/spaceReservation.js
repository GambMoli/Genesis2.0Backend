import express from 'express';
import SpaceReservation from '../class/SpaceReservation/spaceReservation.js';
import ReserveSpaceCommand from '../class/Commands/ReserveSpaceCommand.js';
import { pool } from '../db/db.js';

const router = express.Router();
const spaceReservation = new SpaceReservation();

router.post('/spaces/reserve', async (req, res) => {
  // #swagger.tags = ['Space Reservations']
  // #swagger.summary = 'Reserve a space'
  // #swagger.description = 'Creates a new space reservation with the specified details including space ID, user ID, dates and reason'
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

router.get('/spaces/history/:userId', async (req, res) => {
  // #swagger.tags = ['Space Reservations']
  // #swagger.summary = 'Get user reservation history'
  // #swagger.description = 'Retrieves the reservation history for a specific user with pagination support'
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

router.get('/spaces/spaces', async (req, res) => {
  // #swagger.tags = ['Spaces']
  // #swagger.summary = 'Get all available spaces'
  // #swagger.description = 'Retrieves a list of all available spaces with their IDs and names'
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM espacios');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los espacios' });
  }
});

router.get('/spaces/all-reservations', async (req, res) => {
  // #swagger.tags = ['Space Reservations']
  // #swagger.summary = 'Get all reservations'
  // #swagger.description = 'Retrieves all space reservations with pagination support'
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const result = await spaceReservation.getAllDetails(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener todas las reservas' });
  }
});

router.put('/spaces/update-status/:reservaId', async (req, res) => {
  // #swagger.tags = ['Space Reservations']
  // #swagger.summary = 'Update reservation status'
  // #swagger.description = 'Updates the status of a specific reservation'
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

router.put('/spaces/update-reservation/:reservaId', async (req, res) => {
  // #swagger.tags = ['Space Reservations']
  // #swagger.summary = 'Update reservation details'
  // #swagger.description = 'Updates the details of a specific reservation including dates, reason and space'
  const { reservaId } = req.params;
  const { userId, newStartDate, newEndDate, newReason, newSpaceId } = req.body;

  try {
    const result = await spaceReservation.updateReservation(reservaId, userId, newStartDate, newEndDate, newReason, newSpaceId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/spaces/reservation/:reservaId', async (req, res) => {
  // #swagger.tags = ['Space Reservations']
  // #swagger.summary = 'Get reservation details'
  // #swagger.description = 'Retrieves detailed information about a specific reservation'
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