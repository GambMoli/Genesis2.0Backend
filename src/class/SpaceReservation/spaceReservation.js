import ReserveSpaceCommand from '../Commands/ReserveSpaceCommand.js';

export default class SpaceReservation {
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

  async getCommandHistory(userId, page = 1, pageSize = 10) {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.getDetails(userId, page, pageSize);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener el historial:', error);
      return { success: false, message: 'Error al obtener el historial del usuario' };
    }
  }

  async getAllCommandHistory() {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.getAllDetails();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener el historial completo:', error);
      return { success: false, message: 'Error al obtener el historial completo' };
    }
  }

  async getAllDetails(page = 1, pageSize = 10) {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.getAllDetails(page, pageSize);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener todas las reservas:', error);
      return { success: false, message: 'Error al obtener todas las reservas' };
    }
  }

  async updateStatus(reservaId, newStatus) {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.updateStatus(reservaId, newStatus);
      return result;
    } catch (error) {
      console.error('Error al actualizar el estado de la reserva:', error);
      return { success: false, message: error.message };
    }
  }

  async updateReservation(reservaId, userId, newStartDate, newEndDate, newReason, newSpaceId) {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.updateReservation(reservaId, userId, newStartDate, newEndDate, newReason, newSpaceId);
      return result;
    } catch (error) {
      console.error('Error al actualizar la reservación:', error);
      return { success: false, message: error.message };
    }
  }



  async getReservationById(reservaId) {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.getReservationById(reservaId);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener la reserva por ID:', error);
      return { success: false, message: 'Error al obtener los detalles de la reserva' };
    }
  }


}
