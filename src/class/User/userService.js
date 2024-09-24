
import { pool } from "../../db/db.js";

class UserService {

  async createUser({ nombre, email, password, documento, tipo_documento_id, carrera_id }) {
    const query = `
      INSERT INTO usuarios (nombre, email, password, documento, tipo_documento_id, carrera_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [nombre, email, password, documento, tipo_documento_id, carrera_id];
    const result = await pool.query(query, values);
    return result.rows[0];
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
