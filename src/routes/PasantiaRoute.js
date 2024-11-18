import express from 'express';
import PasantiaService from '../class/Pasantia/PasantiaService.js';
import upload from '../middleware/upload.js';

const router = express.Router();
const pasantiaService = new PasantiaService();

router.post('/pasantias', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Create a new internship'
  // #swagger.description = 'Creates a new internship posting with the specified title, description, salary, and company information'
  const { usuarioId, titulo, descripcion, salario, empresa, direccion, latitud, longitud } = req.body;
  try {
    const result = await pasantiaService.createPasantia(
      usuarioId, titulo, descripcion, salario, empresa, direccion, latitud, longitud
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/pasantias', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Get all internships'
  // #swagger.description = 'Retrieves a paginated list of all available internships'
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const result = await pasantiaService.getAllPasantias(page, pageSize);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pasantias/:id', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Get internship by ID'
  // #swagger.description = 'Retrieves detailed information about a specific internship posting'
  const { id } = req.params;
  try {
    const pasantia = await pasantiaService.getPasantiaById(id);
    res.json(pasantia);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.post('/pasantias/:id/postular', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Apply for an internship'
  // #swagger.description = 'Submits an application for a specific internship position for the given user'
  const { id } = req.params;
  const { usuarioId } = req.body;
  try {
    const result = await pasantiaService.postularPasantia(id, usuarioId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/pasantias/:id/postulaciones', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Get all applications for an internship'
  // #swagger.description = 'Retrieves a paginated list of all applications submitted for a specific internship position'
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

router.post('/postulaciones/:id/aceptar', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Accept an application'
  // #swagger.description = 'Accepts a specific internship application'
  const { id } = req.params;
  try {
    const result = await pasantiaService.aceptarPostulacion(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/postulaciones/:id/rechazar', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Reject an application'
  // #swagger.description = 'Rejects a specific internship application'
  const { id } = req.params;
  try {
    const result = await pasantiaService.rechazarPostulacion(id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.get('/pasantias/:id/check-postulacion', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Check if user has applied to an internship'
  // #swagger.description = 'Verifies if a specific user has already applied to the given internship'
  const { id } = req.params;
  const { usuarioId } = req.query;
  try {
    const result = await pasantiaService.checkUserPostulation(id, usuarioId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/usuarios/:usuarioId/postulaciones', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Get user applications'
  // #swagger.description = 'Retrieves a paginated list of all internship applications made by a specific user'
  const { usuarioId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const result = await pasantiaService.getUserPostulations(usuarioId, page, pageSize);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/usuarios/:usuarioId/pasantias-disponibles', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Get available internships for user'
  // #swagger.description = 'Retrieves a paginated list of internships where the user has not applied yet'
  const { usuarioId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const result = await pasantiaService.getAvailablePasantias(usuarioId, page, pageSize);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pasantias/documentos/:id', async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Descargar documento'
  // #swagger.description = 'Descarga el archivo PDF CV'
  const { id } = req.params;
  try {
    const { archivo } = await pasantiaService.getDocumentoById(id);
    res.setHeader('Content-Disposition', `attachment; filename="CV"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(archivo);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/pasantias/documentos', upload.single('archivo'), async (req, res) => {
  // #swagger.tags = ['Internships']
  // #swagger.summary = 'Subir documento'
  // #swagger.description = 'Sube un archivo PDF como parte de una CV'
  const archivo = req.file?.buffer; // Obtiene el archivo en buffer
  console.log('====================================');
  console.log(archivo);
  console.log('====================================');
  try {
    const result = await pasantiaService.uploadDocumento(archivo);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;