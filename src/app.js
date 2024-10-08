import express from 'express';
import cors from 'cors';
import { pool } from './db/db.js';
import { PORT } from './config.js';
import userRoutes from './routes/userRoutes.js';
import spaceReservationRoutes from './routes/spaceReservation.js'
import libraryRoutes from './routes/libraryRoute.js'
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json' assert { type: "json" };


const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Sirve');
});


app.use('/api', userRoutes);
app.use('/api', spaceReservationRoutes);
app.use('/api', libraryRoutes);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});