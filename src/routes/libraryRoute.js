import express from 'express';
import LibraryService from '../class/Library/libraryService.js';
import ReserveBookCommand from '../class/Commands/ReserveBookCommand.js';

const router = express.Router();
const libraryService = new LibraryService();

router.post('/library/reserve', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Reserve a book'
  // #swagger.description = 'Creates a new book reservation with the specified book ID, user ID and dates'
  const { bookId, userId, startDate, endDate } = req.body;
  const command = new ReserveBookCommand(bookId, userId, startDate, endDate);

  try {
    const result = await libraryService.executeCommand(command);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.get('/library/history/:userId', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get user reservation history'
  // #swagger.description = 'Retrieves the book reservation history for a specific user with pagination support'
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const history = await libraryService.getReservationHistory(userId, page, pageSize);
    res.status(200).json(history);
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
});

router.get('/library/books', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get all books'
  // #swagger.description = 'Retrieves a paginated list of all available books in the library'
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const result = await libraryService.getAllBooks(page, pageSize);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los libros' });
  }
});

router.post('/library/books', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Create a new book'
  // #swagger.description = 'Adds a new book to the library with the provided details including name, author, image, PDF URL and description'
  const { nombre, autor, imagen, urlPdf, descripcion, usuarioId } = req.body;

  try {
    const result = await libraryService.createBook(nombre, autor, imagen, urlPdf, descripcion, usuarioId);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.get('/library/all-reservations', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get all book reservations'
  // #swagger.description = 'Retrieves all book reservations with pagination support'
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const result = await libraryService.getAllReservations(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener todas las reservas' });
  }
});

router.put('/library/reservations/:reservaId', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Update reservation status'
  // #swagger.description = 'Updates the status of a specific book reservation'
  const { reservaId } = req.params;
  const { status } = req.body;

  try {
    const result = await libraryService.updateReservationStatus(reservaId, status);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Error al actualizar el estado de la reserva' });
  }
});

router.put('/library/cancel-reservation/:reservaId', async (req, res) => {
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Cancel book reservation'
  // #swagger.description = 'Cancels a specific book reservation for a user'
  const { reservaId } = req.params;
  const { userId } = req.body;

  try {
    const result = await libraryService.cancelReservation(reservaId, userId);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cancelar la reserva' });
  }
});

router.get('/library/:libroId/estadisticas', async (req, res) => {
  // #swagger.tags = ['Libros']
  // #swagger.summary = 'Obtener estadísticas del libro'
  // #swagger.description = 'Recupera estadísticas para un libro específico'
  try {
    const libroId = parseInt(req.params.libroId, 10);
    if (isNaN(libroId)) {
      return res.status(400).json({ success: false, message: 'ID de libro inválido' });
    }
    const result = await libraryService.getBookStatistics(libroId);
    console.log(result)
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas del libro' });
  }
});



export default router;