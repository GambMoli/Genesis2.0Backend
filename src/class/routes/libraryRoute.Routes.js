import express from 'express';
import LibraryService from '../class/Library/libraryService.js';
import ReserveBookCommand from '../class/Commands/ReserveBookCommand.js';

const router = express.Router();
const libraryService = new LibraryService();

router.post('/reserve', async (req, res) => {
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

router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const history = await libraryService.getReservationHistory(userId, page, pageSize);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
});

router.get('/books', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const result = await libraryService.getAllBooks(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los libros' });
  }
});

router.post('/books', async (req, res) => {
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

router.get('/all-reservations', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    const result = await libraryService.getAllReservations(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener todas las reservas' });
  }
});

router.put('/reservations/:reservaId', async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Error al actualizar el estado de la reserva' });
  }
});

router.put('/cancel-reservation/:reservaId', async (req, res) => {
  const { reservaId } = req.params;
  const { userId } = req.body;

  try {
    const result = await ReserveBookCommand.cancelReservation(reservaId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/modify-reservation/:reservaId', async (req, res) => {
  const { reservaId } = req.params;
  const { userId, newStartDate, newEndDate } = req.body;

  try {
    const result = await ReserveBookCommand.modifyReservation(reservaId, userId, newStartDate, newEndDate);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


// router.post('/books', upload.fields([
//   { name: 'imagen', maxCount: 1 },
//   { name: 'pdf', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { nombre, autor, descripcion, usuarioId } = req.body;

//     if (!req.files['imagen'] || !req.files['pdf']) {
//       return res.status(400).json({
//         success: false,
//         message: 'Se requiere una imagen y un PDF para el libro'
//       });
//     }

//     const imagenPath = `/uploads/books/${req.files['imagen'][0].filename}`;
//     const pdfPath = `/uploads/books/${req.files['pdf'][0].filename}`;

//     const result = await libraryService.createBook(
//       nombre,
//       autor,
//       imagenPath,
//       pdfPath,
//       descripcion,
//       usuarioId
//     );

//     if (result.success) {
//       res.status(201).json(result);
//     } else {
//       res.status(400).json(result);
//     }
//   } catch (error) {
//     console.error('Error al crear el libro:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error interno del servidor',
//       error: error.message
//     });
//   }
// });



export default router;