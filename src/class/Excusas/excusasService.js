import ExcusasCommand from "../Commands/ExcusasCommand.js";

export default class ExcusasService {
  constructor() {
    this.excusasCommand = new ExcusasCommand();
  }

  async createExcusa(id_estudiante, razon_falta, fecha_falta, id_documento) {
    try {
      const result = await this.excusasCommand.createExcusa(
        id_estudiante,
        razon_falta,
        fecha_falta,
        id_documento
      );
      return result;
    } catch (error) {
      throw new Error(`Error al crear la excusa: ${error.message}`);
    }
  }

  async getAllExcusas(page, pageSize) {
    try {
      const paginatedData = await this.excusasCommand.getAllExcusas(page, pageSize);
      return { success: true, data: paginatedData };
    } catch (error) {
      throw new Error(`Error al obtener las excusas: ${error.message}`);
    }
  }

  async getExcusasByEstudiante(id_estudiante, page, pageSize) {
    try {
      const paginatedData = await this.excusasCommand.getExcusasByEstudiante(
        id_estudiante,
        page,
        pageSize
      );
      return { success: true, data: paginatedData };
    } catch (error) {
      throw new Error(`Error al obtener las excusas del estudiante: ${error.message}`);
    }
  }

  async updateExcusaState(id, estado) {
    try {
      const result = await this.excusasCommand.updateExcusaState(id, estado);
      return result;
    } catch (error) {
      throw new Error(`Error al actualizar el estado de la excusa: ${error.message}`);
    }
  }

  async getDocumentoById(id) {
    try {
      const { archivo } = await this.excusasCommand.getDocumentoById(id);
      return { success: true, archivo };
    } catch (error) {
      throw new Error(`Error al obtener el documento: ${error.message}`);
    }
  }

  async uploadDocumento(archivo) {
    try {
      const result = await this.excusasCommand.uploadDocumento(archivo);
      return result;
    } catch (error) {
      throw new Error(`Error al subir el documento: ${error.message}`);
    }
  }
}