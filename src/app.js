import express from 'express';
import cors from 'cors';
import { pool } from './db/db.js';
import { PORT } from './config.js';
import userRoutes from './class/User/userRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Sirve');
});


app.get('/ping', async (req, res) => {
  const result = await pool.query('SELECT * FROM carreras');
  res.send(result);
});

// Rutas de usuarios
app.use('/api', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
