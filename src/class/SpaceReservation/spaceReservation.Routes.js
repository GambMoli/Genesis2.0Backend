// router.js
import express from 'express';
import SpaceReservation from './spaceReservation.js';
import ReserveSpaceCommand from '../Commands/ReserveSpaceCommand.js';

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
    console.log('====================================');
    console.log(userId);
    console.log('====================================');
    const history = await spaceReservation.getCommandHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
});

export default router;