import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentService } from './investment.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Pruebas unitarias del servicio de inversiones.
 * Se enfocan en la lógica financiera pura (simulate / goalProjection)
 * y en el comparador de bancos (compare) con Prisma mockeado.
 */
describe('InvestmentService', () => {
  let service: InvestmentService;

  // Mock de Prisma: solo implementamos lo que usa el servicio.
  const prismaMock = {
    bank: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InvestmentService>(InvestmentService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('simulate()', () => {
    it('calcula la ganancia simple con interés simple (capital * TREA * días/360)', () => {
      // 10 000 al 5% TREA por 360 días => ganancia 500
      const result = service.simulate({
        capital: 10000,
        trea: 5,
        termDays: 360,
      } as any);

      expect(result.gain).toBeCloseTo(500, 2);
      expect(result.finalAmount).toBeCloseTo(10500, 2);
    });

    it('escala la ganancia proporcionalmente al plazo (180 días = mitad)', () => {
      const result = service.simulate({
        capital: 10000,
        trea: 5,
        termDays: 180,
      } as any);

      expect(result.gain).toBeCloseTo(250, 2);
    });

    it('proyecta valor futuro cuando hay aportes mensuales', () => {
      const result: any = service.simulate({
        capital: 1000,
        trea: 12,
        termDays: 360,
        monthlyContribution: 100,
      } as any);

      expect(result.months).toBe(12);
      expect(result.monthlyContribution).toBe(100);
      // Con aportes, el valor proyectado debe superar el capital + aportes puestos.
      expect(result.projectedWithContributions).toBeGreaterThan(1000 + 100 * 12);
    });
  });

  describe('goalProjection()', () => {
    it('marca la meta como alcanzable cuando la proyección supera el objetivo', async () => {
      const result = await service.goalProjection({
        targetAmount: 1000,
        initialCapital: 1000,
        monthlyContribution: 100,
        termMonths: 12,
        annualRate: 5,
      });

      expect(result.isReachable).toBe(true);
      expect(result.monthlyData).toHaveLength(12);
      expect(result.suggestedMonthlyContribution).toBeNull();
    });

    it('sugiere un aporte mensual mayor cuando la meta NO es alcanzable', async () => {
      const result = await service.goalProjection({
        targetAmount: 100000,
        initialCapital: 0,
        monthlyContribution: 100,
        termMonths: 12,
        annualRate: 5,
      });

      expect(result.isReachable).toBe(false);
      expect(result.suggestedMonthlyContribution).toBeGreaterThan(100);
      expect(result.monthsToGoal).toBeNull();
    });

    it('usa una tasa por defecto (4%) cuando no se envía annualRate', async () => {
      const result = await service.goalProjection({
        targetAmount: 500,
        initialCapital: 100,
        monthlyContribution: 50,
        termMonths: 6,
      });
      // Con tasa positiva, el final debe superar el simple aporte sin interés.
      const sinInteres = 100 + 50 * 6;
      expect(result.projectedFinal).toBeGreaterThan(sinInteres);
    });
  });

  describe('compare()', () => {
    it('ordena los bancos por monto final y devuelve el mejor primero', async () => {
      prismaMock.bank.findMany.mockResolvedValue([
        { id: 'b1', name: 'Banco A', treaPEN: 4, apyUSD: null },
        { id: 'b2', name: 'Banco B', treaPEN: 8, apyUSD: null },
        { id: 'b3', name: 'Banco C', treaPEN: 6, apyUSD: null },
      ]);

      const res = await service.compare('user-1', 10000, 'PEN', 360);

      expect(res.results).toHaveLength(3);
      expect(res.bestBank?.bankName).toBe('Banco B'); // 8% => mayor ganancia
      expect(res.results[0]!.finalAmount).toBeGreaterThan(res.results[1]!.finalAmount);
    });

    it('descarta bancos sin tasa para la moneda solicitada', async () => {
      prismaMock.bank.findMany.mockResolvedValue([
        { id: 'b1', name: 'Sin USD', treaPEN: 5, apyUSD: null },
        { id: 'b2', name: 'Con USD', treaPEN: 5, apyUSD: 3 },
      ]);

      const res = await service.compare('user-1', 5000, 'USD', 360);

      expect(res.results).toHaveLength(1);
      expect(res.results[0]!.bankName).toBe('Con USD');
    });
  });
});
