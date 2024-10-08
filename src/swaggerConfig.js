import swaggerAutogen from 'swagger-autogen';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const doc = {
  info: {
    title: 'Genesis 2.0',
    description: 'Endpoints Genesis 2.0',
    version: '1.0.0'
  },
  host: 'localhost:3000',
  basePath: '/api',
  consumes: ['application/json'],
  produces: ['application/json'],
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desarrollo'
    },
    {
      url: 'https://genesis20backend-production.up.railway.app/api',
      description: 'Servidor de producción'
    }
  ],
  definitions: {},
  tags: [
    {
      name: 'Users',
      description: 'Endpoints relacionados con usuarios'
    },
    {
      name: 'Space Reservations',
      description: 'Endpoints relacionados con reserva de espacios'
    },
    {
      name: 'Library',
      description: 'Endpoints relacionados con la biblioteca'
    }
  ]
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  path.join(__dirname, './routes/userRoutes.js'),
  path.join(__dirname, './routes/spaceReservation.js'),
  path.join(__dirname, './routes/libraryRoute.js'),
];




swaggerAutogen(outputFile, endpointsFiles, doc);