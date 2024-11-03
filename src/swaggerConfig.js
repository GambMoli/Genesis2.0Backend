import swaggerAutogen from 'swagger-autogen';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 3000;

const isProduction = PORT !== '3000';

const doc = {
  info: {
    title: 'Genesis 2.0',
    description: 'Endpoints Genesis 2.0',
    version: '1.0.0'
  },
  host: isProduction
    ? 'genesis20backend-production.up.railway.app'
    : `localhost:${PORT}`,
  basePath: '/api',
  schemes: isProduction ? ['https'] : ['http'], // Cambiar esquemas según el entorno
  consumes: ['application/json'],
  produces: ['application/json'],
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
    },
  ],
  definitions: {}
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
  path.join(__dirname, './routes/userRoutes.js'),
  path.join(__dirname, './routes/spaceReservation.js'),
  path.join(__dirname, './routes/libraryRoute.js'),
  path.join(__dirname, './routes/PasantiaRoute.js'),
];

const generateDoc = async () => {
  let outputJson = await swaggerAutogen(outputFile, endpointsFiles, doc);

  outputJson.servers = [
    {
      url: isProduction
        ? 'https://genesis20backend-production.up.railway.app/api'
        : `http://localhost:${PORT}/api`, // Usar el puerto dinámico
      description: isProduction ? 'Servidor de producción' : 'Servidor de desarrollo'
    }
  ];

  const fs = await import('fs/promises');
  await fs.writeFile(outputFile, JSON.stringify(outputJson, null, 2));

  console.log('Documentation generated with custom servers');
};

generateDoc();
