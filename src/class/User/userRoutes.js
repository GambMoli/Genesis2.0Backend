// userRoutes.js
import express from 'express';
import { userService } from './userService.js';

const userRoutes = express.Router(); // Cambiar 'router' a 'userRoutes'

userRoutes.post('/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRoutes.get('/users/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRoutes.put('/users/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRoutes.delete('/users/:id', async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    if (user) {
      res.status(200).json({ message: 'User deleted', user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRoutes.get('/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRoutes.post('/users/validate', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    const user = await userService.validateUser(email, password);
    res.status(200).json({ username: user.username, role: user.role, id: user.id });
  } catch (error) {

    res.status(401).json({ error: error.message });
  }
});

export default userRoutes;
