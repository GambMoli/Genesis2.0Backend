
import { pool } from "../../db/db.js";

class UserService {

  static async createUser(userData) {
    const { nombre, email, password, documento, tipo_documento_id, carrera_id } = userData;

    const insertQuery = `
      INSERT INTO usuarios (nombre, email, password, documento, tipo_documento_id, carrera_id)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const [result] = await pool.query(insertQuery, [nombre, email, password, documento, tipo_documento_id, carrera_id]);

    const getUserQuery = `
      SELECT * FROM usuarios WHERE id = LAST_INSERT_ID();
    `;

    const [newUser] = await pool.query(getUserQuery);

    return newUser[0];
  }


  async getUserById(id) {
    const query = 'SELECT * FROM usuarios WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }


  async updateUser(id, { nombre, email, password, documento, tipo_documento_id, carrera_id }) {
    const query = `
      UPDATE usuarios
      SET nombre = $1, email = $2, password = $3, documento = $4, tipo_documento_id = $5, carrera_id = $6
      WHERE id = $7 RETURNING *;
    `;
    const values = [nombre, email, password, documento, tipo_documento_id, carrera_id, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Eliminar un usuario por su ID
  async deleteUser(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Leer todos los usuarios
  async getAllUsers() {
    const query = 'SELECT * FROM usuarios;';
    const result = await pool.query(query);
    return result.rows;
  }
}

export const userService = new UserService();
