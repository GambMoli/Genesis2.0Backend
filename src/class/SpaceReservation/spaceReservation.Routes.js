// router.js
import express from 'express';
import SpaceReservation from './spaceReservation.js';
import ReserveSpaceCommand from '../Commands/ReserveSpaceCommand.js';
import { pool } from '../../db/db.js';

const router = express.Router();
const spaceReservation = new SpaceReservation();

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

router.post('/undo', async (req, res) => {
  try {
    const result = await spaceReservation.undoLastCommand();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const history = await spaceReservation.getCommandHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
});

router.get('/spaces', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM espacios');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los espacios' });
  }
});

router.get('/all-reservations', async (req, res) => {
  try {
    const result = await spaceReservation.getAllDetails();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener todas las reservas' });
  }
});

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


export default router;