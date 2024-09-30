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

  async undoLastCommand() {
    if (this.history.length === 0) {
      return { success: false, message: 'No hay comandos para deshacer' };
    }

    const lastCommand = this.history.pop();
    const result = await lastCommand.undo();
    return result;
  }

  async getCommandHistory(userId) {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.getDetails(userId);
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

  async getAllDetails() {
    try {
      const command = new ReserveSpaceCommand();
      const result = await command.getAllDetails();
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

}