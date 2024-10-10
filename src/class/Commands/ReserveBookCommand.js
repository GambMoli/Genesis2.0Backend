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

  static async modifyReservation(reservaId, userId, newStartDate, newEndDate) {
    if (!await this.checkAvailabilityForModification(reservaId, userId, newStartDate, newEndDate)) {
      throw new Error('El libro no está disponible para las nuevas fechas seleccionadas.');
    }

    const query = `
      UPDATE reservas_libros
      SET fecha_inicio = ?, fecha_fin = ?, estado = 'pendiente'
      WHERE id = ? AND usuario_id = ?
    `;

    const [result] = await pool.query(query, [newStartDate, newEndDate, reservaId, userId]);

    if (result.affectedRows === 0) {
      throw new Error('No se pudo modificar la reserva. Verifica que sea tu reserva y que esté en estado pendiente.');
    }

    return { success: true, message: 'Reserva modificada con éxito' };
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
        SELECT fecha_fin
        FROM reservas_libros
        WHERE libro_id = ?
        ORDER BY fecha_fin DESC
        LIMIT 1
      `,
      bookDetails: `
        SELECT nombre, autor, descripcion
        FROM libros
        WHERE id = ?
      `
    };

    try {
      const [reservationCount] = await pool.query(queries.reservationCount, [bookId]);
      const [uniqueUsers] = await pool.query(queries.uniqueUsers, [bookId]);
      const [totalReservationTime] = await pool.query(queries.totalReservationTime, [bookId]);
      const [lastReservation] = await pool.query(queries.lastReservation, [bookId]);
      const [bookDetails] = await pool.query(queries.bookDetails, [bookId]);

      return {
        bookId,
        ...bookDetails[0],
        reservationCount: reservationCount[0].count,
        uniqueUsers: uniqueUsers[0].count,
        totalReservationTimeHours: totalReservationTime[0].total_hours || 0,
        lastReservation: lastReservation[0]?.fecha_fin || null
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