import PasantiaCommand from "../Commands/PasantiaCommand.js";

export default class PasantiaService {
  constructor() {
    this.pasantiaCommand = new PasantiaCommand();
  }

  async createPasantia(usuarioId, titulo, descripcion, salario, empresa, direccion, latitud, longitud) {
    try {
      const result = await this.pasantiaCommand.createPasantia(
        usuarioId,
        titulo,
        descripcion,
        salario,
        empresa,
        direccion,
        latitud,
        longitud
      );
      return result;
    } catch (error) {
      throw new Error(`Error al crear la pasantía: ${error.message}`);
    }
  }

  async getAllPasantias(page, pageSize) {
    try {
      const paginatedData = await this.pasantiaCommand.getAllPasantias(page, pageSize);
      return { success: true, data: paginatedData };
    } catch (error) {
      throw new Error(`Error al obtener las pasantías: ${error.message}`);
    }
  }

  async getPasantiaById(id) {
    try {
      const pasantia = await this.pasantiaCommand.getPasantiaById(id);
      return pasantia;
    } catch (error) {
      throw new Error(`Error al obtener la pasantía: ${error.message}`);
    }
  }

  async postularPasantia(pasantiaId, usuarioId, documento_postulacion_id) {
    try {
      const result = await this.pasantiaCommand.postularPasantia(
        pasantiaId,
        usuarioId,
        documento_postulacion_id
      );
      return result;
    } catch (error) {
      throw new Error(`Error al postular a la pasantía: ${error.message}`);
    }
  }

  async getAllPostulaciones(pasantiaId, page, pageSize) {
    try {
      const postulaciones = await this.pasantiaCommand.getAllPostulaciones(
        pasantiaId,
        page,
        pageSize
      );
      return postulaciones;
    } catch (error) {
      throw new Error(
        `Error al obtener las postulaciones para la pasantía: ${error.message}`
      );
    }
  }

  async aceptarPostulacion(postulacionId) {
    try {
      const result = await this.pasantiaCommand.aceptarPostulacion(postulacionId);
      return result;
    } catch (error) {
      throw new Error(`Error al aceptar la postulación: ${error.message}`);
    }
  }

  async rechazarPostulacion(postulacionId) {
    try {
      const result = await this.pasantiaCommand.rechazarPostulacion(postulacionId);
      return result;
    } catch (error) {
      throw new Error(`Error al rechazar la postulación: ${error.message}`);
    }
  }

  async checkUserPostulation(pasantiaId, usuarioId) {
    try {
      const result = await this.pasantiaCommand.checkUserPostulation(
        pasantiaId,
        usuarioId
      );
      return result;
    } catch (error) {
      throw new Error(`Error al verificar la postulación: ${error.message}`);
    }
  }

  async getUserPostulations(usuarioId, page, pageSize) {
    try {
      const postulaciones = await this.pasantiaCommand.getUserPostulations(
        usuarioId,
        page,
        pageSize
      );
      return { success: true, data: postulaciones };
    } catch (error) {
      throw new Error(`Error al obtener las postulaciones del usuario: ${error.message}`);
    }
  }

  async getAvailablePasantias(usuarioId, page, pageSize) {
    try {
      const pasantias = await this.pasantiaCommand.getAvailablePasantias(
        usuarioId,
        page,
        pageSize
      );
      return { success: true, data: pasantias };
    } catch (error) {
      throw new Error(`Error al obtener las pasantías disponibles: ${error.message}`);
    }
  }

  async getDocumentoById(id) {
    try {
      const { archivo } = await this.pasantiaCommand.getDocumentoById(id);
      return { success: true, archivo };
    } catch (error) {
      throw new Error(`Error al obtener el documento: ${error.message}`);
    }
  }

  async uploadDocumento(archivo) {
    try {
      const result = await this.pasantiaCommand.uploadDocumento(archivo);
      return result;
    } catch (error) {
      throw new Error(`Error al subir el documento: ${error.message}`);
    }
  }
}