import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn()
};

jest.unstable_mockModule('../../db/db.js', () => ({
  pool: mockPool
}));

const ReserveSpaceCommand = (await import('../Commands/ReserveSpaceCommand.js')).default;

describe('ReserveSpaceCommand', () => {
  let command;

  beforeEach(() => {
    jest.clearAllMocks();
    command = new ReserveSpaceCommand(1, 1, '2024-10-05', '2024-10-10', 'Reunión');
  });

  describe('execute', () => {
    test('debería lanzar un error si el espacio no está disponible', async () => {
      mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

      await expect(command.execute()).rejects.toThrow('El espacio no está disponible para las fechas seleccionadas.');
    });

    test('debería crear una reserva si el espacio está disponible', async () => {
      mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);
      mockPool.query.mockResolvedValueOnce([{ insertId: 123 }]);

      const result = await command.execute();

      expect(result).toEqual({ success: true, message: 'Reserva creada con éxito', reservaId: 123 });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkAvailability', () => {
    test('debería devolver true si el espacio está disponible', async () => {
      mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);

      const result = await command.checkAvailability();

      expect(result).toBe(true);
    });

    test('debería devolver false si el espacio no está disponible', async () => {
      mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

      const result = await command.checkAvailability();

      expect(result).toBe(false);
    });
  });

  describe('getDetails', () => {
    test('debería obtener los detalles de las reservas de un usuario', async () => {
      const mockData = [
        {
          id: 1,
          nombre_espacio: 'Aula 101',
          usuario_id: 2,
          fecha_inicio: '2024-10-05',
          fecha_fin: '2024-10-06',
          motivo: 'Reunión',
          estado: 'pendiente',
          created_at: '2024-09-30',
          updated_at: '2024-09-30'
        }
      ];

      mockPool.query.mockResolvedValueOnce([[{ total: 1 }]]);
      mockPool.query.mockResolvedValueOnce([mockData]);

      const result = await command.getDetails(2);

      expect(result).toEqual({
        totalItems: 1,
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        data: [
          {
            reservaId: 1,
            spaceName: 'Aula 101',
            userId: 2,
            startDate: '2024-10-05',
            endDate: '2024-10-06',
            reason: 'Reunión',
            status: 'pendiente',
            createdAt: '2024-09-30',
            updatedAt: '2024-09-30'
          }
        ]
      });
    });

    test('debería manejar errores al obtener detalles', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(command.getDetails(2)).rejects.toThrow('Error al obtener detalles de reserva: Database error');
    });
  });

  describe('getAllDetails', () => {
    test('debería obtener todos los detalles de las reservas', async () => {
      const mockData = [
        {
          id: 1,
          nombre_espacio: 'Aula 101',
          usuario_id: 2,
          nombre_usuario: 'John Doe',
          fecha_inicio: '2024-10-05',
          fecha_fin: '2024-10-06',
          motivo: 'Reunión',
          estado: 'pendiente'
        }
      ];

      mockPool.query.mockResolvedValueOnce([[{ total: 1 }]]);
      mockPool.query.mockResolvedValueOnce([mockData]);

      const result = await command.getAllDetails();

      expect(result).toEqual({
        totalItems: 1,
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        data: [
          {
            reservaId: 1,
            spaceName: 'Aula 101',
            userId: 2,
            userName: 'John Doe',
            startDate: '2024-10-05',
            endDate: '2024-10-06',
            reason: 'Reunión',
            status: 'pendiente'
          }
        ]
      });
    });

    test('debería manejar errores al obtener todos los detalles', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(command.getAllDetails()).rejects.toThrow('Error al obtener todos los detalles de reservas: Database error');
    });
  });

  describe('updateStatus', () => {
    test('debería actualizar el estado de una reserva', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await command.updateStatus(1, 'aceptado');

      expect(result).toEqual({ success: true, message: 'Reserva aceptado con éxito' });
    });

    test('debería lanzar un error si el estado no es válido', async () => {
      await expect(command.updateStatus(1, 'invalid')).rejects.toThrow('Estado no válido');
    });

    test('debería lanzar un error si no se encuentra la reserva', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(command.updateStatus(1, 'aceptado')).rejects.toThrow('No se encontró la reserva especificada.');
    });
  });

  describe('updateReservation', () => {
    test('debería actualizar una reserva existente', async () => {
      mockPool.query.mockResolvedValueOnce([[{ id: 1, espacio_id: 1 }]]);
      mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await command.updateReservation(1, 1, '2024-10-15', '2024-10-20', 'Nueva reunión');

      expect(result).toEqual({ success: true, message: 'Reserva actualizada con éxito' });
    });

    test('debería lanzar un error si la reserva no existe', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      await expect(command.updateReservation(1, 1, '2024-10-15', '2024-10-20', 'Nueva reunión')).rejects.toThrow('No se puede editar esta reserva');
    });

    test('debería lanzar un error si el espacio no está disponible para las nuevas fechas', async () => {
      mockPool.query.mockResolvedValueOnce([[{ id: 1, espacio_id: 1 }]]);
      mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

      await expect(command.updateReservation(1, 1, '2024-10-15', '2024-10-20', 'Nueva reunión')).rejects.toThrow('El espacio no está disponible para las nuevas fechas seleccionadas.');
    });
  });

  describe('getReservationById', () => {
    test('debería obtener los detalles de una reserva específica', async () => {
      const mockData = {
        id: 1,
        espacio_id: 2,
        nombre_espacio: 'Aula 101',
        usuario_id: 3,
        nombre_usuario: 'John Doe',
        fecha_inicio: '2024-10-05',
        fecha_fin: '2024-10-06',
        motivo: 'Reunión',
        estado: 'pendiente'
      };

      mockPool.query.mockResolvedValueOnce([[mockData]]);

      const result = await command.getReservationById(1);

      expect(result).toEqual({
        reservaId: 1,
        space: {
          spaceId: 2,
          spaceName: 'Aula 101'
        },
        userName: 'John Doe',
        userId: 3,
        startDate: '2024-10-05',
        endDate: '2024-10-06',
        reason: 'Reunión',
        status: 'pendiente'
      });
    });

    test('debería lanzar un error si no se encuentra la reserva', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      await expect(command.getReservationById(1)).rejects.toThrow('No se encontró la reserva especificada.');
    });
  });
});