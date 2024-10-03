import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn()
};

jest.unstable_mockModule('../../db/db.js', () => ({
  pool: mockPool
}));

const ReserveSpaceCommand = (await import('../Commands/ReserveSpaceCommand.js')).default;

describe('ReserveSpaceCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería lanzar un error si el espacio no está disponible', async () => {
    const command = new ReserveSpaceCommand(1, 1, '2024-10-05', '2024-10-10', 'Reunión');

    mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);  // Simula que el espacio está ocupado

    await expect(command.execute()).rejects.toThrow('El espacio no está disponible para las fechas seleccionadas.');
  });

  test('debería crear una reserva si el espacio está disponible', async () => {
    const command = new ReserveSpaceCommand(1, 1, '2024-10-05', '2024-10-10', 'Reunión');

    // Simula disponibilidad
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);

    // Simula una inserción exitosa
    mockPool.query.mockResolvedValueOnce([{ insertId: 123 }]);

    const result = await command.execute();

    expect(result).toEqual({ success: true, message: 'Reserva creada con éxito', reservaId: 123 });
    expect(mockPool.query).toHaveBeenCalledTimes(2);  // checkAvailability y la inserción
  });

  test('debería obtener los detalles de una reserva', async () => {
    const command = new ReserveSpaceCommand();

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

    // Simula la respuesta de la base de datos
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
});