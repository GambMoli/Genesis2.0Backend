
import { pool } from "../../db/db.js";
import bcrypt from 'bcrypt';


class UserService {

  async createUser(userData) {
    const { nombre, email, password, documento, tipo_documento_id, carrera_id, rol_id } = userData;

    const insertQuery = `
      INSERT INTO usuarios (nombre, email, password, documento, tipo_documento_id, carrera_id, rol_id)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const [result] = await pool.query(insertQuery, [nombre, email, password, documento, tipo_documento_id, carrera_id, rol_id]);

    const getUserQuery = `
      SELECT * FROM usuarios WHERE id = LAST_INSERT_ID();
    `;

    const [newUser] = await pool.query(getUserQuery);

    return newUser[0];
  }

  async getUserById(id) {
    const query = 'SELECT * FROM usuarios WHERE id = ?;';
    const [result] = await pool.query(query, [id]);
    return result[0];
  }

  async updateUser(id, { nombre, email, password, documento, tipo_documento_id, carrera_id, rol_id }) {
    const query = `
      UPDATE usuarios
      SET nombre = $1, email = $2, password = $3, documento = $4, tipo_documento_id = $5, carrera_id = $6, rol_id = $7
      WHERE id = $8 RETURNING *;
    `;

    const values = [nombre, email, password, documento, tipo_documento_id, carrera_id, rol_id, id];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  async deleteUser(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getAllUsers() {
    const query = 'SELECT * FROM usuarios;';
    const [result] = await pool.query(query);
    console.log('====================================');
    console.log(result);
    console.log('====================================');
    return result;
  }

  async validateUser(email, password) {
    const query = `
      SELECT usuarios.nombre AS username, roles.nombre AS role, usuarios.password AS hashedPassword
      FROM usuarios
      JOIN roles ON usuarios.rol_id = roles.id
      WHERE usuarios.email = ?;
    `;

    const [result] = await pool.query(query, [email]);

    if (result.length === 0) {
      throw new Error('Usuario o contraseña inválidos');
    }

    const user = result[0];

    if (user.hashedPassword !== password) {
      throw new Error('Usuario o contraseña inválidos');
    }

    return {
      username: user.username,
      role: user.role
    };
  }


}

export const userService = new UserService();
