import { config } from './config.js';
import { logger } from './logger.js';
import TelegramBot from './bot.js';
import SummaryScheduler from './summary.js';

// Configurar timezone global
process.env.TZ = config.system.timezone;

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Log do erro mas não sair do processo imediatamente
  logger.warn('Continuando execução após erro não capturado...');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', { 
    reason: reason?.message || reason,
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });
  
  // Log do erro mas não sair do processo
  logger.warn('Continuando execução após Promise rejeitada...');
});

async function startApp() {
  try {
    logger.info('🚀 Iniciando Radar Diário...');

    // Inicializar bot do Telegram
    const bot = new TelegramBot();
    bot.start();

    // Configurar agendador de resumos
    const scheduler = new SummaryScheduler();
    scheduler.setBot(bot);
    scheduler.start();

    logger.info('✅ Radar Diário iniciado com sucesso!');
    logger.info(`📅 Resumo diário agendado para ${config.system.summaryHour}:00 (${config.system.timezone})`);

    // Manter o processo vivo com heartbeat
    setInterval(() => {
      logger.debug('Bot ainda rodando...', { 
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timezone: config.system.timezone
      });
    }, 30000); // Log a cada 30 segundos

  } catch (error) {
    logger.error('❌ Erro ao iniciar aplicação:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Iniciar aplicação
startApp();