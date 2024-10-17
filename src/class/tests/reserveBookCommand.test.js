import { jest } from '@jest/globals';
import ReserveBookCommand from '../Commands/ReserveBookCommand.js';


const mockPool = {
  query: jest.fn()
};

jest.mock('../../db/db.js', () => ({
  pool: mockPool
}));

describe('ReserveBookCommand', () => {
  let command;

  beforeEach(() => {
    jest.clearAllMocks();
    command = new ReserveBookCommand(1, 1, '2024-10-05', '2024-10-10');
  });

  describe('execute', () => {
    it('debería crear una reserva si el libro está disponible', async () => {
      mockPool.query
        .mockResolvedValueOnce([[{ count: 0 }]])  // checkAvailability
        .mockResolvedValueOnce([{ insertId: 1 }]);  // insertQuery

      const result = await command.execute();

      expect(result).toEqual({
        success: true,
        message: 'Reserva de libro creada con éxito',
        reservaId: 1
      });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('debería lanzar un error si el libro no está disponible', async () => {
      mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

      await expect(command.execute()).rejects.toThrow('El libro no está disponible para las fechas seleccionadas.');
    });
  });

  describe('updateReservationStatus', () => {
    it('debería actualizar el estado de la reserva', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await command.updateReservationStatus(1, 'activa');

      expect(result).toEqual({
        success: true,
        message: "Estado de la reserva actualizado a 'activa' exitosamente",
        reservaId: 1,
        newStatus: 'activa'
      });
    });

    it('debería lanzar un error si el estado no es válido', async () => {
      await expect(command.updateReservationStatus(1, 'invalido')).rejects.toThrow('Estado de reserva no válido');
    });
  });

  describe('getAllReservations', () => {
    it('debería obtener todas las reservas paginadas', async () => {
      const mockReservations = [
        {
          id: 1,
          libro_id: 1,
          libro_nombre: 'Libro 1',
          libro_autor: 'Autor 1',
          usuario_id: 1,
          nombre_usuario: 'Usuario 1',
          fecha_inicio: '2024-10-05',
          fecha_fin: '2024-10-10',
          estado: 'pendiente',
          created_at: '2024-10-01',
          updated_at: '2024-10-01'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce([[{ total: 1 }]])
        .mockResolvedValueOnce([mockReservations]);

      const result = await command.getAllReservations();

      expect(result).toEqual({
        totalItems: 1,
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        reservations: [
          {
            reservaId: 1,
            book: {
              bookId: 1,
              bookName: 'Libro 1',
              bookAuthor: 'Autor 1'
            },
            user: {
              userId: 1,
              userName: 'Usuario 1'
            },
            startDate: '2024-10-05',
            endDate: '2024-10-10',
            status: 'pendiente',
            createdAt: '2024-10-01',
            updatedAt: '2024-10-01'
          }
        ]
      });
    });
  });

  describe('getAllBooks', () => {
    it('debería obtener todos los libros paginados', async () => {
      const mockBooks = [
        {
          id: 1,
          nombre: 'Libro 1',
          autor: 'Autor 1',
          imagen: 'imagen1.jpg',
          pdf_blob: null,
          descripcion: 'Descripción 1',
          disponible: true
        }
      ];

      mockPool.query
        .mockResolvedValueOnce([mockBooks])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await ReserveBookCommand.getAllBooks();

      expect(result).toEqual({
        books: mockBooks,
        currentPage: 1,
        totalPages: 1,
        totalBooks: 1
      });
    });
  });

  // Aquí puedes agregar más pruebas para los otros métodos...

  describe('createBook', () => {
    it('debería crear un nuevo libro', async () => {
      const mockBook = {
        nombre: 'Nuevo Libro',
        autor: 'Nuevo Autor',
        imagen: 'nueva_imagen.jpg',
        urlPdf: 'nuevo_libro.pdf',
        descripcion: 'Nueva descripción',
        usuarioId: 1
      };

      mockPool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await ReserveBookCommand.createBook(
        mockBook.nombre,
        mockBook.autor,
        mockBook.imagen,
        mockBook.urlPdf,
        mockBook.descripcion,
        mockBook.usuarioId
      );

      expect(result).toEqual({
        success: true,
        message: 'Libro creado exitosamente',
        bookId: 1,
        data: {
          id: 1,
          nombre: mockBook.nombre,
          autor: mockBook.autor,
          imagen: mockBook.imagen,
          urlPdf: mockBook.urlPdf,
          descripcion: mockBook.descripcion
        }
      });
    });
  });

  describe('updateBook', () => {
    it('debería actualizar un libro existente', async () => {
      const mockBook = {
        id: 1,
        nombre: 'Libro Actualizado',
        autor: 'Autor Actualizado',
        imagen: 'imagen_actualizada.jpg',
        url_pdf: 'libro_actualizado.pdf',
        descripcion: 'Descripción actualizada'
      };

      mockPool.query
        .mockResolvedValueOnce([mockBook])  // getBookById
        .mockResolvedValueOnce([{ affectedRows: 1 }]);  // updateQuery

      const result = await ReserveBookCommand.updateBook(1, {
        nombre: mockBook.nombre,
        autor: mockBook.autor,
        descripcion: mockBook.descripcion
      });

      expect(result).toEqual({
        success: true,
        message: 'Libro actualizado exitosamente'
      });
    });
  });

  describe('deleteBook', () => {
    it('debería eliminar un libro existente', async () => {
      const mockBook = {
        id: 1,
        imagen: 'imagen.jpg',
        url_pdf: 'libro.pdf'
      };

      mockPool.query
        .mockResolvedValueOnce([mockBook])  // getBookById
        .mockResolvedValueOnce([{ affectedRows: 1 }]);  // deleteQuery

      const result = await ReserveBookCommand.deleteBook(1);

      expect(result).toEqual({
        success: true,
        message: 'Libro eliminado exitosamente'
      });
    });
  });

  describe('getBookStatistics', () => {
    it('debería obtener estadísticas de un libro', async () => {
      const mockStats = {
        count: 5,
        unique_users: 3,
        total_hours: 120,
        last_reservation: '2024-10-10',
        nombre: 'Libro 1',
        autor: 'Autor 1',
        descripcion: 'Descripción 1'
      };

      mockPool.query
        .mockResolvedValueOnce([[{ count: 5 }]])
        .mockResolvedValueOnce([[{ count: 3 }]])
        .mockResolvedValueOnce([[{ total_hours: 120 }]])
        .mockResolvedValueOnce([[{ fecha_fin: '2024-10-10' }]])
        .mockResolvedValueOnce([[mockStats]]);

      const result = await ReserveBookCommand.getBookStatistics(1);

      expect(result).toEqual({
        bookId: 1,
        nombre: 'Libro 1',
        autor: 'Autor 1',
        descripcion: 'Descripción 1',
        reservationCount: 5,
        uniqueUsers: 3,
        totalReservationTimeHours: 120,
        lastReservation: '2024-10-10'
      });
    });
  });

  describe('getReservationHistory', () => {
    it('debería obtener el historial de reservas de un usuario', async () => {
      const mockReservations = [
        {
          reserva_id: 1,
          libro_id: 1,
          libro_nombre: 'Libro 1',
          libro_autor: 'Autor 1',
          fecha_inicio: '2024-10-05',
          fecha_fin: '2024-10-10',
          estado: 'finalizada'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce([mockReservations])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await command.getReservationHistory(1);

      expect(result).toEqual({
        reservations: mockReservations,
        currentPage: 1,
        totalPages: 1,
        totalReservations: 1
      });
    });
  });
});