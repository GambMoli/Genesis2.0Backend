import express from 'express';
import PasantiaService from '../class/Pasantia/PasantiaService.js';

const router = express.Router();
const pasantiaService = new PasantiaService();

// #swagger.tags = ['Pasantias']
// #swagger.summary = 'Create a new internship'
// #swagger.description = 'Creates a new internship with the specified title, description, salary, and company'
router.post('/pasantias', async (req, res) => {
  const { titulo, descripcion, salario, empresa } = req.body;
  try {
    const result = await pasantiaService.createPasantia(
      titulo,
      descripcion,
      salario,
      empresa
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// #swagger.tags = ['Pasantias']
// #swagger.summary = 'Get all internships'
// #swagger.description = 'Retrieves all internships with pagination'
// #swagger.parameters['page'] = { in: 'query', type: 'integer', required: false, default: 1 }
// #swagger.parameters['pageSize'] = { in: 'query', type: 'integer', required: false, default: 10 }
router.get('/pasantias', async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const result = await pasantiaService.getAllPasantias(page, pageSize);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// #swagger.tags = ['Pasantias']
// #swagger.summary = 'Get an internship by ID'
// #swagger.description = 'Retrieves an internship by its ID'
// #swagger.parameters['id'] = { in: 'path', type: 'integer', required: true }
router.get('/pasantias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pasantia = await pasantiaService.getPasantiaById(id);
    res.json(pasantia);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// #swagger.tags = ['Pasantias']
// #swagger.summary = 'Apply for an internship'
// #swagger.description = 'Allows a user to apply for an internship'
// #swagger.parameters['id'] = { in: 'path', type: 'integer', required: true }
// #swagger.parameters['usuarioId'] = { in: 'body', type: 'integer', required: true }
router.post('/pasantias/:id/postular', async (req, res) => {
  const { id } = req.params;
  const { usuarioId } = req.body;
  try {
    const result = await pasantiaService.postularPasantia(id, usuarioId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// #swagger.tags = ['Postulaciones']
// #swagger.summary = 'Get all applications for an internship'
// #swagger.description = 'Retrieves all applications for a specific internship with pagination'
// #swagger.parameters['id'] = { in: 'path', type: 'integer', required: true }
// #swagger.parameters['page'] = { in: 'query', type: 'integer', required: false, default: 1 }
// #swagger.parameters['pageSize'] = { in: 'query', type: 'integer', required: false, default: 10 }
router.get('/pasantias/:id/postulaciones', async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const postulaciones = await pasantiaService.getAllPostulaciones(
      id,
      page,
      pageSize
    );
    res.json(postulaciones);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// #swagger.tags = ['Postulaciones']
// #swagger.summary = 'Accept an application'
// #swagger.description = 'Allows an administrator to accept an application'
// #swagger.parameters['id'] = { in: 'path', type: 'integer', required: true }
router.post('/postulaciones/:id/aceptar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pasantiaService.aceptarPostulacion(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// #swagger.tags = ['Postulaciones']
// #swagger.summary = 'Reject an application'
// #swagger.description = 'Allows an administrator to reject an application'
// #swagger.parameters['id'] = { in: 'path', type: 'integer', required: true }
router.post('/postulaciones/:id/rechazar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pasantiaService.rechazarPostulacion(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;