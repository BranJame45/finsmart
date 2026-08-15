import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Pruebas unitarias del servicio de metas.
 * Verifican las métricas calculadas por enrich() (a través de findAll):
 * cuánto falta, progreso en % y ahorro mensual necesario.
 */
describe('GoalsService', () => {
  let service: GoalsService;

  const prismaMock = {
    goal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll() → enrich()', () => {
    it('calcula remaining y progreso correctamente', async () => {
      prismaMock.goal.findMany.mockResolvedValue([
        { targetAmount: 1000, currentAmount: 250, deadline: null },
      ]);

      const [goal] = await service.findAll('user-1');

      expect(goal.remaining).toBe(750);
      expect(goal.progress).toBe(25); // %
    });

    it('limita el progreso a 100% aunque se supere la meta', async () => {
      prismaMock.goal.findMany.mockResolvedValue([
        { targetAmount: 1000, currentAmount: 1500, deadline: null },
      ]);

      const [goal] = await service.findAll('user-1');

      expect(goal.remaining).toBe(0); // no negativo
      expect(goal.progress).toBe(100);
    });

    it('calcula el ahorro mensual necesario según la fecha límite', async () => {
      // Fecha límite a 10 meses exactos desde hoy.
      const now = new Date();
      const deadline = new Date(now.getFullYear(), now.getMonth() + 10, now.getDate());

      prismaMock.goal.findMany.mockResolvedValue([
        { targetAmount: 1000, currentAmount: 0, deadline },
      ]);

      const [goal] = await service.findAll('user-1');

      expect(goal.monthsLeft).toBe(10);
      expect(goal.monthlySavingNeeded).toBe(100); // ceil(1000/10)
    });

    it('no calcula ahorro mensual si no hay fecha límite', async () => {
      prismaMock.goal.findMany.mockResolvedValue([
        { targetAmount: 1000, currentAmount: 0, deadline: null },
      ]);

      const [goal] = await service.findAll('user-1');

      expect(goal.monthsLeft).toBeNull();
      expect(goal.monthlySavingNeeded).toBeNull();
    });

    it('maneja meta con targetAmount 0 sin dividir por cero', async () => {
      prismaMock.goal.findMany.mockResolvedValue([
        { targetAmount: 0, currentAmount: 0, deadline: null },
      ]);

      const [goal] = await service.findAll('user-1');

      expect(goal.progress).toBe(0);
      expect(goal.remaining).toBe(0);
    });
  });
});
