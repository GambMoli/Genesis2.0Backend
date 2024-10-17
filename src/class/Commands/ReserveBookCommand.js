import Command from './Command.js';
import { pool } from '../../db/db.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/books')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser una imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export default class ReserveBookCommand extends Command {
  constructor(bookId, userId, startDate, endDate) {
    super();
    this.bookId = bookId;
    this.userId = userId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reservaId = null;
  }

  async execute() {
    const [bookExists] = await pool.query('SELECT id FROM libros WHERE id = ?', [this.bookId]);
    if (bookExists.length === 0) {
      throw new Error('El libro especificado no existe.');
    }

    if (!await this.checkAvailability()) {
      throw new Error('El libro no está disponible para las fechas seleccionadas.');
    }

    const insertQuery = `
      INSERT INTO reservas_libros (libro_id, usuario_id, fecha_inicio, fecha_fin, estado)
      VALUES (?, ?, ?, ?, ?);
    `;

    const [result] = await pool.query(insertQuery, [
      this.bookId,
      this.userId,
      this.startDate,
      this.endDate,
      'pendiente'
    ]);

    this.reservaId = result.insertId;

    return { success: true, message: 'Reserva de libro creada con éxito', reservaId: this.reservaId };
  }

  async updateReservationStatus(reservaId, newStatus) {
    const validStatuses = ['pendiente', 'activa', 'finalizada', 'cancelada'];

    if (!validStatuses.includes(newStatus)) {
      throw new Error('Estado de reserva no válido. Debe ser pendiente, activa, finalizada, o cancelada.');
    }

    const query = `
      UPDATE reservas_libros
      SET estado = ?, updated_at = NOW()
      WHERE id = ?
    `;

    try {
      const [result] = await pool.query(query, [newStatus, reservaId]);

      if (result.affectedRows === 0) {
        throw new Error('No se encontró la reserva o no se pudo actualizar');
      }

      return {
        success: true,
        message: `Estado de la reserva actualizado a '${newStatus}' exitosamente`,
        reservaId,
        newStatus
      };
    } catch (error) {
      throw new Error(`Error al actualizar el estado de la reserva: ${error.message}`);
    }
  }

  async getAllReservations(page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;

    const countQuery = 'SELECT COUNT(*) AS total FROM reservas_libros';
    const query = `
      SELECT rl.*, l.nombre AS libro_nombre, l.autor AS libro_autor, u.nombre AS nombre_usuario
      FROM reservas_libros rl
      JOIN libros l ON rl.libro_id = l.id
      JOIN usuarios u ON rl.usuario_id = u.id
      ORDER BY rl.fecha_inicio DESC
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
        reservations: rows.map(row => ({
          reservaId: row.id,
          book: {
            bookId: row.libro_id,
            bookName: row.libro_nombre,
            bookAuthor: row.libro_autor
          },
          user: {
            userId: row.usuario_id,
            userName: row.nombre_usuario
          },
          startDate: row.fecha_inicio,
          endDate: row.fecha_fin,
          status: row.estado,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      };
    } catch (error) {
      throw new Error(`Error al obtener todas las reservas de libros: ${error.message}`);
    }
  }

  static async getAllBooks(page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT id, nombre, autor, imagen, pdf_blob, descripcion, disponible
      FROM libros
      LIMIT ? OFFSET ?
    `;
    const countQuery = 'SELECT COUNT(*) as total FROM libros';

    const [books] = await pool.query(query, [pageSize, offset]);
    const [countResult] = await pool.query(countQuery);
    const totalBooks = countResult[0].total;

    return {
      books,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / pageSize),
      totalBooks
    };
  }

  async checkAvailability() {
    const query = `
      SELECT COUNT(*) as count
      FROM reservas_libros
      WHERE libro_id = ?
        AND ((fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio >= ? AND fecha_fin <= ?))
        AND estado != 'cancelada'
    `;

    const [rows] = await pool.query(query, [
      this.bookId,
      this.endDate,
      this.startDate,
      this.startDate,
      this.endDate,
      this.startDate,
      this.endDate
    ]);

    return rows[0].count === 0;
  }

  static async cancelReservation(reservaId, userId) {
    const query = `
      UPDATE reservas_libros
      SET estado = 'cancelado'
      WHERE id = ? AND usuario_id = ?
    `;

    const [result] = await pool.query(query, [reservaId, userId]);

    if (result.affectedRows === 0) {
      throw new Error('No se pudo cancelar la reserva. Verifica que sea tu reserva y que esté en estado pendiente.');
    }

    return { success: true, message: 'Reserva cancelada con éxito' };
  }

  async modifyReservation(reservaId, userId, newStartDate, newEndDate) {
    // Convertir las fechas al formato que MySQL acepta
    const formatDate = (date) => {
      return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
    };

    const formattedStartDate = formatDate(newStartDate);
    const formattedEndDate = formatDate(newEndDate);

    if (!await this.checkAvailability(reservaId, userId, formattedStartDate, formattedEndDate)) {
      throw new Error('El libro no está disponible para las nuevas fechas seleccionadas.');
    }

    const query = `
      UPDATE reservas_libros
      SET fecha_inicio = ?, fecha_fin = ?, estado = 'pendiente'
      WHERE id = ? AND usuario_id = ?
    `;

    try {
      const [result] = await pool.query(query, [formattedStartDate, formattedEndDate, reservaId, userId]);

      if (result.affectedRows === 0) {
        throw new Error('No se pudo modificar la reserva. Verifica que sea tu reserva y que esté en estado pendiente.');
      }

      return {
        success: true,
        message: 'Reserva modificada con éxito',
        data: {
          reservaId,
          newStartDate: formattedStartDate,
          newEndDate: formattedEndDate
        }
      };
    } catch (error) {
      throw new Error(`Error al modificar la reserva: ${error.message}`);
    }
  }

  static async checkAvailabilityForModification(reservaId, bookId, newStartDate, newEndDate) {
    const query = `
      SELECT COUNT(*) as count
      FROM reservas_libros
      WHERE libro_id = ?
        AND id != ?
        AND ((fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio <= ? AND fecha_fin >= ?)
          OR (fecha_inicio >= ? AND fecha_fin <= ?))
        AND estado != 'cancelado'
    `;

    const [rows] = await pool.query(query, [
      bookId,
      reservaId,
      newEndDate,
      newStartDate,
      newStartDate,
      newEndDate,
      newStartDate,
      newEndDate
    ]);

    return rows[0].count === 0;
  }

  static async createBook(nombre, autor, imagen, urlPdf, descripcion, usuarioId) {
    try {
      if (!nombre || !autor || !imagen || !urlPdf || !descripcion) {
        throw new Error('Todos los campos son obligatorios');
      }

      const insertQuery = `
        INSERT INTO libros (
          nombre,
          autor,
          imagen,
          url_pdf,
          descripcion,
          usuario_id,
          disponible,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, true, NOW())
      `;

      const [result] = await pool.query(insertQuery, [
        nombre,
        autor,
        imagen,
        urlPdf,
        descripcion,
        usuarioId
      ]);

      return {
        success: true,
        message: 'Libro creado exitosamente',
        bookId: result.insertId,
        data: {
          id: result.insertId,
          nombre,
          autor,
          imagen,
          urlPdf,
          descripcion
        }
      };
    } catch (error) {
      // Si hay un error y se subió una imagen, la eliminamos
      if (imagen) {
        try {
          await fs.unlink(path.join('public', imagen));
        } catch (unlinkError) {
          console.error('Error al eliminar la imagen:', unlinkError);
        }
      }
      throw new Error(`Error al crear el libro: ${error.message}`);
    }
  }

  static async updateBook(bookId, updates, newImage = null, newPdf = null) {
    try {
      const book = await this.getBookById(bookId);
      if (!book) {
        throw new Error('Libro no encontrado');
      }

      // Si hay una nueva imagen, eliminar la anterior
      if (newImage && book.imagen) {
        try {
          await fs.unlink(path.join('public', book.imagen));
        } catch (error) {
          console.error('Error al eliminar la imagen anterior:', error);
        }
      }

      // Si hay un nuevo PDF, eliminar el anterior
      if (newPdf && book.url_pdf) {
        try {
          await fs.unlink(path.join('public', book.url_pdf));
        } catch (error) {
          console.error('Error al eliminar el PDF anterior:', error);
        }
      }

      const updateQuery = `
        UPDATE libros
        SET nombre = ?,
            autor = ?,
            imagen = ?,
            url_pdf = ?,
            descripcion = ?,
            updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await pool.query(updateQuery, [
        updates.nombre || book.nombre,
        updates.autor || book.autor,
        newImage || book.imagen,
        newPdf || book.url_pdf,
        updates.descripcion || book.descripcion,
        bookId
      ]);

      if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar el libro');
      }

      return {
        success: true,
        message: 'Libro actualizado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al actualizar el libro: ${error.message}`);
    }
  }

  static async deleteBook(bookId) {
    try {
      const book = await this.getBookById(bookId);
      if (!book) {
        throw new Error('Libro no encontrado');
      }

      // Eliminar la imagen si existe
      if (book.imagen) {
        try {
          await fs.unlink(path.join('public', book.imagen));
        } catch (error) {
          console.error('Error al eliminar la imagen:', error);
        }
      }

      // Eliminar el PDF si existe
      if (book.url_pdf) {
        try {
          await fs.unlink(path.join('public', book.url_pdf));
        } catch (error) {
          console.error('Error al eliminar el PDF:', error);
        }
      }

      const deleteQuery = `
        DELETE FROM libros
        WHERE id = ?
      `;

      const [result] = await pool.query(deleteQuery, [bookId]);

      if (result.affectedRows === 0) {
        throw new Error('No se pudo eliminar el libro');
      }

      return {
        success: true,
        message: 'Libro eliminado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al eliminar el libro: ${error.message}`);
    }
  }

  static async getBookById(bookId) {
    const query = `
      SELECT *
      FROM libros
      WHERE id = ?
    `;

    const [rows] = await pool.query(query, [bookId]);
    return rows[0];
  }

  static async getBookStatistics(bookId) {
    const queries = {
      reservationCount: `
        SELECT COUNT(*) as count
        FROM reservas_libros
        WHERE libro_id = ?
      `,
      uniqueUsers: `
        SELECT COUNT(DISTINCT usuario_id) as count
        FROM reservas_libros
        WHERE libro_id = ?
      `,
      totalReservationTime: `
        SELECT SUM(TIMESTAMPDIFF(HOUR, fecha_inicio, fecha_fin)) as total_hours
        FROM reservas_libros
        WHERE libro_id = ?
      `,
      lastReservation: `
        SELECT fecha_fin, usuario_id
        FROM reservas_libros
        WHERE libro_id = ?
        ORDER BY fecha_fin DESC
        LIMIT 1
      `,
      bookDetails: `
        SELECT nombre, autor, descripcion, imagen, disponible, created_at
        FROM libros
        WHERE id = ?
      `,
      currentReservation: `
        SELECT id, usuario_id, fecha_inicio, fecha_fin
        FROM reservas_libros
        WHERE libro_id = ? AND fecha_inicio <= NOW() AND fecha_fin >= NOW() AND estado = 'activa'
        LIMIT 1
      `,
      upcomingReservations: `
        SELECT COUNT(*) as count
        FROM reservas_libros
        WHERE libro_id = ? AND fecha_inicio > NOW() AND estado = 'pendiente'
      `,
      averageReservationDuration: `
        SELECT AVG(TIMESTAMPDIFF(HOUR, fecha_inicio, fecha_fin)) as avg_duration
        FROM reservas_libros
        WHERE libro_id = ? AND estado = 'finalizada'
      `,
      mostFrequentUser: `
        SELECT usuario_id, COUNT(*) as reservation_count
        FROM reservas_libros
        WHERE libro_id = ?
        GROUP BY usuario_id
        ORDER BY reservation_count DESC
        LIMIT 1
      `
    };

    try {
      const [reservationCount] = await pool.query(queries.reservationCount, [bookId]);
      const [uniqueUsers] = await pool.query(queries.uniqueUsers, [bookId]);
      const [totalReservationTime] = await pool.query(queries.totalReservationTime, [bookId]);
      const [lastReservation] = await pool.query(queries.lastReservation, [bookId]);
      const [bookDetails] = await pool.query(queries.bookDetails, [bookId]);
      const [currentReservation] = await pool.query(queries.currentReservation, [bookId]);
      const [upcomingReservations] = await pool.query(queries.upcomingReservations, [bookId]);
      const [averageReservationDuration] = await pool.query(queries.averageReservationDuration, [bookId]);
      const [mostFrequentUser] = await pool.query(queries.mostFrequentUser, [bookId]);


      let lastReservationUserName = null;
      let mostFrequentUserName = null;

      if (lastReservation[0]?.usuario_id) {
        const [lastReservationUser] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [lastReservation[0].usuario_id]);
        lastReservationUserName = lastReservationUser[0]?.nombre;
      }

      if (mostFrequentUser[0]?.usuario_id) {
        const [frequentUser] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [mostFrequentUser[0].usuario_id]);
        mostFrequentUserName = frequentUser[0]?.nombre;
      }

      return {
        bookId,
        ...bookDetails[0],
        reservationCount: reservationCount[0].count,
        uniqueUsers: uniqueUsers[0].count,
        totalReservationTimeHours: totalReservationTime[0].total_hours || 0,
        lastReservation: lastReservation[0]?.fecha_fin || null,
        lastReservationUser: lastReservationUserName,
        currentReservation: currentReservation[0] || null,
        upcomingReservationsCount: upcomingReservations[0].count,
        averageReservationDurationHours: averageReservationDuration[0].avg_duration || 0,
        mostFrequentUser: {
          userId: mostFrequentUser[0]?.usuario_id || null,
          name: mostFrequentUserName,
          reservationCount: mostFrequentUser[0]?.reservation_count || 0
        },
        availability: bookDetails[0].disponible ? 'Disponible' : 'No disponible',
        createdAt: bookDetails[0].created_at
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del libro: ${error.message}`);
    }
  }

  async getReservationHistory(userId, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT
        r.id as reserva_id,
        l.id as libro_id,
        l.nombre as libro_nombre,
        l.autor as libro_autor,
        r.fecha_inicio,
        r.fecha_fin,
        r.estado
      FROM
        reservas_libros r
      JOIN
        libros l ON r.libro_id = l.id
      WHERE
        r.usuario_id = ?
      ORDER BY
        r.fecha_inicio DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM reservas_libros
      WHERE usuario_id = ?
    `;

    try {
      const [reservations] = await pool.query(query, [userId, pageSize, offset]);
      const [countResult] = await pool.query(countQuery, [userId]);
      const totalReservations = countResult[0].total;

      return {
        reservations,
        currentPage: page,
        totalPages: Math.ceil(totalReservations / pageSize),
        totalReservations
      };
    } catch (error) {
      throw new Error(`Error al obtener el historial de reservaciones: ${error.message}`);
    }
  }

}