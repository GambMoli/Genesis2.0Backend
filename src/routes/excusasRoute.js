import express from 'express';
import ExcusasService from '../class/Excusas/excusasService.js';
import upload from '../middleware/upload.js';

const router = express.Router();
const excusasService = new ExcusasService();

router.post('/excusas', async (req, res) => {
  // #swagger.tags = ['Excusas Médicas']
  // #swagger.summary = 'Crear una nueva excusa'
  // #swagger.description = 'Crea una nueva excusa médica con la información proporcionada'
  const { id_estudiante, razon_falta, fecha_falta, id_documento } = req.body;
  try {
    const result = await excusasService.createExcusa(
      id_estudiante,
      razon_falta,
      fecha_falta,
      id_documento
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/excusas', async (req, res) => {
  // #swagger.tags = ['Excusas Médicas']
  // #swagger.summary = 'Obtener todas las excusas'
  // #swagger.description = 'Obtiene todas las excusas médicas de forma paginada'
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const result = await excusasService.getAllExcusas(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/excusas/estudiante/:id', async (req, res) => {
  // #swagger.tags = ['Excusas Médicas']
  // #swagger.summary = 'Obtener excusas de un estudiante'
  // #swagger.description = 'Obtiene todas las excusas médicas de un estudiante específico de forma paginada'
  const { id } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const result = await excusasService.getExcusasByEstudiante(id, page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/excusas/:id/estado', async (req, res) => {
  // #swagger.tags = ['Excusas Médicas']
  // #swagger.summary = 'Actualizar estado de una excusa'
  // #swagger.description = 'Actualiza el estado de una excusa médica'
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const result = await excusasService.updateExcusaState(id, estado);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/documentos/:id', async (req, res) => {
  // #swagger.tags = ['Excusas Médicas']
  // #swagger.summary = 'Descargar documento'
  // #swagger.description = 'Descarga el archivo PDF de una excusa médica'
  const { id } = req.params;
  try {
    const { archivo } = await excusasService.getDocumentoById(id);
    res.setHeader('Content-Disposition', `attachment; filename="excusa"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(archivo);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/documentos', upload.single('archivo'), async (req, res) => {
  // #swagger.tags = ['Excusas Médicas']
  // #swagger.summary = 'Subir documento'
  // #swagger.description = 'Sube un archivo PDF como parte de una excusa médica'
  const archivo = req.file?.buffer; // Obtiene el archivo en buffer
  console.log('====================================');
  console.log(archivo);
  console.log('====================================');
  try {
    const result = await excusasService.uploadDocumento(archivo);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;