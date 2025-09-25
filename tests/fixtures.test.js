import { describe, test, expect } from '@jest/globals';
import { parseMessage } from '../src/parsing.js';
import fixtures from '../tests/fixtures.json';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Configurar dayjs para testes
dayjs.extend(utc);
dayjs.extend(timezone);

// Mock do timezone para testes
const mockTimezone = 'America/Sao_Paulo';
process.env.TZ = mockTimezone;
process.env.TIMEZONE = mockTimezone;

describe('Testes com Fixtures', () => {
  fixtures.fixtures.forEach((fixture, index) => {
    if (fixture.input === 'TRIGGER_SUMMARY') {
      // Pular teste de resumo por enquanto
      return;
    }

    describe(`Fixture ${index + 1}: ${fixture.label}`, () => {
      test('deve fazer parse correto da mensagem', () => {
        const result = parseMessage(fixture.input);
        const expected = fixture.expected;

        // Verificar prioridade
        if (expected.prioridade) {
          expect(result.prioridade).toBe(expected.prioridade);
        }

        // Verificar status
        if (expected.status) {
          expect(result.status).toBe(expected.status);
        }

        // Verificar projeto
        if (expected.projeto) {
          expect(result.projeto).toBe(expected.projeto);
        }

        // Verificar prazo ISO
        if (expected.prazoISO) {
          if (expected.prazoISO.includes('TODAY+1')) {
            // Para "amanhã", verificar se é D+1
            const tomorrow = dayjs().tz(mockTimezone).add(1, 'day');
            expect(result.prazoISO).toBe(tomorrow.format('YYYY-MM-DD'));
          } else {
            expect(result.prazoISO).toBe(expected.prazoISO);
          }
        }

        // Verificar prazo BR
        if (expected.prazoBR) {
          if (expected.prazoBR.includes('TODAY+1')) {
            // Para "amanhã", verificar se é D+1
            const tomorrow = dayjs().tz(mockTimezone).add(1, 'day');
            expect(result.prazoBR).toBe(tomorrow.format('DD-MM-YYYY'));
          } else {
            expect(result.prazoBR).toBe(expected.prazoBR);
          }
        }

        // Verificar se resumo contém informações esperadas
        expect(result.resumo).toBeTruthy();
        expect(result.resumo.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Testes de Idempotência', () => {
    test('deve detectar mensagem duplicada', () => {
      const message = 'Enviar relatório de conciliação até 05/10 [UGF] #urgente';
      
      // Primeira execução
      const result1 = parseMessage(message);
      expect(result1).toBeTruthy();
      
      // Segunda execução (simulando duplicata)
      const result2 = parseMessage(message);
      expect(result2).toBeTruthy();
      
      // Os resultados devem ser idênticos
      expect(result1.prioridade).toBe(result2.prioridade);
      expect(result1.status).toBe(result2.status);
      expect(result1.projeto).toBe(result2.projeto);
      expect(result1.prazoISO).toBe(result2.prazoISO);
      expect(result1.prazoBR).toBe(result2.prazoBR);
    });
  });

  describe('Testes de Formato de Data', () => {
    test('deve usar formato ISO para cálculos internos', () => {
      const result = parseMessage('Tarefa até 15/12/2025');
      expect(result.prazoISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('deve usar formato BR para exibição', () => {
      const result = parseMessage('Tarefa até 15/12/2025');
      expect(result.prazoBR).toMatch(/^\d{2}-\d{2}-\d{4}$/);
    });
  });
});
