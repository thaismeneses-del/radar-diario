// Setup para testes Jest
import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Configurar timezone para testes
process.env.TZ = 'America/Sao_Paulo';
process.env.TIMEZONE = 'America/Sao_Paulo';

// Mock de console para reduzir output nos testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
