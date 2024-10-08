import Command from './Command.js';
import { pool } from '../../db/db.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

// Configuración de multer para el almacenamiento de imágenes
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

export default class CreateBookCommand extends Command {
  constructor(nombre, autor, imagen, descripcion, usuarioId) {
    super();
    this.nombre = nombre;
    this.autor = autor;
    this.imagen = imagen;
    this.descripcion = descripcion;
    this.usuarioId = usuarioId;
  }

  async execute() {
    try {
      // Validaciones básicas
      if (!this.nombre || !this.autor || !this.imagen || !this.descripcion) {
        throw new Error('Todos los campos son obligatorios');
      }

      const insertQuery = `
        INSERT INTO libros (
          nombre,
          autor,
          imagen,
          descripcion,
          usuario_id,
          disponible,
          created_at
        ) VALUES (?, ?, ?, ?, ?, true, NOW())
      `;

      const [result] = await pool.query(insertQuery, [
        this.nombre,
        this.autor,
        this.imagen,
        this.descripcion,
        this.usuarioId
      ]);

      return {
        success: true,
        message: 'Libro creado exitosamente',
        bookId: result.insertId,
        data: {
          id: result.insertId,
          nombre: this.nombre,
          autor: this.autor,
          imagen: this.imagen,
          descripcion: this.descripcion
        }
      };
    } catch (error) {
      // Si hay un error y se subió una imagen, la eliminamos
      if (this.imagen) {
        try {
          await fs.unlink(path.join('public', this.imagen));
        } catch (unlinkError) {
          console.error('Error al eliminar la imagen:', unlinkError);
        }
      }
      throw new Error(`Error al crear el libro: ${error.message}`);
    }
  }

  static async updateBook(bookId, updates, newImage = null) {
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

      const updateQuery = `
        UPDATE libros
        SET nombre = ?,
            autor = ?,
            imagen = ?,
            descripcion = ?,
            updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await pool.query(updateQuery, [
        updates.nombre || book.nombre,
        updates.autor || book.autor,
        newImage || book.imagen,
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
      // Primero obtenemos la información del libro para eliminar la imagen
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

      // Eliminar el libro de la base de datos
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

  async createBook(nombre, autor, imagen, descripcion, usuarioId) {
    try {
      if (!nombre || !autor || !imagen || !descripcion) {
        throw new Error('Todos los campos son obligatorios');
      }

      const insertQuery = `
        INSERT INTO libros (
          nombre,
          autor,
          imagen,
          descripcion,
          usuario_id,
          disponible,
          created_at
        ) VALUES (?, ?, ?, ?, ?, true, NOW())
      `;

      const [result] = await pool.query(insertQuery, [
        nombre,
        autor,
        imagen,
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
          descripcion
        }
      };
    } catch (error) {
      throw new Error(`Error al crear el libro: ${error.message}`);
    }
  }
}