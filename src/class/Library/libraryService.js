import ReserveBookCommand from '../Commands/ReserveBookCommand.js';

export default class LibraryService {
  constructor() {
    this.history = [];
  }

  async executeCommand(command) {
    try {
      const result = await command.execute();
      if (result.success) {
        this.history.push(command);
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getReservationHistory(userId, page = 1, pageSize = 10) {
    try {
      const command = new ReserveBookCommand();
      const result = await command.getReservationHistory(userId, page, pageSize);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener el historial de reservas:', error);
      return { success: false, message: 'Error al obtener el historial de reservas' };
    }
  }

  async getAllBooks(page = 1, pageSize = 10) {
    try {
      const result = await ReserveBookCommand.getAllBooks(page, pageSize);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener los libros:', error);
      return { success: false, message: 'Error al obtener los libros' };
    }
  }

  async createBook(nombre, autor, imagen, urlPdf, descripcion, usuarioId) {
    try {
      const command = new ReserveBookCommand();
      const result = await command.createBook(nombre, autor, imagen, urlPdf, descripcion, usuarioId);
      return result;
    } catch (error) {
      console.error('Error al crear el libro:', error);
      return { success: false, message: 'Error al crear el libro' };
    }
  }

  async getAllReservations(page = 1, pageSize = 10) {
    try {
      const command = new ReserveBookCommand();
      const result = await command.getAllReservations(page, pageSize);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener todas las reservas:', error);
      return { success: false, message: 'Error al obtener todas las reservas' };
    }
  }

  async updateReservationStatus(reservaId, newStatus) {
    try {
      const command = new ReserveBookCommand();
      const result = await command.updateReservationStatus(reservaId, newStatus);
      return result;
    } catch (error) {
      console.error('Error al actualizar el estado de la reserva:', error);
      return { success: false, message: 'Error al actualizar el estado de la reserva' };
    }
  }

  async reserveBook(bookId, userId, startDate, endDate) {
    const command = new ReserveBookCommand(bookId, userId, startDate, endDate);
    return this.executeCommand(command);
  }

  async cancelReservation(reservaId, userId) {
    try {
      const command = new ReserveBookCommand();
      const result = await command.cancelReservation(reservaId, userId);
      return result;
    } catch (error) {
      console.error('Error al cancelar la reserva:', error);
      return { success: false, message: error.message };
    }
  }

  async modifyReservation(reservaId, userId, newStartDate, newEndDate) {
    try {
      const command = new ReserveBookCommand();
      const result = await command.modifyReservation(reservaId, userId, newStartDate, newEndDate);
      return result;
    } catch (error) {
      console.error('Error al modificar la reserva:', error);
      return { success: false, message: error.message };
    }
  }

  async createBook(nombre, autor, imagen, urlPdf, descripcion, usuarioId) {
    try {
      const result = await ReserveBookCommand.createBook(nombre, autor, imagen, urlPdf, descripcion, usuarioId);
      return result;
    } catch (error) {
      console.error('Error al crear el libro:', error);
      return { success: false, message: 'Error al crear el libro' };
    }
  }


  async updateBook(bookId, updates, newImage, newPdf) {
    try {
      const result = await ReserveBookCommand.updateBook(bookId, updates, newImage, newPdf);
      return result;
    } catch (error) {
      console.error('Error al actualizar el libro:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteBook(bookId) {
    try {
      const result = await ReserveBookCommand.deleteBook(bookId);
      return result;
    } catch (error) {
      console.error('Error al eliminar el libro:', error);
      return { success: false, message: error.message };
    }
  }

}