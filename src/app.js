import express from 'express'
import { pool } from './db/db.js';
import { PORT } from './config.js'
const app = express();


app.get('/', (req, res) => {
  res.send('Sirve')
})

app.get('/ping', (req, res) => {
  const result = pool.query('SELECT * FROM carreras')
  console.log('====================================');
  console.log(result);
  console.log('====================================');
  res.send(result)
})

app.listen(PORT);